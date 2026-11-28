import { useState } from 'react';
import { categorias, precoDoCard } from '../../../data/cardapio.js';
import { formatarPreco } from '../../../data/produtos.js';
import { excluirProduto, salvarOrdem, salvarProduto } from '../../../firebase/conteudo.js';
import { mensagemDeErro } from '../../auth.js';
import Icon from '../../../components/Icon/Icon.jsx';
import { useConfirmar } from '../Confirmar/Confirmar.jsx';
import EditorProduto from '../EditorProduto/EditorProduto.jsx';
import './ListaProdutos.css';

const nomeCategoria = (id) => categorias.find((c) => c.id === id)?.label ?? id;

export default function ListaProdutos({ produtos, setProdutos, avisar }) {
  const [editando, setEditando] = useState(null); // produto, 'novo' ou null
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  // Roda uma gravação mostrando erro, sem deixar clicar em outra coisa no meio.
  const executar = async (fn) => {
    setErro('');
    setOcupado(true);
    try {
      await fn();
      return true;
    } catch (err) {
      setErro(mensagemDeErro(err));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const mover = async (indice, direcao) => {
    const destino = indice + direcao;
    const nova = [...produtos];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    const comOrdem = nova.map((p, i) => ({ ...p, ordem: i }));
    const anterior = produtos;
    setProdutos(() => comOrdem);
    const ok = await executar(() => salvarOrdem('produtos', comOrdem));
    if (!ok) setProdutos(() => anterior);
  };

  const alternarVisivel = async (produto) => {
    const atualizado = { ...produto, ativo: produto.ativo === false };
    const ok = await executar(() => salvarProduto(atualizado));
    if (ok) {
      setProdutos((lista) => lista.map((p) => (p.id === produto.id ? atualizado : p)));
      avisar(atualizado.ativo ? 'Produto aparecendo no site' : 'Produto escondido do site');
    }
  };

  const excluir = async (produto) => {
    const sim = await confirmar({
      titulo: `Excluir "${produto.nome}"?`,
      texto: 'O produto some do site e não dá para desfazer. Se quiser só tirar do ar por um tempo, use o botão de esconder.',
      botao: 'Excluir',
      perigo: true,
    });
    if (!sim) return;
    const ok = await executar(() => excluirProduto(produto.id));
    if (ok) {
      setProdutos((lista) => lista.filter((p) => p.id !== produto.id));
      avisar('Produto excluído');
    }
  };

  if (editando) {
    return (
      <EditorProduto
        produto={editando === 'novo' ? null : editando}
        proximaOrdem={produtos.length ? Math.max(...produtos.map((p) => p.ordem ?? 0)) + 1 : 0}
        onCancelar={() => setEditando(null)}
        onSalvo={(salvo) => {
          setProdutos((lista) =>
            lista.some((p) => p.id === salvo.id)
              ? lista.map((p) => (p.id === salvo.id ? salvo : p))
              : [...lista, salvo]
          );
          setEditando(null);
          avisar('Produto salvo!');
        }}
      />
    );
  }

  return (
    <section aria-labelledby="lprod-titulo">
      {dialogo}
      <div className="lprod-head">
        <div>
          <h1 id="lprod-titulo" className="lprod-titulo">Produtos</h1>
          <p className="adm-ajuda">
            Estes são os produtos do cardápio do site, na mesma ordem. Use as setas para mudar a ordem.
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditando('novo')}>
          <Icon name="add" /> Novo produto
        </button>
      </div>

      {erro && <p className="adm-erro lprod-erro" role="alert">{erro}</p>}

      {produtos.length === 0 ? (
        <p className="adm-card lprod-vazio">Nenhum produto ainda. Clique em “Novo produto” para começar.</p>
      ) : (
        <ul className="lprod-lista" aria-busy={ocupado || undefined}>
          {produtos.map((p, i) => {
            const preco = precoDoCard(p);
            const oculto = p.ativo === false;
            return (
              <li key={p.id} className={`lprod-item ${oculto ? 'is-oculto' : ''}`}>
                <div className="lprod-ordem">
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => mover(i, -1)}
                    disabled={ocupado || i === 0}
                    aria-label={`Subir ${p.nome}`}
                  >
                    <Icon name="arrow_upward" />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => mover(i, 1)}
                    disabled={ocupado || i === produtos.length - 1}
                    aria-label={`Descer ${p.nome}`}
                  >
                    <Icon name="arrow_downward" />
                  </button>
                </div>

                <button type="button" className="lprod-info" onClick={() => setEditando(p)}>
                  <span className="lprod-foto">
                    {p.imagem ? <img src={p.imagem} alt="" loading="lazy" /> : <Icon name="image" />}
                  </span>
                  <span className="lprod-texto">
                    <strong>{p.nome}</strong>
                    <span>
                      {nomeCategoria(p.categoria)} · {preco.prefixo} {formatarPreco(preco.valor)}
                      {preco.sufixo}
                    </span>
                    {oculto && <span className="lprod-tag">Escondido do site</span>}
                  </span>
                </button>

                <div className="lprod-acoes">
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => setEditando(p)}
                    disabled={ocupado}
                    aria-label={`Editar ${p.nome}`}
                    title="Editar"
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => alternarVisivel(p)}
                    disabled={ocupado}
                    aria-label={oculto ? `Mostrar ${p.nome} no site` : `Esconder ${p.nome} do site`}
                    title={oculto ? 'Mostrar no site' : 'Esconder do site'}
                  >
                    <Icon name={oculto ? 'visibility_off' : 'visibility'} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn is-perigo"
                    onClick={() => excluir(p)}
                    disabled={ocupado}
                    aria-label={`Excluir ${p.nome}`}
                    title="Excluir"
                  >
                    <Icon name="delete" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
