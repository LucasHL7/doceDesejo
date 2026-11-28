// Reduz e comprime uma foto no próprio navegador antes de salvar.
//
// As fotos ficam dentro dos documentos do Firestore (limite de 1 MB por documento),
// então cada foto é redimensionada e comprimida até ficar abaixo de `maxBytes`.
// Usa WebP (mantém fundo transparente e fica bem menor que JPG); se o navegador não
// souber gerar WebP, usa JPG com fundo branco.

function suportaWebp() {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp');
}

async function abrir(arquivo) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
    } catch {
      /* tenta com <img> abaixo */
    }
  }
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Tamanho aproximado em bytes de um data URL (é assim que ele ocupa espaço no Firestore).
export const tamanhoDataUrl = (dataUrl) => dataUrl.length;

export async function comprimirImagem(arquivo, { maxLado = 1200, maxBytes = 300_000 } = {}) {
  if (!arquivo?.type?.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).');
  }

  let imagem;
  try {
    imagem = await abrir(arquivo);
  } catch {
    throw new Error('Não foi possível abrir essa foto. Tente salvar como JPG ou PNG e enviar de novo.');
  }

  const largura = imagem.width;
  const altura = imagem.height;
  const webp = suportaWebp();
  const tipo = webp ? 'image/webp' : 'image/jpeg';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let lado = maxLado;
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const escala = Math.min(1, lado / Math.max(largura, altura));
    canvas.width = Math.round(largura * escala);
    canvas.height = Math.round(altura * escala);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!webp) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    for (const qualidade of [0.85, 0.75, 0.65, 0.55]) {
      const dataUrl = canvas.toDataURL(tipo, qualidade);
      if (tamanhoDataUrl(dataUrl) <= maxBytes) {
        imagem.close?.();
        return dataUrl;
      }
    }
    lado = Math.round(lado * 0.8);
  }
  imagem.close?.();
  throw new Error('Não foi possível deixar essa foto leve o bastante. Tente outra foto.');
}
