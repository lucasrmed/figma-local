#!/bin/sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Instale uma versão LTS mantida do Node.js (22 ou posterior) em https://nodejs.org/en/download e abra este instalador novamente."
  printf "Pressione Enter para fechar. "
  read -r resposta
  exit 1
fi
node scripts/install.mjs --open
