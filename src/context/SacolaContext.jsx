import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buscarProduto, calcularLinha } from '../data/cardapio.js';

// Sacola de pedido compartilhada entre o cardápio, a sacola flutuante e o formulário.
// Fica salva no navegador da pessoa para não se perder ao recarregar a página.

const CHAVE = 'doce-desejo:sacola';
const SacolaContext = createContext(null);

function lerSalvo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (!Array.isArray(salvo)) return [];
    // descarta itens de produtos que não existem mais
    return salvo.filter((l) => buscarProduto(l.produtoId));
  } catch {
    return [];
  }
}

export function SacolaProvider({ children }) {
  const [linhas, setLinhas] = useState(lerSalvo);
  const [aberta, setAberta] = useState(false);
  // muda a cada item adicionado; a sacola usa para mostrar o aviso "Adicionado"
  const [ultimoAdicionado, setUltimoAdicionado] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(linhas));
    } catch {
      /* navegação privada ou armazenamento bloqueado: segue sem salvar */
    }
  }, [linhas]);

  const adicionar = useCallback((linha) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLinhas((atual) => [...atual, { ...linha, id }]);
    setUltimoAdicionado({ id, produtoId: linha.produtoId });
  }, []);

  const alterarQtd = useCallback((id, qtd) => {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, qtd } : l)));
  }, []);

  const remover = useCallback((id) => {
    setLinhas((atual) => atual.filter((l) => l.id !== id));
  }, []);

  const limpar = useCallback(() => setLinhas([]), []);

  const valor = useMemo(() => {
    const comPreco = linhas.map((l) => {
      const produto = buscarProduto(l.produtoId);
      return { ...l, produto, total: calcularLinha(produto, l) };
    });
    return {
      linhas: comPreco,
      quantidadeItens: comPreco.length,
      total: comPreco.reduce((soma, l) => soma + l.total, 0),
      adicionar,
      alterarQtd,
      remover,
      limpar,
      aberta,
      ultimoAdicionado,
      abrir: () => setAberta(true),
      fechar: () => setAberta(false),
    };
  }, [linhas, aberta, ultimoAdicionado, adicionar, alterarQtd, remover, limpar]);

  return <SacolaContext.Provider value={valor}>{children}</SacolaContext.Provider>;
}

export function useSacola() {
  const ctx = useContext(SacolaContext);
  if (!ctx) throw new Error('useSacola precisa estar dentro de <SacolaProvider>');
  return ctx;
}
