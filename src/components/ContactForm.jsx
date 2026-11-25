import { useState } from 'react';
import {
  bolosConfeitados,
  brownies,
  bemCasados,
  salgadinhos,
  tiposFatia,
  massas,
  recheiosBolo,
  recheiosFatia,
  sabores,
  produtosFormulario,
  formasPagamento,
  precoUnitarioBrigadeiro,
  formatarPreco,
  PRECO_BENTO_CAKE,
  LIMITE_SABORES,
  WHATSAPP_NUMERO,
} from '../data/produtos.js';

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

const bloquearE = (e) => {
  if (e.key === 'e' || e.key === 'E') e.preventDefault();
};

const formatarTotal = (valor) => valor.toFixed(2).replace('.', ',');

// Valores iniciais de cada produto (equivalem à primeira opção de cada select do site antigo).
const detalhesIniciais = {
  bolo: {
    tipoBolo: `Confeitado-${bolosConfeitados[0].fatias}`,
    massa: massas[0].value,
    recheio: recheiosBolo[0].value,
    recheio2: '',
  },
  fatias: {
    tipoFatia: tiposFatia[0].valor,
    quantidade: '',
    massa: massas[0].value,
    recheio: recheiosFatia[0].value,
  },
  brigadeiro: { quantidade: '', corCaixeta: '' },
  brownie: { quantidade: brownies[0].qtd },
  'bem-casado': { quantidade: bemCasados[0].qtd },
  salgadinho: { quantidade: salgadinhos[0].qtd },
  'bento-cake': {},
};

const formInicial = {
  nome: '',
  cpf: '',
  numero: '',
  data: '',
  hora: '',
  produto: '',
  formaPagamento: formasPagamento[0].value,
  observacoes: '',
};

function Select({ id, label, value, onChange, options }) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </>
  );
}

function SaboresCheckbox({ produto, selecionados, onChange }) {
  const lista = sabores[produto];
  if (!lista) return null;

  const nomes = { brigadeiro: 'Brigadeiro', brownie: 'Brownie', 'bem-casado': 'Bem Casado' };

  const alternar = (valor) => {
    if (selecionados.includes(valor)) {
      onChange(selecionados.filter((v) => v !== valor));
    } else if (selecionados.length >= LIMITE_SABORES) {
      alert(`Você pode selecionar no máximo ${LIMITE_SABORES} sabores.`);
    } else {
      onChange([...selecionados, valor]);
    }
  };

  return (
    <div className="form-group">
      <label>Escolha até {LIMITE_SABORES} sabores de {nomes[produto]}:</label>
      {lista.map((s) => {
        const id = `${produto}-${s.value}`;
        return (
          <div key={s.value}>
            <input
              type="checkbox"
              id={id}
              value={s.value}
              checked={selecionados.includes(s.value)}
              onChange={() => alternar(s.value)}
            />
            <label htmlFor={id}>{s.label}</label>
          </div>
        );
      })}
    </div>
  );
}

function calcularTotal(produto, d) {
  switch (produto) {
    case 'bolo':
      return bolosConfeitados.find((b) => `Confeitado-${b.fatias}` === d.tipoBolo)?.preco ?? 0;
    case 'fatias':
      return Number(d.tipoFatia) * Number(d.quantidade);
    case 'brigadeiro': {
      const qtd = Number(d.quantidade);
      return precoUnitarioBrigadeiro(qtd) * qtd;
    }
    case 'brownie':
      return brownies.find((b) => b.qtd === Number(d.quantidade))?.preco ?? 0;
    case 'bem-casado':
      return bemCasados.find((b) => b.qtd === Number(d.quantidade))?.preco ?? 0;
    case 'salgadinho':
      return salgadinhos.find((s) => s.qtd === Number(d.quantidade))?.preco ?? 0;
    case 'bento-cake':
      return PRECO_BENTO_CAKE;
    default:
      return 0;
  }
}

function linhasDetalhes(produto, d, saboresSelecionados) {
  const listaSabores = saboresSelecionados.join(', ');
  switch (produto) {
    case 'bolo': {
      const linhas = [`*Tipo de Bolo*: ${d.tipoBolo}`, `*Massa*: ${d.massa}`];
      if (d.recheio) linhas.push(`*Recheio*: ${d.recheio}`);
      if (d.recheio2) linhas.push(`*Segundo Recheio*: ${d.recheio2}`);
      return linhas;
    }
    case 'fatias': {
      const tipo = tiposFatia.find((t) => t.valor === Number(d.tipoFatia));
      return [
        `*Tipo de fatia*: ${tipo.nome} - ${formatarPreco(tipo.valor)}`,
        `*Massa*: ${d.massa}`,
        `*Recheio*: ${d.recheio}`,
        `*Quantidade de fatias*: ${Number(d.quantidade)}`,
      ];
    }
    case 'brigadeiro':
      return [
        `*Quantidade*: ${Number(d.quantidade)}`,
        `*Sabores*: ${listaSabores}`,
        `*Cor da Caixeta*: ${d.corCaixeta}`,
      ];
    case 'brownie':
      return [`*Quantidade*: ${d.quantidade}`, `*Sabores*: ${listaSabores}`];
    case 'bem-casado':
      return [`*Recheio*: ${listaSabores}`, `*Quantidade*: ${d.quantidade}`];
    case 'salgadinho':
      return [`*Quantidade*: ${d.quantidade}`];
    case 'bento-cake':
      return ['*Produto*: Bento Cake'];
    default:
      return [];
  }
}

export default function ContactForm() {
  const [form, setForm] = useState(formInicial);
  const [detalhes, setDetalhes] = useState({});
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setDetalhe = (campo) => (valor) => setDetalhes((d) => ({ ...d, [campo]: valor }));

  const trocarProduto = (produto) => {
    setForm((f) => ({ ...f, produto }));
    setDetalhes({ ...(detalhesIniciais[produto] ?? {}) });
    setSaboresSelecionados([]);
  };

  const { produto } = form;

  const enviar = (e) => {
    e.preventDefault();

    const nome = form.nome.trim();
    const telefone = form.numero.trim();
    const cpf = form.cpf.trim();
    const observacoes = form.observacoes.trim();

    if (!nome || !telefone || !cpf || !produto || !form.formaPagamento || !form.data || !form.hora) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const codigoConfirmacao = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dataFormatada = form.data.split('-').reverse().join('/');

    let valorTotal = calcularTotal(produto, detalhes);
    if (form.formaPagamento === 'credito') {
      valorTotal *= 1.05; // Acrescenta 5% ao valor total
    }

    const mensagem = [
      '*FORMULARIO DE ORÇAMENTO*',
      '',
      `*Nome*: ${nome}`,
      `*Telefone*: ${telefone}`,
      `*CPF*: ${cpf}`,
      `*Data*: ${dataFormatada}`,
      `*Hora*: ${form.hora}`,
      `*Produto*: ${produto}`,
      ...linhasDetalhes(produto, detalhes, saboresSelecionados),
      `*Observações*: ${observacoes}`,
      `*Forma de Pagamento*: ${form.formaPagamento}`,
      `*Valor Total*: R$ ${valorTotal.toFixed(2)}`,
      `*Código de Confirmação*: ${codigoConfirmacao}`,
    ].join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank')?.focus();
  };

  return (
    <section id="contact" className="contact">
      <h2>Formulário para orçamento</h2>
      <form id="pedidoForm" onSubmit={enviar} className="contact-form-container">
        <label htmlFor="nome">Nome:</label>
        <input type="text" id="nome" required value={form.nome} onChange={(e) => set('nome')(e.target.value)} />

        <label htmlFor="cpf">CPF:</label>
        <input
          type="text"
          id="cpf"
          required
          maxLength={14}
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

        <label htmlFor="produto">Produto:</label>
        <select id="produto" required value={produto} onChange={(e) => trocarProduto(e.target.value)}>
          <option value="">Selecione um produto</option>
          {produtosFormulario.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {produto && (
          <div id="opcoesAdicionais">
            {produto === 'bolo' && (
              <>
                <Select
                  id="tipo-bolo"
                  label="Tipo de Bolo:"
                  value={detalhes.tipoBolo}
                  onChange={setDetalhe('tipoBolo')}
                  options={bolosConfeitados.map((b) => ({
                    value: `Confeitado-${b.fatias}`,
                    label: `Confeitado (${b.fatias} fatias - ${formatarPreco(b.preco)})`,
                  }))}
                />
                <Select id="massa" label="Massa:" value={detalhes.massa} onChange={setDetalhe('massa')} options={massas} />
                <div id="recheio-container">
                  <Select id="recheio" label="Recheio:" value={detalhes.recheio} onChange={setDetalhe('recheio')} options={recheiosBolo} />
                </div>
                <div id="recheio2-container">
                  <Select
                    id="recheio2"
                    label="Segundo Recheio (opcional):"
                    value={detalhes.recheio2}
                    onChange={setDetalhe('recheio2')}
                    options={[{ value: '', label: 'Nenhum' }, ...recheiosBolo]}
                  />
                </div>
              </>
            )}

            {produto === 'brigadeiro' && (
              <>
                <label htmlFor="brigadeiros-input-value">Quantidade:</label>
                <p>Digite a quantidade de brigadeiros</p>
                <input
                  id="brigadeiros-input-value"
                  type="number"
                  min="10"
                  placeholder="Nenhum"
                  onKeyDown={bloquearE}
                  value={detalhes.quantidade}
                  onChange={(e) => setDetalhe('quantidade')(e.target.value)}
                />
                <label htmlFor="cor-caixeta">Cor da caixeta:</label>
                <input
                  type="text"
                  id="cor-caixeta"
                  placeholder="Ex.: Branco, Rosa Claro, Dourado..."
                  value={detalhes.corCaixeta}
                  onChange={(e) => setDetalhe('corCaixeta')(e.target.value)}
                />
                <p>Total: R$ <span id="total-brigadeiros">{formatarTotal(calcularTotal('brigadeiro', detalhes))}</span></p>
              </>
            )}

            {produto === 'brownie' && (
              <>
                <p><strong>Sabores: Chocolate, Ninho, Dois amores, Doce de Leite.</strong></p>
                <Select
                  id="quantidade-brownie"
                  label="Quantidade:"
                  value={detalhes.quantidade}
                  onChange={setDetalhe('quantidade')}
                  options={brownies.map((b) => ({ value: b.qtd, label: `${b.qtd} unidades - ${formatarPreco(b.preco)}` }))}
                />
              </>
            )}

            {produto === 'bem-casado' && (
              <Select
                id="qtd-bemcasados"
                label="Quantidade:"
                value={detalhes.quantidade}
                onChange={setDetalhe('quantidade')}
                options={bemCasados.map((b) => ({ value: b.qtd, label: `${b.qtd} unidades - ${formatarPreco(b.preco)}` }))}
              />
            )}

            {produto === 'salgadinho' && (
              <>
                <p><strong>Sabores: Coxinha (Frango e Pizza), Bolinhas de queijo, Pastel de queijo.</strong></p>
                <Select
                  id="quantidade-salgadinho"
                  label="Quantidade:"
                  value={detalhes.quantidade}
                  onChange={setDetalhe('quantidade')}
                  options={salgadinhos.map((s) => ({ value: s.qtd, label: `${s.qtd} unidades - ${formatarPreco(s.preco)}` }))}
                />
              </>
            )}

            {produto === 'bento-cake' && (
              <div id="bento-cake-message" style={{ color: 'red', fontWeight: 'bold' }}>
                Bento Cake selecionado. Este bolo tem recheio padrão e custa {formatarPreco(PRECO_BENTO_CAKE)}.
              </div>
            )}

            {produto === 'fatias' && (
              <>
                <Select
                  id="tipo-fatia"
                  label="Tipo de fatia:"
                  value={detalhes.tipoFatia}
                  onChange={setDetalhe('tipoFatia')}
                  options={tiposFatia.map((t) => ({ value: t.valor, label: `${t.nome} - ${formatarPreco(t.valor)}` }))}
                />
                <p>Digite a quantidade de fatias</p>
                <input
                  id="fatias-input-value"
                  placeholder="Nenhuma"
                  type="number"
                  min="8"
                  onKeyDown={bloquearE}
                  value={detalhes.quantidade}
                  onChange={(e) => setDetalhe('quantidade')(e.target.value)}
                />
                <div>
                  <Select id="massa" label="Massas:" value={detalhes.massa} onChange={setDetalhe('massa')} options={massas} />
                </div>
                <div id="recheio-container">
                  <Select id="recheio" label="Recheio:" value={detalhes.recheio} onChange={setDetalhe('recheio')} options={recheiosFatia} />
                </div>
                <p> Total: R$ <span id="total-fatias">{formatarTotal(calcularTotal('fatias', detalhes))}</span></p>
              </>
            )}
          </div>
        )}

        <SaboresCheckbox produto={produto} selecionados={saboresSelecionados} onChange={setSaboresSelecionados} />

        <Select
          id="forma-pagamento"
          label="Forma de Pagamento:"
          value={form.formaPagamento}
          onChange={set('formaPagamento')}
          options={formasPagamento}
        />

        <label htmlFor="observacoes">Digite aqui Observações, sabores e outros detalhes:</label>
        <textarea
          id="observacoes"
          rows={4}
          className="obs"
          value={form.observacoes}
          onChange={(e) => set('observacoes')(e.target.value)}
        />

        <p><strong>ENVIAR A IMAGEM DE REFERÊNCIA JUNTO COM O FORMULÁRIO!</strong></p>
        <p><strong>ESSE É UM FORMULÁRIO DE ORÇAMENTO, AGUARDE O SEU PEDIDO SER CONFIRMADO.</strong></p>

        <button type="submit">Enviar</button>
      </form>
    </section>
  );
}
