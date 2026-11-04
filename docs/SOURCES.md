# Documentação consultada

Acesso: **03/11/2026**. Runtime de validação: Node.js **23.11.0**, agent-browser **0.27.0**, Chrome for Testing **151**. Dependência direta: **figma-clipboard-mcp 0.2.0**, versões transitivas fixadas em `package-lock.json`. A extensão exige Chrome 116+; a captura desta versão atende macOS. A distribuição exige Node.js 22+ e recomenda uma versão LTS mantida; o runtime existente de teste não foi atualizado globalmente.

| Fonte de primeira parte | Decisão ou limite apoiado |
| --- | --- |
| [Chrome: native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) | Mensagens JSON UTF-8 com prefixo de quatro bytes; resposta até 1 MB; origem fixa sem wildcard. Conexão persistente e registro do host por usuário. Chrome for Testing possui localização própria do host. |
| [Chrome: painel lateral](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) | Painel MV3 e abertura pelo ícone. Compatibilidade mínima conservadora Chrome 116. |
| [Chrome: política de conteúdo](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy) | Scripts locais, sem eval ou scripts inline na extensão. Decodificação fica no leitor Node. |
| [Chrome: chave da extensão](https://developer.chrome.com/docs/extensions/reference/manifest/key) | Chave pública fixa para manter o mesmo ID e restringir a origem do host. Não distribuir chave privada. |
| [Chrome: content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) | Captura em mundo isolado e ponte pelo worker; validar origem e arquivo. |
| [Chrome: mensagens](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) | Listener com resposta assíncrona e `return true` para compatibilidade. |
| [Figma: copiar e colar](https://help.figma.com/hc/en-us/articles/4409078832791-Copy-and-paste-objects) | Usar a ação normal de cópia e respeitar as permissões do arquivo. |
| [Figma: links](https://help.figma.com/hc/en-us/articles/360045942953-Add-links-to-text) | Distinguir arquivo, página e seleção; IDs não determinam o tipo do objeto. |
| [Figma: inspeção](https://help.figma.com/hc/en-us/articles/22012921621015-Guide-to-inspecting) | Conferir propriedades disponíveis pelo painel; não inferir valores ausentes. |
| [Apple: NSPasteboard.changeCount](https://developer.apple.com/documentation/appkit/nspasteboard/changecount) | Verificar mudança da área de transferência antes de importar uma captura automática. |
| [Node 23.11: processos](https://nodejs.org/download/release/v23.11.0/docs/api/child_process.html) | Ferramentas com argumentos, limites de tempo/buffer e sem interpolar links no shell. |
| [Node 23.11: URL](https://nodejs.org/download/release/v23.11.0/docs/api/url.html) | Validar protocolo/host e preservar parâmetros codificados. |
| [Node 23.11: arquivos](https://nodejs.org/download/release/v23.11.0/docs/api/fs.html) | Arquivos locais restritos e publicação do índice por rename. |
| [Node: versões e manutenção](https://nodejs.org/en/about/previous-releases) | Recomendar LTS mantida na instalação; Node 20 já está fora de manutenção. |
| [Agent-browser: comandos](https://agent-browser.dev/commands) | Rota opcional com sessão persistente e interação DOM, sem screenshots a cada passo. |
| [OpenAI: plugins](https://developers.openai.com/plugins/build/plugins) | Manifesto com skills e referência à skill de configuração; MCP é opcional. |
| [OpenAI: skills](https://developers.openai.com/plugins/concepts/skills) | Pacotes de instruções e recursos reutilizáveis. |

## Formato experimental

[figma-clipboard-mcp](https://github.com/georg3103/figma-clipboard-mcp), versão 0.2.0, e [Kiwi](https://github.com/evanw/kiwi) documentam o decodificador utilizado. São fontes dos autores dessas bibliotecas, **não um contrato oficial do formato Figma**. Interiores de componentes remotos e outros dados ausentes permanecem lacunas declaradas. Mudanças de formato devem causar erro, não interpretação inventada.

## Decisões locais e hipóteses

Índice primeiro, escopo explícito, 6.000 caracteres por padrão, paginação e cache privado são decisões deste projeto. Não garantimos a mesma velocidade em outros arquivos, nem cobertura integral dos dados visuais. Links de branch, seção e protótipo têm normalização e testes de escopo; a validação real de todas as variantes permanece aberta.

## Publicação open source — 03/11/2026

| Fonte | Decisão ou restrição |
| --- | --- |
| [GitHub: licença](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository), [MIT](https://choosealicense.com/licenses/mit/) | Arquivo LICENSE na raiz e preservação de atribuições. MIT é a escolha deste projeto. |
| [GitHub: releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) | Tag, notas e ZIP instalável como asset; beta marcada como prerelease. |
| [GitHub: fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo), [stars](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars) | Instruções de contribuição e apoio voluntário no README. |
| [actions/checkout](https://github.com/actions/checkout), v7.0.1 | Checkout fixado por SHA, sem persistência de credencial. |
| [actions/setup-node](https://github.com/actions/setup-node), v7.1.0 | Matriz Node 22/24, lockfile e cache automático desativado. |
| [actions/upload-artifact](https://github.com/actions/upload-artifact), v7.0.2 | Artefato do pacote com retenção de sete dias; release guarda o download público. |
| [GitHub: e-mail de commits](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address) | Autoria usa o endereço noreply do GitHub, preservando o e-mail pessoal. |
| [GitHub: relatos privados](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository) | Canal privado para relatos de segurança. |

Plataformas desta etapa: Git/GitHub, GitHub CLI 2.102.0, Actions e npm. O protocolo de captura e as dependências do leitor foram preservados. As versões/SHA das Actions foram verificadas nas releases oficiais e na API do GitHub.
