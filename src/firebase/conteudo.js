// Leitura e gravação do conteúdo editável do site no Firestore.
//
// Coleções:
// - produtos/{id}     um produto do cardápio (veja src/data/cardapio.js)
// - galeria/{id}      uma foto do carrossel { src, alt, ordem }
// - imagensSite/{id}  uma foto fixa do site (hero, delivery-1...) { src, alt }
// - admins/{uid}      quem pode editar (criado à mão no Console do Firebase)
//
// As fotos ficam no próprio documento (data URL comprimida no navegador): assim tudo
// cabe no plano gratuito, sem o Firebase Storage, que exige o plano pago.
// Usa o Firestore Lite (sem tempo real), bem menor que o SDK completo.

import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from 'firebase/firestore/lite';
import { firebaseConfig, firebaseConfigurado } from './config.js';

export { firebaseConfigurado };

let app = null;
export function getApp() {
  if (!firebaseConfigurado) return null;
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

const db = () => getFirestore(getApp());

const porOrdem = (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0);

async function lerColecao(nome) {
  const snap = await getDocs(collection(db(), nome));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

// Tudo o que o site público precisa, numa ida só.
export async function carregarConteudo() {
  const [produtos, galeria, imagens] = await Promise.all([
    lerColecao('produtos'),
    lerColecao('galeria'),
    lerColecao('imagensSite'),
  ]);
  return {
    produtos: produtos.sort(porOrdem),
    galeria: galeria.sort(porOrdem),
    imagensSite: Object.fromEntries(imagens.map(({ id, ...resto }) => [id, resto])),
  };
}

// ---- Painel ----

export async function ehAdmin(uid) {
  const snap = await getDoc(doc(db(), 'admins', uid));
  return snap.exists();
}

const semId = ({ id, ...resto }) => resto;

export const salvarProduto = (produto) => setDoc(doc(db(), 'produtos', produto.id), semId(produto));
export const excluirProduto = (id) => deleteDoc(doc(db(), 'produtos', id));

export const salvarFotoGaleria = (foto) => setDoc(doc(db(), 'galeria', foto.id), semId(foto));
export const excluirFotoGaleria = (id) => deleteDoc(doc(db(), 'galeria', id));

export const salvarImagemSite = (id, imagem) => setDoc(doc(db(), 'imagensSite', id), imagem);

// Grava só o campo `ordem` de vários itens de uma vez (depois de reordenar).
export async function salvarOrdem(colecao, itens) {
  const lote = writeBatch(db());
  itens.forEach((item, i) => lote.set(doc(db(), colecao, item.id), { ordem: i }, { merge: true }));
  await lote.commit();
}

// Copia o conteúdo padrão para o Firestore no primeiro acesso ao painel.
export async function importarPadrao({ produtos, galeria, imagensSite }) {
  const lote = writeBatch(db());
  produtos.forEach((p) => lote.set(doc(db(), 'produtos', p.id), semId(p)));
  galeria.forEach((f) => lote.set(doc(db(), 'galeria', f.id), semId(f)));
  Object.entries(imagensSite).forEach(([id, img]) => lote.set(doc(db(), 'imagensSite', id), img));
  await lote.commit();
}

// Id curto e legível a partir de um nome ("Bolo de pote" -> "bolo-de-pote-x7k2").
export function gerarId(nome = '') {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const sufixo = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${sufixo}` : sufixo;
}
