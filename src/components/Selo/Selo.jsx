import './Selo.css';

// Selo da marca (Logo.png) com o miolo preenchido de branco.
// O PNG só tem os traços; o centro é transparente e deixava o fundo aparecer.
// O tamanho vem do className de quem usa (width/height no CSS do componente pai).
export default function Selo({ className = '', alt = 'Doce Desejo' }) {
  return (
    <span className={`selo ${className}`.trim()}>
      <img src="/scr/Logo.png" alt={alt} />
    </span>
  );
}
