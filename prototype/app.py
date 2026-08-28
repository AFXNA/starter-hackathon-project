"""PresentU API server.

Three judges on a hackathon panel, plus audio transcription:

    POST /api/transcribe          file            -> { transcript }
    POST /api/judge/presentation  text= | file=  -> verdict   (file = audio, transcribed first)
    POST /api/judge/code          text= | file=  -> verdict   (file = a source file)
    POST /api/judge/creativity    text=          -> verdict

All judge/transcribe requests are multipart/form-data (fields: `text`, `file`).
    POST /api/pitch               file            -> { transcript, presentation }

Run:
    uvicorn app:app --reload --port 8000
"""

import json
import time
import traceback

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from judgeFunctions import doCodeJudge, doCreativityJudge, doPresentationJudge
from transcriber import transcribe

app = FastAPI(title="PresentU API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
    "audio/webm", "audio/ogg", "audio/m4a", "audio/mp4",
}
AUDIO_EXT = (".mp3", ".wav", ".mpeg", ".mpga", ".m4a", ".ogg", ".webm")

JUDGES = {
    "presentation": doPresentationJudge,
    "code": doCodeJudge,
    "creativity": doCreativityJudge,
}


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


# ----- transcription --------------------------------------------------------

@app.post("/api/transcribe")
async def api_transcribe(file: UploadFile = File(...)) -> dict:
    return {"transcript": await _transcribe_upload(file)}


# ----- judges --------------------------------------------------------------

@app.post("/api/judge/{kind}")
async def api_judge(
    kind: str,
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
) -> dict:
    if kind not in JUDGES:
        raise HTTPException(404, f"Unknown judge '{kind}'. Try: {', '.join(JUDGES)}")

    transcript = None
    if file is not None:
        content = await _read_upload(file)
        if kind == "code":
            body = content.decode("utf-8", errors="replace")
        else:
            transcript = await _transcribe_bytes(content, file.content_type)
            body = transcript
    elif text and text.strip():
        body = text
    else:
        raise HTTPException(400, "Provide `text` (JSON body) or upload a `file`.")

    verdict = _run_judge(kind, body)
    if transcript is not None:
        verdict["transcript"] = transcript
    return verdict


# ----- convenience: audio pitch -> transcript + presentation verdict -------

@app.post("/api/pitch")
async def api_pitch(file: UploadFile = File(...)) -> dict:
    transcript = await _transcribe_upload(file)
    verdict = _run_judge("presentation", transcript)
    verdict["transcript"] = transcript
    return verdict


# ----- helpers -----------------------------------------------------------

def _run_judge(kind: str, body: str) -> dict:
    t0 = time.time()
    try:
        raw = JUDGES[kind](body)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            502, f"Judge (ollama) failed: {exc}. Is `ollama serve` running "
                 f"with the model pulled?",
        )
    parsed = None
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        pass
    return {"judge": kind, "raw": raw, "parsed": parsed,
            "elapsed_s": round(time.time() - t0, 1)}


async def _read_upload(file: UploadFile) -> bytes:
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file.")
    return data


async def _transcribe_upload(file: UploadFile) -> str:
    name = (file.filename or "").lower()
    if file.content_type not in AUDIO_TYPES and not name.endswith(AUDIO_EXT):
        raise HTTPException(
            415, f"Unsupported audio type: {file.content_type or name}. "
                 f"Upload mp3, wav, or mpeg.",
        )
    return await _transcribe_bytes(await _read_upload(file), file.content_type)


async def _transcribe_bytes(data: bytes, mime_type: str | None) -> str:
    try:
        text = transcribe(data, mime_type=mime_type or "audio/mpeg")
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(502, f"Transcription failed: {exc}")
    if not text:
        raise HTTPException(
            422, "Transcription returned no text (silent or unclear audio?).",
        )
    return text
