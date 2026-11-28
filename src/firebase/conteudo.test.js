// O SDK do Firebase é falso aqui (vitest.setup.js): nada chega ao projeto de verdade.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDoc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore/lite';
import { initializeApp } from 'firebase/app';
import {
  carregarConteudo,
  ehAdmin,
  excluirFotoGaleria,
  excluirProduto,
  gerarId,
  getApp,
  importarPadrao,
  salvarFotoGaleria,
  salvarImagemSite,
  salvarOrdem,
  salvarProduto,
} from './conteudo.js';

const snapshot = (docs) => ({ docs: docs.map(({ id, ...dados }) => ({ id, data: () => dados })) });

function loteFalso() {
  const lote = { set: vi.fn(), commit: vi.fn().mockResolvedValue() };
  writeBatch.mockReturnValue(lote);
  return lote;
}

beforeEach(() => vi.clearAllMocks());

describe('getApp', () => {
  it('inicializa o app uma vez só', () => {
    const a = getApp();
    const b = getApp();
    expect(a).toBe(b);
    expect(initializeApp.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

describe('carregarConteudo', () => {
  it('lê as três coleções, ordena por `ordem` e indexa as imagens do site por id', async () => {
    getDocs.mockImplementation(async ({ nome }) => {
      if (nome === 'produtos') return snapshot([{ id: 'b', ordem: 2 }, { id: 'a', ordem: 1 }, { id: 'c' }]);
      // fotos sem `ordem` contam como 0
      if (nome === 'galeria') return snapshot([{ id: 'g2', ordem: 1 }, { id: 'g0' }, { id: 'g1', ordem: 0 }]);
      return snapshot([{ id: 'hero', src: 'x.png', alt: 'Bolo' }]);
    });

    const dados = await carregarConteudo();

    expect(dados.produtos.map((p) => p.id)).toEqual(['c', 'a', 'b']);
    expect(dados.galeria.map((g) => g.id)).toEqual(['g0', 'g1', 'g2']);
    expect(dados.imagensSite).toEqual({ hero: { src: 'x.png', alt: 'Bolo' } });
  });

  it('propaga o erro do Firestore', async () => {
    getDocs.mockRejectedValue(new Error('offline'));
    await expect(carregarConteudo()).rejects.toThrow('offline');
  });
});

describe('ehAdmin', () => {
  it('é admin quando existe o documento admins/{uid}', async () => {
    getDoc.mockResolvedValue({ exists: () => true });
    await expect(ehAdmin('u1')).resolves.toBe(true);
    expect(getDoc).toHaveBeenCalledWith({ colecao: 'admins', id: 'u1' });
  });

  it('não é admin sem o documento', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    await expect(ehAdmin('u2')).resolves.toBe(false);
  });
});

describe('gravações', () => {
  it('salva produto e foto sem gravar o id dentro do documento', async () => {
    await salvarProduto({ id: 'p1', nome: 'Bolo' });
    expect(setDoc).toHaveBeenCalledWith({ colecao: 'produtos', id: 'p1' }, { nome: 'Bolo' });

    await salvarFotoGaleria({ id: 'f1', src: 's', ordem: 3 });
    expect(setDoc).toHaveBeenCalledWith({ colecao: 'galeria', id: 'f1' }, { src: 's', ordem: 3 });

    await salvarImagemSite('hero', { src: 's', alt: 'a' });
    expect(setDoc).toHaveBeenCalledWith({ colecao: 'imagensSite', id: 'hero' }, { src: 's', alt: 'a' });
  });

  it('exclui produto e foto', async () => {
    await excluirProduto('p1');
    await excluirFotoGaleria('f1');
    expect(deleteDoc).toHaveBeenCalledWith({ colecao: 'produtos', id: 'p1' });
    expect(deleteDoc).toHaveBeenCalledWith({ colecao: 'galeria', id: 'f1' });
  });

  it('salvarOrdem grava só o campo ordem, em lote', async () => {
    const lote = loteFalso();
    await salvarOrdem('produtos', [{ id: 'b' }, { id: 'a' }]);
    expect(lote.set).toHaveBeenNthCalledWith(1, { colecao: 'produtos', id: 'b' }, { ordem: 0 }, { merge: true });
    expect(lote.set).toHaveBeenNthCalledWith(2, { colecao: 'produtos', id: 'a' }, { ordem: 1 }, { merge: true });
    expect(lote.commit).toHaveBeenCalledOnce();
  });

  it('importarPadrao copia produtos, galeria e imagens num lote só', async () => {
    const lote = loteFalso();
    await importarPadrao({
      produtos: [{ id: 'p', nome: 'P' }],
      galeria: [{ id: 'g', src: 'g.jpg' }],
      imagensSite: { hero: { src: 'h.png' } },
    });
    expect(lote.set).toHaveBeenCalledWith({ colecao: 'produtos', id: 'p' }, { nome: 'P' });
    expect(lote.set).toHaveBeenCalledWith({ colecao: 'galeria', id: 'g' }, { src: 'g.jpg' });
    expect(lote.set).toHaveBeenCalledWith({ colecao: 'imagensSite', id: 'hero' }, { src: 'h.png' });
    expect(lote.commit).toHaveBeenCalledOnce();
  });
});

describe('gerarId', () => {
  it('monta um id legível, sem acento, com sufixo aleatório', () => {
    expect(gerarId('Pão de Mel Ç!')).toMatch(/^pao-de-mel-c-[a-z0-9]{1,4}$/);
  });

  it('sem nome, usa só o sufixo', () => {
    expect(gerarId()).toMatch(/^[a-z0-9]{1,4}$/);
    expect(gerarId('!!!')).toMatch(/^[a-z0-9]{1,4}$/);
  });
});

describe('sem Firebase configurado', () => {
  it('getApp devolve null e não inicializa nada', async () => {
    vi.resetModules();
    vi.doMock('./config.js', () => ({ firebaseConfigurado: false, firebaseConfig: {} }));
    const { getApp: getAppSemConfig } = await import('./conteudo.js');
    expect(getAppSemConfig()).toBeNull();
    expect(initializeApp).not.toHaveBeenCalled();
    vi.doUnmock('./config.js');
  });
});
