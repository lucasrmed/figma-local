<img src="assets/logo.svg" width="64" height="64" alt="Figma Local">

# Figma Local

**Read many Figma screens with compact context.** A Chrome extension, local reader and Codex skills.

[Português](README.md) · [Windows download](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-windows-0.3.0.zip) · [Mac download](https://github.com/lucasrmed/figma-local/releases/download/v0.3.0/figma-local-macos-0.3.0.zip) · [Installation guide](docs/INSTALL.md) · [Report a bug](https://github.com/lucasrmed/figma-local/issues/new/choose)

Copy a selection or page once, then query a local frame catalog, summaries and specific details. The reader uses Figma's normal **Copy** action and does not call the official Figma MCP or REST API. This is an independent project, not affiliated with Figma or OpenAI.

## Install

You need **Windows or macOS**, **Chrome 116+**, a [maintained Node.js LTS release](https://nodejs.org/en/download) **22 or newer**, and access to the Figma file. Codex is required to use the bundled skills. Installation downloads npm dependencies.

1. [Download the beta for your OS](https://github.com/lucasrmed/figma-local/releases/tag/v0.3.0), extract all files and open **Instalar.cmd** (Windows) or **Instalar.command** (Mac) inside **FigmaLocal**. No administrator access is needed.
2. Follow the generated guide. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select:

   ```text
   Windows: %LOCALAPPDATA%\FigmaLocal\app\extension
   Mac: ~/Library/Application Support/FigmaLocal/app/extension
   ```

3. Open your Figma file in Chrome and sign in. Open **Figma Local** from the extensions menu and check **Leitor conectado** (reader connected).
4. Choose **Capturar seleção** (capture selection) or **Capturar página** (capture page), then confirm using the button inside Figma.
5. Select frames in the catalog, choose **Copiar pedido para o Codex** (copy request), and paste into Codex. Invoke `$figma-local`. Reopen Codex if the new skills are not listed.

The current extension UI is in Portuguese; capture menu detection supports Portuguese and English Figma labels. Other Figma interface languages are not validated. The beta is not published in the Chrome Web Store.

## What's included

- Chrome side panel for capture, search, selection and links.
- Local Node.js reader with a precomputed index, summaries and bounded JSON output.
- `figma-local` skill for queries and `figma-local-setup` for setup.
- Optional manual-copy and agent-browser paths. The skill can query existing captures without the extension.

The panel shows the latest capture per file. Earlier captures remain available to the reader. Frame links stay scoped to their IDs; section links list their contained frames. A file-root link starts with the local index. Identical names do not merge different IDs.

## Context and privacy

Local capture and indexing make no model calls. Agent queries still use your model's plan and context. The default response budget is **6,000 characters**, with pagination; characters do not measure billed tokens.

Captures stay on your computer, and the reader has no remote server or telemetry. Data requested by a skill enters your model's context. Never attach private captures, browser profiles or credentials to public issues.

Captures are snapshots, not live validation. The clipboard format is internal to Figma and may change. Remote component interiors, images, prototype interactions and computed measurements may be missing. Figma's file permissions remain in effect. Copy replaces your clipboard. Linux capture is not implemented. Windows requires native Windows Node.js and Windows PowerShell 5.1; do not install the reader through WSL. Automated Windows tests cover the real clipboard and native protocol with synthetic data; a live Figma capture on Windows still needs beta feedback.

[Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Validation](docs/VALIDATION.md)

## From source

```bash
git clone https://github.com/lucasrmed/figma-local.git
cd figma-local
npm ci --ignore-scripts
node scripts/install.mjs --open
```

For development:

```bash
npm run check
npm test
npm run package
npm run verify-package
```

## Support and contribute

If this helps you, click **Star ⭐** at the top of the repository. [Fork the project](https://github.com/lucasrmed/figma-local/fork) to create your own version or propose a pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Issues and contributions are welcome in Portuguese and English.

## License

[MIT](LICENSE), copyright Lucas Medeiros. See [third-party notices](THIRD_PARTY_NOTICES.md) for dependencies.
