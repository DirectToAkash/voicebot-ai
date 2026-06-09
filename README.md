# 🎙️ VoiceBot AI — voice.mybots.in

> Free AI Text to Voice | React + Vite frontend · Node.js + Express backend

## Quick Start

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env
# → Edit .env, add your TTS API key

# 3. Build React frontend
npm run build

# 4. Start server
npm start
# → http://localhost:3000
```

## Dev (two terminals)

```bash
# Terminal 1 — React hot reload (port 5173, proxies /api to 3000)
npm run dev

# Terminal 2 — Express API
npm run dev:server
```

## Push to GitHub

```bash
git add .
git commit -m "✨ Update"
git push
```

## Deploy on Hostinger

1. `npm install && npm run build` on the server
2. Startup file: `server.js`
3. Set env vars in hPanel → Node.js → Environment Variables
4. Restart app

## TTS Providers (.env)

| Variable | Value |
|---|---|
| `TTS_PROVIDER` | `azure` / `elevenlabs` / `google` / `playht` |
| `AZURE_TTS_KEY` | Your Azure key |
| `AZURE_TTS_REGION` | e.g. `eastus` |
| `ELEVENLABS_API_KEY` | Your ElevenLabs key |
| `GOOGLE_TTS_KEY` | Your Google key |
| `SITE_URL` | `https://voice.mybots.in` |

Made with ❤️ for mybots.in
