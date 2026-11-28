import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PreviaWhatsApp from './PreviaWhatsApp.jsx';

describe('PreviaWhatsApp', () => {
  it('desenha cada tipo de linha da mensagem', () => {
    const { container } = render(
      <PreviaWhatsApp
        hora="14:05"
        linhas={[
          { texto: '*FORMULARIO*' },
          { texto: '' },
          { rotulo: 'Nome', valor: 'Ana' },
          { rotulo: 'CPF', valor: null },
          { texto: '   Massa: Ninho', suave: true },
          { texto: '(nenhum item)', vazio: true },
          { rotulo: 'Observações', valor: '', opcional: true },
          { texto: 'nota: 5 * 2' },
        ]}
      />
    );
    const bolha = container.querySelector('.wa-bubble');
    expect(bolha.querySelector('strong')).toHaveTextContent('FORMULARIO');
    expect(bolha.querySelectorAll('br')).toHaveLength(1);
    expect(bolha).toHaveTextContent('Nome: Ana');
    expect(screen.getByLabelText('a preencher')).toBeInTheDocument();
    expect(bolha.querySelector('.is-soft')).toHaveTextContent('Massa: Ninho');
    expect(bolha.querySelector('.is-empty')).toHaveTextContent('(nenhum item)');
    expect(bolha).not.toHaveTextContent('Observações');
    expect(bolha).toHaveTextContent('nota: 5 * 2'); // asterisco sozinho não vira negrito
    expect(bolha).toHaveTextContent('14:05');
  });
});
