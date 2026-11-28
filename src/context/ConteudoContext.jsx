import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cardapioPadrao } from '../data/cardapio.js';
import { galeriaPadrao, imagensSitePadrao } from '../data/imagensPadrao.js';
import { firebaseConfigurado } from '../firebase/config.js';

// Conteúdo editável do site (produtos e fotos), carregado do Firebase.
//
// status:
// - 'carregando': ainda buscando no Firebase; os componentes mostram um espaço reservado
//                 em vez do conteúdo padrão, para não piscar preço ou foto antigos.
// - 'pronto':     veio do Firebase.
// - 'padrao':     Firebase não configurado, fora do ar, lento demais ou ainda vazio:
//                 usa o conteúdo que está no código.

const TEMPO_LIMITE = 8000;
const ConteudoContext = createContext(null);

const padrao = {
  produtos: cardapioPadrao,
  galeria: galeriaPadrao,
  imagensSite: imagensSitePadrao,
};

async function buscar() {
  const { carregarConteudo } = await import('../firebase/conteudo.js');
  const limite = new Promise((_, rejeitar) =>
    setTimeout(() => rejeitar(new Error('Firebase demorou para responder')), TEMPO_LIMITE)
  );
  return Promise.race([carregarConteudo(), limite]);
}

export function ConteudoProvider({ children }) {
  const [estado, setEstado] = useState(() =>
    firebaseConfigurado ? { status: 'carregando', ...padrao } : { status: 'padrao', ...padrao }
  );

  useEffect(() => {
    if (!firebaseConfigurado) return undefined;
    let ativo = true;
    buscar()
      .then((dados) => {
        if (!ativo) return;
        // Banco ainda vazio (conteúdo nunca importado pelo painel): segue com o padrão.
        const vazio =
          !dados.produtos.length && !dados.galeria.length && !Object.keys(dados.imagensSite).length;
        if (vazio) {
          setEstado({ status: 'padrao', ...padrao });
          return;
        }
        setEstado({
          status: 'pronto',
          produtos: dados.produtos,
          galeria: dados.galeria,
          imagensSite: { ...imagensSitePadrao, ...dados.imagensSite },
        });
      })
      .catch((erro) => {
        console.warn('Não foi possível carregar o conteúdo do Firebase. Usando o padrão.', erro);
        if (ativo) setEstado({ status: 'padrao', ...padrao });
      });
    return () => {
      ativo = false;
    };
  }, []);

  const valor = useMemo(() => {
    const visiveis = estado.produtos.filter((p) => p.ativo !== false);
    return {
      status: estado.status,
      carregando: estado.status === 'carregando',
      produtos: visiveis,
      galeria: estado.galeria,
      imagensSite: estado.imagensSite,
      buscarProduto: (id) => visiveis.find((p) => p.id === id),
    };
  }, [estado]);

  return <ConteudoContext.Provider value={valor}>{children}</ConteudoContext.Provider>;
}

export function useConteudo() {
  const ctx = useContext(ConteudoContext);
  if (!ctx) throw new Error('useConteudo precisa estar dentro de <ConteudoProvider>');
  return ctx;
}
