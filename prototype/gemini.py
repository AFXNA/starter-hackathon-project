import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

interaction = client.interactions.create(
    model="gemma-4-26b-a4b-it",
    input= """import ollama
import os
import subprocess

with open("codeJudge.system", "r", encoding="utf-8") as file:
    codeJudgeInstruct = file.read()

with open("presentationJudge.system", "r", encoding="utf-8") as file:
    presentationJudgeInstruct = file.read()

with open("creativityJudge.system", "r", encoding="utf-8") as file:
    creativityJudgeInstruct = file.read()


model = "hf.co/unsloth/gemma-4-E4B-it-GGUF:UD-Q4_K_XL"






def doCodeJudge(code):

    codeJudgeAI = ollama.chat(model=model, messages=[
    {
        'role': 'system',
        'content': codeJudgeInstruct, 
    },
    {
        'role': 'user',
        'content': code,
    },
    ])
    return codeJudgeAI['message']['content']

def doPresentationJudge(presentation):
    presentationJudgeAI = ollama.chat(model=model, messages=[
    {
    'role': 'system',
    'content': presentationJudgeInstruct.read(), 
    },
    {
    'role': 'user',
    'content': presentation,
    },
    ])
    
    return presentationJudgeAI['message']['content']

def doCreativityJudge(ideaprompt):
    creativityJudgeAI = ollama.chat(model=model, messages=[
    {
    'role': 'system',
    'content': creativityJudgeInstruct.read(), 
    },
    {
    'role': 'user',
    'content': '',
    },
    ])
    return doCreativityJudge['message']['content']

print(doCodeJudge(some code)""",
)

print(interaction.output_text)
