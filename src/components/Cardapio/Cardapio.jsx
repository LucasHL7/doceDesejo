import { useState } from 'react';
import { categorias, produtos, precoDoCard } from '../../data/cardapio.js';
import { formatarPreco } from '../../data/produtos.js';
import Icon from '../Icon/Icon.jsx';
import ProdutoModal from '../ProdutoModal/ProdutoModal.jsx';
import './Cardapio.css';

export default function Cardapio() {
  const [categoria, setCategoria] = useState('todos');
  const [escolhido, setEscolhido] = useState(null);

  const visiveis =
    categoria === 'todos' ? produtos : produtos.filter((p) => p.categoria === categoria);

  return (
    <section id="product-list" className="menu" aria-labelledby="menu-title">
      <div className="menu-inner">
        <header className="menu-head">
          <span className="menu-eyebrow">Cardápio</span>
          <h2 id="menu-title" className="menu-title">
            Monte o seu <span className="menu-script">pedido</span>
          </h2>
          <p className="menu-lead">
            Escolha os produtos, personalize e adicione à sacola. No final, enviamos tudo pelo
            WhatsApp como orçamento.
          </p>
        </header>

        <div className="menu-tabs" role="tablist" aria-label="Categorias do cardápio">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoria === c.id}
              className={`menu-tab ${categoria === c.id ? 'is-active' : ''}`}
              onClick={() => setCategoria(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <ul className="menu-grid">
          {visiveis.map((p) => {
            const preco = precoDoCard(p);
            return (
              <li key={p.id} className="menu-card">
                <button type="button" className="menu-card-btn" onClick={() => setEscolhido(p)}>
                  <span className="menu-card-img">
                    <img src={p.imagem} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="menu-card-body">
                    <span className="menu-card-name">{p.nome}</span>
                    <span className="menu-card-desc">{p.descricao}</span>
                    <span className="menu-card-foot">
                      <span className="menu-card-price">
                        {preco.prefixo && <small>{preco.prefixo}</small>}
                        {formatarPreco(preco.valor)}
                        {preco.sufixo}
                      </span>
                      <span className="menu-card-add" aria-hidden="true">
                        <Icon name="add" />
                      </span>
                    </span>
                  </span>
                  <span className="sr-only">Escolher {p.nome}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ProdutoModal produto={escolhido} onFechar={() => setEscolhido(null)} />
    </section>
  );
}
