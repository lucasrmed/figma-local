# Validação da beta

Data: 03/11/2026. Resultados locais, sem garantia de desempenho em outros arquivos.

## Leitor

Uma página real já aberta no Figma produziu 286 objetos copiados, 191 frames candidatos e 13.402 registros. A captura e importação levaram 4,92–5,92 s. Consultas com índices pré-calculados levaram aproximadamente 58 ms: 10 frames em 1.746 caracteres ou resumos de três frames em 3.507 caracteres. Esses tempos excluem abrir o arquivo e autenticar. Uma consulta posterior pelo helper da skill instalada retornou 10 dos 191 frames em 129 ms e 1.746 caracteres, com paginação; esse tempo inclui iniciar o helper e o leitor. Identificadores e conteúdo do arquivo privado não fazem parte do pacote distribuído.

Os testes usam um binário sintético e cobrem normalização de links, origem da cópia, separação por ID, limite de escopo, múltiplas capturas, paginação, JSON limitado, importação validada e protocolo nativo fragmentado/UTF-8. Os testes descritos nesta primeira etapa passaram. As duas skills passaram pelo validador da ferramenta de criação de skills. Todos os arquivos JavaScript passaram pela verificação de sintaxe.

## Instalação e extensão

Instalação real do leitor e das skills no macOS, com migração do cache privado existente. Instalação e reinstalação também verificadas em um usuário isolado, incluindo caminho com espaços e apóstrofo. O helper da skill localizou a instalação e consultou um frame real. A comunicação nativa respondeu ao protocolo pelo launcher instalado.

No Chrome for Testing 151, a extensão carregou, conectou ao leitor e exibiu o catálogo real com 191 frames candidatos, em lotes de 20. Busca por nome retornou nove resultados; seleção e consulta de resumo pelo painel retornaram uma tela com 2.329 caracteres de JSON formatado. A interface foi conferida por screenshot a 420 e 320 px de largura, sem rolagem horizontal. A consulta é local: nenhum MCP do Figma foi usado nesses testes.

O ZIP foi inspecionado: lista explícita de arquivos, instalador executável, sem cache, dependências instaladas, perfil ou identificadores do arquivo privado. Ele baixa as dependências na instalação.

## Captura real pela extensão

Após o login, a confirmação dentro do Figma importou um frame: 1 raiz copiada, 1 frame candidato e 353 registros. A etapa de importação local reportou 1.641 ms; isso não inclui todos os cliques e a preparação no navegador.

A captura da página pela extensão também foi registrada com `captureMethod: chrome-copy`, escopo `page`, 286 raízes, 191 frames candidatos e 13.402 registros. A decodificação/indexação local dessa captura reportou 407 ms. O conteúdo privado continua fora do pacote.

Uma tentativa da página excedeu a espera inicial de seis segundos pela nova cópia; uma tentativa seguinte concluiu. A espera foi ampliada para vinte segundos, com resposta da extensão limitada a quarenta e cinco segundos. Esse teto não adiciona demora quando a cópia fica pronta antes. Os testes também verificam que a importação aguarda uma nova cópia. A repetição da captura real após esse ajuste do limite ficou pendente: a janela de teste deixou de responder após recarregar a extensão. A captura real bem-sucedida é anterior a essa alteração de limite.

O comportamento em versões anteriores do Chrome, em outros computadores e com todas as variantes de links permanece aberto. A beta não foi publicada em loja.

## Limitações conhecidas

Formato interno do Figma sem contrato público. Captura no Mac e Windows (Windows adicionado na 0.3.0); Linux não implementado. Interiores remotos, imagens, interações e medidas calculadas podem faltar. Mudanças de idioma/interface podem exigir ajuste do acionamento de Copiar; a importação manual continua disponível. Não há publicação em loja, assinatura/notarização de aplicativo ou atualização automática. Instalação exige Node.js e acesso ao npm.

## Preparação da primeira release pública

Na preparação do GitHub, sete testes passaram, incluindo uma verificação que exclui cache/credenciais/dependências do pacote e rejeita links simbólicos. Manifestos, sintaxe, exemplos sem chaves reais e links internos da documentação foram conferidos.

O ZIP público foi extraído e instalado em um perfil local isolado com caminho contendo espaços e apóstrofo. A skill encontrou a instalação, o host nativo respondeu ao ping e as verificações do aplicativo instalado passaram. O arquivo SHA256SUMS acompanha o pacote. A integração de captura permaneceu a mesma da validação real descrita acima.

A CI foi configurada para Node 22/24 em macOS e Node 22 em Linux; o resultado remoto deve ser consultado na aba Actions. Testes do parser no Linux não significam suporte à captura nesse sistema.

## Redução das dependências antes da publicação

A auditoria sinalizou Zod na cadeia do pacote do servidor MCP, que não é iniciado pelo produto. Os três módulos MIT de decodificação/estilo foram preservados sem alterações em `vendor/figma-clipboard`; a origem e os hashes estão registrados ali. O pacote do servidor foi retirado e restaram somente fzstd 0.1.1 e kiwi-schema 0.5.0.

Depois da mudança, os sete testes passaram e `npm audit --omit=dev` reportou zero vulnerabilidades conhecidas na consulta de preparação da release. Consultas reais de nó, árvore e componentes foram comparadas com a versão anterior e retornaram resultados idênticos, sem copiar os dados do design para o repositório. O pacote atualizado também passou pela verificação de conteúdo e checksum.

## Windows na beta 0.3.0

A [CI da implementação Windows](https://github.com/lucasrmed/figma-local/actions/runs/41763792695) passou em todos os cinco ambientes: Node 22/24 no Windows e Mac, mais Node 22 no Linux. No Windows, o Chrome for Testing 157.0.8103.38 carregou a extensão, encontrou o registro nativo, importou o clipboard real com dados sintéticos e consultou resumos com acentos preservados. Isso valida a integração com o navegador; o login e a captura no Figma do Windows permanecem como teste manual da beta.

A suíte atual contém dez testes, incluindo os escopos/tickets com adaptadores assíncronos para Mac e Windows, pastas de instalação e empacotamento. A CI adiciona Node 22/24 em Windows x64, mantendo Mac e testes do parser no Linux.

O teste de integração do Windows usa uma VM descartável e grava uma cópia sintética no clipboard real, com o mesmo formato `HTML Format` e binário de fixture do leitor. Ele verifica instalação e atualização com preservação do cache, caminhos com espaços/apóstrofo/acentos/`&`/`%`/`!`, registro HKCU, launcher batch, prefixo binário de mensagens, UTF-8, ticket de nova cópia, expiração por uso e consulta pela skill instalada. O teste é separado de `npm test` para não alterar clipboard/registro na máquina de quem desenvolve.

O teste de Chrome for Testing no Windows abre um perfil temporário com a extensão instalada, usa a descoberta real do host pelo navegador e consulta/importa os dados sintéticos pela extensão. A captura no editor Figma autenticado do Windows permanece pendente de teste manual; os resultados do Mac acima não são apresentados como teste visual do Windows.

A primeira rodada identificou uma falha do `cpSync` recursivo no runtime Node 22 do Windows durante a cópia das skills. O instalador passou a copiar explicitamente diretórios/arquivos e recusa symlinks. A leitura de CF_HTML usa bytes UTF-8 diretamente, preservando os comentários de dados do Figma.

A instalação atual também foi conferida no Mac em perfil temporário com acentos, espaço e apóstrofo, incluindo helper da skill, ping pelo launcher e verificações no aplicativo instalado. A auditoria npm não encontrou vulnerabilidades conhecidas na consulta desta etapa. Os ZIPs usam lista explícita de arquivos, checksum e modos portáveis; não incluem dados do design ou perfil do navegador.
