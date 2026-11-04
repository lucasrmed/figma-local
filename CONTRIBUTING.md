# Contribuir com Figma Local

Contribuições em português e inglês são bem-vindas. Você pode melhorar a documentação, relatar bugs reproduzíveis ou propor código. Para instalar e usar a ferramenta, siga o [README](README.md).

## Fork e primeiro pull request

1. Clique em [Fork](https://github.com/lucasrmed/figma-local/fork) e crie sua cópia.
2. Clone seu fork e crie uma branch:

   ```bash
   git clone https://github.com/SEU_USUARIO/figma-local.git
   cd figma-local
   git switch -c melhoria-descritiva
   npm ci --ignore-scripts
   ```

3. Faça uma mudança focada, seguindo a estrutura e o estilo do projeto.
4. Execute:

   ```bash
   npm run check
   npm test
   npm run package
   npm run verify-package
   ```

5. Faça commit, envie sua branch e abra um pull request para `lucasrmed/figma-local`, branch `main`. Descreva o problema, o resultado e como verificou.

Para sincronizar o fork, use o recurso **Sync fork** do GitHub ou configure `https://github.com/lucasrmed/figma-local.git` como remoto `upstream`.

## O que preservar

- A leitura continua local e respeita as permissões do arquivo Figma.
- Capturas, perfis, credenciais, cookies e conteúdo privado não entram em commits, exemplos ou issues. Use os binários sintéticos gerados em `test/fixture.mjs`.
- Índice e resumo vêm antes da árvore completa. Preserve limites, paginação, datas, tipo real e identidade arquivo + nó.
- Informe lacunas de componentes remotos. Não descreva snapshots como validação visual atual.
- Dependências permanecem fixadas no lockfile. Mudanças de permissões ou novos serviços remotos exigem discussão clara no PR.
- O código usa módulos JavaScript nativos e `node:test`. Reutilize a infraestrutura existente.

## Instalar sua versão para testar

No Mac ou Windows, `node scripts/install.mjs --open` instala sua cópia no perfil do usuário. Depois recarregue a extensão e a aba do Figma. Essa instalação pode substituir outra instalação gerenciada do Figma Local, preservando o cache. No Mac, para um teste isolado do instalador, use `--home 'PASTA_TEMPORARIA'`; não use a pasta de outra pessoa.

A criação/verificação dos ZIPs usa Python 3 no ambiente de desenvolvimento/CI; quem instala a release precisa apenas do Node.js e do Chrome. `npm run package -- --target windows` ou `--target macos` permite escolher o pacote.

## Antes de mudanças maiores

Abra uma proposta explicando o caso de uso, o limite atual e o comportamento desejado. O [roadmap](docs/ROADMAP.md) mostra ideias, não promessas de prazo. Suporte a outro sistema operacional precisa de testes reais do clipboard, instalação e comunicação do navegador; testes do parser sozinhos não validam a integração. Registre separadamente a captura no Figma autenticado. `test/windows-smoke.mjs` altera clipboard e registros HKCU: é reservado às VMs descartáveis da CI, não ao computador de uso diário.

## Licença e convivência

Ao enviar uma contribuição, confirme que pode compartilhá-la sob a licença MIT do projeto. Mantenha as atribuições de terceiros. Siga o [código de conduta](CODE_OF_CONDUCT.md).

## English summary

Fork the repository, create a focused branch, install dependencies with `npm ci --ignore-scripts`, then run the four checks above. Describe the behavior and validation in your pull request. Use synthetic/public examples only. Discuss larger changes first, preserve local processing and bounded output, and contribute only code you are entitled to share under MIT.
