import { useState } from 'react';
import { entrar, mensagemDeErro, redefinirSenha } from '../../auth.js';
import Selo from '../../../components/Selo/Selo.jsx';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setInfo('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      // o Admin.jsx percebe o login e troca de tela
    } catch (err) {
      setErro(mensagemDeErro(err));
      setEnviando(false);
    }
  };

  const esqueci = async () => {
    setErro('');
    setInfo('');
    if (!email.trim()) {
      setErro('Digite seu e-mail acima e clique de novo em "Esqueci a senha".');
      return;
    }
    try {
      await redefinirSenha(email);
      setInfo('Se esse e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.');
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  };

  return (
    <main className="login">
      <form className="login-box" onSubmit={enviar} noValidate>
        <Selo className="login-selo" />
        <h1 className="login-title">Painel Doce Desejo</h1>
        <p className="login-lead">Entre para editar o cardápio e as fotos do site.</p>

        <label className="adm-field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="adm-field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {erro && <p className="adm-erro" role="alert">{erro}</p>}
        {info && <p className="adm-info" role="status">{info}</p>}

        <button type="submit" className="adm-btn adm-btn-primary login-entrar" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="login-esqueci" onClick={esqueci}>
          Esqueci a senha
        </button>
      </form>
      <a href="/" className="login-voltar">← Voltar para o site</a>
    </main>
  );
}
