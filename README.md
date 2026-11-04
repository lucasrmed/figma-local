<img src="assets/logo.svg" width="64" height="64" alt="Figma Local">

# Figma Local

**Leia muitas telas do Figma com contexto compacto.** Extensão Chrome, leitor local e skills para o Codex.

[![CI](https://github.com/lucasrmed/figma-local/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasrmed/figma-local/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-176b4f)](LICENSE)
[![macOS e Windows beta](https://img.shields.io/badge/macOS%20%2B%20Windows-beta-176b4f)](https://github.com/lucasrmed/figma-local/releases/tag/v0.3.0)

[English](README.en.md) · [Baixar para Windows](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-windows-0.3.0.zip) · [Baixar para Mac](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-macos-0.3.0.zip) · [Instalação detalhada](docs/INSTALL.md) · [Reportar problema](https://github.com/lucasrmed/figma-local/issues/new/choose)

Capture uma seleção ou página uma vez. Depois consulte um catálogo de frames, resumos, textos e detalhes pontuais pelo cache local. O agente recebe apenas o que precisa para a tarefa.

A captura usa a ação normal **Copiar**, no Figma aberto com a sua conta. O leitor não chama a API REST nem o MCP oficial do Figma. Projeto independente, sem vínculo oficial com a Figma ou a OpenAI.

## O que vem no projeto

| Parte | O que faz |
| --- | --- |
| Extensão Chrome | Captura, busca telas, seleciona frames e prepara um pedido com links para o Codex. |
| Leitor local | Decodifica a cópia, mantém o índice e responde com limites e paginação. |
| Skill `figma-local` | Consulta o cache por arquivo e `node-id`, começando pelos resumos. |
| Skill `figma-local-setup` | Instala e verifica a configuração no Mac ou Windows. |

A skill também funciona sem carregar a extensão: você pode copiar no Figma e importar pelo leitor. Agent-browser é opcional.

## Instalar em poucos passos

Requisitos: **Windows ou macOS**, **Chrome 116+**, uma [versão LTS mantida do Node.js](https://nodejs.org/en/download), **22 ou posterior**, e acesso ao arquivo do Figma. Para usar as skills, tenha o Codex instalado. A primeira instalação precisa de internet para baixar as dependências.

1. Baixe o ZIP para [Windows](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-windows-0.3.0.zip) ou [Mac](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-macos-0.3.0.zip) e descompacte tudo.
2. Na pasta **FigmaLocal**, abra **Instalar.cmd** no Windows ou **Instalar.command** no Mac. O instalador prepara o leitor e as duas skills no seu usuário, sem administrador, e abre um guia.
3. No Chrome, abra `chrome://extensions`, ative **Modo do desenvolvedor** e escolha **Carregar sem compactação**.
4. Selecione a pasta **instalada**, indicada pelo guia:

   | Sistema | Pasta da extensão |
   | --- | --- |
   | Windows | `%LOCALAPPDATA%\FigmaLocal\app\extension` |
   | Mac | `~/Library/Application Support/FigmaLocal/app/extension` |

5. Abra seu arquivo do Figma no Chrome e faça login. Pelo menu de extensões, abra **Figma Local** e confira **Leitor conectado**.
6. Escolha **Capturar seleção** ou **Capturar página** e confirme no botão que aparece dentro do Figma.
7. Marque as telas no catálogo, clique **Copiar pedido para o Codex** e cole no Codex. Use `$figma-local`. Se as skills não aparecerem, reabra o Codex.

O painel mostra a última captura de cada arquivo. A skill também encontra alvos em capturas anteriores. A extensão é carregada manualmente nesta beta e ainda não está na Chrome Web Store.

[Passo a passo completo, atualização, solução de problemas e remoção →](docs/INSTALL.md)

## Experimente no Codex

Depois da captura, envie seu pedido junto de links de frames ou seções:

```text
Use $figma-local para consultar as telas destes links.
Comece pelo índice e pelos resumos. Abra detalhes só quando necessário.
Informe a data da captura e o que estiver faltando.

[cole aqui os links do Figma]
```

A captura e a indexação locais não fazem chamadas a modelos. As consultas do agente continuam consumindo o contexto e o plano do modelo. O limite padrão é **6.000 caracteres por resposta**, com paginação; caracteres não são uma medição de tokens faturados.

## Compartilhe o link certo

| Você compartilha | O leitor consulta |
| --- | --- |
| Frame com `node-id` | Esse frame e seus descendentes. |
| Seção com `node-id` | Os frames contidos nela. |
| Página | A página, quando esse escopo for solicitado. |
| Vários links | Cada arquivo + ID, preservando estados e tamanhos diferentes. |
| Arquivo sem `node-id` | O índice local para localizar o fluxo. |
| Texto, ícone ou componente | O tipo real do nó; contexto maior exige o frame/seção. |

Para um fluxo com muitas telas, compartilhe uma seção ou os links dos frames. Nomes iguais não juntam IDs diferentes. **Copiar link** fornece o endereço; **Copiar** fornece os dados que o leitor importa.

## Desempenho observado

Em um teste local, uma página produziu **191 frames candidatos**. O índice de 10 retornou em **129 ms e 1.746 caracteres** pelo helper da skill. A captura da página já aberta levou aproximadamente **5–6 segundos** pela rota com agent-browser. Esses números excluem login e abertura do arquivo e não garantem o mesmo resultado em outros projetos.

[Veja o método, os testes e as limitações da validação.](docs/VALIDATION.md)

## Privacidade e limites da beta

- O cache fica no seu computador. O leitor não usa servidor remoto nem telemetria; a instalação baixa dependências pelo npm e o navegador acessa o Figma normalmente.
- Os dados consultados pela skill entram no contexto do modelo que você usa. Capturas podem conter conteúdo confidencial: não envie seu cache ou perfil do navegador para issues e pull requests.
- A captura é um snapshot com data de importação. Capture novamente após mudanças no design.
- O formato da cópia é interno ao Figma e pode mudar. Interiores de componentes de bibliotecas, imagens, interações e medidas calculadas podem estar ausentes. Frames candidatos podem incluir anotações.
- As permissões do arquivo continuam valendo. A ferramenta não contorna bloqueios de cópia e não altera o design.
- A operação Copiar substitui a área de transferência. Regras do seu workspace que exigem validação via MCP continuam valendo.
- Captura no Linux, atualização automática e publicação em loja ainda não fazem parte desta versão.

[Privacidade](PRIVACY.md) · [Segurança](SECURITY.md) · [Arquitetura](docs/ARCHITECTURE.md)

## Instalar pelo código-fonte

```bash
git clone https://github.com/lucasrmed/figma-local.git
cd figma-local
npm ci --ignore-scripts
node scripts/install.mjs --open
```

Depois carregue a pasta da extensão indicada pelo instalador. Para consultar sem extensão:

```bash
# Primeiro, no Figma, selecione os objetos e use Copiar.
node reader.mjs import --url 'LINK_FIGMA' --scope selection
node reader.mjs index 'LINK_FIGMA' --limit 10 --max-chars 3000
node reader.mjs summary 'LINK_DO_FRAME' --max-chars 6000
```

[Comandos do leitor e captura opcional com agent-browser.](docs/CLI.md)

## Apoie e contribua

Se o projeto ajudar você, clique em **Star ⭐** no topo do repositório. Para criar sua versão ou propor melhorias, faça um [fork](https://github.com/lucasrmed/figma-local/fork) e siga o [guia de contribuição](CONTRIBUTING.md). Sugestões e relatos de bugs são bem-vindos em português ou inglês.

Boas contribuições iniciais: melhorar a instalação, adicionar exemplos públicos, reproduzir problemas de captura com arquivos de teste e testar a beta em outros computadores. Consulte o [roadmap](docs/ROADMAP.md) antes de começar mudanças maiores.

```bash
npm ci --ignore-scripts
npm run check
npm test
npm run package
npm run verify-package
```

## Licença

[MIT](LICENSE), por Lucas Medeiros. As dependências mantêm suas próprias licenças e atribuições em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
