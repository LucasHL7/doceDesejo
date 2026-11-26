import { formasPagamento, formatarPreco } from '../../data/produtos.js';
import { descreverEscolhas, rotuloQuantidade } from '../../data/cardapio.js';

export const ACRESCIMO_CREDITO = 0.05;

// Monta a mensagem do WhatsApp como uma lista de linhas.
// Cada linha é { rotulo, valor } (rótulo em negrito) ou { texto }.
// Campos ainda vazios ficam com valor null: a prévia mostra um espaço a preencher
// e o envio só acontece com tudo preenchido.
export function montarLinhas({ form, linhas, total, codigo }) {
  const credito = form.formaPagamento === 'credito';
  const totalFinal = credito ? total * (1 + ACRESCIMO_CREDITO) : total;
  const pagamento = formasPagamento.find((f) => f.value === form.formaPagamento)?.label;
  const dataFormatada = form.data ? form.data.split('-').reverse().join('/') : null;

  const itens = linhas.length
    ? linhas.flatMap((l) => {
        const escolhas = descreverEscolhas(l.produto, l);
        return [
          { texto: `• *${rotuloQuantidade(l.produto, l.qtd)} ${l.produto.nome}* — ${formatarPreco(l.total)}` },
          ...(escolhas.length ? [{ texto: `   ${escolhas.join(' · ')}`, suave: true }] : []),
        ];
      })
    : [{ texto: '(nenhum item na sacola)', vazio: true }];

  return [
    { texto: '*FORMULARIO DE ORÇAMENTO*' },
    { texto: '' },
    { rotulo: 'Nome', valor: form.nome.trim() || null },
    { rotulo: 'Telefone', valor: form.numero.trim() || null },
    { rotulo: 'CPF', valor: form.cpf.trim() || null },
    { rotulo: 'Data', valor: dataFormatada },
    { rotulo: 'Hora', valor: form.hora || null },
    { texto: '' },
    { texto: '*Pedido*:' },
    ...itens,
    { texto: '' },
    { rotulo: 'Observações', valor: form.observacoes.trim(), opcional: true },
    { rotulo: 'Forma de Pagamento', valor: pagamento },
    ...(credito
      ? [{ rotulo: 'Acréscimo crédito (5%)', valor: formatarPreco(total * ACRESCIMO_CREDITO) }]
      : []),
    { rotulo: 'Valor Total', valor: formatarPreco(totalFinal) },
    { rotulo: 'Código de Confirmação', valor: codigo },
  ];
}

// Texto final enviado ao WhatsApp (formatação do próprio WhatsApp: *negrito*).
export function montarTexto(dados) {
  return montarLinhas(dados)
    .map((l) => ('texto' in l ? l.texto : `*${l.rotulo}*: ${l.valor ?? ''}`))
    .join('\n');
}

export const gerarCodigo = () => Math.random().toString(36).substring(2, 7).toUpperCase();
