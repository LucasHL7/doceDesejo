import { describe, expect, it } from 'vitest';
import { cardapioPadrao } from '../../../data/cardapio.js';
import {
  lerNumero,
  mascararPreco,
  novaOpcao,
  novoCampo,
  paraProduto,
  paraRascunho,
  precoTexto,
  slug,
  soDigitos,
} from './produtoForm.js';

describe('mascararPreco (formatação enquanto digita)', () => {
  it('os dígitos entram pelos centavos', () => {
    const digitados = ['1', '12', '123', '1234', '12345', '123450'];
    expect(digitados.map(mascararPreco)).toEqual(['0,01', '0,12', '1,23', '12,34', '123,45', '1.234,50']);
  });

  it('ignora letras, símbolos e zeros à esquerda', () => {
    expect(mascararPreco('abc1,7x0')).toBe('1,70');
    expect(mascararPreco('R$ 0001,50')).toBe('1,50');
  });

  it('campo vazio continua vazio', () => {
    expect(mascararPreco('')).toBe('');
    expect(mascararPreco('0')).toBe('');
    expect(mascararPreco('abc')).toBe('');
  });
});

describe('precoTexto e lerNumero', () => {
  it('formata no padrão brasileiro', () => {
    expect(precoTexto(1.7)).toBe('1,70');
    expect(precoTexto(100)).toBe('100,00');
    expect(precoTexto(1234.5)).toBe('1.234,50');
    expect(precoTexto(null)).toBe('');
  });

  it('lê o que precoTexto escreve (ida e volta)', () => {
    for (const n of [0.01, 1.5, 1.7, 40, 113, 1234.5, 99999.99]) {
      expect(lerNumero(precoTexto(n))).toBe(n);
    }
  });

  it('aceita ponto ou vírgula como decimal', () => {
    expect(lerNumero('1,70')).toBe(1.7);
    expect(lerNumero('1.70')).toBe(1.7);
    expect(lerNumero('R$ 1.234,50')).toBe(1234.5);
  });

  it('texto inválido vira NaN', () => {
    expect(lerNumero('')).toBeNaN();
    expect(lerNumero('abc')).toBeNaN();
    expect(lerNumero('1,2,3')).toBeNaN();
  });
});

describe('soDigitos e slug', () => {
  it('soDigitos deixa só números', () => {
    expect(soDigitos('1a2 b3')).toBe('123');
  });

  it('slug tira acento e espaço', () => {
    expect(slug('Doce de Leite')).toBe('doce-de-leite');
    expect(slug('Prestígio')).toBe('prestigio');
    expect(slug('!!!')).toBe('item');
  });
});

describe('paraRascunho → paraProduto', () => {
  it.each(cardapioPadrao.map((p) => [p.nome, p]))(
    '%s: abrir e salvar sem mexer devolve o mesmo produto',
    (_, original) => {
      const { produto, erros } = paraProduto(paraRascunho(original), { proximaOrdem: 99 });
      expect(erros).toBeUndefined();
      expect(produto).toEqual(original);
    }
  );

  it('produto novo vazio mostra os erros principais', () => {
    const { erros } = paraProduto(paraRascunho(null), { proximaOrdem: 0 });
    expect(erros).toContain('Dê um nome ao produto.');
    expect(erros).toContain('Adicione pelo menos uma opção com preço.');
  });

  it('produto novo recebe id a partir do nome e vai para o fim da lista', () => {
    const r = { ...paraRascunho(null), nome: 'Bolo de Pote', tipo: 'fixo', preco: '12,50' };
    const { produto } = paraProduto(r, { proximaOrdem: 7 });
    expect(produto.id).toMatch(/^bolo-de-pote-[a-z0-9]{4}$/);
    expect(produto.ordem).toBe(7);
    expect(produto.preco).toBe(12.5);
  });

  it('não salva campos de outro tipo de preço (o documento fica limpo)', () => {
    const r = { ...paraRascunho(cardapioPadrao.find((p) => p.id === 'bolo-confeitado')), tipo: 'fixo', preco: '50,00' };
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(produto).not.toHaveProperty('opcoes');
    expect(produto).not.toHaveProperty('opcaoLabel');
    expect(produto.preco).toBe(50);
  });

  it('nenhum valor undefined (o Firestore recusa)', () => {
    const r = { ...paraRascunho(null), nome: 'Teste', tipo: 'unidade', precoUnitario: '2,00' };
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(JSON.stringify(produto)).toBe(JSON.stringify(produto, (_, v) => (v === undefined ? null : v)));
  });

  it('mantém o código das opções existentes ao renomear (a sacola das clientes usa ele)', () => {
    const bolo = cardapioPadrao.find((p) => p.id === 'bolo-confeitado');
    const r = paraRascunho(bolo);
    r.opcoes[0] = { ...r.opcoes[0], label: '8 fatias (mini)' };
    r.opcoes.push({ ...novaOpcao(), label: '100 fatias', preco: '600,00' });
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(produto.opcoes[0]).toEqual({ value: '8', label: '8 fatias (mini)', preco: 100 });
    expect(produto.opcoes.at(-1)).toEqual({ value: '100-fatias', label: '100 fatias', preco: 600 });
  });

  it('linhas de opção totalmente vazias são ignoradas', () => {
    const r = { ...paraRascunho(null), nome: 'X', opcoes: [{ ...novaOpcao(), label: 'P', preco: '10,00' }, novaOpcao()] };
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(produto.opcoes).toHaveLength(1);
  });

  it('acusa preço zerado ou opção sem nome', () => {
    const r = {
      ...paraRascunho(null),
      nome: 'X',
      opcoes: [
        { ...novaOpcao(), label: 'P', preco: '' },
        { ...novaOpcao(), label: '', preco: '5,00' },
      ],
    };
    const { erros } = paraProduto(r, { proximaOrdem: 0 });
    expect(erros).toContain('Confira o preço da opção "P".');
    expect(erros).toContain('A opção 2 está sem nome.');
  });

  it('preço de atacado só entra quando marcado', () => {
    const base = { ...paraRascunho(null), nome: 'X', tipo: 'unidade', precoUnitario: '2,00', atacadoAcimaDe: '50', atacadoPreco: '1,80' };
    expect(paraProduto({ ...base, temAtacado: false }, { proximaOrdem: 0 }).produto).not.toHaveProperty('atacado');
    expect(paraProduto({ ...base, temAtacado: true }, { proximaOrdem: 0 }).produto.atacado).toEqual({ acimaDe: 50, preco: 1.8 });
  });

  it('personalizações: opções uma por linha, sem repetidas nem linhas vazias', () => {
    const campo = { ...novoCampo(), label: 'Recheio', tipo: 'select', opcoesTexto: 'Ninho\n\n  Chocolate \nNinho\n' };
    const r = { ...paraRascunho(null), nome: 'X', tipo: 'fixo', preco: '1,00', campos: [campo] };
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(produto.campos[0]).toEqual({
      id: 'recheio',
      label: 'Recheio',
      tipo: 'select',
      opcoes: [
        { value: 'ninho', label: 'Ninho' },
        { value: 'chocolate', label: 'Chocolate' },
      ],
    });
  });

  it('personalizações com o mesmo nome ganham ids diferentes', () => {
    const c = () => ({ ...novoCampo(), label: 'Sabor', tipo: 'texto' });
    const r = { ...paraRascunho(null), nome: 'X', tipo: 'fixo', preco: '1,00', campos: [c(), c()] };
    const { produto } = paraProduto(r, { proximaOrdem: 0 });
    expect(produto.campos.map((x) => x.id)).toEqual(['sabor', 'sabor-2']);
  });
});

describe('paraProduto: validação de cada tipo de preço', () => {
  const rascunho = (extra) => ({ ...paraRascunho(null), nome: 'Teste', ...extra });
  const erros = (extra) => paraProduto(rascunho(extra), { proximaOrdem: 0 }).erros ?? [];

  it('preço único sem preço', () => {
    expect(erros({ tipo: 'fixo', preco: '' })).toEqual(['Confira o preço do produto.']);
  });

  it('por unidade: mínimo, passo e preço inválidos', () => {
    expect(erros({ tipo: 'unidade', min: '0', passo: '', precoUnitario: '' })).toEqual([
      'A quantidade mínima precisa ser um número inteiro (1 ou mais).',
      'O “de quanto em quanto” precisa ser um número inteiro (1 ou mais).',
      'Confira o preço por unidade.',
    ]);
  });

  it('por unidade: atacado incompleto', () => {
    expect(
      erros({ tipo: 'unidade', precoUnitario: '2,00', temAtacado: true, atacadoAcimaDe: '', atacadoPreco: '' })
    ).toEqual(['Confira a quantidade do preço para pedidos grandes.', 'Confira o preço para pedidos grandes.']);
  });

  it('por unidade sem nome da unidade usa "unidades"', () => {
    const { produto } = paraProduto(rascunho({ tipo: 'unidade', unidade: '   ', precoUnitario: '2,00' }), {
      proximaOrdem: 0,
    });
    expect(produto.unidade).toBe('unidades');
  });

  it('opção sem nome e com preço ruim é apontada pelo número', () => {
    const opcoes = [{ ...novaOpcao(), label: '', preco: 'abc' }];
    expect(erros({ tipo: 'opcoes', opcoes })).toEqual(['A opção 1 está sem nome.', 'Confira o preço da opção 1.']);
  });

  it('personalizações sem nome, sem opções ou com máximo inválido', () => {
    const campos = [
      { ...novoCampo(), label: '', opcoesTexto: '' },
      { ...novoCampo(), label: 'Sabores', tipo: 'checkbox', opcoesTexto: 'A\nB', max: '0' },
    ];
    expect(erros({ tipo: 'fixo', preco: '10,00', campos })).toEqual([
      'A personalização 1 está sem nome.',
      'Escreva as opções de "personalização 1".',
      'Confira o máximo de escolhas de "Sabores".',
    ]);
  });
});

describe('textos vazios (null/undefined) nos ajudantes', () => {
  it('não quebram', () => {
    expect(mascararPreco(undefined)).toBe('');
    expect(soDigitos(null)).toBe('');
    expect(lerNumero(undefined)).toBeNaN();
  });
});
