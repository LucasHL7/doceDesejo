import { useEffect, useState } from 'react';
import Icon from '../Icon/Icon.jsx';
import './Header.css';

// Links do menu (desktop). O ícone é usado no menu lateral.
const links = [
  { href: '#home', label: 'Início', icon: 'home' },
  { href: '#about', label: 'Estilos de bolos', icon: 'photo_library' },
  { href: '#product-list', label: 'Preços', icon: 'sell' },
  { href: '#menu', label: 'Outros produtos', icon: 'cookie' },
];

// A partir de quantos pixels rolados o menu vai para a lateral (desktop).
const LIMITE_LATERAL = 320;

// Itens da barra inferior (celular). O item `destaque` é o botão central.
const itensBarra = [
  { href: '#home', label: 'Início', icon: 'home' },
  { href: '#product-list', label: 'Preços', icon: 'sell' },
  { href: '#contact', label: 'Pedir', icon: 'cake', destaque: true },
  { href: '#about', label: 'Bolos', icon: 'photo_library' },
  {
    href: 'https://www.instagram.com/docedesejogourmethe/',
    label: 'Insta',
    icon: 'photo_camera',
    externo: true,
  },
];

const secoesObservadas = ['#home', '#about', '#product-list', '#menu', '#contact'];

export default function Header() {
  const [rolou, setRolou] = useState(false);
  const [lateral, setLateral] = useState(false);
  const [ativo, setAtivo] = useState('#home');

  // Sombra mais forte ao rolar; no desktop, o menu vai para a lateral.
  useEffect(() => {
    const aoRolar = () => {
      setRolou(window.scrollY > 10);
      setLateral(window.scrollY > LIMITE_LATERAL);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
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

  return (
    <>
      <header className={`site-header ${rolou ? 'is-scrolled' : ''} ${lateral ? 'is-side' : ''}`}>
        <nav className="header-pill" aria-label="Principal" inert={lateral ? '' : undefined}>
          <a href="#home" className="header-brand">
            <img src="/scr/Logo.png" alt="" className="header-logo" />
            <span className="header-name">Doce Desejo</span>
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
        </nav>

        {/* Menu lateral (desktop): aparece no lugar da pílula depois de rolar. */}
        <nav className="side-rail" aria-label="Principal (lateral)" inert={lateral ? undefined : ''}>
          <a href="#home" className="side-rail-brand" aria-label="Doce Desejo, voltar ao início">
            <img src="/scr/Logo.png" alt="" />
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

      {/* Fica fora do <header>: o blur dele mudaria a referência do position: fixed. */}
      <nav className="bottom-nav" aria-label="Atalhos">
        {itensBarra.map((item) => {
          const isAtivo = !item.externo && ativo === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`bottom-nav-item ${item.destaque ? 'is-featured' : ''} ${isAtivo ? 'is-active' : ''}`}
              aria-current={isAtivo ? 'true' : undefined}
              {...(item.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span className="bottom-nav-icon">
                <Icon name={item.icon} filled={isAtivo || item.destaque} />
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
