from pathlib import Path

import ollama

_HERE = Path(__file__).parent


def _load(name: str) -> str:
    return (_HERE / name).read_text(encoding="utf-8")


codeJudgeInstruct = _load("codeJudge.system")
presentationJudgeInstruct = _load("presentationJudge.system")
creativityJudgeInstruct = _load("creativityJudge.system")

model = "hf.co/unsloth/gemma-4-E4B-it-GGUF:IQ4_XS"


def _judge(system_prompt: str, user_content: str) -> str:
    response = ollama.chat(
        model=model,
        format="json",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
    )
    return response["message"]["content"]


def doCodeJudge(code: str) -> str:
    return _judge(codeJudgeInstruct, code)


def doPresentationJudge(presentation: str) -> str:
    return _judge(presentationJudgeInstruct, presentation)


def doCreativityJudge(ideaprompt: str) -> str:
    return _judge(creativityJudgeInstruct, ideaprompt)
