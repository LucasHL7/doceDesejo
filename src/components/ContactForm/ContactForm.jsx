import { useMemo, useRef, useState } from 'react';
import { formasPagamento, formatarPreco, WHATSAPP_NUMERO } from '../../data/produtos.js';
import { descreverEscolhas, rotuloQuantidade } from '../../data/cardapio.js';
import { useSacola } from '../../context/SacolaContext.jsx';
import Icon from '../Icon/Icon.jsx';
import PreviaWhatsApp from '../PreviaWhatsApp/PreviaWhatsApp.jsx';
import { ACRESCIMO_CREDITO, gerarCodigo, montarLinhas, montarTexto } from './mensagem.js';
import './ContactForm.css';

const soDigitos = (t) => t.replace(/\D/g, '');

const formatarCPF = (texto) =>
  soDigitos(texto)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

// (86) 9999-8888 para fixo e (86) 99999-8888 para celular.
function formatarTelefone(texto) {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

const iconePagamento = {
  pix: 'qr_code_2',
  dinheiro: 'payments',
  debito: 'credit_card',
  credito: 'credit_card',
};

const hojeISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const formInicial = {
  nome: '',
  numero: '',
  cpf: '',
  data: '',
  hora: '',
  formaPagamento: 'pix',
  observacoes: '',
};

function validar(form) {
  const erros = {};
  if (!form.nome.trim()) erros.nome = 'Digite seu nome.';
  const tel = soDigitos(form.numero).length;
  if (tel !== 10 && tel !== 11) erros.numero = 'Digite o telefone com DDD.';
  if (soDigitos(form.cpf).length !== 11) erros.cpf = 'Digite os 11 números do CPF.';
  if (!form.data) erros.data = 'Escolha a data.';
  else if (form.data < hojeISO()) erros.data = 'A data não pode estar no passado.';
  if (!form.hora) erros.hora = 'Escolha o horário.';
  return erros;
}

export default function ContactForm() {
  const { linhas, total, abrir } = useSacola();
  const [form, setForm] = useState(formInicial);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState('');
  const [codigo] = useState(gerarCodigo);
  const formRef = useRef(null);
  const dialogRef = useRef(null);

  const credito = form.formaPagamento === 'credito';
  const totalFinal = credito ? total * (1 + ACRESCIMO_CREDITO) : total;
  const dadosMensagem = { form, linhas, total, codigo };
  const linhasPrevia = montarLinhas(dadosMensagem);
  const horaAgora = useMemo(
    () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    []
  );

  const set = (campo) => (valor) => {
    setAviso('');
    setErros((e) => ({ ...e, [campo]: undefined }));
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const enviar = (e) => {
    e?.preventDefault();
    if (linhas.length === 0) {
      setAviso('Sua sacola está vazia. Escolha os produtos no cardápio antes de enviar.');
      return;
    }
    const encontrados = validar(form);
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      setAviso('Confira os campos destacados.');
      dialogRef.current?.close();
      // leva o foco ao primeiro campo com problema
      const primeiro = ['nome', 'numero', 'cpf', 'data', 'hora'].find((c) => encontrados[c]);
      formRef.current?.querySelector(`#${primeiro}`)?.focus();
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(montarTexto(dadosMensagem))}`;
    window.open(url, '_blank')?.focus();
  };

  const campo = (id, rotulo, { formatar, ...props } = {}) => (
    <div className={`quote-field ${erros[id] ? 'has-error' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        value={form[id]}
        aria-invalid={erros[id] ? 'true' : undefined}
        aria-describedby={erros[id] ? `${id}-erro` : undefined}
        {...props}
        onChange={(e) => set(id)(formatar ? formatar(e.target.value) : e.target.value)}
      />
      {erros[id] && (
        <span id={`${id}-erro`} className="quote-field-error">
          {erros[id]}
        </span>
      )}
    </div>
  );

  return (
    <section id="contact" className="quote" aria-labelledby="quote-title">
      <div className="quote-inner">
        <header className="quote-head">
          <span className="quote-eyebrow">Orçamento</span>
          <h2 id="quote-title" className="quote-title">
            Finalize seu <span className="quote-script">pedido</span>
          </h2>
          <p className="quote-lead">
            Preencha seus dados e veja, ao lado, a mensagem que vai chegar no nosso WhatsApp.
          </p>
        </header>

        <div className="quote-grid">
          <form ref={formRef} className="quote-form" onSubmit={enviar} noValidate>
            {/* 1. Pedido */}
            <fieldset className="quote-step">
              <legend>
                <span className="quote-step-num">1</span> Seu pedido
              </legend>
              {linhas.length === 0 ? (
                <div className="quote-empty">
                  <Icon name="shopping_bag" />
                  <p>Sua sacola está vazia.</p>
                  <a href="#product-list" className="quote-empty-link">Escolher no cardápio</a>
                </div>
              ) : (
                <div className="quote-order">
                  <ul>
                    {linhas.map((l) => (
                      <li key={l.id}>
                        <div>
                          <strong>
                            {rotuloQuantidade(l.produto, l.qtd)} {l.produto.nome}
                          </strong>
                          <span>{descreverEscolhas(l.produto, l).join(' · ')}</span>
                        </div>
                        <span className="quote-order-price">{formatarPreco(l.total)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="quote-order-foot">
                    <button type="button" className="quote-edit" onClick={abrir}>
                      <Icon name="edit" /> Editar sacola
                    </button>
                    <div className="quote-order-total">
                      {credito && <small>com 5% do crédito</small>}
                      <strong>{formatarPreco(totalFinal)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            {/* 2. Dados */}
            <fieldset className="quote-step">
              <legend>
                <span className="quote-step-num">2</span> Seus dados
              </legend>
              {campo('nome', 'Nome completo', { type: 'text', autoComplete: 'name', placeholder: 'Como podemos te chamar?' })}
              <div className="quote-row">
                {campo('numero', 'WhatsApp', {
                  type: 'tel',
                  autoComplete: 'tel-national',
                  inputMode: 'numeric',
                  placeholder: '(86) 99999-8888',
                  formatar: formatarTelefone,
                })}
                {campo('cpf', 'CPF', {
                  type: 'text',
                  inputMode: 'numeric',
                  placeholder: '000.000.000-00',
                  formatar: formatarCPF,
                })}
              </div>
            </fieldset>

            {/* 3. Quando */}
            <fieldset className="quote-step">
              <legend>
                <span className="quote-step-num">3</span> Para quando?
              </legend>
              <div className="quote-row">
                {campo('data', 'Data', { type: 'date', min: hojeISO() })}
                {campo('hora', 'Horário', { type: 'time' })}
              </div>
            </fieldset>

            {/* 4. Pagamento */}
            <fieldset className="quote-step">
              <legend>
                <span className="quote-step-num">4</span> Forma de pagamento
              </legend>
              <div className="quote-pay">
                {formasPagamento.map((f) => (
                  <label key={f.value} className={`quote-pay-option ${form.formaPagamento === f.value ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="formaPagamento"
                      value={f.value}
                      checked={form.formaPagamento === f.value}
                      onChange={() => set('formaPagamento')(f.value)}
                    />
                    <Icon name={iconePagamento[f.value]} />
                    <span>{f.label.replace('Cartão de ', '')}</span>
                    {f.value === 'credito' && <small>+5%</small>}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 5. Observações */}
            <fieldset className="quote-step">
              <legend>
                <span className="quote-step-num">5</span> Observações <small>(opcional)</small>
              </legend>
              <div className="quote-field">
                <label htmlFor="observacoes" className="sr-only">Observações</label>
                <textarea
                  id="observacoes"
                  rows={3}
                  placeholder="Tema da festa, frase no bolo, restrições..."
                  value={form.observacoes}
                  onChange={(e) => set('observacoes')(e.target.value)}
                />
              </div>
            </fieldset>

            <div className="quote-notes">
              <p>
                <Icon name="image" />
                <span>
                  <strong>Tem foto de referência?</strong> Depois de enviar, mande a imagem na mesma
                  conversa do WhatsApp.
                </span>
              </p>
              <p>
                <Icon name="info" />
                <span>Este é um orçamento: aguarde a confirmação do seu pedido.</span>
              </p>
            </div>

            {aviso && (
              <p className="quote-alert" role="alert">
                {aviso}{' '}
                {linhas.length === 0 && <a href="#product-list">Ir para o cardápio</a>}
              </p>
            )}

            <div className="quote-actions">
              <button type="button" className="quote-preview-btn" onClick={() => dialogRef.current?.showModal()}>
                <Icon name="visibility" /> Ver mensagem
              </button>
              <button type="submit" className="quote-submit">
                <Icon name="send" filled /> Enviar pelo WhatsApp
              </button>
            </div>
          </form>

          <aside className="quote-preview" aria-label="Prévia da mensagem">
            <PreviaWhatsApp linhas={linhasPrevia} hora={horaAgora} />
            <p className="quote-preview-caption">É assim que seu pedido chega até nós</p>
          </aside>
        </div>
      </div>

      {/* Prévia no celular */}
      <dialog
        ref={dialogRef}
        className="quote-dialog"
        aria-label="Prévia da mensagem do WhatsApp"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
      >
        <PreviaWhatsApp linhas={linhasPrevia} hora={horaAgora} />
        <div className="quote-dialog-actions">
          <button type="button" className="quote-preview-btn" onClick={() => dialogRef.current.close()}>
            Voltar
          </button>
          <button type="button" className="quote-submit" onClick={() => enviar()}>
            <Icon name="send" filled /> Enviar
          </button>
        </div>
      </dialog>
    </section>
  );
}
