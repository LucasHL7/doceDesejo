import { useState } from 'react';
import { formasPagamento, formatarPreco, WHATSAPP_NUMERO } from '../../data/produtos.js';
import { descreverEscolhas, rotuloQuantidade } from '../../data/cardapio.js';
import { useSacola } from '../../context/SacolaContext.jsx';
import Icon from '../Icon/Icon.jsx';
import './ContactForm.css';

const ACRESCIMO_CREDITO = 0.05;

const formatarCPF = (texto) =>
  texto
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const formatarTelefone = (texto) =>
  texto
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1)$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

const formInicial = {
  nome: '',
  cpf: '',
  numero: '',
  data: '',
  hora: '',
  formaPagamento: formasPagamento[0].value,
  observacoes: '',
};

export default function ContactForm() {
  const { linhas, total, abrir } = useSacola();
  const [form, setForm] = useState(formInicial);
  const [erro, setErro] = useState('');

  const set = (campo) => (valor) => {
    setErro('');
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const credito = form.formaPagamento === 'credito';
  const totalFinal = credito ? total * (1 + ACRESCIMO_CREDITO) : total;

  const enviar = (e) => {
    e.preventDefault();

    const nome = form.nome.trim();
    const telefone = form.numero.trim();
    const cpf = form.cpf.trim();
    const observacoes = form.observacoes.trim();

    if (linhas.length === 0) {
      setErro('Adicione pelo menos um produto do cardápio à sacola.');
      document.querySelector('#product-list')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!nome || !telefone || !cpf || !form.data || !form.hora) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    const codigoConfirmacao = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dataFormatada = form.data.split('-').reverse().join('/');
    const pagamento = formasPagamento.find((f) => f.value === form.formaPagamento)?.label;

    const itens = linhas.flatMap((l) => {
      const escolhas = descreverEscolhas(l.produto, l);
      return [
        `• *${rotuloQuantidade(l.produto, l.qtd)} ${l.produto.nome}* — ${formatarPreco(l.total)}`,
        ...(escolhas.length ? [`   ${escolhas.join(' · ')}`] : []),
      ];
    });

    const mensagem = [
      '*FORMULARIO DE ORÇAMENTO*',
      '',
      `*Nome*: ${nome}`,
      `*Telefone*: ${telefone}`,
      `*CPF*: ${cpf}`,
      `*Data*: ${dataFormatada}`,
      `*Hora*: ${form.hora}`,
      '',
      '*Pedido*:',
      ...itens,
      '',
      `*Observações*: ${observacoes}`,
      `*Forma de Pagamento*: ${pagamento}`,
      credito ? `*Acréscimo crédito (5%)*: ${formatarPreco(total * ACRESCIMO_CREDITO)}` : null,
      `*Valor Total*: ${formatarPreco(totalFinal)}`,
      `*Código de Confirmação*: ${codigoConfirmacao}`,
    ]
      .filter((l) => l !== null)
      .join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank')?.focus();
  };

  return (
    <section id="contact" className="contact">
      <h2>Formulário para orçamento</h2>
      <form id="pedidoForm" onSubmit={enviar} className="contact-form-container" noValidate>
        {/* Resumo da sacola */}
        <div className="order-summary">
          <div className="order-summary-head">
            <h3>
              <Icon name="shopping_bag" /> Seu pedido
            </h3>
            {linhas.length > 0 && (
              <button type="button" className="order-summary-edit" onClick={abrir}>
                Editar
              </button>
            )}
          </div>

          {linhas.length === 0 ? (
            <p className="order-summary-empty">
              Sua sacola está vazia.{' '}
              <a href="#product-list">Escolha os produtos no cardápio</a> e volte aqui.
            </p>
          ) : (
            <>
              <ul className="order-summary-list">
                {linhas.map((l) => (
                  <li key={l.id}>
                    <div>
                      <strong>
                        {rotuloQuantidade(l.produto, l.qtd)} {l.produto.nome}
                      </strong>
                      <span>{descreverEscolhas(l.produto, l).join(' · ')}</span>
                    </div>
                    <span className="order-summary-price">{formatarPreco(l.total)}</span>
                  </li>
                ))}
              </ul>
              {credito && (
                <p className="order-summary-row">
                  <span>Acréscimo do crédito (5%)</span>
                  <span>{formatarPreco(total * ACRESCIMO_CREDITO)}</span>
                </p>
              )}
              <p className="order-summary-total">
                <span>Total estimado</span>
                <strong>{formatarPreco(totalFinal)}</strong>
              </p>
            </>
          )}
        </div>

        <label htmlFor="nome">Nome:</label>
        <input type="text" id="nome" required value={form.nome} onChange={(e) => set('nome')(e.target.value)} />

        <label htmlFor="cpf">CPF:</label>
        <input
          type="text"
          id="cpf"
          required
          maxLength={14}
          inputMode="numeric"
          title="Digite um CPF válido no formato 000.000.000-00"
          value={form.cpf}
          onChange={(e) => set('cpf')(formatarCPF(e.target.value))}
        />

        <label htmlFor="numero">Telefone:</label>
        <input
          type="tel"
          id="numero"
          required
          maxLength={14}
          title="Digite um telefone válido no formato (DDD)0000-0000"
          value={form.numero}
          onChange={(e) => set('numero')(formatarTelefone(e.target.value))}
        />

        <label htmlFor="data">Data:</label>
        <input type="date" id="data" required value={form.data} onChange={(e) => set('data')(e.target.value)} />

        <label htmlFor="hora">Hora:</label>
        <input type="time" id="hora" required value={form.hora} onChange={(e) => set('hora')(e.target.value)} />

        <label htmlFor="forma-pagamento">Forma de Pagamento:</label>
        <select
          id="forma-pagamento"
          value={form.formaPagamento}
          onChange={(e) => set('formaPagamento')(e.target.value)}
        >
          {formasPagamento.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label htmlFor="observacoes">Digite aqui Observações e outros detalhes:</label>
        <textarea
          id="observacoes"
          rows={4}
          className="obs"
          value={form.observacoes}
          onChange={(e) => set('observacoes')(e.target.value)}
        />

        <p><strong>ENVIAR A IMAGEM DE REFERÊNCIA JUNTO COM O FORMULÁRIO!</strong></p>
        <p><strong>ESSE É UM FORMULÁRIO DE ORÇAMENTO, AGUARDE O SEU PEDIDO SER CONFIRMADO.</strong></p>

        {erro && <p className="form-error" role="alert">{erro}</p>}

        <button type="submit">Enviar pelo WhatsApp</button>
      </form>
    </section>
  );
}
