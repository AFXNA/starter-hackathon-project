import { useRef, useState } from "react";
import Verdict, { VerdictSkeleton } from "./Verdict.jsx";

// Dev: Vite proxies /api -> Python server. Prod: set VITE_API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE || "";

const AUDIO_ACCEPT = ".mp3,.wav,.mpeg,.mpga,.m4a,.ogg,.webm,audio/*";
const CODE_ACCEPT =
  ".py,.js,.jsx,.ts,.tsx,.java,.go,.rs,.c,.cpp,.rb,.php,.cs,.kt,.swift,.txt";

const TABS = [
  { id: "pitch", label: "Pitch" },
  { id: "code", label: "Code" },
  { id: "creativity", label: "Creativity" },
];

export default function App() {
  const [tab, setTab] = useState("pitch");
  return (
    <div className="wrap" data-accent={tab}>
      <div className="brand">
        <div className="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
            <path d="m16 16 6-6" /><path d="m8 8 6-6" />
            <path d="m9 7 8 8" /><path d="m21 11-8-8" />
          </svg>
        </div>
        <div>
          <h1 className="center">GemmaJudges</h1>
        </div>
      </div>
      <p className="sub">A hackathon judging panel — presentation, code &amp; creativity, scored 1&ndash;10.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id}
            className={`tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pitch" && <PitchPanel />}
      {tab === "code" && <CodePanel />}
      {tab === "creativity" && <CreativityPanel />}
    </div>
  );
}

/* ---------- request + state helpers ---------- */

async function postForm(path, form) {
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

function useJudge() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await fn());
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, result, run };
}

function Output({ busy, error, result }) {
  return (
    <>
      {error && <div className="panel reveal"><div className="err">{error}</div></div>}
      {busy && <VerdictSkeleton />}
      {!busy && result?.transcript && (
        <div className="panel transcript reveal">
          <h2>Transcript</h2>
          <div className="body">{result.transcript}</div>
        </div>
      )}
      {!busy && result && <Verdict data={result} />}
    </>
  );
}

/* ---------- Pitch (audio upload) ---------- */

function PitchPanel() {
  const { busy, error, result, run } = useJudge();
  const [file, setFile] = useState(null);
  const [hover, setHover] = useState(false);
  const inputRef = useRef(null);

  return (
    <>
      <div className="panel">
        <label
          className={`drop${hover ? " hover" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setHover(true); }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => { e.preventDefault(); setHover(false); setFile(e.dataTransfer.files?.[0] || null); }}
        >
          <input ref={inputRef} type="file" accept={AUDIO_ACCEPT}
                 onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="hint">
            {file ? "Choose a different recording" : "Drop an mp3 / wav / mpeg recording, or click"}
          </div>
          {file && <div className="file">{file.name} · {(file.size / 1048576).toFixed(2)} MB</div>}
        </label>
        <div className="row">
          <button disabled={!file || busy}
            onClick={() => run(() => {
              const fd = new FormData();
              fd.append("file", file, file.name);
              return postForm("/api/pitch", fd);
            })}>
            {busy ? <><span className="spinner" />&nbsp;&nbsp;Transcribing &amp; judging…</> : "Judge the pitch"}
          </button>
          {file && !busy && (
            <button className="ghost"
              onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}>
              Clear
            </button>
          )}
        </div>
      </div>
      <Output busy={busy} error={error} result={result} />
    </>
  );
}

/* ---------- Code ---------- */

function CodePanel() {
  const { busy, error, result, run } = useJudge();
  const [text, setText] = useState("def add(a, b):\n    return a + b\n");
  const fileRef = useRef(null);

  return (
    <>
      <div className="panel">
        <div className="row" style={{ margin: "0 0 12px" }}>
          <button className="ghost" onClick={() => fileRef.current?.click()}>Load a file…</button>
          <input ref={fileRef} type="file" accept={CODE_ACCEPT} style={{ display: "none" }}
                 onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
          <span className="file">or paste below</span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} rows={14} />
        <div className="row">
          <button disabled={!text.trim() || busy}
            onClick={() => run(() => {
              const fd = new FormData();
              fd.append("text", text);
              return postForm("/api/judge/code", fd);
            })}>
            {busy ? <><span className="spinner" />&nbsp;&nbsp;Judging…</> : "Judge the code"}
          </button>
        </div>
      </div>
      <Output busy={busy} error={error} result={result} />
    </>
  );
}

/* ---------- Creativity ---------- */

function CreativityPanel() {
  const { busy, error, result, run } = useJudge();
  const [text, setText] = useState("");

  return (
    <>
      <div className="panel">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
          placeholder="Describe the idea: the job it does, the constraint, why this stack had to exist." />
        <div className="row">
          <button disabled={!text.trim() || busy}
            onClick={() => run(() => {
              const fd = new FormData();
              fd.append("text", text);
              return postForm("/api/judge/creativity", fd);
            })}>
            {busy ? <><span className="spinner" />&nbsp;&nbsp;Judging…</> : "Judge the idea"}
          </button>
        </div>
      </div>
      <Output busy={busy} error={error} result={result} />
    </>
  );
}
