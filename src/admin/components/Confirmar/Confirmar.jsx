import { useCallback, useEffect, useRef, useState } from 'react';
import './Confirmar.css';

// Pergunta de confirmação ("Excluir este produto?") com <dialog> nativo.
// Uso:
//   const [confirmar, dialogo] = useConfirmar();
//   if (await confirmar({ titulo, texto, botao: 'Excluir', perigo: true })) { ... }
//   return <>{dialogo} ...</>
export function useConfirmar() {
  const [pedido, setPedido] = useState(null);
  const resolver = useRef(null);

  const confirmar = useCallback(
    (opcoes) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setPedido(opcoes);
      }),
    []
  );

  const responder = (resposta) => {
    resolver.current?.(resposta);
    resolver.current = null;
    setPedido(null);
  };

  return [confirmar, <Dialogo key="confirmar" pedido={pedido} onResponder={responder} />];
}

function Dialogo({ pedido, onResponder }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (pedido && !el.open) el.showModal();
    if (!pedido && el.open) el.close();
  }, [pedido]);

  return (
    <dialog
      ref={ref}
      className="confirmar"
      aria-labelledby="confirmar-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onResponder(false);
      }}
    >
      {pedido && (
        <div className="confirmar-box">
          <h2 id="confirmar-titulo">{pedido.titulo}</h2>
          {pedido.texto && <p>{pedido.texto}</p>}
          <div className="confirmar-acoes">
            <button type="button" className="adm-btn" onClick={() => onResponder(false)} autoFocus>
              {pedido.cancelar ?? 'Cancelar'}
            </button>
            <button
              type="button"
              className={`adm-btn adm-btn-primary ${pedido.perigo ? 'adm-btn-perigo' : ''}`}
              onClick={() => onResponder(true)}
            >
              {pedido.botao ?? 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
