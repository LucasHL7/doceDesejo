import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { conteudoPadrao, renderizarSite } from '../../test/renderizar.jsx';
import Home from './Home.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

describe('Home', () => {
  it('enquanto carrega, não mostra foto nem preços antigos', async () => {
    await renderizarSite(<Home />, { dados: 'pendente', esperar: false });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Criando sabores');
    expect(document.querySelector('.hero-img')).toBeNull();
    expect(document.querySelector('.hero-badge')).toBeNull();
  });

  it('mostra a foto e os selos de preço vindos do cardápio', async () => {
    const dados = conteudoPadrao();
    dados.imagensSite = { hero: { src: 'novo-hero.webp', alt: 'Bolo novo' } };
    dados.produtos = dados.produtos.map((p) =>
      p.id === 'bento-cake' ? { ...p, preco: 45 } : p
    );
    await renderizarSite(<Home />, { dados });

    expect(screen.getByRole('img', { name: 'Bolo novo' })).toHaveAttribute('src', 'novo-hero.webp');
    const [bolo, bento] = document.querySelectorAll('.hero-badge');
    expect(bolo).toHaveTextContent('Bolo confeitado');
    expect(bolo).toHaveTextContent('a partir de R$100,00');
    expect(bolo).toHaveTextContent('8 fatias');
    expect(bento).toHaveTextContent('Bento Cake');
    expect(bento).toHaveTextContent('R$45,00');
  });

  it('o selo some se o produto for removido; foto sem alt fica com alt vazio', async () => {
    const dados = conteudoPadrao();
    dados.produtos = dados.produtos.filter((p) => p.id !== 'bento-cake');
    dados.imagensSite = { hero: { src: 'h.png' } };
    await renderizarSite(<Home />, { dados });
    expect(document.querySelectorAll('.hero-badge')).toHaveLength(1);
    expect(document.querySelector('.hero-img')).toHaveAttribute('alt', '');
  });

  it('bolo sem opções mostra o selo sem a linha do tamanho', async () => {
    const dados = conteudoPadrao();
    dados.produtos = [{ id: 'bolo-confeitado', nome: 'Bolo', tipo: 'fixo', preco: 50 }];
    await renderizarSite(<Home />, { dados });
    const selo = document.querySelector('.hero-badge-top');
    expect(selo).toHaveTextContent('a partir de R$50,00');
    expect(selo.querySelector('.hero-badge-sub')).toBeNull();
  });

  it('o selo usa a opção mais barata mesmo fora de ordem', async () => {
    const dados = conteudoPadrao();
    dados.produtos = [
      {
        id: 'bolo-confeitado',
        nome: 'Bolo',
        tipo: 'opcoes',
        opcoes: [
          { value: 'g', label: 'Grande', preco: 200 },
          { value: 'p', label: 'Pequeno', preco: 80 },
          { value: 'm', label: 'Médio', preco: 120 },
        ],
      },
    ];
    await renderizarSite(<Home />, { dados });
    const selo = document.querySelector('.hero-badge-top');
    expect(selo).toHaveTextContent('a partir de R$80,00');
    expect(selo).toHaveTextContent('Pequeno');
  });
});
