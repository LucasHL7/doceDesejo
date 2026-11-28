import { describe, expect, it } from 'vitest';
import { calcularLinha, cardapioPadrao } from '../../data/cardapio.js';
import { montarLinhas, montarTexto } from './mensagem.js';

const produto = (id) => cardapioPadrao.find((p) => p.id === id);
const linha = (id, escolha) => {
  const p = produto(id);
  return { ...escolha, produto: p, total: calcularLinha(p, escolha) };
};

const form = {
  nome: 'Maria',
  numero: '(86) 99999-8888',
  cpf: '123.456.789-00',
  data: '2026-12-24',
  hora: '15:00',
  formaPagamento: 'pix',
  observacoes: '',
};

const linhas = [
  linha('bolo-confeitado', { opcao: '20', qtd: 1, campos: { massa: 'ninho', recheio: 'coco', recheio2: '' } }),
  linha('brigadeiro', { qtd: 50, campos: { sabores: ['chocolate'], caixeta: '' } }),
];
const total = linhas.reduce((s, l) => s + l.total, 0); // 165 + 75 = 240

describe('mensagem do WhatsApp', () => {
  it('monta o texto completo do pedido no Pix', () => {
    const texto = montarTexto({ form, linhas, total, codigo: 'AB12C' });
    expect(texto).toContain('*Nome*: Maria');
    expect(texto).toContain('*Data*: 24/12/2026');
    expect(texto).toContain('• *1x Bolo confeitado* — R$165,00');
    expect(texto).toContain('20 fatias · Massa: Ninho · Recheio: Coco');
    expect(texto).toContain('• *50 unidades Brigadeiros* — R$75,00');
    expect(texto).toContain('*Forma de Pagamento*: Pix');
    expect(texto).toContain('*Valor Total*: R$240,00');
    expect(texto).toContain('*Código de Confirmação*: AB12C');
    expect(texto).not.toContain('Acréscimo');
  });

  it('cartão de crédito soma 5% e mostra a linha do acréscimo', () => {
    const texto = montarTexto({ form: { ...form, formaPagamento: 'credito' }, linhas, total, codigo: 'X' });
    expect(texto).toContain('*Acréscimo crédito (5%)*: R$12,00');
    expect(texto).toContain('*Valor Total*: R$252,00');
  });

  it('campos não preenchidos ficam como null (a prévia mostra o espaço em branco)', () => {
    const vazio = { ...form, nome: '  ', data: '', hora: '' };
    const porRotulo = Object.fromEntries(
      montarLinhas({ form: vazio, linhas, total, codigo: 'X' })
        .filter((l) => 'rotulo' in l)
        .map((l) => [l.rotulo, l.valor])
    );
    expect(porRotulo.Nome).toBeNull();
    expect(porRotulo.Data).toBeNull();
    expect(porRotulo.Hora).toBeNull();
  });

  it('sacola vazia avisa no lugar dos itens', () => {
    const texto = montarTexto({ form, linhas: [], total: 0, codigo: 'X' });
    expect(texto).toContain('(nenhum item na sacola)');
  });

  it('texto final com campos vazios não escreve "null"', () => {
    const vazio = { ...form, nome: '', numero: '', cpf: '', data: '', hora: '' };
    const texto = montarTexto({ form: vazio, linhas, total, codigo: 'ABCDE' });
    expect(texto.split('\n')).toContain('*Nome*: ');
    expect(texto).not.toContain('null');
  });
});
