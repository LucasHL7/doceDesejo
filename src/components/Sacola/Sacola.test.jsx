import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSacola } from '../../context/SacolaContext.jsx';
import { renderizarSite, sacolaSalva } from '../../test/renderizar.jsx';
import Sacola from './Sacola.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

let sacola;
function Espiao() {
  sacola = useSacola();
  return null;
}

const renderizar = () =>
  renderizarSite(
    <>
      <Espiao />
      <Sacola />
    </>
  );

const botaoFlutuante = () => screen.queryByRole('button', { name: /Ver pedido/ });
const gaveta = () => document.querySelector('dialog.bag');

afterEach(() => vi.useRealTimers());

describe('Sacola', () => {
  it('sem itens, não mostra o botão flutuante', async () => {
    await renderizar();
    expect(botaoFlutuante()).not.toBeInTheDocument();
  });

  it('mostra quantidade e total no botão e abre a gaveta com os itens', async () => {
    const user = userEvent.setup();
    sacolaSalva([
      { id: 'a', produtoId: 'bento-cake', qtd: 2, campos: {} },
      { id: 'b', produtoId: 'brigadeiro', qtd: 10, campos: { sabores: ['chocolate'], caixeta: 'rosa' } },
    ]);
    await renderizar();

    expect(botaoFlutuante()).toHaveTextContent('2');
    expect(botaoFlutuante()).toHaveTextContent('R$97,00');
    expect(gaveta()).not.toHaveAttribute('open');

    await user.click(botaoFlutuante());
    expect(gaveta()).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');

    const itens = within(gaveta()).getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[1]).toHaveTextContent('Sabores: Chocolate · Cor da caixeta: rosa');
    expect(itens[1]).toHaveTextContent('10 unidades');
    expect(within(gaveta()).getByText('Total estimado').nextSibling).toHaveTextContent('R$97,00');
  });

  it('muda a quantidade respeitando mínimo e passo, e remove itens', async () => {
    const user = userEvent.setup();
    sacolaSalva([
      { id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} },
      { id: 'b', produtoId: 'brigadeiro', qtd: 10, campos: {} },
    ]);
    await renderizar();
    act(() => sacola.abrir());

    expect(screen.getByRole('button', { name: 'Diminuir Bento Cake' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Aumentar Bento Cake' }));
    expect(sacola.linhas[0].qtd).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Diminuir Bento Cake' }));
    expect(sacola.linhas[0].qtd).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Aumentar Brigadeiros' }));
    expect(sacola.linhas[1].qtd).toBe(15);
    expect(screen.getByText('15 unidades')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover Bento Cake' }));
    expect(sacola.linhas.map((l) => l.produtoId)).toEqual(['brigadeiro']);
  });

  it('sacola vazia na gaveta tem link para o cardápio, que fecha', async () => {
    const user = userEvent.setup();
    await renderizar();
    act(() => sacola.abrir());
    expect(within(gaveta()).getByText('Sua sacola está vazia.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver o cardápio' }));
    expect(sacola.aberta).toBe(false);
    expect(gaveta()).not.toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('');
  });

  it('fecha pelo X, pelo fundo e pelo Esc (evento close)', async () => {
    const user = userEvent.setup();
    await renderizar();

    act(() => sacola.abrir());
    await user.click(screen.getByRole('button', { name: 'Fechar sacola' }));
    expect(sacola.aberta).toBe(false);

    act(() => sacola.abrir());
    fireEvent.click(within(gaveta()).getByRole('heading', { name: /Seu pedido/ }));
    expect(sacola.aberta).toBe(true);
    fireEvent.click(gaveta());
    expect(sacola.aberta).toBe(false);

    act(() => sacola.abrir());
    act(() => gaveta().close()); // o navegador fecha sozinho no Esc
    expect(sacola.aberta).toBe(false);
  });

  it('"Continuar para o orçamento" fecha e rola até o formulário', async () => {
    const user = userEvent.setup();
    const form = document.createElement('section');
    form.id = 'contact';
    document.body.appendChild(form);
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();
    act(() => sacola.abrir());

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /Continuar para o orçamento/ }));
    expect(sacola.aberta).toBe(false);
    act(() => vi.advanceTimersByTime(60));
    expect(form.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    form.remove();
  });

  it('mostra o aviso "adicionado à sacola" por alguns segundos', async () => {
    await renderizar();
    vi.useFakeTimers();
    act(() => sacola.adicionar({ produtoId: 'bento-cake', qtd: 1, campos: {} }));
    expect(screen.getByRole('status')).toHaveTextContent('Bento Cake adicionado à sacola');
    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('aviso genérico se o item adicionado não for encontrado', async () => {
    await renderizar();
    act(() => sacola.adicionar({ produtoId: 'nao-existe', qtd: 1, campos: {} }));
    expect(screen.getByRole('status')).toHaveTextContent('Item adicionado à sacola');
  });

  it('esconde o botão flutuante quando o formulário ou o rodapé estão na tela', async () => {
    const contato = document.createElement('section');
    contato.id = 'contact';
    const rodape = document.createElement('footer');
    rodape.className = 'site-footer';
    document.body.append(contato, rodape);
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();

    const obs = IntersectionObserver.instancias.find((o) => o.alvos?.includes(contato));
    expect(obs.alvos).toEqual([contato, rodape]);
    expect(botaoFlutuante()).toBeInTheDocument();

    act(() => obs.callback([{ target: contato, isIntersecting: true }]));
    expect(botaoFlutuante()).not.toBeInTheDocument();
    act(() => obs.callback([{ target: contato, isIntersecting: false }, { target: rodape, isIntersecting: true }]));
    expect(botaoFlutuante()).not.toBeInTheDocument();
    act(() => obs.callback([{ target: rodape, isIntersecting: false }]));
    expect(botaoFlutuante()).toBeInTheDocument();

    contato.remove();
    rodape.remove();
  });
});
