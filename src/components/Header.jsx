import Icon from './Icon/Icon.jsx';

export default function Header() {
  return (
    <header>
      <nav id="navigation" className="navigation">
        <div id="responsive-logo" className="responsive-logo"> Doce Desejo Gourmet</div>
        <a id="nav-text-menu" href="#" className="logo">
          D<span>oc</span>e D<span>esej</span>o
        </a>
        <ul id="nav-menu" className="nav-menu">
          <li className="nav-item"><a href="#home">Home</a></li>
          <li className="nav-item"><a href="#about">Estilos de Bolos</a></li>
          <li className="nav-item"><a href="#menu">Recheios e Massas</a></li>
          <li id="contato" className="nav-item"><a href="#contact">Contato</a></li>
          <Icon id="iconcake" name="cake" />
        </ul>
      </nav>
    </header>
  );
}
