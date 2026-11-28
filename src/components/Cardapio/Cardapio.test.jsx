import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { conteudoPadrao, renderizarSite } from '../../test/renderizar.jsx';
import Cardapio from './Cardapio.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

const cartoes = () =>
  within(document.querySelector('.menu-grid'))
    .queryAllByRole('button')
    .map((b) => b.querySelector('.menu-card-name').textContent);

describe('Cardapio', () => {
  it('mostra esqueletos enquanto carrega, sem produtos', async () => {
    await renderizarSite(<Cardapio />, { dados: 'pendente', esperar: false });
    const grade = document.querySelector('.menu-grid');
    expect(grade).toHaveAttribute('aria-busy', 'true');
    expect(grade.querySelectorAll('.menu-card-skeleton')).toHaveLength(6);
    expect(cartoes()).toEqual([]);
  });

  it('mostra todos os produtos com o preço "a partir de"', async () => {
    await renderizarSite(<Cardapio />);
    expect(document.querySelector('.menu-grid')).not.toHaveAttribute('aria-busy');
    expect(cartoes()).toHaveLength(7);

    const bolo = screen.getByRole('button', { name: /Bolo confeitado/ });
    expect(bolo).toHaveTextContent('a partir deR$100,00');
    expect(screen.getByRole('button', { name: /Brigadeiros/ })).toHaveTextContent('R$1,50/un');
    expect(screen.getByRole('button', { name: /Bento Cake/ })).toHaveTextContent('R$40,00');
  });

  it('filtra por categoria', async () => {
    const user = userEvent.setup();
    await renderizarSite(<Cardapio />);

    const todos = screen.getByRole('tab', { name: 'Todos' });
    expect(todos).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Bolos' }));
    expect(screen.getByRole('tab', { name: 'Bolos' })).toHaveAttribute('aria-selected', 'true');
    expect(todos).toHaveAttribute('aria-selected', 'false');
    expect(cartoes()).toEqual(['Bolo confeitado', 'Bento Cake', 'Fatias de bolo']);

    await user.click(screen.getByRole('tab', { name: 'Salgados' }));
    expect(cartoes()).toEqual(['Salgadinhos de festa']);

    await user.click(todos);
    expect(cartoes()).toHaveLength(7);
  });

  it('esconde abas de categorias sem produtos', async () => {
    const dados = conteudoPadrao();
    dados.produtos = dados.produtos.filter((p) => p.categoria === 'bolos');
    await renderizarSite(<Cardapio />, { dados });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Todos', 'Bolos']);
  });

  it('clicar num produto abre a janela dele', async () => {
    const user = userEvent.setup();
    await renderizarSite(<Cardapio />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Escolher Bento Cake/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Bento Cake' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
