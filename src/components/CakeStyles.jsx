const imagens = [1, 2, 3, 4, 5].map((n) => `/scr/confeitados/confeitado-${n}.jpeg`);

export default function CakeStyles() {
  return (
    <section id="about" className="bolos">
      <h2>Estilos de bolos</h2>
      <div id="cake-container" className="cake-container">
        {imagens.map((src) => (
          <div className="cake-item" key={src}>
            <img className="confeitados" src={src} alt="estilo-de-bolo-confeitado" />
          </div>
        ))}
      </div>
    </section>
  );
}
