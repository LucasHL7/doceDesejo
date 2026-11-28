import Icon from '../Icon/Icon.jsx';
import { useConteudo } from '../../context/ConteudoContext.jsx';
import './Delivery.css';

const CATALOGO_URL = 'https://app.cardapioweb.com/doce_desejo_gourmet';

// Chamada para o catálogo de delivery (Cardápio Web), separado das encomendas por orçamento.
export default function Delivery() {
  const { imagensSite, carregando } = useConteudo();
  // Fotos editadas pelo painel /admin (aba "Fotos do site").
  const fotos = carregando
    ? []
    : ['delivery-1', 'delivery-2', 'delivery-3'].map((id) => imagensSite[id]).filter((f) => f?.src);

  return (
    <section id="menu" className="delivery" aria-labelledby="delivery-title">
      <div className="delivery-card">
        <div className="delivery-text">
          <span className="delivery-eyebrow">
            <Icon name="moped" /> Delivery
          </span>
          <h2 id="delivery-title" className="delivery-title">
            Quer pedir sem esperar <span className="delivery-script">orçamento?</span>
          </h2>
          <p className="delivery-lead">
            No nosso catálogo de delivery você escolhe os doces e salgados, faz o pedido e
            recebe em casa. As encomendas personalizadas, como bolos decorados, continuam sendo
            feitas aqui pelo orçamento.
          </p>

          <ul className="delivery-compare">
            <li>
              <strong>Delivery</strong>
              <span>Pedido direto pelo catálogo online</span>
            </li>
            <li>
              <strong>Orçamento</strong>
              <span>Encomendas e bolos personalizados</span>
            </li>
          </ul>

          <a
            href={CATALOGO_URL}
            className="delivery-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir catálogo de delivery
            <Icon name="open_in_new" />
          </a>
          <p className="delivery-note">Abre o Cardápio Web em uma nova aba.</p>
        </div>

        <div className="delivery-photos" aria-hidden="true">
          {fotos.map((f, i) => (
            <img key={i} src={f.src} alt="" className={`delivery-photo delivery-photo-${i + 1}`} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
