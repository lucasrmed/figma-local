# Instalação e primeiro uso

[Voltar ao projeto](../README.md) · [English quick start](../README.en.md)

## 1. Preparar o computador

Esta beta atende **Windows e macOS**, com **Chrome 116+** e **Node.js 22+**. Instale uma [versão LTS mantida do Node.js](https://nodejs.org/en/download), com npm. No Windows, instale o Node para Windows e rode o leitor no próprio Windows, sem WSL; Windows PowerShell 5.1 faz parte do sistema. O alvo dos testes automatizados é Windows x64. Use uma versão do sistema compatível com a versão do Node instalada.

É necessário acesso normal ao arquivo no Figma. Não é necessário criar token Figma, conectar servidor MCP ou informar credenciais ao leitor. O instalador trabalha no seu usuário e não solicita administrador. A instalação precisa de internet para baixar duas dependências pelo npm. Para usar as skills, tenha o Codex instalado.

## 2. Baixar a versão

Abra a [release v0.3.0](https://github.com/lucasrmed/figma-local/releases/tag/v0.3.0) e escolha:

| Sistema | Download | Abra depois de extrair |
| --- | --- | --- |
| Windows | [figma-local-windows-0.3.0.zip](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-windows-0.3.0.zip) | **Instalar.cmd** |
| Mac | [figma-local-macos-0.3.0.zip](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-macos-0.3.0.zip) | **Instalar.command** |

No Windows, clique com o botão direito no ZIP e escolha **Extrair tudo**. Entre na pasta **FigmaLocal** extraída; não execute o instalador de dentro do ZIP. Os arquivos automáticos **Source code** são uma alternativa para desenvolvimento.

O arquivo **SHA256SUMS** acompanha os downloads. No PowerShell, `Get-FileHash .\figma-local-windows-0.3.0.zip -Algorithm SHA256` permite comparar o hash com o publicado. No Mac, use `shasum -a 256 figma-local-macos-0.3.0.zip`.

## 3. Instalar o leitor e as skills

Abra **Instalar.cmd** no Windows ou **Instalar.command** no Mac. O instalador baixa as dependências e abre um guia com a pasta instalada. Se o sistema ou a política da sua organização bloquear a execução, confira a origem do pacote e respeite a política; não é necessário desativar proteções do computador.

Também é possível abrir o Terminal/PowerShell dentro da pasta extraída e executar:

```text
node scripts/install.mjs --open
```

A instalação cria:

| Conteúdo | Windows | Mac |
| --- | --- | --- |
| Leitor e extensão | `%LOCALAPPDATA%\FigmaLocal\app` | `~/Library/Application Support/FigmaLocal/app` |
| Capturas locais | `%LOCALAPPDATA%\FigmaLocal\cache` | `~/Library/Application Support/FigmaLocal/cache` |
| Configuração | `%LOCALAPPDATA%\FigmaLocal\install.json` | `~/Library/Application Support/FigmaLocal/install.json` |
| Skills | `%USERPROFILE%\.codex\skills\figma-local` e `figma-local-setup` | `~/.codex/skills/figma-local` e `figma-local-setup` |

No Windows, a comunicação é registrada no usuário atual (HKCU) para Chrome e Chromium. No Mac, é registrada para Chrome, Chrome for Testing e Chromium. Pastas/skills de outra origem não são substituídas. Capturas existentes são preservadas nas atualizações normais.

## 4. Carregar a extensão

1. No Chrome, abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor** / **Developer mode**.
3. Escolha **Carregar sem compactação** / **Load unpacked**.
4. Selecione a pasta **instalada**, indicada no guia:

   | Sistema | Pasta da extensão |
   | --- | --- |
   | Windows | `%LOCALAPPDATA%\FigmaLocal\app\extension` |
   | Mac | `~/Library/Application Support/FigmaLocal/app/extension` |

   No Windows, cole o caminho na barra de endereço do seletor e pressione Enter. No Mac, pressione **⌘⇧G** para colar o caminho.

5. A extensão deve aparecer como **Figma Local**, com o ID `cjkffgojhenipdmabikjdfjkjoiajece`.
6. Pelo menu de extensões, abra o painel e confira **Leitor conectado**. Fixe o ícone se quiser acesso mais fácil.

## 5. Capturar suas telas

Abra o arquivo Figma no Chrome com sua própria conta. Caso o Figma tente abrir o aplicativo, escolha **Abra aqui em vez disso**.

- **Seleção:** selecione frames ou uma seção no painel de camadas; abra Figma Local e escolha **Capturar seleção**.
- **Página:** abra a página desejada e escolha **Capturar página**. Esse escopo inclui todos os objetos da página atual.

Confirme pelo botão que aparece dentro do Figma. Aguarde **Captura pronta** e volte ao painel. Páginas grandes podem demorar mais; o leitor aguarda até vinte segundos pela nova cópia. Se expirar, tente novamente ou use a importação manual. Não copie outro conteúdo durante a operação.

O catálogo pode incluir frames de anotações. Busque pelo nome, confira ID e dimensões e selecione os estados que interessam.

## 6. Usar no Codex

Marque os frames no painel e escolha **Copiar pedido para o Codex**. Cole no Codex e acrescente o que deseja fazer. A skill `$figma-local` começa pelos resumos e consulta detalhes sob demanda.

Se a skill não aparecer, abra uma nova conversa ou reabra o Codex. Ela é instalada no perfil padrão `.codex/skills` do seu usuário. Instalações com diretórios personalizados podem exigir configuração manual desse destino.

## Alternativa: copiar e importar manualmente

1. No painel Figma Local, abra **Já copiei no Figma** e confira o link do arquivo de origem.
2. Volte ao Figma, selecione os objetos e use **Copiar**: **Ctrl+C** no Windows ou **⌘C** no Mac.
3. Volte ao painel e clique em **Importar cópia manual**. Não use Copiar link entre as etapas: isso substituiria os dados do design.

A importação manual verifica o arquivo de origem, mas depende de você ter copiado a seleção correta. Uma captura local não comprova a aparência visual completa.

## Atualizar

Baixe uma nova release e execute seu instalador. Depois, em `chrome://extensions`, clique em **Recarregar** no Figma Local e recarregue a aba do Figma. O cache permanece no computador. Capture novamente para consultar mudanças no design.

## Resolver problemas

| Mensagem/situação | Próximo passo |
| --- | --- |
| Node.js não encontrado | Instale Node.js LTS com npm e reabra o instalador. No Windows, use a versão Windows do Node. |
| A janela do instalador fechou ou mostrou erro | Abra PowerShell/Terminal na pasta extraída e execute `node scripts/install.mjs --open` para ler o erro. |
| Leitor desconectado | Execute o instalador, confirme o ID da extensão e use **Reconectar leitor**. |
| Windows bloqueia o PowerShell/adaptador | Consulte a política do computador. A captura precisa de PowerShell e acesso à área de transferência da sessão local. |
| Extensão ficou inválida após atualizar | Recarregue a extensão e a aba do Figma. |
| A cópia pertence a outro arquivo | Confira o link de origem, copie a seleção no arquivo correto e importe novamente. |
| Nenhuma nova cópia | Tente novamente com o Figma em foco ou use a importação manual. Respeite bloqueios de cópia do arquivo. |
| Nenhuma captura para o link | Capture a página/seção que contém aquele `node-id`. |
| Algumas camadas de componentes faltam | Limite conhecido de bibliotecas remotas; não inferir conteúdo ausente. |
| Login ou verificação do Figma | Conclua normalmente no navegador; o leitor não recebe sua senha. |

Se continuar, [abra um relato](https://github.com/lucasrmed/figma-local/issues/new/choose) com versões do sistema, Chrome, Node e passos. Use um arquivo de exemplo sem dados privados. A captura real com Figma no Windows ainda precisa de feedback da beta; veja o que foi automatizado em [VALIDATION.md](VALIDATION.md).

### Perfil personalizado de Chrome

No Mac, para automação com uma pasta de dados própria:

```text
node scripts/install.mjs --profile-dir "PASTA_DE_DADOS_DO_CHROME"
```

Use a pasta de dados do navegador, não a subpasta `Default`. No Windows, o registro HKCU vale para os perfis do Chrome desse usuário. Não copie perfis ou credenciais para o repositório.

## Remover

Remova a extensão em `chrome://extensions` e as duas pastas de skills instaladas em `.codex/skills` do seu usuário.

**Windows:** remova `%LOCALAPPDATA%\FigmaLocal\app`. Para remover também capturas e configuração, remova `%LOCALAPPDATA%\FigmaLocal` inteira. Se quiser guardar os designs, preserve `cache`. Pelo PowerShell, remova somente os registros deste leitor:

```powershell
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.figmalocal.reader" /f
reg delete "HKCU\Software\Chromium\NativeMessagingHosts\com.figmalocal.reader" /f
```

**Mac:** mova `~/Library/Application Support/FigmaLocal/app` para o Lixo. Para remover capturas e configuração, remova a pasta `FigmaLocal` inteira, preservando `cache` se quiser guardar os designs.

Os registros do Mac se chamam `com.figmalocal.reader.json`, dentro de `NativeMessagingHosts` nas pastas `~/Library/Application Support/Google/Chrome`, `~/Library/Application Support/Google/ChromeForTesting` e `~/Library/Application Support/Chromium`. Remova somente esse arquivo de cada pasta existente. Perfis personalizados também podem conter esse arquivo.
