// Preparação comum a todos os testes (vite.config.js > test.setupFiles).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// ---- Nunca falar com o Firebase de verdade ----
// Todo teste usa estas versões falsas do SDK; quem precisar de respostas específicas
// mocka src/firebase/conteudo.js ou ajusta estes vi.fn.
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'app-de-teste' })) }));
vi.mock('firebase/firestore/lite', () => ({
  collection: vi.fn((db, nome) => ({ nome })),
  doc: vi.fn((db, colecao, id) => ({ colecao, id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn(() => ({ db: 'de-teste' })),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ auth: 'de-teste' })),
  onAuthStateChanged: vi.fn(() => () => {}),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.body.style.overflow = '';
  ObservadorFalso.instancias.length = 0;
});

// ---- O que falta no jsdom ----

// <dialog>: o jsdom não implementa showModal/close.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.show = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.close = function close(valor) {
    if (!this.hasAttribute('open')) return;
    if (valor !== undefined) this.returnValue = valor;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

class ObservadorFalso {
  constructor(callback) {
    this.callback = callback;
    ObservadorFalso.instancias.push(this);
  }
  observe(el) {
    this.alvos = [...(this.alvos ?? []), el];
  }
  unobserve() {}
  disconnect() {}
}
ObservadorFalso.instancias = [];
globalThis.IntersectionObserver = class extends ObservadorFalso {};
globalThis.IntersectionObserver.instancias = ObservadorFalso.instancias;
globalThis.ResizeObserver = class extends ObservadorFalso {};
globalThis.ResizeObserver.instancias = ObservadorFalso.instancias;

if (!window.matchMedia) {
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
