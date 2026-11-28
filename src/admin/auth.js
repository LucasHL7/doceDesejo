// Login do painel (Firebase Authentication, e-mail e senha).
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getApp } from '../firebase/conteudo.js';

const auth = () => getAuth(getApp());

export const observarUsuario = (callback) => onAuthStateChanged(auth(), callback);
export const entrar = (email, senha) => signInWithEmailAndPassword(auth(), email.trim(), senha);
export const sair = () => signOut(auth());
export const redefinirSenha = (email) => sendPasswordResetEmail(auth(), email.trim());

// Mensagens de erro do Firebase em português.
export function mensagemDeErro(erro) {
  const codigo = erro?.code ?? '';
  const mensagens = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'Esse e-mail não parece válido.',
    'auth/missing-email': 'Digite seu e-mail.',
    'auth/missing-password': 'Digite sua senha.',
    'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet. Confira e tente de novo.',
    'auth/user-disabled': 'Este usuário foi desativado.',
    'permission-denied': 'Sem permissão para alterar. Saia e entre de novo.',
    'unauthenticated': 'Sua sessão expirou. Saia e entre de novo.',
    'unavailable': 'O Firebase não respondeu. Confira a internet e tente de novo.',
    'invalid-argument': 'Os dados ficaram grandes demais. Tente uma foto menor.',
  };
  return mensagens[codigo] ?? erro?.message ?? 'Algo deu errado. Tente de novo.';
}
