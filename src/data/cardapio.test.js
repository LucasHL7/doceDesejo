import { describe, expect, it } from 'vitest';
import {
  calcularLinha,
  cardapioPadrao,
  descreverEscolhas,
  precoDoCard,
  rotuloQuantidade,
} from './cardapio.js';

const produto = (id) => cardapioPadrao.find((p) => p.id === id);

describe('cardápio padrão', () => {
  it('é só dado simples (pode ir para o Firestore sem perder nada)', () => {
    const idaEVolta = JSON.parse(JSON.stringify(cardapioPadrao));
    expect(idaEVolta).toEqual(cardapioPadrao);
  });

  it('tem ids únicos e ordem sequencial', () => {
    const ids = cardapioPadrao.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cardapioPadrao.map((p) => p.ordem)).toEqual(ids.map((_, i) => i));
  });
});

describe('calcularLinha', () => {
  it('preço único: multiplica pela quantidade', () => {
    expect(calcularLinha(produto('bento-cake'), { qtd: 3 })).toBe(120);
  });

  it('por opção: usa o preço da opção escolhida', () => {
    expect(calcularLinha(produto('bolo-confeitado'), { opcao: '20', qtd: 1 })).toBe(165);
    expect(calcularLinha(produto('brownie'), { opcao: '50', qtd: 2 })).toBe(500);
  });

  it('por opção: opção que não existe mais vale zero (não quebra a sacola)', () => {
    expect(calcularLinha(produto('bolo-confeitado'), { opcao: '999', qtd: 1 })).toBe(0);
  });

  it('por unidade com opções: preço da opção por unidade', () => {
    // fatia com nossa embalagem = R$6
    expect(calcularLinha(produto('fatias'), { opcao: '6', qtd: 10 })).toBe(60);
  });

  it('brigadeiro: R$1,70 até 45 unidades', () => {
    const brigadeiro = produto('brigadeiro');
    expect(calcularLinha(brigadeiro, { qtd: 10 })).toBeCloseTo(17);
    expect(calcularLinha(brigadeiro, { qtd: 45 })).toBeCloseTo(76.5);
  });

  it('brigadeiro: R$1,50 acima de 45 unidades', () => {
    expect(calcularLinha(produto('brigadeiro'), { qtd: 46 })).toBeCloseTo(69);
    expect(calcularLinha(produto('brigadeiro'), { qtd: 100 })).toBeCloseTo(150);
  });

  it('quantidade vazia ou inválida conta como zero', () => {
    expect(calcularLinha(produto('bento-cake'), { qtd: '' })).toBe(0);
    expect(calcularLinha(produto('brigadeiro'), { qtd: 'abc' })).toBe(0);
  });
});

describe('precoDoCard', () => {
  it('preço único não tem "a partir de"', () => {
    expect(precoDoCard(produto('bento-cake'))).toEqual({ prefixo: '', valor: 40, sufixo: '' });
  });

  it('por opção mostra a opção mais barata', () => {
    expect(precoDoCard(produto('bolo-confeitado'))).toEqual({ prefixo: 'a partir de', valor: 100, sufixo: '' });
  });

  it('por unidade mostra o menor preço por unidade', () => {
    expect(precoDoCard(produto('brigadeiro'))).toEqual({ prefixo: 'a partir de', valor: 1.5, sufixo: '/un' });
    expect(precoDoCard(produto('fatias')).valor).toBe(5);
  });
});

describe('descreverEscolhas', () => {
  it('lista opção, selects e sabores com os nomes legíveis', () => {
    const partes = descreverEscolhas(produto('bolo-confeitado'), {
      opcao: '15',
      campos: { massa: 'red-velvet', recheio: 'dois-amores', recheio2: '' },
    });
    expect(partes).toEqual(['15 fatias', 'Massa: Red Velvet', 'Recheio: Dois Amores']);
  });

  it('sabores marcados e texto livre', () => {
    const partes = descreverEscolhas(produto('brigadeiro'), {
      campos: { sabores: ['chocolate', 'beijinho'], caixeta: 'rosa claro' },
    });
    expect(partes).toEqual(['Sabores: Chocolate, Beijinho', 'Cor da caixeta: rosa claro']);
  });

  it('ignora campos vazios', () => {
    expect(descreverEscolhas(produto('brigadeiro'), { campos: { sabores: [], caixeta: '' } })).toEqual([]);
  });
});

describe('rotuloQuantidade', () => {
  it('por unidade mostra a unidade; os outros mostram "Nx"', () => {
    expect(rotuloQuantidade(produto('brigadeiro'), 30)).toBe('30 unidades');
    expect(rotuloQuantidade(produto('bento-cake'), 2)).toBe('2x');
  });
});

describe('produtos incompletos (salvos pelo painel ou antigos) não quebram as contas', () => {
  it('preço ausente vale zero', () => {
    expect(calcularLinha({ tipo: 'fixo' }, { qtd: 2 })).toBe(0);
    expect(calcularLinha({ tipo: 'unidade' }, { qtd: 10 })).toBe(0);
    expect(precoDoCard({ tipo: 'fixo' }).valor).toBe(0);
  });

  it('descreverEscolhas sem campos, ou com valores que não estão mais nas opções', () => {
    expect(descreverEscolhas({ tipo: 'fixo' }, { campos: { x: 'y' } })).toEqual([]);
    const produto = {
      tipo: 'fixo',
      campos: [
        { id: 'massa', label: 'Massa', tipo: 'select', opcoes: [] },
        { id: 'sabores', label: 'Sabores', tipo: 'checkbox', opcoes: [{ value: 'a', label: 'A' }] },
      ],
    };
    expect(descreverEscolhas(produto, { campos: { massa: 'antiga', sabores: ['a', 'sumiu'] } })).toEqual([
      'Massa: antiga',
      'Sabores: A, sumiu',
    ]);
  });
});
