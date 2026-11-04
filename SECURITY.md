# Segurança

A série **0.2.x** é experimental e recebe correções conforme a disponibilidade do mantenedor. Ainda não há auditoria independente nem garantia de prazo de resposta.

## Relatar uma vulnerabilidade

Use [Report a vulnerability](https://github.com/lucasrmed/figma-local/security/advisories/new), na aba **Security**, para um relato privado ao mantenedor. Inclua a versão, o impacto e passos mínimos de reprodução com dados sintéticos. Não abra uma issue pública com credenciais, perfis, capturas privadas ou detalhes de exploração ainda não corrigidos.

Bugs comuns sem impacto de segurança podem ser relatados pelos [templates de issues](https://github.com/lucasrmed/figma-local/issues/new/choose).

## Superfície e limites

A extensão acessa arquivos Figma nos domínios declarados, injeta o botão de captura e se comunica com um processo local por Native Messaging. Esse processo verifica a origem da extensão, limita mensagens e só oferece operações de consulta/captura. O leitor decodifica um formato binário interno ao Figma usando módulos de terceiros sob MIT; não trate esse formato como contrato público estável.

O cache contém dados do design. Ele usa permissões locais restritas e não deve ser enviado ao GitHub. Leia [PRIVACY.md](PRIVACY.md) e mantenha o Node.js em uma versão LTS mantida. Revisar novas permissões, dependências ou serviços faz parte da revisão de contribuições.

## English

Use the repository's private **Report a vulnerability** channel for security issues. Provide synthetic reproduction data and the affected version. Do not publish credentials, browser profiles or private design captures. Ordinary bugs can use public issue templates.
