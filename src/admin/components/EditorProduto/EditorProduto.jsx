import { useEffect, useMemo, useRef, useState } from 'react';
import { categorias, tiposProduto } from '../../../data/cardapio.js';
import { salvarProduto } from '../../../firebase/conteudo.js';
import { mensagemDeErro } from '../../auth.js';
import Icon from '../../../components/Icon/Icon.jsx';
import CampoImagem from '../CampoImagem/CampoImagem.jsx';
import CampoPreco from '../CampoPreco/CampoPreco.jsx';
import { useConfirmar } from '../Confirmar/Confirmar.jsx';
import { novaOpcao, novoCampo, paraProduto, paraRascunho, soDigitos } from './produtoForm.js';
import './EditorProduto.css';

const tiposCampo = [
  { id: 'select', label: 'Escolher uma opção', ajuda: 'Lista para escolher uma (ex.: massa, recheio).' },
  { id: 'checkbox', label: 'Marcar várias', ajuda: 'Pode marcar mais de uma (ex.: sabores).' },
  { id: 'texto', label: 'Texto livre', ajuda: 'A pessoa escreve (ex.: cor da caixeta).' },
];

// Move o item `i` uma posição para cima (-1) ou para baixo (+1).
const mover = (lista, i, direcao) => {
  const nova = [...lista];
  [nova[i], nova[i + direcao]] = [nova[i + direcao], nova[i]];
  return nova;
};

export default function EditorProduto({ produto, proximaOrdem, onCancelar, onSalvo }) {
  const inicial = useMemo(() => paraRascunho(produto), [produto]);
  const [r, setR] = useState(inicial);
  const [erros, setErros] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [confirmar, dialogo] = useConfirmar();
  const topo = useRef(null);

  const alterado = JSON.stringify(r) !== JSON.stringify(inicial);
  const novo = !produto;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!alterado) return undefined;
    const aviso = (e) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [alterado]);

  const set = (campo) => (valor) => setR((atual) => ({ ...atual, [campo]: valor }));
  const setEvento = (campo) => (e) =>
    set(campo)(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const setInteiro = (campo) => (e) => set(campo)(soDigitos(e.target.value));

  const setOpcao = (chave, campo, valor) =>
    setR((a) => ({ ...a, opcoes: a.opcoes.map((o) => (o.chave === chave ? { ...o, [campo]: valor } : o)) }));

  const setCampoPers = (chave, campo, valor) =>
    setR((a) => ({ ...a, campos: a.campos.map((c) => (c.chave === chave ? { ...c, [campo]: valor } : c)) }));

  const voltar = async () => {
    if (alterado) {
      const sair = await confirmar({
        titulo: 'Sair sem salvar?',
        texto: 'As alterações feitas neste produto vão ser perdidas.',
        botao: 'Sair sem salvar',
        cancelar: 'Continuar editando',
        perigo: true,
      });
      if (!sair) return;
    }
    onCancelar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    const { produto: pronto, erros: encontrados } = paraProduto(r, { proximaOrdem });
    if (encontrados) {
      setErros(encontrados);
      topo.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setErros([]);
    setSalvando(true);
    try {
      await salvarProduto(pronto);
      onSalvo(pronto);
    } catch (err) {
      setErros([mensagemDeErro(err)]);
      setSalvando(false);
      topo.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const usaOpcoes = r.tipo === 'opcoes' || (r.tipo === 'unidade' && r.precoModo === 'opcoes');

  return (
    <form className="editor" onSubmit={salvar} noValidate>
      {dialogo}
      <div className="editor-head" ref={topo}>
        <button type="button" className="adm-btn" onClick={voltar}>
          <Icon name="arrow_back" /> Voltar
        </button>
        <h1 className="editor-titulo">{novo ? 'Novo produto' : `Editar ${produto.nome}`}</h1>
      </div>

      {erros.length > 0 && (
        <div className="adm-erro editor-erros" role="alert">
          <strong>Confira antes de salvar:</strong>
          <ul>
            {erros.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Foto e dados básicos ---------- */}
      <section className="adm-card editor-secao editor-basico">
        <CampoImagem rotulo="Foto do produto" valor={r.imagem} onChange={set('imagem')} maxLado={1000} />

        <div className="editor-coluna">
          <label className="adm-field">
            <span>Nome</span>
            <input value={r.nome} onChange={setEvento('nome')} placeholder="Ex.: Bolo de pote" />
          </label>

          <label className="adm-field">
            <span>Descrição curta</span>
            <textarea
              rows={3}
              value={r.descricao}
              onChange={setEvento('descricao')}
              placeholder="Aparece no cartão do cardápio."
            />
          </label>

          <label className="adm-field">
            <span>Categoria</span>
            <select value={r.categoria} onChange={setEvento('categoria')}>
              {categorias
                .filter((c) => c.id !== 'todos')
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
            </select>
          </label>

          <label className="adm-check">
            <input type="checkbox" checked={r.ativo} onChange={setEvento('ativo')} />
            Mostrar no site
          </label>
        </div>
      </section>

      {/* ---------- Preço ---------- */}
      <section className="adm-card editor-secao">
        <h2 className="adm-card-title">Preço</h2>
        <fieldset className="editor-tipos">
          <legend className="sr-only">Como é cobrado</legend>
          {tiposProduto.map((t) => (
            <label key={t.id} className={`editor-tipo ${r.tipo === t.id ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="tipo"
                value={t.id}
                checked={r.tipo === t.id}
                onChange={() => set('tipo')(t.id)}
              />
              <strong>{t.label}</strong>
              <span>{t.ajuda}</span>
            </label>
          ))}
        </fieldset>

        {r.tipo === 'fixo' && (
          <label className="adm-field editor-curto">
            <span>Preço</span>
            <CampoPreco valor={r.preco} onChange={set('preco')} />
          </label>
        )}

        {r.tipo === 'unidade' && (
          <>
            <div className="editor-linha">
              <label className="adm-field">
                <span>Nome da unidade</span>
                <input value={r.unidade} onChange={setEvento('unidade')} placeholder="unidades, fatias…" />
              </label>
              <label className="adm-field">
                <span>Quantidade mínima</span>
                <input inputMode="numeric" value={r.min} onChange={setInteiro('min')} />
              </label>
              <label className="adm-field">
                <span>De quanto em quanto</span>
                <input inputMode="numeric" value={r.passo} onChange={setInteiro('passo')} />
                <small>Quanto os botões + e − somam.</small>
              </label>
            </div>

            <div className="editor-radios" role="radiogroup" aria-label="Preço da unidade">
              <label className="adm-check">
                <input
                  type="radio"
                  name="precoModo"
                  checked={r.precoModo === 'unico'}
                  onChange={() => set('precoModo')('unico')}
                />
                Mesmo preço por unidade
              </label>
              <label className="adm-check">
                <input
                  type="radio"
                  name="precoModo"
                  checked={r.precoModo === 'opcoes'}
                  onChange={() => set('precoModo')('opcoes')}
                />
                Preço muda conforme a opção
              </label>
            </div>

            {r.precoModo === 'unico' && (
              <>
                <label className="adm-field editor-curto">
                  <span>Preço por unidade</span>
                  <CampoPreco valor={r.precoUnitario} onChange={set('precoUnitario')} />
                </label>
                <label className="adm-check">
                  <input type="checkbox" checked={r.temAtacado} onChange={setEvento('temAtacado')} />
                  Preço menor para pedidos grandes
                </label>
                {r.temAtacado && (
                  <div className="editor-linha">
                    <label className="adm-field">
                      <span>Acima de (unidades)</span>
                      <input
                        inputMode="numeric"
                        value={r.atacadoAcimaDe}
                        onChange={setInteiro('atacadoAcimaDe')}
                        placeholder="45"
                      />
                    </label>
                    <label className="adm-field">
                      <span>Preço por unidade</span>
                      <CampoPreco valor={r.atacadoPreco} onChange={set('atacadoPreco')} />
                    </label>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {usaOpcoes && (
          <div className="editor-opcoes">
            <label className="adm-field editor-curto">
              <span>
                Nome da escolha <small>(ex.: Tamanho, Pacote, Quantidade)</small>
              </span>
              <input value={r.opcaoLabel} onChange={setEvento('opcaoLabel')} placeholder="Tamanho" />
            </label>

            <div className="editor-tabela" role="group" aria-label="Opções e preços">
              <div className="editor-tabela-head" aria-hidden="true">
                <span>Opção</span>
                <span>Preço{r.tipo === 'unidade' ? ' por unidade' : ''}</span>
              </div>
              {r.opcoes.map((o, i) => (
                <div key={o.chave} className="editor-tabela-linha">
                  <input
                    aria-label={`Nome da opção ${i + 1}`}
                    value={o.label}
                    onChange={(e) => setOpcao(o.chave, 'label', e.target.value)}
                    placeholder="Ex.: 10 fatias"
                  />
                  <CampoPreco
                    aria-label={`Preço da opção ${i + 1}`}
                    valor={o.preco}
                    onChange={(v) => setOpcao(o.chave, 'preco', v)}
                  />
                  <div className="editor-mini-acoes">
                    <button
                      type="button"
                      className="adm-icon-btn"
                      disabled={i === 0}
                      onClick={() => setR((a) => ({ ...a, opcoes: mover(a.opcoes, i, -1) }))}
                      aria-label={`Subir opção ${i + 1}`}
                    >
                      <Icon name="arrow_upward" />
                    </button>
                    <button
                      type="button"
                      className="adm-icon-btn"
                      disabled={i === r.opcoes.length - 1}
                      onClick={() => setR((a) => ({ ...a, opcoes: mover(a.opcoes, i, 1) }))}
                      aria-label={`Descer opção ${i + 1}`}
                    >
                      <Icon name="arrow_downward" />
                    </button>
                    <button
                      type="button"
                      className="adm-icon-btn is-perigo"
                      disabled={r.opcoes.length === 1}
                      onClick={() => setR((a) => ({ ...a, opcoes: a.opcoes.filter((x) => x.chave !== o.chave) }))}
                      aria-label={`Remover opção ${i + 1}`}
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="adm-btn"
              onClick={() => setR((a) => ({ ...a, opcoes: [...a.opcoes, novaOpcao()] }))}
            >
              <Icon name="add" /> Adicionar opção
            </button>
          </div>
        )}
      </section>

      {/* ---------- Personalizações ---------- */}
      <section className="adm-card editor-secao">
        <h2 className="adm-card-title">Personalizações</h2>
        <p className="adm-ajuda">
          Perguntas feitas antes de adicionar à sacola, como massa, recheio ou sabores. Opcional.
        </p>

        {r.campos.map((c, i) => (
          <div key={c.chave} className="editor-campo">
            <div className="editor-campo-topo">
              <strong>Personalização {i + 1}</strong>
              <div className="editor-mini-acoes">
                <button
                  type="button"
                  className="adm-icon-btn"
                  disabled={i === 0}
                  onClick={() => setR((a) => ({ ...a, campos: mover(a.campos, i, -1) }))}
                  aria-label={`Subir personalização ${i + 1}`}
                >
                  <Icon name="arrow_upward" />
                </button>
                <button
                  type="button"
                  className="adm-icon-btn"
                  disabled={i === r.campos.length - 1}
                  onClick={() => setR((a) => ({ ...a, campos: mover(a.campos, i, 1) }))}
                  aria-label={`Descer personalização ${i + 1}`}
                >
                  <Icon name="arrow_downward" />
                </button>
                <button
                  type="button"
                  className="adm-icon-btn is-perigo"
                  onClick={() => setR((a) => ({ ...a, campos: a.campos.filter((x) => x.chave !== c.chave) }))}
                  aria-label={`Remover personalização ${i + 1}`}
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>

            <div className="editor-linha">
              <label className="adm-field">
                <span>Pergunta</span>
                <input
                  value={c.label}
                  onChange={(e) => setCampoPers(c.chave, 'label', e.target.value)}
                  placeholder="Ex.: Recheio"
                />
              </label>
              <label className="adm-field">
                <span>Tipo de resposta</span>
                <select value={c.tipo} onChange={(e) => setCampoPers(c.chave, 'tipo', e.target.value)}>
                  {tiposCampo.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <small>{tiposCampo.find((t) => t.id === c.tipo)?.ajuda}</small>
              </label>
            </div>

            {c.tipo === 'texto' ? (
              <label className="adm-field">
                <span>
                  Exemplo de resposta <small>(aparece apagado dentro do campo)</small>
                </span>
                <input
                  value={c.placeholder}
                  onChange={(e) => setCampoPers(c.chave, 'placeholder', e.target.value)}
                  placeholder="Ex.: branco, rosa claro, dourado..."
                />
              </label>
            ) : (
              <>
                <label className="adm-field">
                  <span>
                    Opções <small>(uma por linha)</small>
                  </span>
                  <textarea
                    rows={Math.min(8, Math.max(3, c.opcoesTexto.split('\n').length + 1))}
                    value={c.opcoesTexto}
                    onChange={(e) => setCampoPers(c.chave, 'opcoesTexto', e.target.value)}
                    placeholder={'Chocolate\nNinho\nRed Velvet'}
                  />
                </label>
                {c.tipo === 'select' && (
                  <label className="adm-check">
                    <input
                      type="checkbox"
                      checked={c.opcional}
                      onChange={(e) => setCampoPers(c.chave, 'opcional', e.target.checked)}
                    />
                    Opcional (mostra “Nenhum” como primeira opção)
                  </label>
                )}
                {c.tipo === 'checkbox' && (
                  <label className="adm-field editor-curto">
                    <span>
                      Máximo de escolhas <small>(vazio = sem limite)</small>
                    </span>
                    <input
                      inputMode="numeric"
                      value={c.max}
                      onChange={(e) => setCampoPers(c.chave, 'max', soDigitos(e.target.value))}
                      placeholder="4"
                    />
                  </label>
                )}
              </>
            )}
          </div>
        ))}

        <button
          type="button"
          className="adm-btn"
          onClick={() => setR((a) => ({ ...a, campos: [...a.campos, novoCampo()] }))}
        >
          <Icon name="add" /> Adicionar personalização
        </button>
      </section>

      {/* ---------- Aviso ---------- */}
      <section className="adm-card editor-secao">
        <label className="adm-field">
          <span>
            Aviso no pedido <small>(opcional)</small>
          </span>
          <input
            value={r.aviso}
            onChange={setEvento('aviso')}
            placeholder="Ex.: Envie a foto de referência junto com o orçamento."
          />
          <small>Aparece em destaque na janela do produto, antes de adicionar à sacola.</small>
        </label>
      </section>

      <div className="editor-rodape">
        <button type="button" className="adm-btn" onClick={voltar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={salvando}>
          <Icon name="check" /> {salvando ? 'Salvando…' : 'Salvar produto'}
        </button>
      </div>
    </form>
  );
}
