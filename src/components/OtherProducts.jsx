const produtos = [
  { nome: 'Brownie Recheado', img: '/scr/Brownie.jpg', alt: 'brownies' },
  { nome: 'Docinhos Variados - ', img: '/scr/docinhos.jpg', alt: 'brigadeiros' },
  { nome: 'Salgadinhos de Festa', img: '/scr/salgadinhos.jpg', alt: 'salgados' },
  { nome: 'Bem-Casados', img: '/scr/bem-casado.jpg', alt: 'bem-casado' },
];

export default function OtherProducts() {
  return (
    <section id="menu" className="menu-section">
      <h2>Outros Produtos</h2>
      <div className="menu-section2">
        <div className="left-section">
          {produtos.map((p) => (
            <div className="prod-item" key={p.nome}>
              <b>{p.nome}</b>
              <img className="img-prod" src={p.img} alt={p.alt} />
            </div>
          ))}
        </div>
        <div className="right-section">
          <p>Confira tambem o nosso catalogo de Delivery!</p>
          <a className="text-con" href="https://app.cardapioweb.com/doce_desejo_gourmet">Clique aqui</a>
        </div>
      </div>
    </section>
  );
}
