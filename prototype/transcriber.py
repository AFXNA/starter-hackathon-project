import logging
import mimetypes
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

load_dotenv()

# Quiet the SDK's "Direct use of automatic function calling" notice.
logging.getLogger("google_genai").setLevel(logging.ERROR)

# Multimodal Gemini model that accepts audio input. Override with env if needed.
MODEL = os.environ.get("TRANSCRIBE_MODEL", "gemini-3.6-flash")

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = (
    "Transcribe this audio recording verbatim. "
    "Output only the spoken words as plain text - no timestamps, no commentary, "
    "no speaker labels."
)

_CONFIG = types.GenerateContentConfig(
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
)


def transcribe(audio: str | Path | bytes, mime_type: str | None = None,
               retries: int = 4) -> str:
    """Return the transcript of an audio file path or raw audio bytes."""
    if isinstance(audio, (str, Path)):
        path = Path(audio)
        data = path.read_bytes()
        mime_type = mime_type or mimetypes.guess_type(path.name)[0]
    else:
        data = audio

    part = types.Part.from_bytes(data=data, mime_type=mime_type or "audio/mpeg")

    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=MODEL, contents=[PROMPT, part], config=_CONFIG,
            )
            return (response.text or "").strip()
        except genai_errors.ServerError as e:  # 503 high demand, etc.
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            print(f"[transcribe] {e.code} from Gemini, retrying in {wait}s...")
            time.sleep(wait)

    return ""

"""
if __name__ == "__main__":
    import sys

    src = sys.argv[1] if len(sys.argv) > 1 else "sample.mp3"
    print(transcribe(src))
"""