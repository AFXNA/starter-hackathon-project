# PresentU — running the prototype

```
[ React (Vite) ]  --upload mp3/wav-->  [ FastAPI (app.py) ]
                                              |-- transcriber.py  -> Gemini (transcription)
                                              |-- judgeFunctions.py -> Ollama / Gemma (scoring)
```

## 1. Backend (Python)

Prereqs: Python 3.10+, [Ollama](https://ollama.com) running with the judge model pulled,
and a `GEMINI_API_KEY` in `prototype/.env`.

```bash
cd prototype
pip install -r requirements.txt
ollama pull hf.co/unsloth/gemma-4-E4B-it-GGUF:IQ4_XS   # one time
uvicorn app:app --reload --port 8000
```

Endpoints (all POSTs are `multipart/form-data`):
- `GET  /api/health`
- `POST /api/transcribe`          `file=`            -> `{ transcript }`
- `POST /api/pitch`               `file=` (audio)    -> presentation verdict + `transcript`
- `POST /api/judge/presentation`  `text=` or `file=` -> verdict  (file = audio, transcribed first)
- `POST /api/judge/code`          `text=` or `file=` -> verdict  (file = a source file)
- `POST /api/judge/creativity`    `text=`            -> verdict

A verdict is `{ judge, raw, parsed, elapsed_s }` where `parsed` is the judge's
JSON object (scores / strengths / risks / opinion) or `null` if it didn't return
valid JSON.

## 2. Frontend (React)

Prereqs: Node 18+.

```bash
cd prototype/frontend
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8000`, so run the backend first.
To point at a different backend: `VITE_API_TARGET=http://host:port npm run dev`
(dev proxy) or build with `VITE_API_BASE=http://host:port npm run build`.

## Notes

- Supported uploads: mp3, wav, mpeg/mpga, m4a, ogg, webm.
- The dedicated `gemini-3.5-transcribe` model returns nothing via one-shot
  `generate_content`; `transcriber.py` uses `gemini-3.6-flash` instead
  (override with `TRANSCRIBE_MODEL`).
- `/api/judge` needs `ollama serve` up; a 502 with "ollama failed" means it isn't.
