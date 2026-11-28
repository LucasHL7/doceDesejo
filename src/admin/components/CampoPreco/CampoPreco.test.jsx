import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CampoPreco from './CampoPreco.jsx';

function Cena(props) {
  const [valor, setValor] = useState('');
  return <CampoPreco valor={valor} onChange={setValor} aria-label="Preço" {...props} />;
}

describe('CampoPreco', () => {
  it('os números entram pelos centavos, como em maquininha', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    const campo = screen.getByRole('textbox', { name: 'Preço' });

    await user.type(campo, '1');
    expect(campo).toHaveValue('0,01');
    await user.type(campo, '7');
    expect(campo).toHaveValue('0,17');
    await user.type(campo, '0');
    expect(campo).toHaveValue('1,70');
    await user.type(campo, '000');
    expect(campo).toHaveValue('1.700,00');
  });

  it('ignora letras e apagar tudo deixa vazio', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    const campo = screen.getByRole('textbox', { name: 'Preço' });
    await user.type(campo, 'a5b');
    expect(campo).toHaveValue('0,05');
    await user.clear(campo);
    expect(campo).toHaveValue('');
  });

  it('mostra o R$ e repassa atributos para o input', () => {
    render(<Cena disabled />);
    expect(screen.getByText('R$')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Preço' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Preço' })).toHaveAttribute('inputmode', 'numeric');
  });
});
