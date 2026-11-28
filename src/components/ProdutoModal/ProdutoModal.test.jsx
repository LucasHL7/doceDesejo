import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSacola } from '../../context/SacolaContext.jsx';
import { conteudoPadrao, produtoPadrao, renderizarSite } from '../../test/renderizar.jsx';
import ProdutoModal from './ProdutoModal.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

let sacola;
function Cena({ produto, onFechar = () => {} }) {
  sacola = useSacola();
  const [atual, setAtual] = useState(produto);
  return (
    <>
      <button type="button" onClick={() => setAtual(produto)}>reabrir</button>
      <ProdutoModal
        produto={atual}
        onFechar={() => {
          setAtual(null);
          onFechar();
        }}
      />
    </>
  );
}

const abrir = async (id, props) => {
  await renderizarSite(<Cena produto={produtoPadrao(id)} {...props} />);
  return screen.getByRole('dialog');
};

const botaoAdicionar = () => screen.getByRole('button', { name: /Adicionar/ });

beforeEach(() => {
  sacola = null;
});

describe('ProdutoModal', () => {
  it('sem produto, fica fechado', async () => {
    await renderizarSite(<ProdutoModal produto={null} onFechar={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre com a primeira opção escolhida e o total certo; trocar a opção muda o total', async () => {
    const user = userEvent.setup();
    const dialog = await abrir('bolo-confeitado');

    expect(dialog).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('heading', { name: 'Bolo confeitado' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /8 fatias/ })).toBeChecked();
    expect(botaoAdicionar()).toHaveTextContent('R$100,00');
    expect(screen.getByText(/foto de referência/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /20 fatias/ }));
    expect(botaoAdicionar()).toHaveTextContent('R$165,00');

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(botaoAdicionar()).toHaveTextContent('R$330,00');
    await user.click(screen.getByRole('button', { name: 'Diminuir quantidade' }));
    expect(botaoAdicionar()).toHaveTextContent('R$165,00');
  });

  it('adiciona à sacola com as escolhas feitas e fecha', async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    await abrir('bolo-confeitado', { onFechar });

    await user.selectOptions(screen.getByLabelText('Massa'), 'ninho');
    await user.selectOptions(screen.getByLabelText(/Segundo recheio/), 'coco');
    await user.click(botaoAdicionar());

    expect(sacola.linhas).toHaveLength(1);
    expect(sacola.linhas[0]).toMatchObject({
      produtoId: 'bolo-confeitado',
      opcao: '8',
      qtd: 1,
      campos: { massa: 'ninho', recheio: 'coco', recheio2: 'coco' },
    });
    expect(onFechar).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('segundo recheio é opcional e começa em "Nenhum"', async () => {
    await abrir('bolo-confeitado');
    expect(screen.getByLabelText(/Segundo recheio \(opcional\)/)).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Nenhum' })).toBeInTheDocument();
  });

  it('por unidade: começa no mínimo, soma de passo em passo e não deixa ficar abaixo do mínimo', async () => {
    const user = userEvent.setup();
    await abrir('brigadeiro');
    const qtd = screen.getByLabelText('Quantidade de unidades');

    expect(qtd).toHaveValue(10);
    expect(screen.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled();
    expect(botaoAdicionar()).toHaveTextContent('R$17,00');

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(qtd).toHaveValue(15);

    // acima de 45 o preço da unidade cai para R$1,50
    await user.clear(qtd);
    await user.type(qtd, '50');
    expect(botaoAdicionar()).toHaveTextContent('R$75,00');

    await user.clear(qtd);
    await user.type(qtd, '3');
    await user.click(botaoAdicionar());
    expect(screen.getByRole('alert')).toHaveTextContent('A quantidade mínima é 10 unidades.');
    expect(sacola.linhas).toHaveLength(0);

    // mexer na quantidade apaga o erro
    await user.type(qtd, '0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('o campo de quantidade não aceita sinais nem decimais', async () => {
    await abrir('brigadeiro');
    const qtd = screen.getByLabelText('Quantidade de unidades');
    for (const key of ['e', '-', '+', ',', '.']) {
      const evento = fireEvent.keyDown(qtd, { key });
      expect(evento).toBe(false); // preventDefault foi chamado
    }
    expect(fireEvent.keyDown(qtd, { key: '5' })).toBe(true);
  });

  it('erro de mínimo para produtos que não são por unidade', async () => {
    const user = userEvent.setup();
    await abrir('bento-cake');
    const qtd = screen.getByLabelText('Quantidade');
    await user.clear(qtd);
    await user.click(botaoAdicionar());
    expect(screen.getByRole('alert')).toHaveTextContent('A quantidade mínima é 1.');
  });

  it('limita os sabores ao máximo e deixa desmarcar', async () => {
    const user = userEvent.setup();
    await abrir('brigadeiro');
    expect(screen.getByText('Sabores (até 4)')).toBeInTheDocument();

    const sabores = ['Chocolate', 'Ninho', 'Dois Amores', 'Beijinho'];
    // com 3 marcados ainda dá para marcar o 4º
    for (const s of sabores.slice(0, 3)) await user.click(screen.getByRole('checkbox', { name: s }));
    expect(screen.getByRole('checkbox', { name: 'Beijinho' })).toBeEnabled();

    await user.click(screen.getByRole('checkbox', { name: 'Ninho' }));
    expect(screen.getByRole('checkbox', { name: 'Ninho' })).not.toBeChecked();

    await user.type(screen.getByLabelText('Cor da caixeta'), 'rosa');
    await user.click(botaoAdicionar());
    expect(sacola.linhas[0].campos).toEqual({ sabores: ['chocolate', 'dois-amores'], caixeta: 'rosa' });
  });

  it('bloqueia novos sabores ao chegar no máximo', async () => {
    const user = userEvent.setup();
    const base = produtoPadrao('brigadeiro');
    const produto = {
      ...base,
      campos: [{ ...base.campos[0], max: 2 }],
    };
    await renderizarSite(<Cena produto={produto} />);

    await user.click(screen.getByRole('checkbox', { name: 'Chocolate' }));
    await user.click(screen.getByRole('checkbox', { name: 'Ninho' }));
    expect(screen.getByRole('checkbox', { name: 'Beijinho' })).toBeDisabled();
    // mesmo se o clique chegar, não passa do máximo
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beijinho' }));
    await user.click(botaoAdicionar());
    expect(sacola.linhas[0].campos.sabores).toEqual(['chocolate', 'Ninho']);
  });

  it('checkbox sem máximo deixa marcar todos', async () => {
    const user = userEvent.setup();
    const base = produtoPadrao('brownie');
    const { max, ...semMax } = base.campos[0];
    await renderizarSite(<Cena produto={{ ...base, campos: [semMax] }} />);
    expect(max).toBe(4);
    expect(screen.getByText('Sabores')).toBeInTheDocument();
    for (const cb of screen.getAllByRole('checkbox')) await user.click(cb);
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).toBeChecked();
  });

  it('fecha pelo X e pelo clique no fundo', async () => {
    const user = userEvent.setup();
    const onFechar = vi.fn();
    const dialog = await abrir('bento-cake', { onFechar });

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onFechar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'reabrir', hidden: true }));
    expect(dialog).toHaveAttribute('open');
    // clique dentro do conteúdo não fecha
    fireEvent.click(screen.getByRole('heading', { name: 'Bento Cake' }));
    expect(onFechar).toHaveBeenCalledTimes(1);
    fireEvent.click(dialog);
    expect(onFechar).toHaveBeenCalledTimes(2);
  });

  it('produto por unidade com opções mostra o preço por unidade', async () => {
    await abrir('fatias');
    expect(screen.getByRole('radio', { name: /Fatia com embalagem propria/ })).toBeChecked();
    expect(screen.getAllByText(/\/un$/).length).toBeGreaterThan(0);
    expect(botaoAdicionar()).toHaveTextContent('R$40,00'); // 8 fatias x R$5
  });

  it('produto sem personalizações nem opções; "+" com a quantidade apagada', async () => {
    const user = userEvent.setup();
    const produto = { id: 'simples', nome: 'Simples', tipo: 'fixo', preco: 10, opcoes: [] };
    // o produto precisa estar no cardápio para a sacola aceitar
    await renderizarSite(<Cena produto={produto} />, { dados: { ...conteudoPadrao(), produtos: [produto] } });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    const qtd = screen.getByLabelText('Quantidade');
    await user.clear(qtd);
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(qtd).toHaveValue(1);
    await user.click(botaoAdicionar());
    expect(sacola.linhas[0]).toMatchObject({ produtoId: 'simples', opcao: null, qtd: 1, campos: {} });
  });

  it('select sem nenhuma opção começa vazio', async () => {
    const produto = {
      id: 'sem-opcoes',
      nome: 'Sem opções',
      tipo: 'fixo',
      preco: 10,
      campos: [{ id: 'massa', label: 'Massa', tipo: 'select', opcoes: [] }],
    };
    const user = userEvent.setup();
    await renderizarSite(<Cena produto={produto} />, { dados: { ...conteudoPadrao(), produtos: [produto] } });
    await user.click(botaoAdicionar());
    expect(sacola.linhas[0].campos).toEqual({ massa: '' });
  });
});
