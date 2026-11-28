// firebase/auth é falso aqui (vitest.setup.js).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { entrar, mensagemDeErro, observarUsuario, redefinirSenha, sair } from './auth.js';

beforeEach(() => vi.clearAllMocks());

describe('auth', () => {
  it('entrar tira espaços do e-mail', async () => {
    await entrar('  ana@ex.com ', 'segredo');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'ana@ex.com', 'segredo');
  });

  it('redefinirSenha tira espaços do e-mail', async () => {
    await redefinirSenha(' ana@ex.com');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'ana@ex.com');
  });

  it('sair e observarUsuario repassam para o Firebase', () => {
    const cb = vi.fn();
    observarUsuario(cb);
    sair();
    expect(onAuthStateChanged).toHaveBeenCalledWith(expect.anything(), cb);
    expect(signOut).toHaveBeenCalled();
  });
});

describe('mensagemDeErro', () => {
  it('traduz códigos conhecidos', () => {
    expect(mensagemDeErro({ code: 'auth/invalid-credential' })).toBe('E-mail ou senha incorretos.');
    expect(mensagemDeErro({ code: 'permission-denied' })).toMatch(/Sem permissão/);
  });

  it('usa a mensagem original para códigos desconhecidos', () => {
    expect(mensagemDeErro(new Error('pane geral'))).toBe('pane geral');
  });

  it('tem uma mensagem genérica quando não há nada', () => {
    expect(mensagemDeErro(undefined)).toBe('Algo deu errado. Tente de novo.');
  });
});
