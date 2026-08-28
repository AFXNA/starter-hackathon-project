<h1 align="center">🧑‍⚖️ GemmaJudges</h1>
<h3 align="center"><em>An AI judging panel that scores your hackathon pitch, code, and idea — 1 to 10, with real feedback</em></h3>

---

## 🏷 What it is

**GemmaJudges** helps hackathon teams pressure-test their submission *before* they face real judges. Drop in one of three things and a panel of AI judges scores it on a rubric and hands back structured feedback — strengths, risks, an opinion, and citations.

| Input | You give it | What happens |
|-------|-------------|--------------|
| **Pitch** | a recorded talk (`mp3` / `wav` / `mpeg` / `m4a` / `ogg` / `webm`) | Gemini transcribes it → the **presentation** judge scores the transcript |
| **Code** | paste a source file or load one from disk | the **code** judge scores it |
| **Creativity** | describe the idea in plain text | the **creativity** judge scores it |

Two model layers:

- **Transcription** — Google Gemini (cloud) → `prototype/transcriber.py`
- **Judging** — local Gemma via [Ollama](https://ollama.com) → `prototype/judgeFunctions.py`

---

## ⚡ How it works

```
[ React (Vite) ]  --upload / paste-->  [ FastAPI (app.py) ]
                                              |-- transcriber.py    -> Gemini      (transcription)
                                              |-- judgeFunctions.py -> Ollama/Gemma (scoring, JSON rubric)
```

Every judge returns a **verdict**:

```jsonc
{
  "judge": "presentation",
  "raw": "…the exact string the model returned…",
  "parsed": { "scores": { "overall": 7, … }, "strengths": [], "risks": [], "opinion": "", "citations": [] },
  "elapsed_s": 4.2,
  "transcript": "…only present when audio was transcribed…"
}
```

If the model doesn't return valid JSON, `parsed` is `null` and the UI shows the raw text.

---

## 🔧 Built with

| Layer | Tech | Role |
|-------|------|------|
| Frontend | React 18 + Vite | tabs, the three input panels, the `<Verdict>` gauge / score bars / strengths-risks view |
| Backend | FastAPI + Uvicorn | one HTTP API; all POSTs are `multipart/form-data` (`text=` and/or `file=`) |
| Transcription | `google-genai` → `gemini-3.6-flash` | verbatim audio → text, with exponential backoff on 503 |
| Judging | `ollama` → `hf.co/unsloth/gemma-4-E4B-it-GGUF:IQ4_XS` | `format="json"` output matched to the rubric in each `*.system` file |

---

## 🚀 Run it locally

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10+ | backend |
| Node.js | 18+ | frontend |
| [Ollama](https://ollama.com) | any | must be running with the judge model pulled |
| Gemini API key | — | free from [aistudio.google.com](https://aistudio.google.com) |

### 1. Backend

```bash
cd prototype
pip install -r requirements.txt

# one-time: pull the judge model
ollama pull hf.co/unsloth/gemma-4-E4B-it-GGUF:IQ4_XS

# create prototype/.env with your key
echo "GEMINI_API_KEY=AIza..." > .env

uvicorn app:app --reload --port 8000
```

Make sure `ollama serve` is running in a separate terminal (a `502 "ollama failed"` means it isn't).

### 2. Frontend

```bash
cd prototype/frontend
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8000`, so start the backend first.
Point at a different backend with `VITE_API_TARGET=http://host:port npm run dev` (dev) or `VITE_API_BASE=http://host:port npm run build` (prod build).

### 3. Try it

1. Open http://localhost:5173
2. On the **Pitch** tab, upload `prototype/sample.mp3`
3. Click **Judge the pitch** — you'll see the transcript, then a scored verdict

---

## 📡 API

All POST bodies are `multipart/form-data`. CORS is open (`allow_origins=["*"]`).

| Method | Path | Fields | Returns |
|--------|------|--------|---------|
| `GET` | `/api/health` | — | `{ ok: true }` |
| `POST` | `/api/transcribe` | `file=` (audio) | `{ transcript }` |
| `POST` | `/api/pitch` | `file=` (audio) | presentation verdict + `transcript` |
| `POST` | `/api/judge/presentation` | `text=` **or** `file=` (audio, transcribed first) | verdict |
| `POST` | `/api/judge/code` | `text=` **or** `file=` (source file) | verdict |
| `POST` | `/api/judge/creativity` | `text=` | verdict |

---

## 📁 Repository layout

```
prototype/
├── app.py                  FastAPI server
├── transcriber.py          transcribe(audio) -> text, via Gemini
├── judgeFunctions.py       doCodeJudge / doPresentationJudge / doCreativityJudge
├── codeJudge.system        system prompt + JSON rubric  ┐
├── presentationJudge.system                             ├ one per judge
├── creativityJudge.system                               ┘
├── requirements.txt
├── RUNNING.md              run instructions
├── sample.mp3              test audio
└── frontend/               React + Vite single-page app
    └── src/
        ├── App.jsx         tabs + the three input panels + fetch logic
        ├── Verdict.jsx     renders a verdict (gauge, score bars, lists)
        └── index.css       dark theme, per-tab accent colors
frontend/                   early Flutter UI experiment (models.dart, widgets/)
PROJECT_NOTES.txt           full design notes
```

---

## 🔮 What's next

- **In-browser recording** — a `MediaRecorder` flow in the Pitch panel so users can record directly instead of only uploading
- **`POST /api/judge/all`** — run every applicable judge and return a combined scorecard, with an "Overall" tab
- **Persist results** — a store + `GET /api/results` so a second screen (or the Flutter UI) can show the latest verdict
- **Stream judge output** — token streaming instead of one blocking `ollama.chat` call to hide cold-model latency
- **Validate judge JSON** against the rubric schema before trusting `parsed`
- **Deploy** — serve `frontend/dist` from FastAPI, lock CORS to the real origin

---

## 🧯 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502 Judge (ollama) failed` | `ollama serve` isn't running, or the model isn't pulled |
| `502 Transcription failed` | check `GEMINI_API_KEY` in `prototype/.env` |
| `415 Unsupported audio type` | upload `mp3`, `wav`, or `mpeg` |
| `422 Transcription returned no text` | audio was silent or unclear |
| frontend can't reach the API | start the backend on port 8000 before `npm run dev` |
