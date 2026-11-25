import {
  bolosConfeitados,
  brigadeirosTabela,
  brownies,
  bemCasados,
  salgadinhos,
  PRECO_BENTO_CAKE,
  formatarPreco,
} from '../data/produtos.js';

const blocos = [
  {
    titulo: 'Bolos Confeitados',
    itens: [
      ...bolosConfeitados.map((b) => ({ nome: `Bolo Confeitado (${b.fatias} fatias)`, preco: b.preco })),
      { nome: 'Bento Cake (5 fatias)', preco: PRECO_BENTO_CAKE },
    ],
  },
  {
    titulo: 'Brigadeiros',
    itens: brigadeirosTabela.map((b) => ({ nome: `Brigadeiro (${b.qtd} unidades)`, preco: b.preco })),
  },
  {
    titulo: 'Brownies',
    itens: brownies.map((b) => ({ nome: `Brownie (${b.qtd} unidades)`, preco: b.preco })),
  },
  {
    titulo: 'Bem-Casados',
    itens: bemCasados.map((b) => ({ nome: `Bem-Casado (${b.qtd} unidades)`, preco: b.preco })),
  },
  {
    titulo: 'Salgadinhos',
    itens: salgadinhos.map((s) => ({ nome: `Salgadinho (${s.qtd} unidades)`, preco: s.preco })),
  },
];

export default function PriceList() {
  return (
    <section id="product-list" className="product-list">
      <h2>Preços</h2>
      <div id="product-list-container" className="container">
        {blocos.map((bloco) => (
          <div className="product-block" key={bloco.titulo}>
            <h3>{bloco.titulo}</h3>
            <ul className="product-list-ul row">
              {bloco.itens.map((item) => (
                <li key={item.nome}>
                  <strong>{item.nome}:</strong> {formatarPreco(item.preco)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
