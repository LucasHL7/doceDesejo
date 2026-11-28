import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Icon from './Icon.jsx';

describe('Icon', () => {
  it('desenha o SVG escondido de leitores de tela, com a classe extra', () => {
    const { container } = render(<Icon name="cake" className="grande" />);
    const span = container.firstChild;
    expect(span).toHaveClass('icon', 'grande');
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span.querySelector('svg')).not.toBeNull();
  });

  it('a versão preenchida é outro desenho', () => {
    const vazio = render(<Icon name="cake" />).container.innerHTML;
    const cheio = render(<Icon name="cake" filled />).container.innerHTML;
    expect(cheio).not.toBe(vazio);
  });

  it('ícone não cadastrado não desenha nada e avisa no desenvolvimento', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name="nao-existe" />);
    expect(container).toBeEmptyDOMElement();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('nao-existe'));
    aviso.mockRestore();
  });
});
