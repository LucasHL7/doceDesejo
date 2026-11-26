import { icones } from './icones.js';
import './Icon.css';

// Ícone do Material Symbols (Rounded) desenhado como SVG embutido.
// Não depende de fonte externa: o ícone aparece mesmo com internet lenta ou cache antigo.
// O tamanho segue o font-size e a cor segue a cor do texto de quem usa.
export default function Icon({ name, className = '', filled = false, ...props }) {
  const svgs = icones[name];

  if (!svgs) {
    if (import.meta.env.DEV) {
      console.warn(`Ícone "${name}" não cadastrado em src/components/Icon/icones.js`);
    }
    return null;
  }

  return (
    <span
      className={`icon ${className}`.trim()}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: filled ? svgs[1] : svgs[0] }}
      {...props}
    />
  );
}
