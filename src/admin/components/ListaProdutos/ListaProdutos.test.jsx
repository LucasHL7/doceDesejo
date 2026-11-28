import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { excluirProduto, salvarOrdem, salvarProduto } from '../../../firebase/conteudo.js';
import ListaProdutos from './ListaProdutos.jsx';

vi.mock('../../../firebase/conteudo.js', () => ({
  getApp: vi.fn(),
  salvarProduto: vi.fn(),
  salvarOrdem: vi.fn(),
  excluirProduto: vi.fn(),
  gerarId: vi.fn((nome) => `${nome.toLowerCase()}-id`),
}));

const produtos = [
  { id: 'a', nome: 'Bolo A', categoria: 'bolos', tipo: 'fixo', preco: 40, ordem: 0, imagem: 'a.webp' },
  { id: 'b', nome: 'Brigadeiro B', categoria: 'brigadeiros', tipo: 'unidade', precoUnitario: 2, min: 1, passo: 1, ordem: 1 },
  { id: 'c', nome: 'Salgado C', categoria: 'outra', tipo: 'opcoes', opcoes: [{ value: '1', label: '1', preco: 9 }], ordem: 5, ativo: false },
];

let avisar;
let lista;
function Cena({ inicial = produtos }) {
  const [itens, setItens] = useState(inicial);
  lista = itens;
  return <ListaProdutos produtos={itens} setProdutos={setItens} avisar={avisar} />;
}

const nomes = () => screen.getAllByRole('listitem').map((li) => li.querySelector('strong').textContent);
const confirmacao = () => screen.getByRole('dialog');

beforeEach(() => {
  vi.clearAllMocks();
  avisar = vi.fn();
});

describe('ListaProdutos', () => {
  it('lista os produtos com categoria, preço e a marca de escondido', () => {
    render(<Cena />);
    expect(nomes()).toEqual(['Bolo A', 'Brigadeiro B', 'Salgado C']);
    const [a, b, c] = screen.getAllByRole('listitem');
    expect(a).toHaveTextContent('Bolos · R$40,00');
    expect(b).toHaveTextContent('Brigadeiros · a partir de R$2,00/un');
    expect(c).toHaveTextContent('outra · a partir de R$9,00');
    expect(c).toHaveTextContent('Escondido do site');
    expect(c).toHaveClass('is-oculto');
    expect(a.querySelector('img')).toHaveAttribute('src', 'a.webp');
  });

  it('lista vazia convida a criar o primeiro produto', () => {
    render(<Cena inicial={[]} />);
    expect(screen.getByText(/Nenhum produto ainda/)).toBeInTheDocument();
  });

  it('reordena e salva a nova ordem', async () => {
    const user = userEvent.setup();
    salvarOrdem.mockResolvedValue();
    render(<Cena />);
    expect(screen.getByRole('button', { name: 'Subir Bolo A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descer Salgado C' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Descer Bolo A' }));
    expect(nomes()).toEqual(['Brigadeiro B', 'Bolo A', 'Salgado C']);
    expect(salvarOrdem).toHaveBeenCalledWith('produtos', [
      expect.objectContaining({ id: 'b', ordem: 0 }),
      expect.objectContaining({ id: 'a', ordem: 1 }),
      expect.objectContaining({ id: 'c', ordem: 2 }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Subir Salgado C' }));
    expect(nomes()).toEqual(['Brigadeiro B', 'Salgado C', 'Bolo A']);
  });

  it('se salvar a ordem falhar, volta como estava e mostra o erro', async () => {
    const user = userEvent.setup();
    salvarOrdem.mockRejectedValue({ code: 'unavailable' });
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Descer Bolo A' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('O Firebase não respondeu.');
    expect(nomes()).toEqual(['Bolo A', 'Brigadeiro B', 'Salgado C']);
  });

  it('esconde e mostra produtos no site', async () => {
    const user = userEvent.setup();
    salvarProduto.mockResolvedValue();
    render(<Cena />);

    await user.click(screen.getByRole('button', { name: 'Esconder Bolo A do site' }));
    expect(salvarProduto).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', ativo: false }));
    expect(avisar).toHaveBeenCalledWith('Produto escondido do site');
    expect(screen.getByRole('button', { name: 'Mostrar Bolo A no site' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mostrar Salgado C no site' }));
    expect(salvarProduto).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'c', ativo: true }));
    expect(avisar).toHaveBeenLastCalledWith('Produto aparecendo no site');
  });

  it('não muda nada se esconder falhar', async () => {
    const user = userEvent.setup();
    salvarProduto.mockRejectedValue(new Error('falhou'));
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Esconder Bolo A do site' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('falhou');
    expect(screen.getByRole('button', { name: 'Esconder Bolo A do site' })).toBeInTheDocument();
    expect(avisar).not.toHaveBeenCalled();
  });

  it('excluir pede confirmação; cancelar não apaga', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Excluir Bolo A' }));
    expect(within(confirmacao()).getByRole('heading')).toHaveTextContent('Excluir "Bolo A"?');

    await user.click(within(confirmacao()).getByRole('button', { name: 'Cancelar' }));
    expect(excluirProduto).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(nomes()).toHaveLength(3);
  });

  it('excluir confirmado apaga do Firebase e da lista', async () => {
    const user = userEvent.setup();
    excluirProduto.mockResolvedValue();
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Excluir Bolo A' }));
    await user.click(within(confirmacao()).getByRole('button', { name: 'Excluir' }));
    expect(excluirProduto).toHaveBeenCalledWith('a');
    expect(nomes()).toEqual(['Brigadeiro B', 'Salgado C']);
    expect(avisar).toHaveBeenCalledWith('Produto excluído');
  });

  it('erro ao excluir mantém o produto', async () => {
    const user = userEvent.setup();
    excluirProduto.mockRejectedValue({ code: 'permission-denied' });
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Excluir Bolo A' }));
    await user.click(within(confirmacao()).getByRole('button', { name: 'Excluir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão');
    expect(nomes()).toHaveLength(3);
  });

  it('Esc na confirmação conta como cancelar', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: 'Excluir Bolo A' }));
    const dialog = confirmacao();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await screen.findAllByRole('listitem');
    expect(excluirProduto).not.toHaveBeenCalled();
    expect(dialog).not.toHaveAttribute('open');
  });

  it('editar abre o editor; salvar atualiza o produto na lista', async () => {
    const user = userEvent.setup();
    salvarProduto.mockResolvedValue();
    render(<Cena />);

    await user.click(screen.getByRole('button', { name: 'Editar Bolo A' }));
    expect(screen.getByRole('heading', { name: 'Editar Bolo A' })).toBeInTheDocument();
    const nome = screen.getByLabelText('Nome');
    await user.clear(nome);
    await user.type(nome, 'Bolo Novo');
    await user.click(screen.getByRole('button', { name: /Salvar produto/ }));

    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(nomes()).toEqual(['Bolo Novo', 'Brigadeiro B', 'Salgado C']);
    expect(avisar).toHaveBeenCalledWith('Produto salvo!');
  });

  it('clicar no produto também abre o editor; voltar sem mudar não pergunta nada', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: /^Brigadeiro B/ }));
    expect(screen.getByRole('heading', { name: 'Editar Brigadeiro B' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Voltar/ })[0]);
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
  });

  it('novo produto entra no fim da lista, com a próxima ordem', async () => {
    const user = userEvent.setup();
    salvarProduto.mockResolvedValue();
    render(<Cena />);
    await user.click(screen.getByRole('button', { name: /Novo produto/ }));
    expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nome'), 'Pudim');
    await user.click(screen.getByRole('radio', { name: /Preço único/ }));
    await user.type(screen.getByRole('textbox', { name: /^Preço$/ }), '2500');
    await user.click(screen.getByRole('button', { name: /Salvar produto/ }));

    await screen.findByRole('heading', { name: 'Produtos' });
    expect(nomes()).toEqual(['Bolo A', 'Brigadeiro B', 'Salgado C', 'Pudim']);
    expect(lista[3]).toMatchObject({ id: 'pudim-id', ordem: 6, preco: 25, tipo: 'fixo' });
  });

  it('novo produto numa lista vazia começa na ordem 0', async () => {
    const user = userEvent.setup();
    salvarProduto.mockResolvedValue();
    render(<Cena inicial={[]} />);
    await user.click(screen.getByRole('button', { name: /Novo produto/ }));
    await user.type(screen.getByLabelText('Nome'), 'Pudim');
    await user.click(screen.getByRole('radio', { name: /Preço único/ }));
    await user.type(screen.getByRole('textbox', { name: /^Preço$/ }), '2500');
    await user.click(screen.getByRole('button', { name: /Salvar produto/ }));
    await screen.findByRole('heading', { name: 'Produtos' });
    expect(lista[0].ordem).toBe(0);
  });

  it('produtos antigos sem `ordem` contam como 0 para o próximo', async () => {
    const user = userEvent.setup();
    salvarProduto.mockResolvedValue();
    render(<Cena inicial={[{ id: 'x', nome: 'Velho', categoria: 'bolos', tipo: 'fixo', preco: 1 }]} />);
    await user.click(screen.getByRole('button', { name: /Novo produto/ }));
    await user.type(screen.getByLabelText('Nome'), 'Pudim');
    await user.click(screen.getByRole('radio', { name: /Preço único/ }));
    await user.type(screen.getByRole('textbox', { name: /^Preço$/ }), '100');
    await user.click(screen.getByRole('button', { name: /Salvar produto/ }));
    await screen.findByRole('heading', { name: 'Produtos' });
    expect(lista[1].ordem).toBe(1);
  });
});
