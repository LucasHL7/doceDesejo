// Ícone do Material Symbols (Rounded), carregado pelo Google Fonts no index.html.
// Ao usar um ícone novo, adicione o nome em `icon_names` no link do index.html
// (em ordem alfabética), senão ele aparece como texto.
export default function Icon({ name, className = '', filled = false, ...props }) {
  return (
    <span
      className={`material-symbols-rounded icon ${filled ? 'icon-filled' : ''} ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}
