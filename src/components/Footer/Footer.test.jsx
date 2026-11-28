import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Footer from './Footer.jsx';

const matchMediaOriginal = window.matchMedia;
afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});

describe('Footer', () => {
  it('mostra o telefone formatado e links externos seguros', () => {
    render(<Footer />);
    expect(screen.getByText('(86) 99581-1231')).toBeInTheDocument();
    for (const link of screen.getAllByRole('link').filter((l) => l.target === '_blank')) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5586995811231');
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
  });

  it('"Voltar ao topo" respeita quem prefere menos movimento', async () => {
    const user = userEvent.setup();
    render(<Footer />);
    const botao = screen.getByRole('button', { name: /Voltar ao topo/ });

    window.matchMedia = vi.fn(() => ({ matches: false }));
    await user.click(botao);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

    window.matchMedia = vi.fn(() => ({ matches: true }));
    await user.click(botao);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });
});
