import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login.jsx';

vi.mock('../../../firebase/conteudo.js', () => ({ getApp: vi.fn() }));

const email = () => screen.getByLabelText('E-mail');
const senha = () => screen.getByLabelText('Senha');
const entrar = () => screen.getByRole('button', { name: /Entr/ });

beforeEach(() => vi.clearAllMocks());

describe('Login', () => {
  it('entra com e-mail e senha e fica "Entrando…" até o painel abrir', async () => {
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockReturnValue(new Promise(() => {}));
    render(<Login />);

    await user.type(email(), ' ana@ex.com ');
    await user.type(senha(), 'segredo');
    await user.click(entrar());

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'ana@ex.com', 'segredo');
    expect(entrar()).toHaveTextContent('Entrando…');
    expect(entrar()).toBeDisabled();
  });

  it('mostra o erro em português e libera o botão de novo', async () => {
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' });
    render(<Login />);

    await user.type(email(), 'ana@ex.com');
    await user.type(senha(), 'errada');
    await user.click(entrar());

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(entrar()).toBeEnabled();
    expect(entrar()).toHaveTextContent('Entrar');
  });

  it('"Esqueci a senha" pede o e-mail antes', async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole('button', { name: 'Esqueci a senha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Digite seu e-mail acima');
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('"Esqueci a senha" envia o link e avisa', async () => {
    const user = userEvent.setup();
    sendPasswordResetEmail.mockResolvedValue();
    render(<Login />);
    await user.type(email(), 'ana@ex.com');
    await user.click(screen.getByRole('button', { name: 'Esqueci a senha' }));
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'ana@ex.com');
    expect(await screen.findByRole('status')).toHaveTextContent('você vai receber um link');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('"Esqueci a senha" mostra o erro do Firebase', async () => {
    const user = userEvent.setup();
    sendPasswordResetEmail.mockRejectedValue({ code: 'auth/invalid-email' });
    render(<Login />);
    await user.type(email(), 'nao-é-email');
    await user.click(screen.getByRole('button', { name: 'Esqueci a senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Esse e-mail não parece válido.');
  });

  it('login aceito continua "Entrando…" (quem troca de tela é o Admin)', async () => {
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u1' } });
    render(<Login />);
    await user.type(email(), 'ana@ex.com');
    await user.type(senha(), 'certa');
    await user.click(entrar());
    expect(entrar()).toHaveTextContent('Entrando…');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
