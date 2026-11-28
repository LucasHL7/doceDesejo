// Ajudantes para os testes de componentes do site.
//
// Quem usa precisa, no próprio arquivo de teste, mockar o acesso ao Firebase:
//   vi.mock('<caminho>/firebase/conteudo.js', () => ({ carregarConteudo: vi.fn() }));
// e então chamar renderizarSite(), que diz o que o "Firebase" devolve.
import { render, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { carregarConteudo } from '../firebase/conteudo.js';
import { ConteudoProvider, useConteudo } from '../context/ConteudoContext.jsx';
import { SacolaProvider } from '../context/SacolaContext.jsx';
import { cardapioPadrao } from '../data/cardapio.js';
import { galeriaPadrao, imagensSitePadrao } from '../data/imagensPadrao.js';

export const conteudoPadrao = () => ({
  produtos: cardapioPadrao,
  galeria: galeriaPadrao,
  imagensSite: imagensSitePadrao,
});

export const produtoPadrao = (id) => cardapioPadrao.find((p) => p.id === id);

function Sonda() {
  const { status } = useConteudo();
  return <span data-testid="status-conteudo" hidden>{status}</span>;
}

// Renderiza `ui` dentro dos providers do site. Por padrão espera o conteúdo carregar.
export async function renderizarSite(ui, { dados = conteudoPadrao(), esperar = true } = {}) {
  if (dados instanceof Error) carregarConteudo.mockRejectedValue(dados);
  else if (dados === 'pendente') carregarConteudo.mockReturnValue(new Promise(() => {}));
  else carregarConteudo.mockResolvedValue(dados);

  const resultado = render(
    <ConteudoProvider>
      <SacolaProvider>
        <Sonda />
        {ui}
      </SacolaProvider>
    </ConteudoProvider>
  );
  if (esperar) {
    await waitFor(() => expect(screen.getByTestId('status-conteudo')).not.toHaveTextContent('carregando'));
  }
  return resultado;
}

// Coloca itens na sacola salva do navegador antes de renderizar.
export function sacolaSalva(linhas) {
  localStorage.setItem('doce-desejo:sacola', JSON.stringify(linhas));
}
