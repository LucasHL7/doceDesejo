// Fotos do site que podem ser trocadas pelo painel /admin.
// Estes são os valores padrão, usados quando o Firebase não está configurado
// ou não responde, e importados para o Firebase na primeira vez que o painel é aberto.

// Lugares fixos do site com uma foto cada.
export const espacosFoto = [
  { id: 'hero', nome: 'Foto principal (topo do site)', dica: 'Fica melhor com fundo transparente ou claro.' },
  { id: 'delivery-1', nome: 'Delivery: foto 1', dica: 'Aparece na seção de delivery.' },
  { id: 'delivery-2', nome: 'Delivery: foto 2', dica: 'Aparece na seção de delivery.' },
  { id: 'delivery-3', nome: 'Delivery: foto 3', dica: 'Aparece na seção de delivery.' },
];

export const imagensSitePadrao = {
  hero: { src: '/scr/bolo.png', alt: 'Bolo de chocolate com morangos e cerejas' },
  'delivery-1': { src: '/scr/Brownie.jpg', alt: 'Brownie recheado' },
  'delivery-2': { src: '/scr/docinhos.jpg', alt: 'Docinhos variados' },
  'delivery-3': { src: '/scr/salgadinhos.jpg', alt: 'Salgadinhos de festa' },
};

// Carrossel "Estilos de bolos".
export const galeriaPadrao = [1, 2, 3, 4, 5].map((n, i) => ({
  id: `confeitado-${n}`,
  src: `/scr/confeitados/confeitado-${n}.jpeg`,
  alt: `Bolo confeitado decorado, estilo ${n}`,
  ordem: i,
}));
