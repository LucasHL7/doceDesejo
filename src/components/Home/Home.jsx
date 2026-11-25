import { bolosConfeitados, PRECO_BENTO_CAKE, formatarPreco } from '../../data/produtos.js';
import Icon from '../Icon/Icon.jsx';
import './Home.css';

const destaques = ['Bolos sob encomenda', 'Doces e salgados', 'Orçamento pelo WhatsApp'];

export default function Home() {
  const menorBolo = bolosConfeitados[0];

  return (
    <section id="home" className="hero">
      <div className="hero-inner">
        <div className="hero-text">
          <span className="hero-eyebrow">
            <Icon name="cake" />
            Bem-vindo à Doce Desejo
          </span>

          <h1 className="hero-title">
            Criando sabores para <span className="hero-script">adoçar</span> seu dia.
          </h1>

          <p className="hero-lead">
            Bolos únicos para aniversários, casamentos, formaturas e todas as ocasiões especiais.
            Do clássico chocolate ao red velvet, cada bolo é feito à mão e decorado com carinho.
          </p>

          <div className="hero-actions">
            <a href="#contact" className="hero-btn hero-btn-primary">
              Fazer orçamento
              <Icon name="arrow_forward" />
            </a>
            <a href="#product-list" className="hero-btn hero-btn-secondary">Ver preços</a>
          </div>

          <ul className="hero-highlights">
            {destaques.map((d) => (
              <li key={d}>
                <Icon name="check" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <div className="hero-blob" aria-hidden="true"></div>
          <img className="hero-img" src="/scr/bolo.png" alt="Bolo de chocolate com morangos e cerejas" />

          <div className="hero-badge hero-badge-top">
            <span className="hero-badge-label">Bolo confeitado</span>
            <strong>a partir de {formatarPreco(menorBolo.preco)}</strong>
            <span className="hero-badge-sub">{menorBolo.fatias} fatias</span>
          </div>

          <div className="hero-badge hero-badge-bottom">
            <span className="hero-badge-label">Bento Cake</span>
            <strong>{formatarPreco(PRECO_BENTO_CAKE)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
