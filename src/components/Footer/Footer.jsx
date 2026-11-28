import Icon from '../Icon/Icon.jsx';
import Selo from '../Selo/Selo.jsx';
import { WHATSAPP_NUMERO } from '../../data/produtos.js';
import {
  CATALOGO_URL,
  INSTAGRAM_URL,
  LINKTREE_URL,
  MAPS_URL,
  endereco,
  horarios,
} from '../../data/negocio.js';
import './Footer.css';

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}`;

// 5586995811231 -> (86) 99581-1231
const telefoneVisivel = (() => {
  const d = WHATSAPP_NUMERO.replace(/^55/, '');
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
})();

const navegacao = [
  { href: '#home', label: 'Início' },
  { href: '#about', label: 'Estilos de bolos' },
  { href: '#product-list', label: 'Cardápio e preços' },
  { href: '#menu', label: 'Delivery' },
  { href: '#contact', label: 'Fazer orçamento' },
];

// Logo do Instagram desenhado com formas simples (o Material Symbols não tem logos de marcas).
function IconeInstagram() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  const voltarAoTopo = () => {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' });
  };

  return (
    <footer className="site-footer">
      <svg className="footer-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,40 C240,80 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 L0,80 Z" />
      </svg>

      <div className="footer-inner">
        <div className="footer-brand">
          <Selo className="footer-selo" />
          <p className="footer-name">Doce Desejo Gourmet</p>
          <p className="footer-tagline">
            Bolos, doces e salgados feitos à mão em Teresina para adoçar os seus momentos.
          </p>
          <div className="footer-social">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <IconeInstagram />
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <Icon name="chat" />
            </a>
            <a href={LINKTREE_URL} target="_blank" rel="noopener noreferrer" aria-label="Todos os nossos links">
              <Icon name="link" />
            </a>
          </div>
        </div>

        <nav className="footer-col" aria-label="Rodapé">
          <h3>Navegue</h3>
          <ul>
            {navegacao.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col">
          <h3>Fale com a gente</h3>
          <ul className="footer-contact">
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="chat" />
                <span>
                  <small>WhatsApp</small>
                  {telefoneVisivel}
                </span>
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <IconeInstagram />
                <span>
                  <small>Instagram</small>
                  @docedesejogourmethe
                </span>
              </a>
            </li>
            <li>
              <a href={CATALOGO_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="moped" />
                <span>
                  <small>Delivery</small>
                  Catálogo online
                </span>
              </a>
            </li>
            <li>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="location_on" />
                <address>
                  <small>Endereço</small>
                  {endereco.rua}
                  <br />
                  {endereco.bairro}, {endereco.cidade} - {endereco.uf}
                </address>
              </a>
            </li>
            <li className="footer-contact-item">
              <Icon name="schedule" />
              <span>
                <small>Horário</small>
                {horarios.map((h) => (
                  <span key={h.dias} className="footer-horario">
                    {h.dias}: {h.horas}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        <div className="footer-cta">
          <p>Tem uma festa chegando?</p>
          <a href="#contact" className="footer-cta-btn">
            <Icon name="cake" /> Fazer orçamento
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Doce Desejo. Todos os direitos reservados.</p>
        <button type="button" className="footer-top" onClick={voltarAoTopo}>
          Voltar ao topo <Icon name="arrow_upward" />
        </button>
      </div>
    </footer>
  );
}
