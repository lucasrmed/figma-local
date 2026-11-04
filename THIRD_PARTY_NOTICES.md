# Dependências de terceiros

## Decoder derivado de figma-clipboard-mcp 0.2.0

Os módulos `figparse.js`, `scene.js` e `style.js`, em `vendor/figma-clipboard`, são cópias sem alterações dos arquivos publicados em [figma-clipboard-mcp 0.2.0](https://github.com/georg3103/figma-clipboard-mcp), commit `72607e2c3bdd53d40ecede07aa972163c769125f`. A origem e os hashes estão em `vendor/figma-clipboard/UPSTREAM.json`.

A distribuição inclui somente esses módulos MIT de decodificação/estilo. O pacote npm e seu servidor MCP não são instalados. Isso preserva o comportamento de leitura e evita dependências do servidor que não fazem parte deste produto.

### Licença MIT do decoder

MIT License

Copyright (c) 2026 georg3103

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Dependências npm

- [fzstd 0.1.1](https://github.com/101arrowz/fzstd): descompressão Zstandard, licença MIT.
- [kiwi-schema 0.5.0](https://github.com/evanw/kiwi): esquema e leitura binária Kiwi, licença MIT.

Essas bibliotecas são instaladas pelo npm nas versões fixadas em `package-lock.json`. Suas licenças acompanham a instalação em `node_modules`. O ZIP público preserva esta atribuição e a licença do decoder vendorizado.
