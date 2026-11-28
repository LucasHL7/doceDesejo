import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { comprimirImagem } from '../../imagem.js';
import CampoImagem from './CampoImagem.jsx';

vi.mock('../../imagem.js', () => ({ comprimirImagem: vi.fn() }));

const input = (container) => container.querySelector('input[type="file"]');
const arquivo = () => new File(['x'], 'foto.png', { type: 'image/png' });

let onChange;
beforeEach(() => {
  vi.clearAllMocks();
  onChange = vi.fn();
});

describe('CampoImagem', () => {
  it('sem foto, convida a escolher; com foto, mostra e oferece trocar', () => {
    const { rerender } = render(<CampoImagem rotulo="Capa" onChange={onChange} />);
    expect(screen.getByText('Capa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escolher foto/ })).toHaveStyle({ aspectRatio: '4 / 3' });

    rerender(<CampoImagem valor="x.webp" onChange={onChange} formato="1 / 1" contain />);
    const botao = screen.getByRole('button', { name: /Trocar foto/ });
    expect(botao).toHaveClass('is-contain');
    expect(botao.querySelector('img')).toHaveAttribute('src', 'x.webp');
  });

  it('o botão abre o seletor de arquivos', async () => {
    const user = userEvent.setup();
    const { container } = render(<CampoImagem onChange={onChange} />);
    const clique = vi.spyOn(input(container), 'click');
    await user.click(screen.getByRole('button'));
    expect(clique).toHaveBeenCalled();
  });

  it('comprime a foto escolhida e devolve o data URL', async () => {
    const user = userEvent.setup();
    let terminar;
    comprimirImagem.mockReturnValue(new Promise((r) => (terminar = r)));
    const { container } = render(<CampoImagem onChange={onChange} maxLado={800} />);

    const f = arquivo();
    await user.upload(input(container), f);
    expect(comprimirImagem).toHaveBeenCalledWith(f, { maxLado: 800 });
    expect(screen.getByRole('button', { name: /Preparando…/ })).toBeDisabled();

    terminar('data:image/webp;base64,AAA');
    await screen.findByRole('button', { name: /Escolher foto/ });
    expect(onChange).toHaveBeenCalledWith('data:image/webp;base64,AAA');
  });

  it('sem maxLado usa o padrão da compressão; "Preparando…" também ao trocar', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockReturnValue(new Promise(() => {}));
    const { container } = render(<CampoImagem valor="x.webp" onChange={onChange} />);
    await user.upload(input(container), arquivo());
    expect(comprimirImagem).toHaveBeenCalledWith(expect.any(File), undefined);
    expect(screen.getByRole('button', { name: /Preparando…/ })).toBeInTheDocument();
  });

  it('mostra o erro da compressão', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockRejectedValue(new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).'));
    const { container } = render(<CampoImagem onChange={onChange} />);
    await user.upload(input(container), arquivo());
    expect(await screen.findByRole('alert')).toHaveTextContent('Escolha um arquivo de imagem');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('cancelar a escolha não faz nada', () => {
    const { container } = render(<CampoImagem onChange={onChange} />);
    input(container).dispatchEvent(new Event('change', { bubbles: true }));
    expect(comprimirImagem).not.toHaveBeenCalled();
  });
});
