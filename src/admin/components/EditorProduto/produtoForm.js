// Conversão entre um produto (como fica salvo no Firestore, veja src/data/cardapio.js)
// e o rascunho do formulário do editor (textos editáveis, preços com vírgula etc.).

import { gerarId } from '../../../firebase/conteudo.js';

const chave = () => Math.random().toString(36).slice(2, 9);

const formatoBR = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

// 1.7 -> "1,70"; 1234.5 -> "1.234,50"
export const precoTexto = (n) => {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '';
  return Number(n).toLocaleString('pt-BR', formatoBR);
};

// Máscara de valor enquanto digita: só os dígitos contam e entram pelos centavos.
// "1" -> "0,01", "170" -> "1,70", "1,705" -> "17,05", "" -> ""
export function mascararPreco(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  return digitos ? precoTexto(Number(digitos) / 100) : '';
}

// Campos de quantidade: só números inteiros.
export const soDigitos = (texto) => String(texto ?? '').replace(/\D/g, '').slice(0, 6);

// "1,70" / "1.70" / "R$ 1.234,50" -> número; texto inválido -> NaN
export function lerNumero(texto) {
  let t = String(texto ?? '').replace(/[R$\s]/g, '');
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

// "Doce de Leite" -> "doce-de-leite"
export function slug(texto) {
  return (
    String(texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function unico(base, usados) {
  let v = base;
  for (let n = 2; usados.has(v); n++) v = `${base}-${n}`;
  usados.add(v);
  return v;
}

export const novaOpcao = () => ({ chave: chave(), value: null, label: '', preco: '' });

export const novoCampo = () => ({
  chave: chave(),
  id: null,
  label: '',
  tipo: 'select',
  opcoesTexto: '',
  opcoesOriginais: [],
  max: '',
  opcional: false,
  placeholder: '',
});

export function paraRascunho(p) {
  const unidadeComOpcoes = p?.tipo === 'unidade' && p.opcoes?.length > 0;
  const opcoes = (p?.opcoes ?? []).map((o) => ({
    chave: chave(),
    value: o.value,
    label: o.label,
    preco: precoTexto(o.preco),
  }));
  return {
    id: p?.id ?? null,
    ordem: p?.ordem,
    nome: p?.nome ?? '',
    descricao: p?.descricao ?? '',
    categoria: p?.categoria ?? 'bolos',
    imagem: p?.imagem ?? '',
    ativo: p?.ativo !== false,
    tipo: p?.tipo ?? 'opcoes',
    preco: precoTexto(p?.preco),
    opcaoLabel: p?.opcaoLabel ?? '',
    opcoes: opcoes.length ? opcoes : [novaOpcao()],
    unidade: p?.unidade ?? 'unidades',
    min: String(p?.min ?? 1),
    passo: String(p?.passo ?? 1),
    precoModo: unidadeComOpcoes ? 'opcoes' : 'unico',
    precoUnitario: precoTexto(p?.precoUnitario),
    temAtacado: Boolean(p?.atacado),
    atacadoAcimaDe: p?.atacado ? String(p.atacado.acimaDe) : '',
    atacadoPreco: precoTexto(p?.atacado?.preco),
    campos: (p?.campos ?? []).map((c) => ({
      chave: chave(),
      id: c.id,
      label: c.label,
      tipo: c.tipo,
      opcoesTexto: (c.opcoes ?? []).map((o) => o.label).join('\n'),
      opcoesOriginais: c.opcoes ?? [],
      max: c.max ? String(c.max) : '',
      opcional: Boolean(c.opcional),
      placeholder: c.placeholder ?? '',
    })),
    aviso: p?.aviso ?? '',
  };
}

// Monta o produto a partir do rascunho. Devolve { produto } ou { erros: [textos] }.
export function paraProduto(r, { proximaOrdem }) {
  const erros = [];
  const nome = r.nome.trim();
  if (!nome) erros.push('Dê um nome ao produto.');

  const produto = {
    id: r.id ?? gerarId(nome),
    ordem: r.ordem ?? proximaOrdem,
    ativo: r.ativo,
    categoria: r.categoria,
    nome,
    descricao: r.descricao.trim(),
    imagem: r.imagem,
    tipo: r.tipo,
  };

  const lerOpcoes = () => {
    const usados = new Set();
    const linhas = r.opcoes.filter((o) => o.label.trim() || o.preco.trim());
    if (!linhas.length) erros.push('Adicione pelo menos uma opção com preço.');
    return linhas.map((o, i) => {
      const label = o.label.trim();
      const preco = lerNumero(o.preco);
      if (!label) erros.push(`A opção ${i + 1} está sem nome.`);
      if (!(preco > 0)) erros.push(`Confira o preço da opção ${label ? `"${label}"` : i + 1}.`);
      // mantém o código das opções que já existiam (a sacola dos clientes usa ele)
      const value = o.value && !usados.has(o.value) ? (usados.add(o.value), o.value) : unico(slug(label), usados);
      return { value, label, preco };
    });
  };

  if (r.tipo === 'fixo') {
    produto.preco = lerNumero(r.preco);
    if (!(produto.preco > 0)) erros.push('Confira o preço do produto.');
  } else if (r.tipo === 'opcoes') {
    produto.opcaoLabel = r.opcaoLabel.trim() || 'Opção';
    produto.opcoes = lerOpcoes();
  } else {
    produto.unidade = r.unidade.trim() || 'unidades';
    produto.min = Number(r.min);
    produto.passo = Number(r.passo);
    if (!Number.isInteger(produto.min) || produto.min < 1) erros.push('A quantidade mínima precisa ser um número inteiro (1 ou mais).');
    if (!Number.isInteger(produto.passo) || produto.passo < 1) erros.push('O “de quanto em quanto” precisa ser um número inteiro (1 ou mais).');
    if (r.precoModo === 'opcoes') {
      produto.opcaoLabel = r.opcaoLabel.trim() || 'Tipo';
      produto.opcoes = lerOpcoes();
    } else {
      produto.precoUnitario = lerNumero(r.precoUnitario);
      if (!(produto.precoUnitario > 0)) erros.push('Confira o preço por unidade.');
      if (r.temAtacado) {
        const acimaDe = Number(r.atacadoAcimaDe);
        const preco = lerNumero(r.atacadoPreco);
        if (!Number.isInteger(acimaDe) || acimaDe < 1) erros.push('Confira a quantidade do preço para pedidos grandes.');
        if (!(preco > 0)) erros.push('Confira o preço para pedidos grandes.');
        produto.atacado = { acimaDe, preco };
      }
    }
  }

  const idsCampos = new Set();
  produto.campos = r.campos.map((c, i) => {
    const label = c.label.trim();
    if (!label) erros.push(`A personalização ${i + 1} está sem nome.`);
    const id = c.id && !idsCampos.has(c.id) ? (idsCampos.add(c.id), c.id) : unico(slug(label), idsCampos);
    const campo = { id, label, tipo: c.tipo };

    if (c.tipo === 'texto') {
      if (c.placeholder.trim()) campo.placeholder = c.placeholder.trim();
      return campo;
    }

    const usados = new Set();
    const nomes = [...new Set(c.opcoesTexto.split('\n').map((l) => l.trim()).filter(Boolean))];
    if (!nomes.length) erros.push(`Escreva as opções de "${label || `personalização ${i + 1}`}".`);
    campo.opcoes = nomes.map((nomeOpcao) => {
      const antiga = c.opcoesOriginais.find((o) => o.label === nomeOpcao && !usados.has(o.value));
      const value = antiga ? (usados.add(antiga.value), antiga.value) : unico(slug(nomeOpcao), usados);
      return { value, label: nomeOpcao };
    });

    if (c.tipo === 'select' && c.opcional) campo.opcional = true;
    if (c.tipo === 'checkbox' && c.max.trim()) {
      const max = Number(c.max);
      if (!Number.isInteger(max) || max < 1) erros.push(`Confira o máximo de escolhas de "${label}".`);
      else campo.max = max;
    }
    return campo;
  });

  if (r.aviso.trim()) produto.aviso = r.aviso.trim();

  return erros.length ? { erros } : { produto };
}
