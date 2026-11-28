import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmar } from './Confirmar.jsx';

let resposta;
function Cena({ opcoes }) {
  const [confirmar, dialogo] = useConfirmar();
  return (
    <>
      {dialogo}
      <button type="button" onClick={async () => resposta(await confirmar(opcoes))}>
        perguntar
      </button>
    </>
  );
}

describe('useConfirmar', () => {
  it('usa os textos padrão e botão sem cor de perigo quando nada é informado', async () => {
    const user = userEvent.setup();
    resposta = vi.fn();
    render(<Cena opcoes={{ titulo: 'Tem certeza?' }} />);
    await user.click(screen.getByRole('button', { name: 'perguntar' }));

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveTextContent('Tem certeza?');
    expect(dialogo.querySelector('p')).toBeNull(); // sem texto extra
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    const confirmar = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmar).not.toHaveClass('adm-btn-perigo');

    await user.click(confirmar);
    expect(resposta).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('textos e cor de perigo personalizados', async () => {
    const user = userEvent.setup();
    resposta = vi.fn();
    render(
      <Cena opcoes={{ titulo: 'Apagar?', texto: 'Não volta.', botao: 'Apagar', cancelar: 'Deixa', perigo: true }} />
    );
    await user.click(screen.getByRole('button', { name: 'perguntar' }));
    expect(screen.getByText('Não volta.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar' })).toHaveClass('adm-btn-perigo');
    await user.click(screen.getByRole('button', { name: 'Deixa' }));
    expect(resposta).toHaveBeenCalledWith(false);
  });
});
