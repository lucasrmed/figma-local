# Arquitetura

1. **Extensão Chrome:** painel lateral, escolha de escopo, catálogo e links para o pedido ao Codex. Scripts limitados ao domínio Figma; sem acesso geral a outros sites.
2. **Captura:** botão de confirmação dentro do Figma aciona o menu normal Copiar. Não acessa APIs privadas ou memória interna do aplicativo. Uma falha oferece importação manual.
3. **Comunicação nativa:** conexão local do Chrome por stdin/stdout. Não abre porta HTTP, não precisa de token Figma nem inclui servidor MCP. O processo só aceita o ID fixo da extensão. Pedidos limitados a ping, arquivos, consultas, preparação e importação.
4. **Leitor Node.js:** verifica arquivo/seleção/nova cópia, decodifica o binário com módulos MIT e bibliotecas fixadas e escreve cache no perfil do usuário (modos restritos no Mac; ACLs herdadas no Windows). Preparações expiram em dois minutos e são de uso único. A importação aguarda até vinte segundos por uma nova cópia; o painel limita cada pedido a quarenta e cinco segundos.
5. **Cache:** binário identificado por SHA-256, índice e resumos pré-calculados; capturas diferentes coexistem. Saídas com data, `live:false`, limite e paginação. Consultas de índice/resumo evitam decodificar a árvore inteira.
6. **Skill:** descobre o leitor instalado e chama consultas curtas. Pode trabalhar sem extensão usando uma captura existente ou uma cópia manual. Conteúdo do design é tratado como dado não confiável.

## Escolhas do produto

Escopo explícito, limite de caracteres e índice primeiro são decisões do projeto. A documentação do Figma não garante o formato da área de transferência. Dados auxiliares não equivalem às camadas renderizadas. A data é da importação, não do último salvamento no Figma.

A interface usa JavaScript nativo, sem framework, recursos remotos ou código inline. O decodificador fica no processo Node porque a dependência compila o esquema binário dinamicamente; a política da extensão permanece restrita.

## Windows

O leitor usa Windows PowerShell 5.1 e chamadas Win32 para ler `HTML Format` (CF_HTML em UTF-8). O adaptador abre, copia e fecha a área de transferência; libera a memória sem tomar posse dela. `GetClipboardSequenceNumber` detecta uma nova cópia. Um processo persistente compila o adaptador uma vez e atende as consultas de mudança, evitando abrir PowerShell a cada intervalo. Não observa o clipboard continuamente: só responde a capturas solicitadas. A ponte usa pipes locais e não abre janelas nem portas de rede.

O instalador registra o manifesto em HKCU para Chrome/Chromium e cria um launcher `.cmd` que encaminha o protocolo binário para Node.js. Não altera a política de execução do PowerShell. Computadores gerenciados podem impedir execução do adaptador; nesses casos, é necessário respeitar a política da organização.

## Distribuição

O ZIP instala no perfil do usuário, sem privilégios de administrador. A configuração nativa aceita somente a origem da extensão. O instalador não substitui pastas/skills de outra origem. No Windows, o registro HKCU vale para os perfis do Chrome desse usuário. No Mac, para perfis personalizados de automação, use `node scripts/install.mjs --profile-dir 'PASTA_DE_DADOS_DO_CHROME'`.

O `plugin.json` agrupa as skills e indica a skill de configuração. A instalação local de skills funciona independentemente de publicação em um catálogo. A beta ainda exige carregar a extensão sem compactação; não está publicada na Chrome Web Store.
