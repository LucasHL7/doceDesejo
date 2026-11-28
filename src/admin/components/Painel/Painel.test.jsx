import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { carregarConteudo, importarPadrao } from '../../../firebase/conteudo.js';
import { cardapioPadrao } from '../../../data/cardapio.js';
import { galeriaPadrao, imagensSitePadrao } from '../../../data/imagensPadrao.js';
import Painel from './Painel.jsx';

vi.mock('../../../firebase/conteudo.js', () => ({
  getApp: vi.fn(),
  carregarConteudo: vi.fn(),
  importarPadrao: vi.fn(),
  salvarProduto: vi.fn(),
  salvarOrdem: vi.fn(),
  excluirProduto: vi.fn(),
  salvarImagemSite: vi.fn(),
  salvarFotoGaleria: vi.fn(),
  excluirFotoGaleria: vi.fn(),
  gerarId: vi.fn(() => 'id-novo'),
}));

const usuario = { uid: 'u1', email: 'ana@ex.com' };
const vazio = { produtos: [], galeria: [], imagensSite: {} };
const cheio = { produtos: cardapioPadrao, galeria: galeriaPadrao, imagensSite: imagensSitePadrao };

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('Painel', () => {
  it('mostra quem está logado e "Carregando…" até os dados chegarem', () => {
    carregarConteudo.mockReturnValue(new Promise(() => {}));
    render(<Painel usuario={usuario} />);
    expect(screen.getByText('ana@ex.com')).toBeInTheDocument();
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('sai pelo botão do topo', async () => {
    const user = userEvent.setup();
    carregarConteudo.mockReturnValue(new Promise(() => {}));
    render(<Painel usuario={usuario} />);
    await user.click(screen.getByRole('button', { name: /Sair/ }));
    expect(signOut).toHaveBeenCalled();
  });

  it('erro ao carregar: mostra a mensagem e deixa tentar de novo', async () => {
    const user = userEvent.setup();
    carregarConteudo.mockRejectedValueOnce({ code: 'unavailable' }).mockResolvedValueOnce(cheio);
    render(<Painel usuario={usuario} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('O Firebase não respondeu.');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('banco vazio: oferece importar o conteúdo atual do site', async () => {
    const user = userEvent.setup();
    carregarConteudo.mockResolvedValueOnce(vazio).mockResolvedValueOnce(cheio);
    let terminar;
    importarPadrao.mockReturnValue(new Promise((r) => (terminar = r)));
    render(<Painel usuario={usuario} />);

    const botao = await screen.findByRole('button', { name: 'Importar conteúdo atual do site' });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.click(botao);
    expect(botao).toHaveTextContent('Importando…');
    expect(botao).toBeDisabled();
    expect(importarPadrao).toHaveBeenCalledWith({
      produtos: cardapioPadrao,
      galeria: galeriaPadrao,
      imagensSite: imagensSitePadrao,
    });

    await act(async () => terminar());
    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Conteúdo do site importado!');
  });

  it('falha ao importar mostra o erro', async () => {
    const user = userEvent.setup();
    carregarConteudo.mockResolvedValue(vazio);
    importarPadrao.mockRejectedValue({ code: 'permission-denied' });
    render(<Painel usuario={usuario} />);
    await user.click(await screen.findByRole('button', { name: 'Importar conteúdo atual do site' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão para alterar.');
    expect(screen.getByRole('button', { name: 'Importar conteúdo atual do site' })).toBeEnabled();
  });

  it('troca entre as abas Produtos e Fotos do site', async () => {
    const user = userEvent.setup();
    carregarConteudo.mockResolvedValue(cheio);
    render(<Painel usuario={usuario} />);

    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Produtos/ })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: /Fotos do site/ }));
    expect(screen.getByRole('heading', { name: 'Fotos do site' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Produtos' })).not.toBeInTheDocument();
  });

  it('o aviso rápido some depois de 3 segundos', async () => {
    carregarConteudo.mockResolvedValueOnce(vazio).mockResolvedValueOnce(cheio);
    importarPadrao.mockResolvedValue();
    render(<Painel usuario={usuario} />);
    const botao = await screen.findByRole('button', { name: 'Importar conteúdo atual do site' });

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => botao.click());
    expect(screen.getByRole('status')).toHaveTextContent('Conteúdo do site importado!');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
