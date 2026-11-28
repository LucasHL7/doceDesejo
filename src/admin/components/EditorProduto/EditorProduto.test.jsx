import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { salvarProduto } from '../../../firebase/conteudo.js';
import { comprimirImagem } from '../../imagem.js';
import { cardapioPadrao } from '../../../data/cardapio.js';
import EditorProduto from './EditorProduto.jsx';

vi.mock('../../../firebase/conteudo.js', () => ({
  getApp: vi.fn(),
  salvarProduto: vi.fn(),
  gerarId: vi.fn(() => 'id-gerado'),
}));
vi.mock('../../imagem.js', () => ({ comprimirImagem: vi.fn() }));

const padrao = (id) => cardapioPadrao.find((p) => p.id === id);

let onCancelar;
let onSalvo;
const renderizar = (produto = null, proximaOrdem = 7) =>
  render(
    <EditorProduto produto={produto} proximaOrdem={proximaOrdem} onCancelar={onCancelar} onSalvo={onSalvo} />
  );

const salvar = () => screen.getByRole('button', { name: /Salvar produto|Salvando/ });
const tipo = (nome) => screen.getByRole('radio', { name: new RegExp(nome) });
const campoTexto = (rotulo) => screen.getByRole('textbox', { name: rotulo });

beforeEach(() => {
  vi.clearAllMocks();
  onCancelar = vi.fn();
  onSalvo = vi.fn();
  salvarProduto.mockResolvedValue();
});

describe('EditorProduto: produto novo', () => {
  it('começa vazio, rola para o topo e lista os erros ao salvar sem preencher', async () => {
    const user = userEvent.setup();
    renderizar();
    expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect(tipo('Por opção')).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mostrar no site' })).toBeChecked();

    await user.click(salvar());
    const erros = screen.getByRole('alert');
    expect(erros).toHaveTextContent('Dê um nome ao produto.');
    expect(erros).toHaveTextContent('Adicione pelo menos uma opção com preço.');
    expect(salvarProduto).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('preço único: salva o produto montado', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(campoTexto('Nome'), '  Pudim  ');
    await user.type(campoTexto('Descrição curta'), 'Pudim de leite');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'brigadeiros');
    await user.click(screen.getByRole('checkbox', { name: 'Mostrar no site' }));
    await user.click(tipo('Preço único'));
    await user.type(campoTexto('Preço'), '1990');
    await user.type(campoTexto(/Aviso no pedido/), 'Encomende com 2 dias');
    await user.click(salvar());

    expect(salvarProduto).toHaveBeenCalledWith({
      id: 'id-gerado',
      ordem: 7,
      ativo: false,
      categoria: 'brigadeiros',
      nome: 'Pudim',
      descricao: 'Pudim de leite',
      imagem: '',
      tipo: 'fixo',
      preco: 19.9,
      campos: [],
      aviso: 'Encomende com 2 dias',
    });
    expect(onSalvo).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Pudim' }));
  });

  it('enquanto salva, desativa os botões; erro do Firebase aparece e libera de novo', async () => {
    const user = userEvent.setup();
    let falhar;
    salvarProduto.mockReturnValue(new Promise((_, r) => (falhar = r)));
    renderizar();
    await user.type(campoTexto('Nome'), 'Pudim');
    await user.click(tipo('Preço único'));
    await user.type(campoTexto('Preço'), '500');
    await user.click(salvar());

    expect(salvar()).toHaveTextContent('Salvando…');
    expect(salvar()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    falhar({ code: 'invalid-argument' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Os dados ficaram grandes demais.');
    expect(salvar()).toBeEnabled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it('por opção: adiciona, reordena e remove opções', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(campoTexto('Nome'), 'Bolo');
    await user.type(campoTexto(/Nome da escolha/), 'Tamanho');

    // só uma opção: não dá para remover nem mover
    expect(screen.getByRole('button', { name: 'Remover opção 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Subir opção 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descer opção 1' })).toBeDisabled();

    await user.type(campoTexto('Nome da opção 1'), 'Pequeno');
    await user.type(campoTexto('Preço da opção 1'), '5000');
    await user.click(screen.getByRole('button', { name: /Adicionar opção/ }));
    await user.type(campoTexto('Nome da opção 2'), 'Grande');
    await user.type(campoTexto('Preço da opção 2'), '9000');
    await user.click(screen.getByRole('button', { name: /Adicionar opção/ }));
    await user.type(campoTexto('Nome da opção 3'), 'Médio');
    await user.type(campoTexto('Preço da opção 3'), '7000');

    await user.click(screen.getByRole('button', { name: 'Subir opção 3' }));
    expect(campoTexto('Nome da opção 2')).toHaveValue('Médio');
    await user.click(screen.getByRole('button', { name: 'Descer opção 1' }));
    expect(campoTexto('Nome da opção 1')).toHaveValue('Médio');
    expect(campoTexto('Nome da opção 2')).toHaveValue('Pequeno');
    await user.click(screen.getByRole('button', { name: 'Remover opção 3' }));

    await user.click(salvar());
    expect(salvarProduto).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'opcoes',
        opcaoLabel: 'Tamanho',
        opcoes: [
          { value: 'medio', label: 'Médio', preco: 70 },
          { value: 'pequeno', label: 'Pequeno', preco: 50 },
        ],
      })
    );
  });

  it('por unidade com preço único e preço de atacado', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(campoTexto('Nome'), 'Docinho');
    await user.click(tipo('Por unidade'));

    // por unidade sem opções não mostra a tabela de opções
    expect(screen.queryByRole('group', { name: 'Opções e preços' })).not.toBeInTheDocument();

    await user.clear(campoTexto('Nome da unidade'));
    await user.type(campoTexto('Nome da unidade'), 'docinhos');
    await user.clear(campoTexto('Quantidade mínima'));
    await user.type(campoTexto('Quantidade mínima'), '2x5');
    await user.clear(campoTexto(/De quanto em quanto/));
    await user.type(campoTexto(/De quanto em quanto/), '5');
    await user.type(campoTexto('Preço por unidade'), '180');

    await user.click(screen.getByRole('checkbox', { name: /Preço menor para pedidos grandes/ }));
    await user.type(campoTexto('Acima de (unidades)'), '50');
    const precos = screen.getAllByRole('textbox', { name: 'Preço por unidade' });
    await user.type(precos[1], '150');
    await user.click(salvar());

    expect(salvarProduto).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'unidade',
        unidade: 'docinhos',
        min: 25,
        passo: 5,
        precoUnitario: 1.8,
        atacado: { acimaDe: 50, preco: 1.5 },
      })
    );
  });

  it('por unidade com preço por opção', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(campoTexto('Nome'), 'Fatia');
    await user.click(tipo('Por unidade'));
    await user.click(screen.getByRole('radio', { name: 'Preço muda conforme a opção' }));
    expect(screen.getByText('Preço por unidade', { selector: 'span' })).toBeInTheDocument();
    await user.type(campoTexto('Nome da opção 1'), 'Simples');
    await user.type(campoTexto('Preço da opção 1'), '600');
    await user.click(salvar());
    expect(salvarProduto).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'unidade', opcaoLabel: 'Tipo', opcoes: [{ value: 'simples', label: 'Simples', preco: 6 }] })
    );

    // voltar para "mesmo preço" esconde as opções
    await user.click(screen.getByRole('radio', { name: 'Mesmo preço por unidade' }));
    expect(screen.queryByRole('group', { name: 'Opções e preços' })).not.toBeInTheDocument();
  });

  it('personalizações: lista, várias marcações e texto livre', async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(campoTexto('Nome'), 'Kit');
    await user.click(tipo('Preço único'));
    await user.type(campoTexto('Preço'), '1000');

    const adicionar = () => user.click(screen.getByRole('button', { name: /Adicionar personalização/ }));
    await adicionar();
    await adicionar();
    await adicionar();
    const blocos = () => document.querySelectorAll('.editor-campo');
    expect(blocos()).toHaveLength(3);

    // 1: lista opcional
    let b = within(blocos()[0]);
    await user.type(b.getByRole('textbox', { name: 'Pergunta' }), 'Massa');
    expect(b.getByText(/Lista para escolher uma/)).toBeInTheDocument();
    await user.type(b.getByRole('textbox', { name: /Opções/ }), 'Chocolate{Enter}Ninho');
    await user.click(b.getByRole('checkbox', { name: /Opcional/ }));

    // 2: marcar várias, com máximo
    b = within(blocos()[1]);
    await user.type(b.getByRole('textbox', { name: 'Pergunta' }), 'Sabores');
    await user.selectOptions(b.getByRole('combobox', { name: /Tipo de resposta/ }), 'checkbox');
    await user.type(b.getByRole('textbox', { name: /Opções/ }), 'Morango{Enter}Limão');
    await user.type(b.getByRole('textbox', { name: /Máximo de escolhas/ }), 'a2');

    // 3: texto livre
    b = within(blocos()[2]);
    await user.type(b.getByRole('textbox', { name: 'Pergunta' }), 'Recado');
    await user.selectOptions(b.getByRole('combobox', { name: /Tipo de resposta/ }), 'texto');
    await user.type(b.getByRole('textbox', { name: /Exemplo de resposta/ }), 'Parabéns!');

    // reordena: texto livre para o topo, e Massa para baixo
    await user.click(screen.getByRole('button', { name: 'Subir personalização 3' }));
    await user.click(screen.getByRole('button', { name: 'Subir personalização 2' }));
    expect(screen.getByRole('button', { name: 'Subir personalização 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descer personalização 3' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Descer personalização 2' }));

    await user.click(salvar());
    expect(salvarProduto.mock.calls[0][0].campos).toEqual([
      { id: 'recado', label: 'Recado', tipo: 'texto', placeholder: 'Parabéns!' },
      {
        id: 'sabores',
        label: 'Sabores',
        tipo: 'checkbox',
        opcoes: [
          { value: 'morango', label: 'Morango' },
          { value: 'limao', label: 'Limão' },
        ],
        max: 2,
      },
      {
        id: 'massa',
        label: 'Massa',
        tipo: 'select',
        opcional: true,
        opcoes: [
          { value: 'chocolate', label: 'Chocolate' },
          { value: 'ninho', label: 'Ninho' },
        ],
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Remover personalização 1' }));
    expect(blocos()).toHaveLength(2);
  });

  it('troca a foto pelo campo de imagem', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockResolvedValue('data:image/webp;base64,AAA');
    const { container } = renderizar();
    const arquivo = new File(['x'], 'bolo.png', { type: 'image/png' });
    await user.upload(container.querySelector('input[type="file"]'), arquivo);
    expect(comprimirImagem).toHaveBeenCalledWith(arquivo, { maxLado: 1000 });
    expect(container.querySelector('.cimg-preview img')).toHaveAttribute('src', 'data:image/webp;base64,AAA');
  });
});

describe('EditorProduto: editando um produto existente', () => {
  it('carrega os dados do produto e mantém id e ordem ao salvar', async () => {
    const user = userEvent.setup();
    renderizar(padrao('brigadeiro'));
    expect(screen.getByRole('heading', { name: 'Editar Brigadeiros' })).toBeInTheDocument();
    expect(campoTexto('Nome')).toHaveValue('Brigadeiros');
    expect(tipo('Por unidade')).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Preço menor/ })).toBeChecked();
    expect(campoTexto('Acima de (unidades)')).toHaveValue('45');

    await user.click(salvar());
    const salvo = salvarProduto.mock.calls[0][0];
    expect(salvo).toMatchObject({ id: 'brigadeiro', ordem: 3, precoUnitario: 1.7, atacado: { acimaDe: 45, preco: 1.5 } });
    expect(salvo.campos[0].opcoes.map((o) => o.value)).toEqual(['chocolate', 'Ninho', 'dois-amores', 'beijinho']);
  });

  it('voltar sem alterações sai direto', async () => {
    const user = userEvent.setup();
    renderizar(padrao('bento-cake'));
    await user.click(screen.getByRole('button', { name: /Voltar/ }));
    expect(onCancelar).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('com alterações, pergunta antes de sair e avisa ao fechar a aba', async () => {
    const user = userEvent.setup();
    renderizar(padrao('bento-cake'));

    const antes = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(antes);
    expect(antes.defaultPrevented).toBe(false);

    await user.type(campoTexto('Nome'), '!');
    const depois = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(depois);
    expect(depois.defaultPrevented).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    const pergunta = screen.getByRole('dialog');
    expect(pergunta).toHaveTextContent('Sair sem salvar?');
    await user.click(within(pergunta).getByRole('button', { name: 'Continuar editando' }));
    expect(onCancelar).not.toHaveBeenCalled();
    expect(campoTexto('Nome')).toHaveValue('Bento Cake!');

    await user.click(screen.getByRole('button', { name: /Voltar/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair sem salvar' }));
    expect(onCancelar).toHaveBeenCalled();
  });

  it('carrega a tabela de opções e troca de tipo de cobrança', () => {
    renderizar(padrao('salgadinho'));
    expect(tipo('Por opção')).toBeChecked();
    expect(campoTexto('Nome da opção 1')).toHaveValue('50 unidades');
    expect(campoTexto('Preço da opção 1')).toHaveValue('40,00');
    fireEvent.click(tipo('Preço único'));
    expect(screen.queryByRole('group', { name: 'Opções e preços' })).not.toBeInTheDocument();
    expect(campoTexto('Preço')).toHaveValue('');
  });
});
