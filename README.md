# Doce Desejo

![Doce Desejo](public/og-image.jpg)

Site da **Doce Desejo**, confeitaria de Teresina-PI. A cliente monta o pedido no cardápio, personaliza cada produto e envia o orçamento pronto pelo WhatsApp. A dona da confeitaria atualiza produtos, preços e fotos por um painel administrativo, sem mexer no código.

**[docedesejoencomendas.netlify.app](https://docedesejoencomendas.netlify.app)**

## Funcionalidades

**Site**
- Cardápio por categoria com três formas de preço: por opção (tamanho, pacote), por unidade (com preço menor para pedidos grandes) e preço único
- Janela de produto com personalizações (massa, recheios, sabores com limite de escolhas)
- Sacola de pedido salva no navegador e formulário com prévia ao vivo da mensagem do WhatsApp
- Carrossel de bolos, seção de delivery e layout pensado primeiro para o celular

**Painel administrativo (`/admin/`)**
- Login com Firebase Authentication; só usuários cadastrados como admin conseguem gravar
- Criar, editar, esconder, reordenar e excluir produtos, com editor de preços e personalizações
- Trocar a foto principal, as fotos do delivery e as do carrossel
- Fotos comprimidas no navegador (WebP) antes de salvar

**Qualidade**
- 100% de cobertura de linhas nos testes (Vitest + Testing Library)
- SEO local: dados estruturados `Bakery`, Open Graph, sitemap e robots gerados no build
- Volta para o conteúdo do código se o Firebase estiver fora do ar

## Tecnologias

React 18 · Vite 6 · Firebase (Firestore Lite e Authentication) · Vitest · Testing Library · Netlify

Sem biblioteca de UI: o CSS é próprio, um arquivo por componente, e os ícones são SVGs do Material Symbols embutidos no bundle.

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com os dados do seu projeto Firebase
npm run dev                  # site em http://localhost:5173 e painel em /admin/
```

Sem as variáveis do Firebase, o site funciona com o cardápio padrão do código, e o painel avisa que falta configuração.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/` (site, painel, robots e sitemap) |
| `npm test` | roda os testes |
| `npm run coverage` | testes com relatório de cobertura em `coverage/` |

## Estrutura

```
admin/index.html          página do painel
src/
  components/<Nome>/      componentes do site (JSX + CSS de cada um)
  admin/                  painel: login, lista e editor de produtos, fotos
  context/                conteúdo vindo do Firebase e sacola de pedido
  data/                   cardápio padrão, contas de preço, dados da empresa
  firebase/               configuração e acesso ao Firestore
scripts/gerar-seo.mjs     robots.txt e sitemap.xml no build
firestore.rules           regras de segurança do Firestore
```

## Documentação

- [PAINEL.md](PAINEL.md): como configurar o Firebase e usar o painel, e os limites do plano gratuito
- [PLANO-SEO.md](PLANO-SEO.md): situação do SEO e próximos passos

## Direitos

Código © 2026 [LucasHL7](https://github.com/LucasHL7). Todos os direitos reservados.

O repositório é público apenas para consulta, como parte do meu portfólio. Não há licença de uso: copiar, modificar ou redistribuir o código exige autorização. A marca, o logotipo e as fotos dos produtos pertencem à Doce Desejo.
