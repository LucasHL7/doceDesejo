import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon/Icon.jsx';
import './CakeStyles.css';

// Fotos do carrossel. Para adicionar um bolo, coloque a imagem em
// public/scr/confeitados/ e inclua uma linha aqui.
const bolos = [
  { src: '/scr/confeitados/confeitado-1.jpeg', alt: 'Bolo confeitado decorado, estilo 1' },
  { src: '/scr/confeitados/confeitado-2.jpeg', alt: 'Bolo confeitado decorado, estilo 2' },
  { src: '/scr/confeitados/confeitado-3.jpeg', alt: 'Bolo confeitado decorado, estilo 3' },
  { src: '/scr/confeitados/confeitado-4.jpeg', alt: 'Bolo confeitado decorado, estilo 4' },
  { src: '/scr/confeitados/confeitado-5.jpeg', alt: 'Bolo confeitado decorado, estilo 5' },
];

const prefereMenosMovimento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function CakeStyles() {
  const trilho = useRef(null);
  const [atual, setAtual] = useState(0);
  const [ultimo, setUltimo] = useState(0); // última posição alcançável

  // Distância entre o início de um slide e o do próximo.
  const passo = useCallback(() => {
    const el = trilho.current;
    const slides = el?.children;
    if (!slides || slides.length < 2) return el?.clientWidth || 1;
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }, []);

  // Atualiza a posição atual e quantas posições existem (muda com a largura da tela).
  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    const p = passo();
    setUltimo(Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / p)));
    setAtual(Math.round(el.scrollLeft / p));
  }, [passo]);

  useEffect(() => {
    const el = trilho.current;
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', medir);
      ro.disconnect();
    };
  }, [medir]);

  const irPara = (indice) => {
    const alvo = Math.min(Math.max(indice, 0), ultimo);
    trilho.current.scrollTo({
      left: alvo * passo(),
      behavior: prefereMenosMovimento() ? 'auto' : 'smooth',
    });
  };

  return (
    <section id="about" className="cakes" aria-labelledby="cakes-title">
      <div className="cakes-inner">
        <header className="cakes-head">
          <div>
            <span className="cakes-eyebrow">Nossos confeitados</span>
            <h2 id="cakes-title" className="cakes-title">
              Estilos de <span className="cakes-script">bolos</span>
            </h2>
            <p className="cakes-lead">
              Alguns dos bolos que já saíram da nossa cozinha. Use como inspiração para o seu.
            </p>
          </div>

          <div className="cakes-arrows">
            <button
              type="button"
              className="cakes-arrow"
              onClick={() => irPara(atual - 1)}
              disabled={atual <= 0}
              aria-label="Bolo anterior"
              aria-controls="cakes-track"
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              className="cakes-arrow"
              onClick={() => irPara(atual + 1)}
              disabled={atual >= ultimo}
              aria-label="Próximo bolo"
              aria-controls="cakes-track"
            >
              <Icon name="chevron_right" />
            </button>
          </div>
        </header>

        <ul
          id="cakes-track"
          ref={trilho}
          className="cakes-track"
          tabIndex={0}
          aria-label="Fotos de bolos confeitados. Use as setas do teclado para navegar."
        >
          {bolos.map((b, i) => (
            <li key={b.src} className="cakes-slide" aria-label={`${i + 1} de ${bolos.length}`}>
              <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>

        {ultimo > 0 && (
          <div className="cakes-dots" role="group" aria-label="Escolher posição do carrossel">
            {Array.from({ length: ultimo + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`cakes-dot ${i === atual ? 'is-active' : ''}`}
                onClick={() => irPara(i)}
                aria-label={`Ir para a posição ${i + 1}`}
                aria-current={i === atual ? 'true' : undefined}
              />
            ))}
          </div>
        )}

        <div className="cakes-cta">
          <p>Gostou de algum? Envie a foto como referência no seu orçamento.</p>
          <a href="#contact" className="cakes-cta-btn">
            Pedir um parecido
            <Icon name="arrow_forward" />
          </a>
        </div>
      </div>
    </section>
  );
}
