import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conteudoPadrao, renderizarSite } from '../../test/renderizar.jsx';
import CakeStyles from './CakeStyles.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

// O jsdom não calcula layout: simulamos um trilho de 300px com slides de 100px.
function simularLayout(trilho, { total, largura = 300, passo = 100, rolagem = 0 }) {
  Object.defineProperty(trilho, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(trilho, 'scrollWidth', { configurable: true, value: total * passo });
  Object.defineProperty(trilho, 'scrollLeft', { configurable: true, writable: true, value: rolagem });
  [...trilho.children].forEach((li, i) =>
    Object.defineProperty(li, 'offsetLeft', { configurable: true, value: i * passo })
  );
}

const trilho = () => document.getElementById('cakes-track');
const anterior = () => screen.getByRole('button', { name: 'Bolo anterior' });
const proximo = () => screen.getByRole('button', { name: 'Próximo bolo' });

const matchMediaOriginal = window.matchMedia;
afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});

describe('CakeStyles', () => {
  it('mostra espaços reservados enquanto carrega', async () => {
    await renderizarSite(<CakeStyles />, { dados: 'pendente', esperar: false });
    expect(trilho().querySelectorAll('li[aria-hidden="true"]')).toHaveLength(4);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('mostra as fotos da galeria', async () => {
    await renderizarSite(<CakeStyles />);
    const fotos = screen.getAllByRole('img');
    expect(fotos).toHaveLength(5);
    expect(fotos[0]).toHaveAttribute('alt', 'Bolo confeitado decorado, estilo 1');
    expect(screen.getByLabelText('1 de 5')).toBeInTheDocument();
  });

  it('navega pelas setas e pelos pontos, respeitando os limites', async () => {
    await renderizarSite(<CakeStyles />);
    const el = trilho();
    simularLayout(el, { total: 5 });
    act(() => fireEvent.scroll(el));

    // 5 slides, 3 visíveis: posições 0, 1 e 2
    const pontos = screen.getAllByRole('button', { name: /Ir para a posição/ });
    expect(pontos).toHaveLength(3);
    expect(pontos[0]).toHaveAttribute('aria-current', 'true');
    expect(anterior()).toBeDisabled();
    expect(proximo()).toBeEnabled();

    window.matchMedia = vi.fn(() => ({ matches: false }));
    fireEvent.click(proximo());
    expect(el.scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: 'smooth' });

    // pessoa que prefere menos movimento: sem animação
    window.matchMedia = vi.fn(() => ({ matches: true }));
    fireEvent.click(pontos[2]);
    expect(el.scrollTo).toHaveBeenLastCalledWith({ left: 200, behavior: 'auto' });

    // o navegador rola até o fim
    el.scrollLeft = 200;
    act(() => fireEvent.scroll(el));
    expect(proximo()).toBeDisabled();
    expect(anterior()).toBeEnabled();
    expect(screen.getAllByRole('button', { name: /Ir para a posição/ })[2]).toHaveAttribute('aria-current', 'true');

    fireEvent.click(anterior());
    expect(el.scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: 'auto' });
  });

  it('remede ao mudar de tamanho; com uma foto só, sem pontos', async () => {
    const dados = conteudoPadrao();
    dados.galeria = [dados.galeria[0]];
    await renderizarSite(<CakeStyles />, { dados });
    const el = trilho();
    simularLayout(el, { total: 1, largura: 300, passo: 300 });

    const ro = ResizeObserver.instancias.find((o) => o.alvos?.includes(el));
    act(() => ro.callback([]));

    expect(screen.queryByRole('group', { name: /posição do carrossel/ })).not.toBeInTheDocument();
    expect(proximo()).toBeDisabled();
  });

  it('aceita fotos sem id e ignora medidas que chegam depois de sair da tela', async () => {
    const dados = conteudoPadrao();
    dados.galeria = [{ src: 'a.jpg', alt: 'A' }, { src: 'b.jpg', alt: 'B' }];
    const { unmount } = await renderizarSite(<CakeStyles />, { dados });
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('src'))).toEqual(['a.jpg', 'b.jpg']);

    const ro = ResizeObserver.instancias.find((o) => o.alvos?.includes(trilho()));
    unmount();
    expect(() => act(() => ro.callback([]))).not.toThrow();
  });
});
