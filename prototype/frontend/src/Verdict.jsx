/* Renders a judge verdict from `data.parsed` (the JSON the judge returned),
   falling back to raw text. */

const SUMMARY_KEYS = ["what_it_does", "what_they_said", "idea_in_one_line"];

const band = (v) => (Number(v) >= 7 ? "good" : Number(v) >= 4 ? "mid" : "bad");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const label = (k) => k.replace(/_/g, " ");

function Gauge({ value }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, Number(value) || 0)) / 10;
  const color = `var(--${band(value)})`;
  return (
    <div className="gauge">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.7,0.2,1)" }}
        />
      </svg>
      <div className="num">{value}<span>/10</span></div>
    </div>
  );
}

export default function Verdict({ data }) {
  const p = data?.parsed;
  const title = `${cap(data?.judge || "judge")} judge`;

  if (!p) {
    return (
      <div className="panel reveal">
        <div className="verdict-head"><h2>{title}</h2></div>
        <div className="transcript"><div className="body">{data?.raw || "No response."}</div></div>
        {data?.elapsed_s != null && <div className="timing">{data.elapsed_s}s</div>}
      </div>
    );
  }

  const scores = p.scores || {};
  const overall = scores.overall;
  const axes = Object.entries(scores).filter(([k]) => k !== "overall");
  const summary = SUMMARY_KEYS.map((k) => p[k]).find(Boolean);

  return (
    <div className="panel reveal">
      <div className="verdict-head">
        <div>
          <h2>{title}</h2>
          {summary && <p className="summary" style={{ marginTop: 8 }}>{summary}</p>}
          {p.nearest_pattern && <p className="summary mono">Closest to: {p.nearest_pattern}</p>}
        </div>
        {overall != null && <Gauge value={overall} />}
      </div>

      {axes.length > 0 && (
        <div className="axes">
          {axes.map(([k, v]) => (
            <div key={k}>
              <div className="axis-label"><span>{label(k)}</span><b>{v}</b></div>
              <div className="bar">
                <span className={band(v)} style={{ width: `${(Number(v) || 0) * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cols">
        <List title="Strengths" cls="s" items={p.strengths} />
        <List title="Risks" cls="r" items={p.risks} />
      </div>

      {p.opinion && <p className="opinion">{p.opinion}</p>}

      {Array.isArray(p.citations) && p.citations.length > 0 && (
        <details className="cites">
          <summary>Citations ({p.citations.length})</summary>
          <ul>{p.citations.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </details>
      )}

      {data?.elapsed_s != null && <div className="timing">judged in {data.elapsed_s}s</div>}
    </div>
  );
}

function List({ title, cls, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <h3 className={cls}>{title}</h3>
      <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

export function VerdictSkeleton() {
  return (
    <div className="panel">
      <div className="verdict-head">
        <div style={{ flex: 1 }} className="skeleton">
          <div className="sk w40" />
          <div className="sk w80" />
        </div>
        <div className="sk lg" />
      </div>
      <div className="skeleton" style={{ marginTop: 18 }}>
        <div className="sk w60" /><div className="sk w80" /><div className="sk w40" /><div className="sk w60" />
      </div>
    </div>
  );
}
