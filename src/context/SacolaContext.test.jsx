import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { carregarConteudo } from '../firebase/conteudo.js';
import { conteudoPadrao, renderizarSite, sacolaSalva } from '../test/renderizar.jsx';
import { useSacola } from './SacolaContext.jsx';

vi.mock('../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

let sacola;
function Espiao() {
  sacola = useSacola();
  return (
    <div>
      <p data-testid="itens">{sacola.quantidadeItens}</p>
      <p data-testid="total">{sacola.total}</p>
      <p data-testid="aberta">{String(sacola.aberta)}</p>
    </div>
  );
}

const texto = (id) => screen.getByTestId(id).textContent;
const salvo = () => JSON.parse(localStorage.getItem('doce-desejo:sacola'));

beforeEach(() => {
  vi.clearAllMocks();
  sacola = null;
});

describe('SacolaProvider', () => {
  it('adiciona, altera a quantidade, remove e limpa, calculando o total', async () => {
    await renderizarSite(<Espiao />);

    act(() => sacola.adicionar({ produtoId: 'bento-cake', qtd: 2, campos: {} }));
    act(() => sacola.adicionar({ produtoId: 'brownie', opcao: '20', qtd: 1, campos: { sabores: [] } }));
    expect(texto('itens')).toBe('2');
    expect(texto('total')).toBe(String(2 * 40 + 90));
    expect(sacola.ultimoAdicionado.produtoId).toBe('brownie');

    const [bento, brownie] = sacola.linhas;
    expect(bento.produto.nome).toBe('Bento Cake');
    expect(bento.total).toBe(80);

    act(() => sacola.alterarQtd(bento.id, 3));
    expect(texto('total')).toBe(String(3 * 40 + 90));

    act(() => sacola.remover(brownie.id));
    expect(texto('itens')).toBe('1');
    expect(salvo()).toHaveLength(1);

    act(() => sacola.limpar());
    expect(texto('itens')).toBe('0');
    expect(salvo()).toEqual([]);
  });

  it('abre e fecha', async () => {
    await renderizarSite(<Espiao />);
    act(() => sacola.abrir());
    expect(texto('aberta')).toBe('true');
    act(() => sacola.fechar());
    expect(texto('aberta')).toBe('false');
  });

  it('recupera a sacola salva no navegador', async () => {
    sacolaSalva([{ id: 'l1', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizarSite(<Espiao />);
    expect(texto('itens')).toBe('1');
    expect(texto('total')).toBe('40');
  });

  it('ignora sacola salva corrompida ou em formato errado', async () => {
    localStorage.setItem('doce-desejo:sacola', '{isso não é json');
    const { unmount } = await renderizarSite(<Espiao />);
    expect(texto('itens')).toBe('0');
    unmount();

    localStorage.setItem('doce-desejo:sacola', '{"a":1}');
    await renderizarSite(<Espiao />);
    expect(texto('itens')).toBe('0');
  });

  it('descarta itens de produtos removidos ou escondidos no painel, só depois de carregar', async () => {
    sacolaSalva([
      { id: 'l1', produtoId: 'bento-cake', qtd: 1, campos: {} },
      { id: 'l2', produtoId: 'produto-que-sumiu', qtd: 1, campos: {} },
      { id: 'l3', produtoId: 'brownie', opcao: '20', qtd: 1, campos: {} },
    ]);
    const dados = conteudoPadrao();
    dados.produtos = dados.produtos.map((p) => (p.id === 'brownie' ? { ...p, ativo: false } : p));

    let resolver;
    carregarConteudo.mockReturnValue(new Promise((r) => (resolver = r)));
    const { ConteudoProvider } = await import('./ConteudoContext.jsx');
    const { SacolaProvider } = await import('./SacolaContext.jsx');
    render(
      <ConteudoProvider>
        <SacolaProvider>
          <Espiao />
        </SacolaProvider>
      </ConteudoProvider>
    );

    // enquanto carrega, nada é apagado do que estava salvo
    expect(salvo()).toHaveLength(3);

    await act(async () => resolver(dados));
    await waitFor(() => expect(salvo()).toHaveLength(1));
    expect(salvo()[0].produtoId).toBe('bento-cake');
    expect(texto('itens')).toBe('1');
  });

  it('continua funcionando se o navegador bloquear o armazenamento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    await renderizarSite(<Espiao />);
    act(() => sacola.adicionar({ produtoId: 'bento-cake', qtd: 1, campos: {} }));
    expect(texto('itens')).toBe('1');
    setItem.mockRestore();
  });

  it('useSacola fora do provider dá um erro claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Espiao />)).toThrow('useSacola precisa estar dentro de <SacolaProvider>');
    console.error.mockRestore();
  });
});
