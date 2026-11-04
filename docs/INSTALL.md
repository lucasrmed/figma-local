# Instalação e primeiro uso

[Voltar ao projeto](../README.md) · [English quick start](../README.en.md)

## 1. Preparar o computador

Esta beta atende macOS com Chrome 116+ e Node.js 22+. Instale uma [versão LTS mantida do Node.js](https://nodejs.org/en/download). É necessário acesso normal ao arquivo no Figma. Não é necessário criar um token Figma, conectar um servidor MCP ou informar credenciais ao leitor.

## 2. Baixar a versão

Abra a [release v0.2.0](https://github.com/lucasrmed/figma-local/releases/tag/v0.2.0) e, em **Assets**, baixe **figma-local-macos-0.2.0.zip**. Descompacte e entre na pasta **FigmaLocal**. Esse é o pacote de instalação; os arquivos automáticos **Source code** são uma alternativa para desenvolvimento.

Também está disponível o arquivo **SHA256SUMS** para conferir o download. Na pasta do ZIP, quem usa Terminal pode executar `shasum -a 256 -c SHA256SUMS`.

## 3. Instalar o leitor e as skills

Abra **Instalar.command**. O instalador trabalha no seu usuário, baixa as dependências e abre um guia. Não precisa de senha de administrador.

Se preferir o Terminal, entre na pasta extraída e execute:

```bash
node scripts/install.mjs --open
```

A instalação cria:

| Caminho | Conteúdo |
| --- | --- |
| `~/Library/Application Support/FigmaLocal/app` | Leitor e extensão |
| `~/Library/Application Support/FigmaLocal/cache` | Capturas locais do design |
| `~/Library/Application Support/FigmaLocal/install.json` | Configuração e caminhos |
| `~/.codex/skills/figma-local` | Skill de consulta |
| `~/.codex/skills/figma-local-setup` | Skill de configuração |

O instalador registra a comunicação local para Chrome, Chrome for Testing e Chromium. Pastas/skills de outra origem não são substituídas. As capturas existentes são preservadas em atualizações normais.

## 4. Carregar a extensão

1. No Chrome, digite `chrome://extensions` na barra de endereços.
2. Ative **Modo do desenvolvedor** / **Developer mode**.
3. Clique em **Carregar sem compactação** / **Load unpacked**.
4. Selecione **a pasta instalada**, indicada no guia, não apenas a pasta que veio no download:

   ```text
   ~/Library/Application Support/FigmaLocal/app/extension
   ```

   No seletor de pastas do macOS, pressione **⌘⇧G** para colar o caminho.

5. A extensão deve aparecer como **Figma Local**. Seu ID esperado é `cjkffgojhenipdmabikjdfjkjoiajece`.
6. Pelo ícone de extensões do Chrome, fixe o Figma Local se quiser acesso mais fácil.

## 5. Capturar suas telas

Abra o arquivo do Figma no navegador e entre com a sua própria conta. Caso o Figma tente abrir o aplicativo, escolha **Abra aqui em vez disso**.

- **Seleção:** selecione frames ou uma seção no painel de camadas; abra Figma Local e escolha **Capturar seleção**.
- **Página:** abra a página desejada e escolha **Capturar página**. Esse escopo inclui todos os objetos da página atual.

Confirme pelo botão que aparece dentro do Figma. Aguarde **Captura pronta** e volte ao painel. Páginas grandes podem demorar mais; o leitor aguarda até vinte segundos pela nova cópia. Se expirar, tente novamente ou use a importação manual. Não copie outro conteúdo durante essa operação.

O catálogo pode incluir frames de anotações. Busque pelo nome, confira ID e dimensões e selecione os estados que interessam.

## 6. Usar no Codex

No painel, marque os frames e escolha **Copiar pedido para o Codex**. Cole o pedido no Codex e acrescente o que deseja fazer. A skill `$figma-local` começa pelos resumos e consulta detalhes sob demanda.

Se a skill não aparecer, abra uma nova conversa ou reabra o Codex. Ela é instalada no perfil padrão `~/.codex/skills`; instalações do Codex com diretórios personalizados podem exigir configuração manual desse destino.

## Alternativa: copiar e importar manualmente

1. No painel Figma Local, abra **Já copiei no Figma** e confira o link do arquivo de origem.
2. Volte ao Figma, selecione os objetos e use **Copiar** / **⌘C**.
3. Volte ao painel e clique em **Importar cópia manual**. Não use Copiar link entre as etapas: isso substituiria os dados do design na área de transferência.

A importação manual verifica o arquivo de origem, mas depende de você ter copiado a seleção correta. Uma captura local não prova a aparência visual completa.

## Atualizar

Baixe uma nova release e execute seu instalador. Depois, em `chrome://extensions`, clique em **Recarregar** no Figma Local e recarregue a aba do Figma. O cache permanece no seu computador. Capture novamente para consultar mudanças no design.

## Resolver problemas

| Mensagem/situação | Próximo passo |
| --- | --- |
| Node.js não encontrado | Instale Node.js LTS e reabra o Terminal/instalador. |
| Leitor desconectado | Execute o instalador, confirme o ID da extensão e use **Reconectar leitor**. |
| Extensão ficou inválida após atualizar | Recarregue a extensão e a aba do Figma. |
| A cópia pertence a outro arquivo | Confira o link de origem, copie a seleção desejada no arquivo correto e importe novamente. |
| Nenhuma nova cópia | Tente novamente com o Figma em foco ou use a importação manual. Respeite bloqueios de cópia do arquivo. |
| Nenhuma captura para o link | Capture a página/seção que contém aquele `node-id`. |
| Algumas camadas de componentes faltam | Limite conhecido de bibliotecas remotas; não inferir conteúdo ausente. |
| Login ou verificação do Figma | Conclua normalmente no navegador; o leitor não recebe sua senha. |

Se continuar, [abra um relato](https://github.com/lucasrmed/figma-local/issues/new/choose) com versões e passos. Use um arquivo de exemplo sem dados privados.

### Perfil personalizado de Chrome

Para automação com uma pasta de dados própria, registre o leitor nesse diretório:

```bash
node scripts/install.mjs --profile-dir 'PASTA_DE_DADOS_DO_CHROME'
```

Use a pasta de dados do navegador, não a subpasta de um perfil como `Default`. Não copie perfis ou credenciais para o repositório.

## Remover

Remova a extensão em `chrome://extensions`. Pelo Finder, mova para o Lixo as pastas `~/.codex/skills/figma-local` e `~/.codex/skills/figma-local-setup` e o aplicativo em `~/Library/Application Support/FigmaLocal/app`.

Para remover também as capturas e a configuração, mova a pasta `~/Library/Application Support/FigmaLocal` inteira para o Lixo. Se quiser guardar os designs capturados, preserve a subpasta `cache`.

Os registros locais do leitor se chamam `com.figmalocal.reader.json`, dentro de `NativeMessagingHosts` nas pastas `~/Library/Application Support/Google/Chrome`, `~/Library/Application Support/Google/ChromeForTesting` e `~/Library/Application Support/Chromium`. Remova somente esse arquivo de cada pasta existente; não remova a pasta do navegador. Perfis personalizados registrados também podem conter esse arquivo.
