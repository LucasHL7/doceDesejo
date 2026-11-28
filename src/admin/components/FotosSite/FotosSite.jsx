import { useRef, useState } from 'react';
import { espacosFoto, imagensSitePadrao } from '../../../data/imagensPadrao.js';
import {
  excluirFotoGaleria,
  gerarId,
  salvarFotoGaleria,
  salvarImagemSite,
  salvarOrdem,
} from '../../../firebase/conteudo.js';
import { comprimirImagem } from '../../imagem.js';
import { mensagemDeErro } from '../../auth.js';
import Icon from '../../../components/Icon/Icon.jsx';
import CampoImagem from '../CampoImagem/CampoImagem.jsx';
import { useConfirmar } from '../Confirmar/Confirmar.jsx';
import './FotosSite.css';

export default function FotosSite({ galeria, setGaleria, imagensSite, setImagensSite, avisar }) {
  return (
    <div className="fotos">
      <section aria-labelledby="fotos-fixas">
        <h1 id="fotos-fixas" className="fotos-titulo">Fotos do site</h1>
        <p className="adm-ajuda">Clique numa foto para trocar. Depois, clique em “Salvar”.</p>
        <div className="fotos-grade">
          {espacosFoto.map((e) => (
            <EspacoFoto
              key={e.id}
              espaco={e}
              atual={imagensSite[e.id] ?? imagensSitePadrao[e.id]}
              onSalvo={(img) => {
                setImagensSite((todas) => ({ ...todas, [e.id]: img }));
                avisar('Foto salva!');
              }}
            />
          ))}
        </div>
      </section>

      <Galeria galeria={galeria} setGaleria={setGaleria} avisar={avisar} />
    </div>
  );
}

// Um lugar fixo do site (foto principal, fotos do delivery).
function EspacoFoto({ espaco, atual, onSalvo }) {
  const [src, setSrc] = useState(atual?.src ?? '');
  const [alt, setAlt] = useState(atual?.alt ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const alterado = src !== (atual?.src ?? '') || alt !== (atual?.alt ?? '');

  const salvar = async () => {
    setErro('');
    setSalvando(true);
    const img = { src, alt: alt.trim() };
    try {
      await salvarImagemSite(espaco.id, img);
      onSalvo(img);
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  };

  const hero = espaco.id === 'hero';

  return (
    <div className="adm-card fotos-espaco">
      <CampoImagem
        rotulo={espaco.nome}
        valor={src}
        onChange={setSrc}
        formato={hero ? '1 / 1' : '4 / 3'}
        contain={hero}
        maxLado={hero ? 1000 : 900}
      />
      <p className="adm-ajuda">{espaco.dica}</p>
      <label className="adm-field">
        <span>
          Descrição da foto <small>(para leitores de tela e Google)</small>
        </span>
        <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ex.: Bolo de chocolate com morangos" />
      </label>
      {erro && <p className="adm-erro" role="alert">{erro}</p>}
      <button
        type="button"
        className="adm-btn adm-btn-primary"
        onClick={salvar}
        disabled={!alterado || salvando}
      >
        {salvando ? 'Salvando…' : alterado ? 'Salvar' : 'Salvo'}
      </button>
    </div>
  );
}

// Carrossel "Estilos de bolos": adicionar, remover, reordenar e descrever fotos.
function Galeria({ galeria, setGaleria, avisar }) {
  const input = useRef(null);
  const [ocupado, setOcupado] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [erro, setErro] = useState('');
  const [confirmar, dialogo] = useConfirmar();

  const adicionar = async (e) => {
    const arquivos = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!arquivos.length) return;
    setErro('');
    setOcupado(true);
    let ordem = galeria.length ? Math.max(...galeria.map((f) => f.ordem ?? 0)) + 1 : 0;
    let adicionadas = 0;
    const falhas = [];
    for (const [i, arquivo] of arquivos.entries()) {
      setProgresso(`Enviando ${i + 1} de ${arquivos.length}…`);
      try {
        const src = await comprimirImagem(arquivo, { maxLado: 1000 });
        const foto = { id: gerarId('bolo'), src, alt: 'Bolo confeitado decorado', ordem: ordem++ };
        await salvarFotoGaleria(foto);
        setGaleria((lista) => [...lista, foto]);
        adicionadas++;
      } catch (err) {
        falhas.push(`${arquivo.name}: ${mensagemDeErro(err)}`);
      }
    }
    setProgresso('');
    setOcupado(false);
    if (falhas.length) setErro(falhas.join(' '));
    if (adicionadas) avisar(adicionadas === 1 ? 'Foto adicionada!' : `${adicionadas} fotos adicionadas!`);
  };

  const mover = async (i, direcao) => {
    const nova = [...galeria];
    [nova[i], nova[i + direcao]] = [nova[i + direcao], nova[i]];
    const comOrdem = nova.map((f, n) => ({ ...f, ordem: n }));
    const anterior = galeria;
    setGaleria(() => comOrdem);
    setOcupado(true);
    try {
      await salvarOrdem('galeria', comOrdem);
    } catch (err) {
      setGaleria(() => anterior);
      setErro(mensagemDeErro(err));
    } finally {
      setOcupado(false);
    }
  };

  const remover = async (foto) => {
    const sim = await confirmar({
      titulo: 'Remover esta foto do carrossel?',
      texto: 'Ela some do site e não dá para desfazer.',
      botao: 'Remover',
      perigo: true,
    });
    if (!sim) return;
    setOcupado(true);
    try {
      await excluirFotoGaleria(foto.id);
      setGaleria((lista) => lista.filter((f) => f.id !== foto.id));
      avisar('Foto removida');
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setOcupado(false);
    }
  };

  const salvarDescricao = async (foto, alt) => {
    if (alt.trim() === (foto.alt ?? '')) return;
    const atualizada = { ...foto, alt: alt.trim() };
    try {
      await salvarFotoGaleria(atualizada);
      setGaleria((lista) => lista.map((f) => (f.id === foto.id ? atualizada : f)));
      avisar('Descrição salva');
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  };

  return (
    <section aria-labelledby="fotos-galeria" className="fotos-galeria">
      {dialogo}
      <div className="fotos-galeria-head">
        <div>
          <h2 id="fotos-galeria" className="fotos-titulo">Carrossel “Estilos de bolos”</h2>
          <p className="adm-ajuda">
            Fotos dos bolos já feitos, na ordem em que aparecem. Pode escolher várias de uma vez.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-primary"
          onClick={() => input.current?.click()}
          disabled={ocupado}
        >
          <Icon name="add_photo_alternate" /> {progresso || 'Adicionar fotos'}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={adicionar}
        />
      </div>

      {erro && <p className="adm-erro" role="alert">{erro}</p>}

      {galeria.length === 0 ? (
        <p className="adm-card fotos-vazio">
          Nenhuma foto no carrossel. Enquanto estiver vazio, a seção aparece sem fotos no site.
        </p>
      ) : (
        <ul className="fotos-lista" aria-busy={ocupado || undefined}>
          {galeria.map((f, i) => (
            <li key={f.id} className="fotos-item">
              <img src={f.src} alt="" loading="lazy" />
              <input
                className="fotos-item-alt"
                aria-label={`Descrição da foto ${i + 1}`}
                defaultValue={f.alt}
                onBlur={(e) => salvarDescricao(f, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
              <div className="fotos-item-acoes">
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => mover(i, -1)}
                  disabled={ocupado || i === 0}
                  aria-label={`Mover foto ${i + 1} para antes`}
                >
                  <Icon name="chevron_left" />
                </button>
                <span className="fotos-item-pos">{i + 1}</span>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => mover(i, 1)}
                  disabled={ocupado || i === galeria.length - 1}
                  aria-label={`Mover foto ${i + 1} para depois`}
                >
                  <Icon name="chevron_right" />
                </button>
                <button
                  type="button"
                  className="adm-icon-btn is-perigo"
                  onClick={() => remover(f)}
                  disabled={ocupado}
                  aria-label={`Remover foto ${i + 1}`}
                >
                  <Icon name="delete" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
