import { mascararPreco } from '../EditorProduto/produtoForm.js';
import './CampoPreco.css';

// Campo de valor em reais com formatação automática.
// A pessoa só digita números e eles entram pelos centavos, como em maquininha:
// 1 → 0,01 · 17 → 0,17 · 170 → 1,70 · 123450 → 1.234,50
export default function CampoPreco({ valor, onChange, ...props }) {
  return (
    <span className="cpreco">
      <span className="cpreco-moeda" aria-hidden="true">R$</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        value={valor}
        onChange={(e) => onChange(mascararPreco(e.target.value))}
        {...props}
      />
    </span>
  );
}
