// O jsdom não desenha em <canvas>: aqui o canvas é falso e devolve data URLs do tamanho
// que cada teste quiser, para conferir as decisões de formato, tamanho e qualidade.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { comprimirImagem, tamanhoDataUrl } from './imagem.js';

let ctx;
let canvases;
let gerarDataUrl; // (tipo, qualidade, canvas) => string

beforeEach(() => {
  canvases = [];
  ctx = { clearRect: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' };
  gerarDataUrl = (tipo) => `data:${tipo};base64,${'A'.repeat(100)}`;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext() {
    canvases.push(this);
    return ctx;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function toDataURL(tipo, qualidade) {
    return gerarDataUrl(tipo, qualidade, this);
  });
  window.createImageBitmap = vi.fn(async () => ({ width: 4000, height: 2000, close: vi.fn() }));
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.createImageBitmap;
});

const foto = (tipo = 'image/jpeg') => new File(['x'], 'foto', { type: tipo });

describe('tamanhoDataUrl', () => {
  it('é o tamanho do texto', () => {
    expect(tamanhoDataUrl('abc')).toBe(3);
  });
});

describe('comprimirImagem', () => {
  it('recusa o que não é imagem', async () => {
    await expect(comprimirImagem(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).rejects.toThrow(
      'Escolha um arquivo de imagem'
    );
    await expect(comprimirImagem(null)).rejects.toThrow('Escolha um arquivo de imagem');
  });

  it('reduz o lado maior para maxLado e gera WebP na primeira qualidade que cabe', async () => {
    const resultado = await comprimirImagem(foto(), { maxLado: 1200 });
    expect(resultado.startsWith('data:image/webp')).toBe(true);
    const canvas = canvases.at(-1);
    expect([canvas.width, canvas.height]).toEqual([1200, 600]);
    expect(ctx.fillRect).not.toHaveBeenCalled(); // WebP mantém o fundo transparente
    expect(window.createImageBitmap).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
  });

  it('não aumenta fotos pequenas', async () => {
    window.createImageBitmap = vi.fn(async () => ({ width: 300, height: 200 }));
    await comprimirImagem(foto());
    expect([canvases.at(-1).width, canvases.at(-1).height]).toEqual([300, 200]);
  });

  it('baixa a qualidade e depois o tamanho até caber em maxBytes', async () => {
    const tentativas = [];
    gerarDataUrl = (tipo, qualidade, canvas) => {
      if (qualidade === undefined) return `data:${tipo};`; // teste de suporte a WebP
      tentativas.push([canvas.width, qualidade]);
      // só cabe com lado <= 800 e qualidade 0.55
      const cabe = canvas.width <= 800 && qualidade === 0.55;
      return 'x'.repeat(cabe ? 100 : 1000);
    };
    await comprimirImagem(foto(), { maxLado: 1000, maxBytes: 500 });
    expect(tentativas).toEqual([
      [1000, 0.85],
      [1000, 0.75],
      [1000, 0.65],
      [1000, 0.55],
      [800, 0.85],
      [800, 0.75],
      [800, 0.65],
      [800, 0.55],
    ]);
  });

  it('desiste depois de 6 tentativas de tamanho', async () => {
    const close = vi.fn();
    window.createImageBitmap = vi.fn(async () => ({ width: 1000, height: 1000, close }));
    gerarDataUrl = () => 'x'.repeat(1000);
    await expect(comprimirImagem(foto(), { maxBytes: 10 })).rejects.toThrow('leve o bastante');
    expect(ctx.drawImage).toHaveBeenCalledTimes(6);
    expect(close).toHaveBeenCalled();
  });

  it('sem suporte a WebP, usa JPG com fundo branco', async () => {
    gerarDataUrl = (tipo) => (tipo === 'image/webp' ? 'data:image/png;base64,AA' : `data:${tipo};base64,AA`);
    const resultado = await comprimirImagem(foto('image/png'));
    expect(resultado.startsWith('data:image/jpeg')).toBe(true);
    expect(ctx.fillStyle).toBe('#fff');
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  describe('quando createImageBitmap não funciona, abre com <img>', () => {
    let decode;
    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:foto');
      URL.revokeObjectURL = vi.fn();
      decode = vi.fn().mockResolvedValue();
      vi.spyOn(window, 'Image').mockImplementation(() => {
        const img = document.createElement('img');
        Object.defineProperty(img, 'width', { value: 600 });
        Object.defineProperty(img, 'height', { value: 400 });
        img.decode = decode;
        return img;
      });
    });

    it('navegador sem createImageBitmap', async () => {
      delete window.createImageBitmap;
      await comprimirImagem(foto());
      expect(decode).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto');
      expect(canvases.at(-1).width).toBe(600);
    });

    it('createImageBitmap falhou (ex.: HEIC)', async () => {
      window.createImageBitmap = vi.fn().mockRejectedValue(new Error('formato'));
      await comprimirImagem(foto());
      expect(decode).toHaveBeenCalled();
    });

    it('se nem o <img> abrir, explica o que fazer', async () => {
      window.createImageBitmap = vi.fn().mockRejectedValue(new Error('formato'));
      decode.mockRejectedValue(new Error('decode'));
      await expect(comprimirImagem(foto())).rejects.toThrow('Não foi possível abrir essa foto');
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
