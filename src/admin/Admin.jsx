import { useEffect, useState } from 'react';
import { ehAdmin, firebaseConfigurado } from '../firebase/conteudo.js';
import { observarUsuario, sair } from './auth.js';
import Login from './components/Login/Login.jsx';
import Painel from './components/Painel/Painel.jsx';
import Icon from '../components/Icon/Icon.jsx';

// Mostra o painel só para quem fez login e está em `admins/{uid}`. A proteção de verdade
// são as regras do Firestore; esta tela só evita mostrar um painel que não funcionaria.
export default function Admin() {
  // undefined = ainda verificando; null = sem login
  const [usuario, setUsuario] = useState(firebaseConfigurado ? undefined : null);
  const [permissao, setPermissao] = useState('verificando'); // 'verificando' | 'sim' | 'nao' | 'erro'

  useEffect(() => {
    if (!firebaseConfigurado) return undefined;
    return observarUsuario(async (u) => {
      setUsuario(u);
      if (!u) return;
      setPermissao('verificando');
      try {
        setPermissao((await ehAdmin(u.uid)) ? 'sim' : 'nao');
      } catch (erro) {
        console.error(erro);
        setPermissao(erro?.code === 'permission-denied' ? 'nao' : 'erro');
      }
    });
  }, []);

  if (!firebaseConfigurado) {
    return (
      <Aviso titulo="Firebase não configurado">
        Preencha as variáveis <code>VITE_FIREBASE_*</code> no <code>.env.local</code> (veja{' '}
        <code>.env.example</code>). O passo a passo está em <code>PAINEL.md</code>.
      </Aviso>
    );
  }

  if (usuario === undefined || (usuario && permissao === 'verificando')) {
    return <div className="adm-carregando" role="status">Carregando…</div>;
  }

  if (!usuario) return <Login />;

  if (permissao === 'nao') {
    return (
      <Aviso titulo="Sem acesso ao painel" acao={<BotaoSair />}>
        Você entrou como <strong>{usuario.email}</strong>, mas este usuário ainda não é administrador.
        Para liberar, crie no Firestore o documento <code>admins/{usuario.uid}</code>.
      </Aviso>
    );
  }

  if (permissao === 'erro') {
    return (
      <Aviso titulo="Não foi possível conectar" acao={<BotaoSair />}>
        O Firebase não respondeu. Confira a internet e recarregue a página.
      </Aviso>
    );
  }

  return <Painel usuario={usuario} />;
}

function BotaoSair() {
  return (
    <button type="button" className="adm-btn" onClick={sair}>
      <Icon name="logout" /> Sair
    </button>
  );
}

function Aviso({ titulo, children, acao }) {
  return (
    <main className="adm-aviso">
      <div className="adm-aviso-box">
        <Icon name="lock" className="adm-aviso-icon" />
        <h1>{titulo}</h1>
        <p>{children}</p>
        {acao}
      </div>
    </main>
  );
}
