# Histórico de versões

## 0.3.0 — 2026-11-03

- Instalação por **Instalar.cmd** no Windows, no perfil do usuário, sem administrador.
- Captura pela cópia HTML nativa do Windows, preservando UTF-8 e verificação de nova cópia.
- Registro do leitor no Chrome e Chromium por HKCU, com o mesmo ID da extensão.
- Descoberta da instalação pelas skills no Mac e Windows.
- Pacotes separados por sistema, documentação e testes de integração Windows na CI.
- Captura real no Figma do Windows ainda depende de feedback da beta; a CI usa cópias sintéticas no clipboard real.

## 0.2.0 — 2026-11-03

Primeira beta pública para macOS.

- Extensão Chrome com painel lateral, confirmação de captura, busca e seleção de frames.
- Leitor local via Native Messaging, sem API REST/MCP oficial do Figma.
- Captura de seleção/página e importação manual pelo clipboard.
- Índices, resumos e consultas por nó com limites e paginação.
- Skills `figma-local` e `figma-local-setup` e instalador no perfil do usuário.
- Decoder MIT isolado das dependências não utilizadas do servidor MCP.
- Pacote distribuível com verificação de integridade e exclusão de dados locais.
- Documentação em português e inglês, guia de contribuição e templates de issues.

### Limites conhecidos

Captura somente no macOS. Formato interno do Figma sujeito a mudanças. Interiores remotos, imagens, interações e medidas calculadas podem ficar ausentes. Extensão carregada manualmente; sem loja ou atualização automática. Consulte [VALIDATION.md](docs/VALIDATION.md) para separar resultados observados de testes pendentes.
