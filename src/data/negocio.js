// Dados da empresa usados no rodapé, no topo e nos textos do site.
// Os mesmos dados estão no JSON-LD de index.html (para o Google): se mudar algo aqui,
// mude lá também.

export const endereco = {
  rua: 'Av. Joaquim Nelson, 3245A',
  bairro: 'Novo Horizonte',
  cidade: 'Teresina',
  uf: 'PI',
  cep: '64000-000',
};

export const enderecoCompleto = `${endereco.rua} - ${endereco.bairro}, ${endereco.cidade} - ${endereco.uf}`;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `Doce Desejo, ${enderecoCompleto}, ${endereco.cep}`
)}`;

// Horário de atendimento, em ordem para mostrar no rodapé.
export const horarios = [
  { dias: 'Segunda a sábado', horas: '13h às 19h' },
  { dias: 'Domingo', horas: 'Fechado' },
];

export const INSTAGRAM_URL = 'https://www.instagram.com/docedesejogourmethe/';
export const LINKTREE_URL = 'https://linktr.ee/docedesejogourmethe';
export const CATALOGO_URL = 'https://app.cardapioweb.com/doce_desejo_gourmet';
