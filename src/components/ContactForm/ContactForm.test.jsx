import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSacola } from '../../context/SacolaContext.jsx';
import { renderizarSite, sacolaSalva } from '../../test/renderizar.jsx';
import ContactForm from './ContactForm.jsx';

vi.mock('../../firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));

let sacola;
function Espiao() {
  sacola = useSacola();
  return null;
}

const renderizar = () =>
  renderizarSite(
    <>
      <Espiao />
      <ContactForm />
    </>
  );

const enviar = () => screen.getByRole('button', { name: /Enviar pelo WhatsApp/ });
const formulario = () => document.querySelector('form.quote-form');

async function preencher(user, { data = '2099-12-31' } = {}) {
  await user.type(screen.getByLabelText('Nome completo'), 'Ana Souza');
  await user.type(screen.getByLabelText('WhatsApp'), '86999998888');
  await user.type(screen.getByLabelText('CPF'), '12345678901');
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: data } });
  fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '15:30' } });
}

let abrirJanela;
beforeEach(() => {
  abrirJanela = vi.spyOn(window, 'open').mockReturnValue({ focus: vi.fn() });
});

describe('ContactForm', () => {
  it('com a sacola vazia, não envia e avisa', async () => {
    const user = userEvent.setup();
    await renderizar();
    expect(screen.getByText('Sua sacola está vazia.')).toBeInTheDocument();

    await user.click(enviar());
    expect(screen.getByRole('alert')).toHaveTextContent('Sua sacola está vazia.');
    expect(within(screen.getByRole('alert')).getByRole('link', { name: 'Ir para o cardápio' })).toBeInTheDocument();
    expect(abrirJanela).not.toHaveBeenCalled();
  });

  it('mostra os itens da sacola e o botão de editar abre a sacola', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 2, campos: {} }]);
    await renderizar();

    const pedido = document.querySelector('.quote-order');
    expect(pedido).toHaveTextContent('2x Bento Cake');
    expect(pedido).toHaveTextContent('R$80,00');

    await user.click(screen.getByRole('button', { name: /Editar sacola/ }));
    expect(sacola.aberta).toBe(true);
  });

  it('valida os campos obrigatórios e leva o foco ao primeiro com erro', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();

    await user.click(enviar());
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados.');
    expect(screen.getByText('Digite seu nome.')).toBeInTheDocument();
    expect(screen.getByText('Digite o telefone com DDD.')).toBeInTheDocument();
    expect(screen.getByText('Digite os 11 números do CPF.')).toBeInTheDocument();
    expect(screen.getByText('Escolha a data.')).toBeInTheDocument();
    expect(screen.getByText('Escolha o horário.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome completo')).toHaveFocus();
    expect(abrirJanela).not.toHaveBeenCalled();

    // corrigir um campo apaga o erro dele e o aviso geral
    await user.type(screen.getByLabelText('Nome completo'), 'A');
    expect(screen.queryByText('Digite seu nome.')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Digite o telefone com DDD.')).toBeInTheDocument();
  });

  it('não aceita data no passado', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();
    await preencher(user, { data: '2000-01-01' });
    await user.click(enviar());
    expect(screen.getByText('A data não pode estar no passado.')).toBeInTheDocument();
    expect(screen.getByLabelText('Data')).toHaveFocus();
  });

  it('formata telefone (fixo e celular) e CPF enquanto digita', async () => {
    const user = userEvent.setup();
    await renderizar();
    const tel = screen.getByLabelText('WhatsApp');

    await user.type(tel, '8');
    expect(tel).toHaveValue('(8');
    await user.type(tel, '6');
    expect(tel).toHaveValue('(86');
    await user.type(tel, '3222');
    expect(tel).toHaveValue('(86) 3222');
    await user.type(tel, '1111');
    expect(tel).toHaveValue('(86) 3222-1111');
    await user.type(tel, '9');
    expect(tel).toHaveValue('(86) 32221-1119');
    await user.clear(tel);
    expect(tel).toHaveValue('');

    const cpf = screen.getByLabelText('CPF');
    await user.type(cpf, '123456789012345');
    expect(cpf).toHaveValue('123.456.789-01');
  });

  it('envia pelo WhatsApp com a mensagem completa', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 2, campos: {} }]);
    await renderizar();
    await preencher(user);
    await user.type(screen.getByLabelText('Observações'), 'Tema: unicórnio');
    await user.click(enviar());

    expect(abrirJanela).toHaveBeenCalledOnce();
    const [url, alvo] = abrirJanela.mock.calls[0];
    expect(alvo).toBe('_blank');
    expect(url).toMatch(/^https:\/\/wa\.me\/5586995811231\?text=/);
    const texto = decodeURIComponent(url.split('?text=')[1]);
    expect(texto).toContain('*Nome*: Ana Souza');
    expect(texto).toContain('*Telefone*: (86) 99999-8888');
    expect(texto).toContain('*CPF*: 123.456.789-01');
    expect(texto).toContain('*Data*: 31/12/2099');
    expect(texto).toContain('*Hora*: 15:30');
    expect(texto).toContain('2x Bento Cake* — R$80,00');
    expect(texto).toContain('*Observações*: Tema: unicórnio');
    expect(texto).toContain('*Forma de Pagamento*: Pix');
    expect(texto).toContain('*Valor Total*: R$80,00');
    expect(texto).toMatch(/\*Código de Confirmação\*: [A-Z0-9]{5}/);
  });

  it('no crédito, soma 5% no total e na mensagem', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();
    await user.click(screen.getByRole('radio', { name: /Crédito/ }));

    expect(screen.getByText('com 5% do crédito')).toBeInTheDocument();
    expect(document.querySelector('.quote-order-total strong')).toHaveTextContent('R$42,00');

    await preencher(user);
    await user.click(enviar());
    const texto = decodeURIComponent(abrirJanela.mock.calls[0][0].split('?text=')[1]);
    expect(texto).toContain('*Forma de Pagamento*: Cartão de Crédito');
    expect(texto).toContain('*Acréscimo crédito (5%)*: R$2,00');
    expect(texto).toContain('*Valor Total*: R$42,00');
  });

  it('prévia ao vivo mostra o que já foi preenchido', async () => {
    const user = userEvent.setup();
    await renderizar();
    const previa = screen.getByRole('complementary', { name: 'Prévia da mensagem' });
    expect(within(previa).getByText('(nenhum item na sacola)')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nome completo'), 'Ana');
    expect(previa).toHaveTextContent('Nome: Ana');
  });

  it('janela de prévia: abre, volta, fecha no fundo e envia por ela', async () => {
    const user = userEvent.setup();
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();
    const dialog = document.querySelector('dialog.quote-dialog');

    await user.click(screen.getByRole('button', { name: /Ver mensagem/ }));
    expect(dialog).toHaveAttribute('open');
    await user.click(within(dialog).getByRole('button', { name: 'Voltar' }));
    expect(dialog).not.toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: /Ver mensagem/ }));
    fireEvent.click(within(dialog).getByRole('img'));
    expect(dialog).toHaveAttribute('open');
    fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute('open');

    // enviar pela prévia com campos faltando fecha a prévia e mostra os erros
    await user.click(screen.getByRole('button', { name: /Ver mensagem/ }));
    await user.click(within(dialog).getByRole('button', { name: /Enviar/ }));
    expect(dialog).not.toHaveAttribute('open');
    expect(screen.getByText('Digite seu nome.')).toBeInTheDocument();

    await preencher(user);
    await user.click(screen.getByRole('button', { name: /Ver mensagem/ }));
    await user.click(within(dialog).getByRole('button', { name: /Enviar/ }));
    expect(abrirJanela).toHaveBeenCalledOnce();
  });

  it('não quebra se o navegador bloquear a nova janela', async () => {
    const user = userEvent.setup();
    abrirJanela.mockReturnValue(null);
    sacolaSalva([{ id: 'a', produtoId: 'bento-cake', qtd: 1, campos: {} }]);
    await renderizar();
    await preencher(user);
    act(() => {
      fireEvent.submit(formulario());
    });
    expect(abrirJanela).toHaveBeenCalledOnce();
  });
});
