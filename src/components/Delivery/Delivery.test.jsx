import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { conteudoPadrao, renderizarSite } from '../../test/renderizar.jsx';
import Delivery from './Delivery.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

const fotos = () => [...document.querySelectorAll('.delivery-photo')].map((i) => i.getAttribute('src'));

describe('Delivery', () => {
  it('tem o link do catálogo abrindo em nova aba', async () => {
    await renderizarSite(<Delivery />);
    const link = screen.getByRole('link', { name: /Abrir catálogo de delivery/ });
    expect(link).toHaveAttribute('href', 'https://app.cardapioweb.com/doce_desejo_gourmet');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sem fotos enquanto carrega', async () => {
    await renderizarSite(<Delivery />, { dados: 'pendente', esperar: false });
    expect(fotos()).toEqual([]);
  });

  it('mostra as três fotos editáveis, pulando as que não têm imagem', async () => {
    const dados = conteudoPadrao();
    dados.imagensSite = {
      'delivery-1': { src: 'um.webp' },
      'delivery-2': { src: '' },
      'delivery-3': { src: 'tres.webp' },
    };
    await renderizarSite(<Delivery />, { dados });
    expect(fotos()).toEqual(['um.webp', 'tres.webp']);
  });
});
