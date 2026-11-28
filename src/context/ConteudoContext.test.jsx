import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { carregarConteudo } from '../firebase/conteudo.js';
import { cardapioPadrao } from '../data/cardapio.js';
import { imagensSitePadrao } from '../data/imagensPadrao.js';
import { ConteudoProvider, useConteudo } from './ConteudoContext.jsx';

vi.mock('../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

// Mostra na tela o que o contexto entrega.
function Espiao() {
  const c = useConteudo();
  return (
    <div>
      <p data-testid="status">{c.status}</p>
      <p data-testid="carregando">{String(c.carregando)}</p>
      <p data-testid="produtos">{c.produtos.map((p) => p.id).join(',')}</p>
      <p data-testid="galeria">{c.galeria.length}</p>
      <p data-testid="hero">{c.imagensSite.hero?.src}</p>
      <p data-testid="delivery">{c.imagensSite['delivery-1']?.src}</p>
      <p data-testid="busca-oculto">{String(Boolean(c.buscarProduto('oculto')))}</p>
      <p data-testid="busca-visivel">{c.buscarProduto('visivel')?.nome ?? '-'}</p>
    </div>
  );
}

const renderizar = () =>
  render(
    <ConteudoProvider>
      <Espiao />
    </ConteudoProvider>
  );

const texto = (id) => screen.getByTestId(id).textContent;
const idsPadrao = cardapioPadrao.map((p) => p.id).join(',');

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.useRealTimers());

describe('ConteudoProvider', () => {
  it('começa "carregando" sem mostrar produtos e depois usa o que veio do Firebase', async () => {
    let resolver;
    carregarConteudo.mockReturnValue(new Promise((r) => (resolver = r)));
    renderizar();

    expect(texto('status')).toBe('carregando');
    expect(texto('carregando')).toBe('true');

    await act(async () =>
      resolver({
        produtos: [
          { id: 'visivel', nome: 'Bolo visível', ativo: true },
          { id: 'sem-campo', nome: 'Sem campo ativo' },
          { id: 'oculto', nome: 'Escondido', ativo: false },
        ],
        galeria: [{ id: 'g1', src: 'g1.jpg' }],
        imagensSite: { hero: { src: 'firebase-hero.webp' } },
      })
    );

    expect(texto('status')).toBe('pronto');
    expect(texto('carregando')).toBe('false');
    // ativo: false some do site; sem o campo continua aparecendo
    expect(texto('produtos')).toBe('visivel,sem-campo');
    expect(texto('busca-oculto')).toBe('false');
    expect(texto('busca-visivel')).toBe('Bolo visível');
    expect(texto('galeria')).toBe('1');
    expect(texto('hero')).toBe('firebase-hero.webp');
    // fotos que não vieram do Firebase continuam com o padrão
    expect(texto('delivery')).toBe(imagensSitePadrao['delivery-1'].src);
  });

  it('com o banco vazio, usa o cardápio padrão', async () => {
    carregarConteudo.mockResolvedValue({ produtos: [], galeria: [], imagensSite: {} });
    renderizar();
    await waitFor(() => expect(texto('status')).toBe('padrao'));
    expect(texto('produtos')).toBe(idsPadrao);
    expect(texto('galeria')).toBe('5');
  });

  it('se o Firebase falhar, usa o padrão e avisa no console', async () => {
    carregarConteudo.mockRejectedValue(new Error('offline'));
    renderizar();
    await waitFor(() => expect(texto('status')).toBe('padrao'));
    expect(texto('produtos')).toBe(idsPadrao);
    expect(console.warn).toHaveBeenCalled();
  });

  it('se o Firebase demorar mais de 8 segundos, desiste e usa o padrão', async () => {
    // só o setTimeout é falso; o resto (setImmediate) segue real para esperar o import dinâmico
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    carregarConteudo.mockReturnValue(new Promise(() => {}));
    renderizar();
    for (let i = 0; i < 50 && !carregarConteudo.mock.calls.length; i++) {
      await new Promise((r) => setImmediate(r));
    }
    expect(carregarConteudo).toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(7999));
    expect(texto('status')).toBe('carregando');

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(texto('status')).toBe('padrao');
    expect(console.warn.mock.calls[0][1].message).toMatch(/demorou/);
  });

  it('ignora a resposta se o componente já saiu da tela', async () => {
    let resolver;
    carregarConteudo.mockReturnValue(new Promise((r) => (resolver = r)));
    const { unmount } = renderizar();
    await vi.waitFor(() => expect(carregarConteudo).toHaveBeenCalled());
    unmount();
    // não deve dar erro de setState em componente desmontado
    await act(async () => resolver({ produtos: [{ id: 'x' }], galeria: [], imagensSite: {} }));
  });

  it('useConteudo fora do provider dá um erro claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Espiao />)).toThrow('useConteudo precisa estar dentro de <ConteudoProvider>');
  });
});

describe('ConteudoProvider sem Firebase configurado', () => {
  it('usa o padrão direto, sem tentar carregar', async () => {
    vi.resetModules();
    vi.doMock('../firebase/config.js', () => ({ firebaseConfigurado: false, firebaseConfig: {} }));
    const { ConteudoProvider: Provider, useConteudo: usar } = await import('./ConteudoContext.jsx');
    const { carregarConteudo: carregar } = await import('../firebase/conteudo.js');

    function Status() {
      return <p data-testid="status">{usar().status}</p>;
    }
    render(
      <Provider>
        <Status />
      </Provider>
    );

    expect(texto('status')).toBe('padrao');
    expect(carregar).not.toHaveBeenCalled();
    vi.doUnmock('../firebase/config.js');
  });
});
