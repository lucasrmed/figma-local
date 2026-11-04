# Privacidade e dados locais

O Figma Local não possui servidor remoto, conta própria, analytics ou telemetria. Esta descrição cobre o código deste projeto; serviços externos usados por você têm seus próprios termos e políticas.

## O que o leitor usa

- O link Figma informado, para identificar arquivo e nó.
- A cópia HTML/binária da seleção, lida da área de transferência no momento da captura/importação.
- Nome do arquivo, IDs de nós, textos, propriedades, referências e outros dados presentes nessa cópia.
- Caminhos locais e data de importação para localizar e identificar capturas.

A captura substitui o conteúdo da área de transferência. O leitor não solicita senha, token Figma, cookies ou perfil do navegador. O leitor inclui módulos MIT de decodificação e não instala nem inicia um servidor MCP.

## Onde ficam os dados

Na instalação padrão, os dados ficam em `~/Library/Application Support/FigmaLocal/cache`, no perfil do usuário. Consultas diretas sem instalação podem usar `.cache` na raiz do leitor. Esses locais são privados ao computador e ficam fora do pacote publicado. Não são uma cópia de segurança nem uma sincronização com o Figma.

A extensão mantém informação da captura atual na memória da sessão do Chrome. O leitor responde às consultas localmente pela comunicação nativa, sem abrir um servidor HTTP.

## Quando há acesso à rede

A instalação usa o npm para baixar dependências públicas fixadas no lockfile. O Chrome acessa o Figma normalmente usando sua sessão. O README pode carregar badges do GitHub e do shields.io quando visualizado.

Ao usar a skill, o conteúdo solicitado entra no contexto do modelo/serviço que você escolheu. O armazenamento local da captura não impede esse envio das partes consultadas. O projeto não promete uso de IA sem custo nem define a retenção de dados do seu provedor de IA.

## Controle e remoção

Capture somente arquivos que pode acessar, compartilhe apenas os links necessários e siga as regras do seu workspace. Consulte a data da captura antes de usá-la como evidência.

Você pode remover capturas pela pasta do cache ou seguir as [instruções de remoção](docs/INSTALL.md#remover). Não envie capturas, cookies, perfis ou dados confidenciais para issues, pull requests ou forks públicos.
