---
name: figma-local-setup
description: "Instale, verifique ou repare a configuração do Figma Local no Mac: leitor, extensão Chrome e skill de consulta. Use quando o usuário pedir a instalação ou a configuração deste pacote."
---

# Configurar Figma Local

Esta versão atende macOS com Node.js 22 ou posterior; recomende uma versão LTS mantida. A invocação para instalar autoriza a configuração local necessária; publicação nas lojas e alterações no Figma são etapas separadas.

Execute `node scripts/setup.mjs` relativo à pasta desta skill. O script encontra o pacote e roda o instalador. Ele preserva o cache do usuário, registra a comunicação nativa com Chrome/Chrome for Testing e instala as duas skills. Não sobrescreve skills ou instalações sem o marcador de propriedade Figma Local.

Leia o resultado do instalador e abra a página de configuração retornada. O Chrome precisa carregar a pasta `extension` indicada pelo instalador como extensão sem compactação. Depois, confirme pelo painel que o leitor está conectado. Não declare a extensão carregada antes dessa verificação.

Para diagnóstico, use o status do helper da skill `figma-local` e o painel da extensão. Não reinstale dependências repetidamente sem um erro novo. O usuário usa a própria conta Figma; peça login somente se a sessão precisar dele. Finalize com os componentes instalados, o que foi testado e qualquer ação manual ainda necessária.
