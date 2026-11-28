import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { carregarConteudo } from './firebase/conteudo.js';
import App from './App.jsx';

vi.mock('./firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

describe('App', () => {
  it('monta o site inteiro com o conteúdo padrão quando o Firebase falha', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    carregarConteudo.mockRejectedValue(new Error('offline'));
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Escolher Bento Cake/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Finalize seu pedido/ })).toBeInTheDocument();
    expect(document.querySelector('footer.site-footer')).toBeInTheDocument();
  });
});
