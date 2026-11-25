import Icon from './Icon/Icon.jsx';

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          fill="#F06292"
          fillOpacity="1"
          d="M0,128L48,128C96,128,192,128,288,144C384,160,480,192,576,170.7C672,149,768,75,864,48C960,21,1056,43,1152,64C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      <div id="content" className="content">
        <p>&copy; 2025 Doce Desejo. Todos os direitos reservados.</p>
        <div className="social">
          <a id="link-footer" href="https://www.instagram.com/docedesejogourmethe/" className="links">
            <Icon name="photo_camera" />INSTAGRAM
          </a>
          <a id="link-footer" href="https://linktr.ee/docedesejogourmethe" className="links">
            <Icon name="call" />CONTATOS
          </a>
        </div>

        <a id="logo-footer" href="https://linktr.ee/docedesejogourmethe" className="links">
          <img className="logo-footer" src="/scr/Logo.png" alt="logo" />
        </a>
      </div>
    </footer>
  );
}
