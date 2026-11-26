// Fonte única de preços e opções. O cardápio (cardapio.js) monta os produtos a partir daqui.

export const formatarPreco = (valor) =>
  `R$${valor.toFixed(2).replace('.', ',')}`;

export const bolosConfeitados = [
  { fatias: 8, preco: 100 },
  { fatias: 10, preco: 120 },
  { fatias: 15, preco: 135 },
  { fatias: 20, preco: 165 },
  { fatias: 30, preco: 180 },
  { fatias: 35, preco: 210 },
  { fatias: 40, preco: 230 },
  { fatias: 45, preco: 280 },
  { fatias: 50, preco: 310 },
  { fatias: 60, preco: 360 },
  { fatias: 70, preco: 400 },
  { fatias: 80, preco: 450 },
];

export const PRECO_BENTO_CAKE = 40;

export const brownies = [
  { qtd: 20, preco: 90 },
  { qtd: 50, preco: 250 },
  { qtd: 100, preco: 450 },
];

export const bemCasados = [
  { qtd: 25, preco: 100 },
  { qtd: 30, preco: 120 },
  { qtd: 40, preco: 160 },
  { qtd: 50, preco: 200 },
  { qtd: 60, preco: 240 },
  { qtd: 70, preco: 280 },
  { qtd: 80, preco: 320 },
  { qtd: 90, preco: 360 },
  { qtd: 100, preco: 400 },
];

export const salgadinhos = [
  { qtd: 50, preco: 40 },
  { qtd: 100, preco: 75 },
  { qtd: 150, preco: 113 },
  { qtd: 200, preco: 150 },
  { qtd: 250, preco: 188 },
  { qtd: 300, preco: 225 },
];

export const tiposFatia = [
  { valor: 5, nome: 'Fatia com embalagem propria' },
  { valor: 6, nome: 'Fatia com nossa embalagem' },
  { valor: 8, nome: 'Fatia com 3 brigadeiros' },
];

// Brigadeiro por unidade: acima de 45 unidades o preço unitário cai.
export const precoUnitarioBrigadeiro = (qtd) => (qtd > 45 ? 1.5 : 1.7);

export const massas = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'ninho', label: 'Ninho' },
  { value: 'red-velvet', label: 'Red Velvet' },
  { value: 'Chocolate/Ninho', label: 'Chocolate/Ninho' },
  { value: 'Chocolate/Red Velvet', label: 'Chocolate/Red Velvet' },
  { value: 'Ninho/Red Velvet', label: 'Ninho/Red Velvet' },
];

export const recheiosBolo = [
  { value: 'coco', label: 'Coco' },
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'castanha', label: 'Castanha' },
  { value: 'ninho', label: 'Ninho' },
  { value: 'abacaxi', label: 'Abacaxi' },
  { value: 'dois-amores', label: 'Dois Amores' },
];

export const recheiosFatia = recheiosBolo.filter((r) => r.value !== 'abacaxi');

export const sabores = {
  brigadeiro: [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'Ninho', label: 'Ninho' },
    { value: 'dois-amores', label: 'Dois Amores' },
    { value: 'beijinho', label: 'Beijinho' },
  ],
  brownie: [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'ninho', label: 'Ninho' },
    { value: 'dois-amores', label: 'Dois Amores' },
    { value: 'doce-de-leite', label: 'Doce de Leite' },
  ],
  'bem-casado': [
    { value: 'ninho', label: 'Ninho' },
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'dois-amores', label: 'Dois Amores' },
    { value: 'doce-de-leite', label: 'Doce de Leite' },
  ],
};

export const LIMITE_SABORES = 4;

export const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'credito', label: 'Cartão de Crédito' },
];

export const WHATSAPP_NUMERO = '5586995811231';
