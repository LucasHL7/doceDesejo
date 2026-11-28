import { formatarPreco } from '../../data/produtos.js';
import { precoDoCard } from '../../data/cardapio.js';
import { useConteudo } from '../../context/ConteudoContext.jsx';
import Icon from '../Icon/Icon.jsx';
import './Home.css';

const destaques = ['Bolos sob encomenda', 'Doces e salgados', 'Orçamento pelo WhatsApp'];

export default function Home() {
  const { imagensSite, buscarProduto, carregando } = useConteudo();
  // Os selos de preço usam os produtos do cardápio; somem se o produto for removido no painel.
  const bolo = carregando ? null : buscarProduto('bolo-confeitado');
  const bento = carregando ? null : buscarProduto('bento-cake');
  const menorOpcaoBolo = bolo?.opcoes?.reduce((a, b) => (b.preco < a.preco ? b : a), bolo.opcoes[0]);
  const hero = imagensSite.hero;

  return (
    <section id="home" className="hero">
      <div className="hero-inner">
        <div className="hero-text">
          <span className="hero-eyebrow">
            <Icon name="cake" />
            Confeitaria em Teresina
          </span>

          <h1 className="hero-title">
            Criando sabores para <span className="hero-script">adoçar</span> seu dia.
          </h1>

          <p className="hero-lead">
            Bolos sob encomenda em Teresina para aniversários, casamentos, formaturas e todas as
            ocasiões especiais. Do clássico chocolate ao red velvet, cada bolo é feito à mão e
            decorado com carinho.
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
          {!carregando && hero?.src && <img className="hero-img" src={hero.src} alt={hero.alt ?? ''} />}

          {bolo && (
            <div className="hero-badge hero-badge-top">
              <span className="hero-badge-label">{bolo.nome}</span>
              <strong>a partir de {formatarPreco(precoDoCard(bolo).valor)}</strong>
              {menorOpcaoBolo && <span className="hero-badge-sub">{menorOpcaoBolo.label}</span>}
            </div>
          )}

          {bento && (
            <div className="hero-badge hero-badge-bottom">
              <span className="hero-badge-label">{bento.nome}</span>
              <strong>{formatarPreco(precoDoCard(bento).valor)}</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
