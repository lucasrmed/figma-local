# Histórico de versões

## 0.2.0 — 2026-11-03

Primeira beta pública para macOS.

- Extensão Chrome com painel lateral, confirmação de captura, busca e seleção de frames.
- Leitor local via Native Messaging, sem API REST/MCP oficial do Figma.
- Captura de seleção/página e importação manual pelo clipboard.
- Índices, resumos e consultas por nó com limites e paginação.
- Skills `figma-local` e `figma-local-setup` e instalador no perfil do usuário.
- Pacote distribuível com verificação de integridade e exclusão de dados locais.
- Documentação em português e inglês, guia de contribuição e templates de issues.

### Limites conhecidos

Captura somente no macOS. Formato interno do Figma sujeito a mudanças. Interiores remotos, imagens, interações e medidas calculadas podem ficar ausentes. Extensão carregada manualmente; sem loja ou atualização automática. Consulte [VALIDATION.md](docs/VALIDATION.md) para separar resultados observados de testes pendentes.
