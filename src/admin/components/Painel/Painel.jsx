import { useCallback, useEffect, useRef, useState } from 'react';
import { carregarConteudo, importarPadrao } from '../../../firebase/conteudo.js';
import { cardapioPadrao } from '../../../data/cardapio.js';
import { galeriaPadrao, imagensSitePadrao } from '../../../data/imagensPadrao.js';
import { mensagemDeErro, sair } from '../../auth.js';
import Icon from '../../../components/Icon/Icon.jsx';
import Selo from '../../../components/Selo/Selo.jsx';
import ListaProdutos from '../ListaProdutos/ListaProdutos.jsx';
import FotosSite from '../FotosSite/FotosSite.jsx';
import './Painel.css';

const abas = [
  { id: 'produtos', label: 'Produtos', icone: 'cake' },
  { id: 'fotos', label: 'Fotos do site', icone: 'photo_library' },
];

export default function Painel({ usuario }) {
  const [aba, setAba] = useState('produtos');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [aviso, setAviso] = useState('');
  const timer = useRef(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      setDados(await carregarConteudo());
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Mensagem rápida no rodapé ("Produto salvo!").
  const avisar = useCallback((texto) => {
    clearTimeout(timer.current);
    setAviso(texto);
    timer.current = setTimeout(() => setAviso(''), 3000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const importar = async () => {
    setImportando(true);
    setErro('');
    try {
      await importarPadrao({
        produtos: cardapioPadrao,
        galeria: galeriaPadrao,
        imagensSite: imagensSitePadrao,
      });
      await carregar();
      avisar('Conteúdo do site importado!');
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setImportando(false);
    }
  };

  const vazio =
    dados &&
    !dados.produtos.length &&
    !dados.galeria.length &&
    !Object.keys(dados.imagensSite).length;

  // Funções para as abas atualizarem a lista local depois de salvar.
  const setProdutos = useCallback(
    (fn) => setDados((d) => ({ ...d, produtos: fn(d.produtos) })),
    []
  );
  const setGaleria = useCallback((fn) => setDados((d) => ({ ...d, galeria: fn(d.galeria) })), []);
  const setImagensSite = useCallback(
    (fn) => setDados((d) => ({ ...d, imagensSite: fn(d.imagensSite) })),
    []
  );

  return (
    <div className="painel">
      <header className="painel-top">
        <div className="painel-top-inner">
          <div className="painel-marca">
            <Selo className="painel-selo" />
            <div>
              <strong>Painel</strong>
              <span>{usuario.email}</span>
            </div>
          </div>
          <div className="painel-top-acoes">
            <a href="/" target="_blank" rel="noopener" className="adm-btn">
              <Icon name="open_in_new" />
              <span className="painel-esconder-mobile">Ver site</span>
            </a>
            <button type="button" className="adm-btn" onClick={sair}>
              <Icon name="logout" />
              <span className="painel-esconder-mobile">Sair</span>
            </button>
          </div>
        </div>

        {dados && !vazio && (
          <nav className="painel-abas" aria-label="Seções do painel">
            {abas.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`painel-aba ${aba === a.id ? 'is-active' : ''}`}
                aria-current={aba === a.id ? 'page' : undefined}
                onClick={() => setAba(a.id)}
              >
                <Icon name={a.icone} />
                {a.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="painel-main">
        {erro && (
          <div className="adm-erro painel-erro" role="alert">
            {erro}{' '}
            <button type="button" className="adm-btn" onClick={carregar}>
              Tentar de novo
            </button>
          </div>
        )}

        {!dados && !erro && <p className="painel-carregando">Carregando…</p>}

        {vazio && (
          <section className="adm-card painel-primeira">
            <h1>Primeira vez por aqui 👋</h1>
            <p>
              O cardápio e as fotos do site ainda não estão no Firebase. Clique abaixo para copiar tudo
              o que está no site hoje. Depois disso, é só editar por aqui.
            </p>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={importar}
              disabled={importando}
            >
              {importando ? 'Importando…' : 'Importar conteúdo atual do site'}
            </button>
          </section>
        )}

        {dados && !vazio && aba === 'produtos' && (
          <ListaProdutos produtos={dados.produtos} setProdutos={setProdutos} avisar={avisar} />
        )}

        {dados && !vazio && aba === 'fotos' && (
          <FotosSite
            galeria={dados.galeria}
            setGaleria={setGaleria}
            imagensSite={dados.imagensSite}
            setImagensSite={setImagensSite}
            avisar={avisar}
          />
        )}
      </main>

      <div className={`painel-toast ${aviso ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {aviso && (
          <>
            <Icon name="check" /> {aviso}
          </>
        )}
      </div>
    </div>
  );
}
