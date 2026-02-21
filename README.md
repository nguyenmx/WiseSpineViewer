# WiseSpine

A custom OHIF v3 medical imaging viewer with an integrated AI chat assistant, built on top of the OHIF monorepo and backed by an Orthanc DICOM server.

---

## Repository Layout

```
WiseSpine/
├── Viewers/                        — OHIF v3 monorepo (the main viewer app)
├── ohif-modes/
│   ├── wise-spine/                 — WiseSpine OHIF mode
│   └── wisespine-extension-layout/ — Custom layout extension + AI chatbot
└── orthanc-setup-samples/
    └── docker/ohif/                — Docker Compose stack (Orthanc + nginx)
```

---

## Prerequisites

Install the following before starting:

| Tool | Version | Notes |
|------|---------|-------|
| Git | any | For cloning the repo |
| Node.js | 20.x | Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage versions |
| Yarn | ≥ 1.20 | `npm install -g yarn` |
| Docker Desktop | any | Includes Docker Compose |
| Ollama | any | **Optional** — only needed for local LLM models |

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone <repo-url> WiseSpine
cd WiseSpine
```

### 2. Install Node dependencies

```bash
cd Viewers
yarn install
```

This installs all OHIF monorepo packages and the custom WiseSpine extension/mode via Yarn workspaces. It will take a few minutes on the first run.

### 3. Create the AI config file

The AI chatbot requires an API key file that is **not committed to git**. Create it manually:

```
ohif-modes/wisespine-extension-layout/src/components/aiConfig.ts
```

```ts
export const GEMINI_API_KEY = 'your-gemini-api-key';     // leave blank string '' to disable
export const DEEPSEEK_API_KEY = 'your-deepseek-api-key'; // leave blank string '' to disable
```

If a key is left as an empty string `''`, that provider will be hidden from the model dropdown.

---

## Running the Stack

You need two things running at the same time: the **Orthanc backend** (via Docker) and the **OHIF dev server**.

### Step 1 — Start Orthanc (Docker)

```bash
cd orthanc-setup-samples/docker/ohif
docker compose up
```

This starts:
- **Orthanc** DICOM server with DICOMweb enabled (accessible at `http://localhost:8053`)
- **nginx** reverse proxy routing `/orthanc-container/` to Orthanc

Leave this terminal running.

### Step 2 — Start the OHIF dev server

Open a new terminal:

```bash
cd Viewers
APP_CONFIG=config/local_orthanc.js yarn dev
```

The viewer will be available at **`http://localhost:3000`**.

> The `local_orthanc.js` config points OHIF's DICOMweb data source at the Orthanc container running via Docker.

---

## Using the AI Chat Panel

The AI chat tab appears in the **right side panel** of the viewer whenever you open a study.

### Ollama (local, no API key required)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull mistral-small3.1   # supports images
   ollama pull llama3.2            # text only
   ```
3. Start Ollama with CORS enabled so the browser can reach it:
   ```bash
   # macOS / Linux
   OLLAMA_ORIGINS=http://localhost:3000 ollama serve

   # Windows (PowerShell)
   $env:OLLAMA_ORIGINS="http://localhost:3000"; ollama serve
   ```
4. Open the viewer, select a study, open the **AI Chat** tab, and pick the model from the dropdown.

### DeepSeek (cloud)

Add your key to `aiConfig.ts` (`DEEPSEEK_API_KEY`). Models `deepseek-v3` and `deepseek-reasoner` will appear in the dropdown automatically.

### Gemini (cloud)

Add your key to `aiConfig.ts` (`GEMINI_API_KEY`). Model `gemini-2.5-flash` will appear in the dropdown.

---

## Uploading DICOM Files

1. Open `http://localhost:3000`
2. On the study list page, use the **Upload** button (top right) to drag-and-drop `.dcm` files
3. Orthanc stores them persistently in a Docker volume

Alternatively, upload directly to Orthanc's REST API:

```bash
curl -X POST http://localhost:8053/instances --data-binary @your-file.dcm
```

---

## Common Issues

**`yarn install` fails with peer dependency errors**
Run `yarn install --ignore-engines` or ensure you are on Node 20.x.

**Blank study list after Docker starts**
Orthanc takes ~10 seconds to be fully ready. Refresh the page. If it persists, check `docker compose logs orthanc-container`.

**Ollama models do not appear in the dropdown**
Ensure Ollama is running with `OLLAMA_ORIGINS` set to `http://localhost:3000`. Without this, the browser will get a CORS error and the model list will be empty.

**AI Chat: "Thinking…" spinner never resolves**
- For Ollama: confirm `ollama serve` is running and the selected model is pulled (`ollama list`).
- For cloud providers: check that the API key in `aiConfig.ts` is valid and not empty.

**Port 3000 already in use**
Set a different port: `OHIF_PORT=3001 APP_CONFIG=config/local_orthanc.js yarn dev`

---

## Project-Specific Files

| File | Purpose |
|------|---------|
| `Viewers/platform/app/src/pluginImports.js` | Registers the `@wisespine/extension-layout` extension and `wise-spine` mode with OHIF |
| `Viewers/platform/app/public/config/local_orthanc.js` | OHIF data source config pointing at Orthanc via Docker |
| `ohif-modes/wisespine-extension-layout/src/components/aiConfig.ts` | API keys — **never commit this file** |
| `ohif-modes/wisespine-extension-layout/src/components/CHATBOT_README.md` | Detailed chatbot component documentation |
