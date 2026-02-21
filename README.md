# WiseSpine

A custom OHIF v3 medical imaging viewer with an integrated AI chat assistant, built on top of the OHIF monorepo and backed by an Orthanc DICOM server.

---

## Repository Layout

```
WiseSpine/
├── Viewers/                        — OHIF v3 monorepo (the main viewer app)
├── ohif-modes/
│   ├── wise-spine/                 — WiseSpine OHIF mode (route: /wiseSpine)
│   └── wisespine-extension-layout/ — Custom layout extension + AI chatbot
└── orthanc-setup-samples/
    └── docker/ohif/                — Docker Compose stack (Orthanc + nginx)
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Git | any | For cloning |
| Node.js | ≥ 18 | Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| Yarn | ≥ 1.20 | `npm install -g yarn` |
| Docker Desktop | any | Must be running before Step 2 |
| Ollama | any | **Optional** — only needed for local AI models |

---

## Architecture Overview

The setup has two parts running simultaneously:

| Part | Port | What it does |
|------|------|-------------|
| Docker stack | 80 | Runs Orthanc PACS behind an nginx reverse proxy |
| Webpack dev server | 3000 | Runs the custom WiseSpine OHIF viewer, proxying DICOMweb requests to the Docker stack |

---

## Step 1 — Clone the Orthanc Setup Samples

From the WiseSpine project root:

```bash
cd WiseSpine
git clone https://github.com/orthanc-server/orthanc-setup-samples.git
```

> Reference video: https://www.youtube.com/watch?v=pRI4GIgDYYY

---

## Step 2 — Start the Orthanc Docker Stack

```bash
cd orthanc-setup-samples/docker/ohif
docker compose up --build
```

Verify all containers are running:

```bash
docker ps
```

You should see **5 containers**: `nginx`, `ohif`, `orthanc-container`, `orthanc-plugin`, and `orthanc-index`.

**Docker URLs (once running):**

| URL | Purpose |
|-----|---------|
| `http://localhost/orthanc-container/ui/app/` | Orthanc Explorer — upload DICOM files here |
| `http://localhost/orthanc-plugin/ui/app/` | Orthanc Explorer (plugin variant) |
| `http://localhost/ohif/` | Stock OHIF viewer (not the custom WiseSpine build) |

---

## Step 3 — Upload DICOM Images to Orthanc

1. Open `http://localhost/orthanc-container/ui/app/`
2. Click the **Upload** button
3. Drag and drop your `.dcm` files
4. The study will appear in the study list after upload completes

---

## Step 4 — Configure OHIF to Connect to Orthanc

### 4a. Set the config file

In `Viewers/platform/app/.env`, set:

```
APP_CONFIG=config/local_orthanc.js
```

### 4b. Verify the data source endpoints

In [Viewers/platform/app/public/config/local_orthanc.js](Viewers/platform/app/public/config/local_orthanc.js), the data source must use these relative paths:

```js
wadoUriRoot: '/orthanc-container/dicom-web',
qidoRoot:    '/orthanc-container/dicom-web',
wadoRoot:    '/orthanc-container/dicom-web',
```

### 4c. Add the Webpack proxy rule

In `Viewers/platform/app/.webpack/webpack.pwa.js`, add an entry to the `devServer.proxy` array:

```js
{
  context: ['/orthanc-container'],
  target: 'http://localhost',
  changeOrigin: true,
}
```

This forwards all `/orthanc-container/*` requests from the dev server (port 3000) to the Docker nginx (port 80), avoiding CORS issues.

---

## Step 5 — Start the OHIF Dev Server

```bash
cd Viewers
yarn install
yarn dev
```

The dev server starts at **`http://localhost:3000`**.

---

## Step 6 — View Your DICOM Images

1. Open `http://localhost:3000` — the Study List shows studies from Orthanc
2. Click a study to open it
3. Select the **WiseSpine** mode to view it in the custom layout

To open a study directly in WiseSpine mode:

```
http://localhost:3000/wiseSpine?StudyInstanceUIDs=<STUDY_INSTANCE_UID>
```

---

## AI Chat Panel

The AI Chat tab appears in the right side panel whenever a study is open.

### Ollama — local models (no API key required)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull mistral-small3.1   # vision: supports image input
   ollama pull llama3.2            # text only
   ```
3. Start Ollama with CORS allowed for the dev server:
   ```bash
   # macOS / Linux
   OLLAMA_ORIGINS=http://localhost:3000 ollama serve

   # Windows (PowerShell)
   $env:OLLAMA_ORIGINS="http://localhost:3000"; ollama serve
   ```
4. Open a study, click the **AI Chat** tab, and select the model from the dropdown.

### DeepSeek — cloud

Add your key to `aiConfig.ts` (`DEEPSEEK_API_KEY`). Models `deepseek-v3` and `deepseek-reasoner` will appear automatically.

### Gemini — cloud

Add your key to `aiConfig.ts` (`GEMINI_API_KEY`). Model `gemini-2.5-flash` will appear automatically.

### Creating aiConfig.ts

This file is **gitignored and must be created manually**:

```
ohif-modes/wisespine-extension-layout/src/components/aiConfig.ts
```

```ts
export const GEMINI_API_KEY = 'your-gemini-api-key';     // '' to disable
export const DEEPSEEK_API_KEY = 'your-deepseek-api-key'; // '' to disable
```

---

## Troubleshooting

**`EADDRINUSE` error on port 3000**

Another process is using port 3000. Find and kill it:

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**"Data source is not configured correctly or is not running"**

- Verify Docker containers are running: `docker ps`
- Check the endpoint is reachable: open `http://localhost/orthanc-container/dicom-web/studies` in your browser
- Ensure `APP_CONFIG=config/local_orthanc.js` is set in `.env`
- Ensure the Webpack proxy rule for `/orthanc-container` exists in `webpack.pwa.js`

**CORS errors in browser console**

The dev server proxy is not forwarding requests. Verify the proxy entry in `webpack.pwa.js` includes the `/orthanc-container` context.

**No studies appear in the study list**

Confirm you uploaded DICOM files via the Orthanc Explorer UI at `http://localhost/orthanc-container/ui/app/`.

**Ollama models do not appear in the dropdown**

Ensure Ollama is running with `OLLAMA_ORIGINS` set to `http://localhost:3000`. Without this the browser receives a CORS error and the model list stays empty.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `Viewers/platform/app/.env` | Sets which config file OHIF uses |
| `Viewers/platform/app/public/config/local_orthanc.js` | OHIF DICOMweb data source config |
| `Viewers/platform/app/.webpack/webpack.pwa.js` | Webpack dev server proxy rules |
| `orthanc-setup-samples/docker/ohif/docker-compose.yml` | Docker stack definition |
| `ohif-modes/wise-spine/src/index.jsx` | WiseSpine mode definition |
| `ohif-modes/wisespine-extension-layout/` | Custom layout extension + AI chatbot |
| `ohif-modes/wisespine-extension-layout/src/components/aiConfig.ts` | API keys — **never commit** |
| `ohif-modes/wisespine-extension-layout/src/components/CHATBOT_README.md` | Chatbot component documentation |
