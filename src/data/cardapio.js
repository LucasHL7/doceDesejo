// Cardápio: produtos que a pessoa pode colocar na sacola.
//
// Os produtos vêm do Firebase (editados pelo painel /admin). Este arquivo guarda:
// - as categorias e os tipos de produto;
// - o cardápio padrão, usado quando o Firebase não está configurado ou não responde,
//   e importado para o Firebase na primeira vez que o painel é aberto;
// - as contas de preço e os textos usados pela sacola e pelo WhatsApp.
//
// Tipos de produto:
// - 'opcoes':  escolhe uma opção com preço próprio (ex.: tamanho do bolo) e quantas quer.
// - 'unidade': preço por unidade; a pessoa digita a quantidade (ex.: brigadeiros, fatias).
//              O preço vem das opções (se houver) ou de `precoUnitario`, com um preço menor
//              opcional para pedidos grandes (`atacado`: { acimaDe, preco }).
// - 'fixo':    preço único; só escolhe quantas quer.
//
// `campos` são as personalizações pedidas antes de adicionar:
// { id, label, tipo: 'select' | 'checkbox' | 'texto', opcoes?, max?, opcional?, placeholder? }
// Tudo aqui é dado simples (sem funções) para poder ser salvo no Firestore.

import {
  bolosConfeitados,
  brownies,
  bemCasados,
  salgadinhos,
  tiposFatia,
  massas,
  recheiosBolo,
  recheiosFatia,
  sabores,
  PRECO_BENTO_CAKE,
  LIMITE_SABORES,
} from './produtos.js';

export const categorias = [
  { id: 'todos', label: 'Todos' },
  { id: 'bolos', label: 'Bolos' },
  { id: 'brigadeiros', label: 'Brigadeiros' },
  { id: 'brownies', label: 'Brownies' },
  { id: 'bem-casados', label: 'Bem-casados' },
  { id: 'salgados', label: 'Salgados' },
];

export const tiposProduto = [
  { id: 'opcoes', label: 'Por opção', ajuda: 'Cada opção tem um preço (ex.: tamanho do bolo, pacote de 20/50/100).' },
  { id: 'unidade', label: 'Por unidade', ajuda: 'Preço por unidade, a pessoa digita a quantidade (ex.: brigadeiros).' },
  { id: 'fixo', label: 'Preço único', ajuda: 'Um preço só, a pessoa escolhe quantos quer (ex.: Bento Cake).' },
];

const campoMassa = { id: 'massa', label: 'Massa', tipo: 'select', opcoes: massas };
const campoSabores = (lista, label = 'Sabores') => ({
  id: 'sabores',
  label,
  tipo: 'checkbox',
  max: LIMITE_SABORES,
  opcoes: lista,
});

export const cardapioPadrao = [
  {
    id: 'bolo-confeitado',
    categoria: 'bolos',
    nome: 'Bolo confeitado',
    descricao: 'Decorado do seu jeito, de 8 a 80 fatias.',
    imagem: '/scr/confeitados/confeitado-1.jpeg',
    tipo: 'opcoes',
    opcaoLabel: 'Tamanho',
    opcoes: bolosConfeitados.map((b) => ({
      value: String(b.fatias),
      label: `${b.fatias} fatias`,
      preco: b.preco,
    })),
    campos: [
      campoMassa,
      { id: 'recheio', label: 'Recheio', tipo: 'select', opcoes: recheiosBolo },
      { id: 'recheio2', label: 'Segundo recheio', tipo: 'select', opcional: true, opcoes: recheiosBolo },
    ],
    aviso: 'Envie a foto de referência da decoração junto com o orçamento.',
  },
  {
    id: 'bento-cake',
    categoria: 'bolos',
    nome: 'Bento Cake',
    descricao: 'Mini bolo de 5 fatias, com recheio padrão.',
    imagem: '/scr/bento.png',
    tipo: 'fixo',
    preco: PRECO_BENTO_CAKE,
    campos: [],
  },
  {
    id: 'fatias',
    categoria: 'bolos',
    nome: 'Fatias de bolo',
    descricao: 'Para festas e lembrancinhas, a partir de 8 fatias.',
    imagem: '/scr/Naked.png',
    tipo: 'unidade',
    unidade: 'fatias',
    min: 8,
    passo: 1,
    opcaoLabel: 'Tipo de fatia',
    opcoes: tiposFatia.map((t) => ({ value: String(t.valor), label: t.nome, preco: t.valor })),
    campos: [campoMassa, { id: 'recheio', label: 'Recheio', tipo: 'select', opcoes: recheiosFatia }],
  },
  {
    id: 'brigadeiro',
    categoria: 'brigadeiros',
    nome: 'Brigadeiros',
    descricao: 'R$1,70 cada, ou R$1,50 acima de 45 unidades. Mínimo de 10.',
    imagem: '/scr/docinhos.jpg',
    tipo: 'unidade',
    unidade: 'unidades',
    min: 10,
    passo: 5,
    precoUnitario: 1.7,
    atacado: { acimaDe: 45, preco: 1.5 },
    campos: [
      campoSabores(sabores.brigadeiro),
      {
        id: 'caixeta',
        label: 'Cor da caixeta',
        tipo: 'texto',
        placeholder: 'Ex.: branco, rosa claro, dourado...',
      },
    ],
  },
  {
    id: 'brownie',
    categoria: 'brownies',
    nome: 'Brownie recheado',
    descricao: 'Pacotes de 20, 50 ou 100 unidades.',
    imagem: '/scr/Brownie.jpg',
    tipo: 'opcoes',
    opcaoLabel: 'Pacote',
    opcoes: brownies.map((b) => ({ value: String(b.qtd), label: `${b.qtd} unidades`, preco: b.preco })),
    campos: [campoSabores(sabores.brownie)],
  },
  {
    id: 'bem-casado',
    categoria: 'bem-casados',
    nome: 'Bem-casados',
    descricao: 'De 25 a 100 unidades, perfeitos para casamentos.',
    imagem: '/scr/bem-casado.jpg',
    tipo: 'opcoes',
    opcaoLabel: 'Quantidade',
    opcoes: bemCasados.map((b) => ({ value: String(b.qtd), label: `${b.qtd} unidades`, preco: b.preco })),
    campos: [campoSabores(sabores['bem-casado'], 'Recheios')],
  },
  {
    id: 'salgadinho',
    categoria: 'salgados',
    nome: 'Salgadinhos de festa',
    descricao: 'Coxinha (frango e pizza), bolinha de queijo e pastel de queijo.',
    imagem: '/scr/salgadinhos.jpg',
    tipo: 'opcoes',
    opcaoLabel: 'Quantidade',
    opcoes: salgadinhos.map((s) => ({ value: String(s.qtd), label: `${s.qtd} unidades`, preco: s.preco })),
    campos: [],
  },
].map((p, i) => ({ ordem: i, ativo: true, ...p }));

// Preço de uma unidade para produtos 'unidade' sem opções.
function precoPorUnidade(produto, qtd) {
  const { atacado } = produto;
  if (atacado && qtd > atacado.acimaDe) return atacado.preco;
  return produto.precoUnitario ?? 0;
}

const temOpcoes = (produto) => Array.isArray(produto.opcoes) && produto.opcoes.length > 0;

// Preço de uma linha da sacola (ou do que está sendo montado no modal).
export function calcularLinha(produto, { opcao, qtd }) {
  const n = Number(qtd) || 0;
  if (produto.tipo === 'fixo') return (produto.preco ?? 0) * n;
  if (temOpcoes(produto)) {
    const o = produto.opcoes.find((op) => op.value === opcao);
    return (o?.preco ?? 0) * n;
  }
  return precoPorUnidade(produto, n) * n;
}

// "A partir de" mostrado no card.
export function precoDoCard(produto) {
  if (produto.tipo === 'fixo') return { prefixo: '', valor: produto.preco ?? 0, sufixo: '' };
  const sufixo = produto.tipo === 'unidade' ? '/un' : '';
  if (temOpcoes(produto)) {
    return { prefixo: 'a partir de', valor: Math.min(...produto.opcoes.map((o) => o.preco)), sufixo };
  }
  return { prefixo: 'a partir de', valor: precoPorUnidade(produto, Infinity), sufixo };
}

// Texto curto das escolhas de uma linha (para a sacola e o WhatsApp).
export function descreverEscolhas(produto, { opcao, campos = {} }) {
  const partes = [];
  if (temOpcoes(produto)) {
    const o = produto.opcoes.find((op) => op.value === opcao);
    if (o) partes.push(o.label);
  }
  for (const campo of produto.campos ?? []) {
    const valor = campos[campo.id];
    if (!valor || (Array.isArray(valor) && valor.length === 0)) continue;
    if (campo.tipo === 'select') {
      const o = campo.opcoes.find((op) => op.value === valor);
      partes.push(`${campo.label}: ${o?.label ?? valor}`);
    } else if (campo.tipo === 'checkbox') {
      const nomes = valor.map((v) => campo.opcoes.find((op) => op.value === v)?.label ?? v);
      partes.push(`${campo.label}: ${nomes.join(', ')}`);
    } else {
      partes.push(`${campo.label}: ${valor}`);
    }
  }
  return partes;
}

// Como mostrar a quantidade de uma linha.
export function rotuloQuantidade(produto, qtd) {
  return produto.tipo === 'unidade' ? `${qtd} ${produto.unidade}` : `${qtd}x`;
}
