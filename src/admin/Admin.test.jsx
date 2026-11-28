import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ehAdmin } from '../firebase/conteudo.js';
import Admin from './Admin.jsx';

vi.mock('../firebase/conteudo.js', () => ({
  firebaseConfigurado: true,
  ehAdmin: vi.fn(),
  getApp: vi.fn(),
}));
// O painel em si tem os próprios testes; aqui só importa se a porta deixa entrar.
vi.mock('./components/Painel/Painel.jsx', () => ({
  default: ({ usuario }) => <p>Painel de {usuario.email}</p>,
}));

let avisarLogin;
const pararDeObservar = vi.fn();
const usuario = { uid: 'u1', email: 'ana@ex.com' };

const logar = async (u) => {
  // não espera o callback inteiro (ele pode ficar preso conferindo a permissão)
  await act(async () => {
    avisarLogin(u);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  onAuthStateChanged.mockImplementation((auth, cb) => {
    avisarLogin = cb;
    return pararDeObservar;
  });
});

describe('Admin (porta do painel)', () => {
  it('mostra "Carregando…" até o Firebase dizer quem está logado', () => {
    render(<Admin />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('sem login, mostra a tela de entrar', async () => {
    render(<Admin />);
    await logar(null);
    expect(screen.getByRole('heading', { name: 'Painel Doce Desejo' })).toBeInTheDocument();
    expect(ehAdmin).not.toHaveBeenCalled();
  });

  it('admin cadastrado vê o painel', async () => {
    ehAdmin.mockResolvedValue(true);
    render(<Admin />);
    await logar(usuario);
    expect(ehAdmin).toHaveBeenCalledWith('u1');
    expect(screen.getByText('Painel de ana@ex.com')).toBeInTheDocument();
  });

  it('enquanto confere a permissão, continua carregando', async () => {
    ehAdmin.mockReturnValue(new Promise(() => {}));
    render(<Admin />);
    await logar(usuario);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('usuário logado que não é admin vê como liberar e pode sair', async () => {
    const user = userEvent.setup();
    ehAdmin.mockResolvedValue(false);
    render(<Admin />);
    await logar(usuario);

    expect(screen.getByRole('heading', { name: 'Sem acesso ao painel' })).toBeInTheDocument();
    expect(screen.getByText('admins/u1')).toBeInTheDocument();
    expect(screen.queryByText(/Painel de/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Sair/ }));
    expect(signOut).toHaveBeenCalled();
  });

  it('permission-denied ao conferir conta como "sem acesso"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ehAdmin.mockRejectedValue({ code: 'permission-denied' });
    render(<Admin />);
    await logar(usuario);
    expect(screen.getByRole('heading', { name: 'Sem acesso ao painel' })).toBeInTheDocument();
  });

  it('outro erro ao conferir mostra "Não foi possível conectar"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ehAdmin.mockRejectedValue(new Error('offline'));
    render(<Admin />);
    await logar(usuario);
    expect(screen.getByRole('heading', { name: 'Não foi possível conectar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sair/ })).toBeInTheDocument();
  });

  it('para de observar o login ao sair da tela', () => {
    const { unmount } = render(<Admin />);
    unmount();
    expect(pararDeObservar).toHaveBeenCalled();
  });
});

describe('Admin sem Firebase configurado', () => {
  it('explica como configurar e não tenta logar', async () => {
    vi.resetModules();
    vi.doMock('../firebase/conteudo.js', () => ({ firebaseConfigurado: false, ehAdmin: vi.fn(), getApp: vi.fn() }));
    const { default: AdminSemFirebase } = await import('./Admin.jsx');
    render(<AdminSemFirebase />);
    expect(screen.getByRole('heading', { name: 'Firebase não configurado' })).toBeInTheDocument();
    expect(onAuthStateChanged).not.toHaveBeenCalled();
    vi.doUnmock('../firebase/conteudo.js');
  });
});
