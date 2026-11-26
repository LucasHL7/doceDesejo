import Selo from '../Selo/Selo.jsx';
import Icon from '../Icon/Icon.jsx';
import './PreviaWhatsApp.css';

// Converte o *negrito* do WhatsApp em <strong>, sem usar HTML cru.
function comNegrito(texto) {
  const partes = texto.split(/(\*[^*]+\*)/g);
  return partes.map((p, i) =>
    p.startsWith('*') && p.endsWith('*') && p.length > 2 ? <strong key={i}>{p.slice(1, -1)}</strong> : p
  );
}

// Celular com a conversa do WhatsApp mostrando a mensagem que será enviada.
export default function PreviaWhatsApp({ linhas, hora }) {
  return (
    <div className="wa-phone" role="img" aria-label="Prévia da mensagem que será enviada pelo WhatsApp">
      <div className="wa-screen">
        <div className="wa-top">
          <Icon name="arrow_back" />
          <Selo className="wa-avatar" alt="" />
          <div className="wa-contact">
            <strong>Doce Desejo</strong>
            <span>online</span>
          </div>
        </div>

        <div className="wa-chat">
          <div className="wa-bubble">
            {linhas.map((l, i) => {
              if ('texto' in l) {
                if (l.texto === '') return <br key={i} />;
                return (
                  <p key={i} className={`${l.suave ? 'is-soft' : ''} ${l.vazio ? 'is-empty' : ''}`}>
                    {comNegrito(l.texto)}
                  </p>
                );
              }
              if (l.opcional && !l.valor) return null;
              return (
                <p key={i}>
                  <strong>{l.rotulo}</strong>:{' '}
                  {l.valor ? l.valor : <span className="wa-blank" aria-label="a preencher" />}
                </p>
              );
            })}
            <span className="wa-time">
              {hora} <Icon name="done_all" />
            </span>
          </div>
        </div>

        <div className="wa-input">
          <span>Mensagem</span>
          <span className="wa-send">
            <Icon name="send" filled />
          </span>
        </div>
      </div>
    </div>
  );
}
