import { useId, useRef, useState } from 'react';
import { comprimirImagem } from '../../imagem.js';
import Icon from '../../../components/Icon/Icon.jsx';
import './CampoImagem.css';

// Mostra a foto atual e deixa trocar por outra do computador ou celular.
// A foto escolhida é comprimida aqui mesmo e devolvida como data URL em onChange.
export default function CampoImagem({ valor, onChange, rotulo = 'Foto', formato = '4 / 3', maxLado, contain = false }) {
  const input = useRef(null);
  const id = useId();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const escolher = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErro('');
    setProcessando(true);
    try {
      onChange(await comprimirImagem(arquivo, maxLado ? { maxLado } : undefined));
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="cimg">
      <span className="adm-label" id={`${id}-rotulo`}>{rotulo}</span>
      <button
        type="button"
        className={`cimg-preview ${contain ? 'is-contain' : ''}`}
        style={{ aspectRatio: formato }}
        onClick={() => input.current?.click()}
        aria-describedby={`${id}-rotulo`}
        disabled={processando}
      >
        {valor ? (
          <>
            <img src={valor} alt="" />
            <span className="cimg-trocar">
              <Icon name="photo_camera" />
              {processando ? 'Preparando…' : 'Trocar foto'}
            </span>
          </>
        ) : (
          <span className="cimg-vazio">
            <Icon name="add_photo_alternate" />
            {processando ? 'Preparando…' : 'Escolher foto'}
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={escolher}
      />
      {erro && <p className="adm-erro" role="alert">{erro}</p>}
    </div>
  );
}
