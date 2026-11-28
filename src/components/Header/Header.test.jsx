import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header.jsx';

const matchMediaOriginal = window.matchMedia;
let desktop;
let ouvintesMq;

function rolarPara(y) {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: y });
  act(() => fireEvent.scroll(window));
}

const cabecalho = () => document.querySelector('header.site-header');

beforeEach(() => {
  desktop = false;
  ouvintesMq = [];
  window.matchMedia = vi.fn(() => ({
    get matches() {
      return desktop;
    },
    addEventListener: (_, fn) => ouvintesMq.push(fn),
    removeEventListener: vi.fn(),
  }));
  rolarPara(0);
});

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
  vi.useRealTimers();
});

describe('Header', () => {
  it('no celular, encolhe ao rolar', () => {
    render(<Header />);
    expect(cabecalho()).toHaveClass('site-header');
    expect(cabecalho()).not.toHaveClass('is-scrolled');

    rolarPara(50);
    expect(cabecalho()).toHaveClass('is-scrolled');
    expect(cabecalho()).not.toHaveClass('is-compact');

    rolarPara(200);
    expect(cabecalho()).toHaveClass('is-compact');
    expect(cabecalho()).not.toHaveClass('is-side');
  });

  it('no desktop, vai para o menu lateral depois de rolar bastante', () => {
    desktop = true;
    render(<Header />);
    rolarPara(400);
    expect(cabecalho()).toHaveClass('is-side');
    expect(cabecalho()).not.toHaveClass('is-compact');
    expect(screen.getByRole('navigation', { name: 'Principal (lateral)' })).not.toHaveAttribute('inert');
    expect(screen.getByRole('navigation', { name: 'Principal', hidden: true })).toHaveAttribute('inert');
  });

  it('abre a gaveta, foca o botão de fechar, trava a rolagem e fecha com Esc', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const abrir = screen.getByRole('button', { name: 'Abrir menu' });

    vi.useFakeTimers();
    fireEvent.click(abrir);
    expect(cabecalho()).toHaveClass('is-open');
    expect(abrir).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    act(() => vi.advanceTimersByTime(50));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus();
    vi.useRealTimers();

    await user.keyboard('{Escape}');
    expect(cabecalho()).not.toHaveClass('is-open');
    expect(document.body.style.overflow).toBe('');
    expect(abrir).toHaveFocus();
  });

  it('fecha a gaveta pelo X, pelo fundo e ao escolher um link', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const abrir = () => user.click(screen.getByRole('button', { name: 'Abrir menu' }));

    await abrir();
    await user.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(cabecalho()).not.toHaveClass('is-open');

    await abrir();
    fireEvent.click(document.querySelector('.drawer-backdrop'));
    expect(cabecalho()).not.toHaveClass('is-open');

    await abrir();
    const gaveta = screen.getByRole('dialog', { name: 'Menu' });
    await user.click(gaveta.querySelector('a[href="#menu"]'));
    expect(cabecalho()).not.toHaveClass('is-open');

    // outras teclas não fecham
    await abrir();
    await user.keyboard('a');
    expect(cabecalho()).toHaveClass('is-open');
  });

  it('a gaveta fecha sozinha se a tela virar desktop', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    desktop = true;
    act(() => ouvintesMq.forEach((fn) => fn()));
    expect(cabecalho()).not.toHaveClass('is-open');
  });

  it('destaca o link da seção visível na tela', () => {
    const secao = document.createElement('section');
    secao.id = 'product-list';
    document.body.appendChild(secao);
    render(<Header />);

    const obs = IntersectionObserver.instancias.find((o) => o.alvos?.includes(secao));
    act(() =>
      obs.callback([
        { target: secao, isIntersecting: false },
        { target: secao, isIntersecting: true },
      ])
    );

    const links = screen.getAllByRole('link', { name: 'Preços', hidden: true });
    links.forEach((l) => expect(l).toHaveAttribute('aria-current', 'true'));
    secao.remove();
  });
});
