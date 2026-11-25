export default function Home() {
  return (
    <section id="home" className="home">
      <div id="home-text" className="home-text">
        <h4 className="text-h4">Bem-Vindo a Doce Desejo! </h4>
        <h1 className="text-h1">Criando sabores para adoçar seu dia.</h1>
        <p>
          <strong>Criamos bolos únicos</strong> para aniversários, casamentos, formaturas e todas as
          ocasiões especiais. Do clássico chocolate ao sofisticado red velvet, nossos bolos são feitos
          para agradar todos os gostos e paladares. Confeitos artísticos e elegantes, feitos por nossos
          talentosos confeiteiros, tornam cada bolo uma verdadeira obra de arte.
        </p>
        <a href="#product-list" className="home-btn">Confira os preços</a>
      </div>
      <div id="home-img" className="home-img">
        <img src="/scr/bolo.png" alt="bolo" />
      </div>
    </section>
  );
}
