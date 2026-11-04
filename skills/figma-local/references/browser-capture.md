# Captura pelo navegador

Use esta rota quando agent-browser estiver disponível e a sessão já puder acessar o arquivo. Não leia/exporte cookies para consultar uma captura existente.

O helper da skill encaminha os comandos ao leitor:

```bash
node scripts/reader.mjs capture --session NOME_DA_SESSAO --url 'LINK_DO_FRAME' --scope node
node scripts/reader.mjs capture --session NOME_DA_SESSAO --url 'LINK_DO_ARQUIVO' --scope selection
node scripts/reader.mjs capture --session NOME_DA_SESSAO --url 'LINK_DA_PAGINA' --scope page
node scripts/reader.mjs import --url 'LINK_DO_ARQUIVO' --scope selection
```

`node` exige que somente o nó do link esteja selecionado. `selection` captura a seleção atual. `page` seleciona todos os objetos da página: use somente quando o pedido incluir essa página. Verifique o arquivo da aba antes de capturar.

Se o login estiver ausente, peça ao usuário que entre no Figma; continue trabalhos independentes. Se a interface mudar ou a ação Copiar falhar, use a cópia manual/extensão. Não amplie o escopo nem use a REST API para contornar uma restrição de cópia. A captura é de leitura; não mude as configurações do design para fazê-la funcionar.
