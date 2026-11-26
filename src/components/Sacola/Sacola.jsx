import { useEffect, useRef, useState } from 'react';
import { useSacola } from '../../context/SacolaContext.jsx';
import { descreverEscolhas, rotuloQuantidade } from '../../data/cardapio.js';
import { formatarPreco } from '../../data/produtos.js';
import Icon from '../Icon/Icon.jsx';
import './Sacola.css';

// Botão flutuante com o resumo da sacola + gaveta com os itens do pedido.
export default function Sacola() {
  const { linhas, quantidadeItens, total, alterarQtd, remover, aberta, abrir, fechar, ultimoAdicionado } =
    useSacola();
  const dialog = useRef(null);
  const [aviso, setAviso] = useState(null);
  const [noFormulario, setNoFormulario] = useState(false);

  // Esconde o botão flutuante quando o formulário (que já mostra o pedido) ou o rodapé
  // estão na tela.
  useEffect(() => {
    const alvos = [document.querySelector('#contact'), document.querySelector('.site-footer')].filter(Boolean);
    if (!alvos.length) return undefined;
    const visiveis = new Set();
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)));
        setNoFormulario(visiveis.size > 0);
      },
      { rootMargin: '0px 0px -30% 0px' }
    );
    alvos.forEach((a) => obs.observe(a));
    return () => obs.disconnect();
  }, []);

  // Abre/fecha a gaveta (<dialog> nativo) conforme o estado da sacola.
  useEffect(() => {
    const el = dialog.current;
    if (aberta && !el.open) {
      el.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!aberta && el.open) {
      el.close();
    }
  }, [aberta]);

  // Aviso rápido "Adicionado à sacola".
  useEffect(() => {
    if (!ultimoAdicionado) return undefined;
    const linha = linhas.find((l) => l.id === ultimoAdicionado.id);
    setAviso(linha ? linha.produto.nome : 'Item');
    const t = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(t);
    // só quando um item novo entra
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoAdicionado]);

  const continuar = () => {
    fechar();
    // espera a gaveta fechar e o scroll voltar antes de rolar até o formulário
    setTimeout(() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <>
      {quantidadeItens > 0 && !noFormulario && (
        <button type="button" className="bag-fab" onClick={abrir} aria-haspopup="dialog">
          <span className="bag-fab-icon">
            <Icon name="shopping_bag" />
            <span className="bag-fab-count">{quantidadeItens}</span>
          </span>
          <span className="bag-fab-text">
            Ver pedido <strong>{formatarPreco(total)}</strong>
          </span>
        </button>
      )}

      <div className={`bag-toast ${aviso ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {aviso && (
          <>
            <Icon name="check" /> {aviso} adicionado à sacola
          </>
        )}
      </div>

      <dialog
        ref={dialog}
        className="bag"
        aria-labelledby="bag-title"
        onClose={() => {
          document.body.style.overflow = '';
          fechar();
        }}
        onClick={(e) => e.target === dialog.current && fechar()}
      >
        <div className="bag-box">
          <div className="bag-head">
            <h2 id="bag-title" className="bag-title">
              <Icon name="shopping_bag" /> Seu pedido
            </h2>
            <button type="button" className="bag-close" onClick={fechar} aria-label="Fechar sacola">
              <Icon name="close" />
            </button>
          </div>

          {linhas.length === 0 ? (
            <div className="bag-empty">
              <p>Sua sacola está vazia.</p>
              <button type="button" className="bag-link" onClick={fechar}>
                Ver o cardápio
              </button>
            </div>
          ) : (
            <ul className="bag-list">
              {linhas.map((l) => {
                const p = l.produto;
                const unidade = p.tipo === 'unidade';
                const min = unidade ? p.min : 1;
                const passo = unidade ? p.passo : 1;
                return (
                  <li key={l.id} className="bag-item">
                    <img src={p.imagem} alt="" className="bag-item-img" />
                    <div className="bag-item-info">
                      <div className="bag-item-top">
                        <strong>{p.nome}</strong>
                        <span>{formatarPreco(l.total)}</span>
                      </div>
                      <p className="bag-item-desc">{descreverEscolhas(p, l).join(' · ')}</p>
                      <div className="bag-item-actions">
                        <div className="bag-qty">
                          <button
                            type="button"
                            onClick={() => alterarQtd(l.id, Math.max(min, l.qtd - passo))}
                            disabled={l.qtd <= min}
                            aria-label={`Diminuir ${p.nome}`}
                          >
                            <Icon name="remove" />
                          </button>
                          <span className="bag-qty-value" aria-live="polite">{rotuloQuantidade(p, l.qtd)}</span>
                          <button
                            type="button"
                            onClick={() => alterarQtd(l.id, l.qtd + passo)}
                            aria-label={`Aumentar ${p.nome}`}
                          >
                            <Icon name="add" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="bag-remove"
                          onClick={() => remover(l.id)}
                          aria-label={`Remover ${p.nome}`}
                        >
                          <Icon name="delete" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {linhas.length > 0 && (
            <div className="bag-foot">
              <div className="bag-total">
                <span>Total estimado</span>
                <strong>{formatarPreco(total)}</strong>
              </div>
              <p className="bag-hint">
                No cartão de crédito há acréscimo de 5%. O valor é confirmado no orçamento.
              </p>
              <button type="button" className="bag-cta" onClick={continuar}>
                Continuar para o orçamento
                <Icon name="arrow_forward" />
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
