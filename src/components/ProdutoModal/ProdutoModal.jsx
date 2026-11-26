import { useEffect, useRef, useState } from 'react';
import { calcularLinha } from '../../data/cardapio.js';
import { formatarPreco } from '../../data/produtos.js';
import { useSacola } from '../../context/SacolaContext.jsx';
import Icon from '../Icon/Icon.jsx';
import './ProdutoModal.css';

// Janela para escolher tamanho, quantidade e personalizações de um produto.
// Usa <dialog> nativo: o navegador cuida do foco, do Esc e de bloquear o fundo.
export default function ProdutoModal({ produto, onFechar }) {
  const dialog = useRef(null);

  useEffect(() => {
    const el = dialog.current;
    if (produto && !el.open) {
      el.showModal();
      document.body.style.overflow = 'hidden';
    }
  }, [produto]);

  const fechar = () => {
    dialog.current?.close();
  };

  return (
    <dialog
      ref={dialog}
      className="pmodal"
      aria-labelledby="pmodal-title"
      onClose={() => {
        document.body.style.overflow = '';
        onFechar();
      }}
      onClick={(e) => {
        // clique no fundo escuro (fora do conteúdo) fecha
        if (e.target === dialog.current) fechar();
      }}
    >
      {produto && <Conteudo key={produto.id} produto={produto} onFechar={fechar} />}
    </dialog>
  );
}

function valoresIniciais(produto) {
  const campos = {};
  for (const c of produto.campos) {
    if (c.tipo === 'select') campos[c.id] = c.opcoes[0].value;
    else if (c.tipo === 'checkbox') campos[c.id] = [];
    else campos[c.id] = '';
  }
  return {
    opcao: produto.opcoes ? produto.opcoes[0].value : null,
    qtd: produto.tipo === 'unidade' ? produto.min : 1,
    campos,
  };
}

function Conteudo({ produto, onFechar }) {
  const { adicionar } = useSacola();
  const [escolha, setEscolha] = useState(() => valoresIniciais(produto));
  const [erro, setErro] = useState('');

  const porUnidade = produto.tipo === 'unidade';
  const min = porUnidade ? produto.min : 1;
  const passo = porUnidade ? produto.passo : 1;
  const qtdNum = Number(escolha.qtd) || 0;
  const total = calcularLinha(produto, { opcao: escolha.opcao, qtd: qtdNum });

  const setCampo = (id, valor) =>
    setEscolha((e) => ({ ...e, campos: { ...e.campos, [id]: valor } }));

  const alternarSabor = (campo, valor) => {
    const atual = escolha.campos[campo.id];
    if (atual.includes(valor)) {
      setCampo(campo.id, atual.filter((v) => v !== valor));
    } else if (atual.length < campo.max) {
      setCampo(campo.id, [...atual, valor]);
    }
  };

  const mudarQtd = (delta) => {
    setErro('');
    setEscolha((e) => ({ ...e, qtd: Math.max(min, (Number(e.qtd) || 0) + delta) }));
  };

  const confirmar = (ev) => {
    ev.preventDefault();
    if (!Number.isInteger(qtdNum) || qtdNum < min) {
      setErro(`A quantidade mínima é ${min} ${porUnidade ? produto.unidade : ''}.`.trim());
      return;
    }
    adicionar({ produtoId: produto.id, opcao: escolha.opcao, qtd: qtdNum, campos: escolha.campos });
    onFechar();
  };

  return (
    <form className="pmodal-box" onSubmit={confirmar} noValidate>
      <div className="pmodal-img">
        <img src={produto.imagem} alt="" />
        <button type="button" className="pmodal-close" onClick={onFechar} aria-label="Fechar">
          <Icon name="close" />
        </button>
      </div>

      <div className="pmodal-body">
        <h3 id="pmodal-title" className="pmodal-title">{produto.nome}</h3>
        <p className="pmodal-desc">{produto.descricao}</p>

        {produto.opcoes && (
          <fieldset className="pmodal-field">
            <legend>{produto.opcaoLabel}</legend>
            <div className="pmodal-options">
              {produto.opcoes.map((o) => (
                <label key={o.value} className={`pmodal-option ${escolha.opcao === o.value ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="opcao"
                    value={o.value}
                    checked={escolha.opcao === o.value}
                    onChange={() => setEscolha((e) => ({ ...e, opcao: o.value }))}
                  />
                  <span className="pmodal-option-label">{o.label}</span>
                  <span className="pmodal-option-price">
                    {formatarPreco(o.preco)}
                    {porUnidade ? '/un' : ''}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {produto.campos.map((campo) => (
          <div key={campo.id} className="pmodal-field">
            {campo.tipo === 'select' && (
              <>
                <label htmlFor={`pm-${campo.id}`} className="pmodal-label">{campo.label}</label>
                <select
                  id={`pm-${campo.id}`}
                  value={escolha.campos[campo.id]}
                  onChange={(e) => setCampo(campo.id, e.target.value)}
                >
                  {campo.opcoes.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </>
            )}

            {campo.tipo === 'texto' && (
              <>
                <label htmlFor={`pm-${campo.id}`} className="pmodal-label">{campo.label}</label>
                <input
                  id={`pm-${campo.id}`}
                  type="text"
                  placeholder={campo.placeholder}
                  value={escolha.campos[campo.id]}
                  onChange={(e) => setCampo(campo.id, e.target.value)}
                />
              </>
            )}

            {campo.tipo === 'checkbox' && (
              <fieldset>
                <legend className="pmodal-label">{campo.label}</legend>
                <div className="pmodal-chips">
                  {campo.opcoes.map((o) => {
                    const marcado = escolha.campos[campo.id].includes(o.value);
                    const cheio = !marcado && escolha.campos[campo.id].length >= campo.max;
                    return (
                      <label key={o.value} className={`pmodal-chip ${marcado ? 'is-active' : ''} ${cheio ? 'is-disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={cheio}
                          onChange={() => alternarSabor(campo, o.value)}
                        />
                        {marcado && <Icon name="check" />}
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        ))}

        {produto.aviso && <p className="pmodal-note">{produto.aviso}</p>}
      </div>

      <div className="pmodal-foot">
        <div className="pmodal-qty">
          <button type="button" onClick={() => mudarQtd(-passo)} disabled={qtdNum <= min} aria-label="Diminuir quantidade">
            <Icon name="remove" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            step={1}
            value={escolha.qtd}
            aria-label={porUnidade ? `Quantidade de ${produto.unidade}` : 'Quantidade'}
            onKeyDown={(e) => ['e', 'E', '-', '+', ',', '.'].includes(e.key) && e.preventDefault()}
            onChange={(e) => {
              setErro('');
              setEscolha((s) => ({ ...s, qtd: e.target.value }));
            }}
          />
          <button type="button" onClick={() => mudarQtd(passo)} aria-label="Aumentar quantidade">
            <Icon name="add" />
          </button>
        </div>

        <button type="submit" className="pmodal-add">
          <span>Adicionar</span>
          <strong>{formatarPreco(total)}</strong>
        </button>

        {erro && <p className="pmodal-error" role="alert">{erro}</p>}
      </div>
    </form>
  );
}
