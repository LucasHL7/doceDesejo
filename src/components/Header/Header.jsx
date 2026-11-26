import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon/Icon.jsx';
import Selo from '../Selo/Selo.jsx';
import { WHATSAPP_NUMERO } from '../../data/produtos.js';
import './Header.css';

// Links do menu. O ícone aparece no menu lateral (desktop) e na gaveta (celular).
const links = [
  { href: '#home', label: 'Início', icon: 'home' },
  { href: '#about', label: 'Estilos de bolos', icon: 'photo_library' },
  { href: '#product-list', label: 'Preços', icon: 'sell' },
  { href: '#menu', label: 'Delivery', icon: 'moped' },
];

// A partir de quantos pixels rolados o menu vai para a lateral (desktop).
const LIMITE_LATERAL = 320;

// No celular, a partir daqui a barra encolhe e sobra só o botão do menu.
const LIMITE_COMPACTO = 120;

const DESKTOP = '(min-width: 1025px)';

const INSTAGRAM_URL = 'https://www.instagram.com/docedesejogourmethe/';

const secoesObservadas = ['#home', '#about', '#product-list', '#menu', '#contact'];

export default function Header() {
  const [rolou, setRolou] = useState(false);
  const [lateral, setLateral] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState('#home');
  const botaoAbrir = useRef(null);
  const botaoFechar = useRef(null);

  // Sombra mais forte ao rolar; no desktop, o menu vai para a lateral.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const atualizar = () => {
      setRolou(window.scrollY > 10);
      setLateral(mq.matches && window.scrollY > LIMITE_LATERAL);
      setCompacto(!mq.matches && window.scrollY > LIMITE_COMPACTO);
      if (mq.matches) setAberto(false);
    };
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
    mq.addEventListener('change', atualizar);
    return () => {
      window.removeEventListener('scroll', atualizar);
      mq.removeEventListener('change', atualizar);
    };
  }, []);

  // Destaca o link da seção que está na tela.
  useEffect(() => {
    const secoes = secoesObservadas.map((s) => document.querySelector(s)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) setAtivo(`#${e.target.id}`);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    secoes.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Gaveta aberta: trava a rolagem, fecha com Esc e cuida do foco.
  useEffect(() => {
    if (!aberto) return undefined;
    const abridor = botaoAbrir.current;
    document.body.style.overflow = 'hidden';
    // espera o navegador aplicar o estilo de "aberto" antes de focar
    const timer = setTimeout(() => botaoFechar.current?.focus(), 50);
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', aoTeclar);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', aoTeclar);
      abridor?.focus({ preventScroll: true });
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  const classes = [
    'site-header',
    rolou && 'is-scrolled',
    lateral && 'is-side',
    compacto && 'is-compact',
    aberto && 'is-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <nav className="header-pill" aria-label="Principal" inert={lateral ? '' : undefined}>
        {/* Só no celular: Instagram à esquerda do selo central */}
        <a
          href={INSTAGRAM_URL}
          className="header-insta"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram da Doce Desejo"
          inert={compacto ? '' : undefined}
        >
          <Icon name="photo_camera" />
        </a>

        <a href="#home" className="header-brand" inert={compacto ? '' : undefined}>
          <Selo className="header-logo" />
          <span className="header-name" aria-hidden="true">Doce Desejo</span>
        </a>

        <ul className="header-links">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={ativo === l.href ? 'is-active' : ''}
                aria-current={ativo === l.href ? 'true' : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="header-cta">
          <Icon name="cake" />
          Fazer orçamento
        </a>

        <button
          ref={botaoAbrir}
          type="button"
          className="header-toggle"
          aria-expanded={aberto}
          aria-controls="mobile-drawer"
          aria-label="Abrir menu"
          onClick={() => setAberto(true)}
        >
          <Icon name="menu" />
        </button>
      </nav>

      {/* Gaveta do celular. Fica fora da pílula porque o blur dela mudaria
          a referência do position: fixed. */}
      <div className="drawer-backdrop" onClick={fechar} aria-hidden="true" />
      <div
        id="mobile-drawer"
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={aberto ? undefined : ''}
      >
        <div className="drawer-top">
          <a href="#home" className="drawer-brand" onClick={fechar}>
            <Selo />
          </a>
          <button
            ref={botaoFechar}
            type="button"
            className="drawer-close"
            aria-label="Fechar menu"
            onClick={fechar}
          >
            <Icon name="close" />
          </button>
        </div>

        <ul className="drawer-links">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={ativo === l.href ? 'is-active' : ''}
                aria-current={ativo === l.href ? 'true' : undefined}
                onClick={fechar}
              >
                <Icon name={l.icon} filled={ativo === l.href} />
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="drawer-footer">
          <a href="#contact" className="drawer-cta" onClick={fechar}>
            <Icon name="cake" />
            Fazer orçamento
          </a>
          <div className="drawer-social">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Icon name="photo_camera" />
              Instagram
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" rel="noopener noreferrer">
              <Icon name="chat" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Menu lateral (desktop): aparece no lugar da pílula depois de rolar. */}
      <nav className="side-rail" aria-label="Principal (lateral)" inert={lateral ? undefined : ''}>
        <a href="#home" className="side-rail-brand" aria-label="Doce Desejo, voltar ao início">
          <Selo alt="" />
        </a>

        <ul className="side-rail-links">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`side-rail-item ${ativo === l.href ? 'is-active' : ''}`}
                aria-current={ativo === l.href ? 'true' : undefined}
                aria-label={l.label}
              >
                <Icon name={l.icon} filled={ativo === l.href} />
                <span className="side-rail-tip" aria-hidden="true">{l.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="side-rail-item side-rail-cta" aria-label="Fazer orçamento">
          <Icon name="cake" filled />
          <span className="side-rail-tip" aria-hidden="true">Fazer orçamento</span>
        </a>
      </nav>
    </header>
  );
}
