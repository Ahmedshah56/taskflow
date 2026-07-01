import React, {
  createContext, useContext, useReducer, useEffect,
  useState, useCallback, useMemo, useRef
} from "react";

/* ─────────────────────────────────────────
   TASKFLOW — Control Panel Edition
   Stack: React Hooks · useReducer · Context API
          · Custom Hooks · REST API · LocalStorage
   Design: Mechanical dashboard, orange accent,
           monospace metadata, SVG arc dial
───────────────────────────────────────── */

/* ── 1. Context & Reducer ── */
const Ctx = createContext(null);

const blank = { tasks: [], filter: "all" };

function reducer(s, a) {
  switch (a.type) {
    case "ADD": return { ...s, tasks: [a.p, ...s.tasks] };
    case "TOGGLE": return { ...s, tasks: s.tasks.map(t => t.id === a.id ? { ...t, done: !t.done } : t) };
    case "DELETE": return { ...s, tasks: s.tasks.filter(t => t.id !== a.id) };
    case "PRI": return { ...s, tasks: s.tasks.map(t => t.id === a.id ? { ...t, pri: a.pri } : t) };
    case "FILTER": return { ...s, filter: a.f };
    default: return s;
  }
}

function TaskProvider({ children }) {
  const [s, d] = useReducer(reducer, blank, () => {
    try { const v = localStorage.getItem("tf3"); return v ? { ...blank, tasks: JSON.parse(v) } : blank; }
    catch { return blank; }
  });
  useEffect(() => { localStorage.setItem("tf3", JSON.stringify(s.tasks)); }, [s.tasks]);

  const add = useCallback((text, pri) => d({ type: "ADD", p: { id: crypto.randomUUID(), text, done: false, pri, at: Date.now() } }), []);
  const toggle = useCallback(id => d({ type: "TOGGLE", id }), []);
  const del = useCallback(id => d({ type: "DELETE", id }), []);
  const setPri = useCallback((id, pri) => d({ type: "PRI", id, pri }), []);
  const filter = useCallback(f => d({ type: "FILTER", f }), []);

  const val = useMemo(() => ({ ...s, add, toggle, del, setPri, filter }), [s, add, toggle, del, setPri, filter]);
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

function useTasks() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTasks outside provider");
  return c;
}

/* ── 2. Custom Hook: REST API ── */
function useQuote() {
  const [q, setQ] = useState(null);
  const [loading, setL] = useState(true);
  const get = useCallback(async () => {
    setL(true);
    try {
      const r = await fetch("https://api.quotable.io/random?tags=motivational|inspirational");
      const d = await r.json();
      setQ({ text: d.content, by: d.author });
    } catch {
      setQ({ text: "Discipline is choosing between what you want now and what you want most.", by: "Abraham Lincoln" });
    } finally { setL(false); }
  }, []);
  useEffect(() => { get(); }, [get]);
  return { q, loading, get };
}

/* ── 3. Priority config ── */
const PRI = {
  high: { label: "HIGH", hex: "#FF4545", dim: "#3B1515" },
  medium: { label: "MED", hex: "#FFB020", dim: "#3B2A10" },
  low: { label: "LOW", hex: "#22C880", dim: "#0F3020" },
};

/* ── 4. SVG Arc Dial (Signature element) ── */
function ArcDial({ pct }) {
  const R = 38, C = 44, stroke = 5;
  const circ = 2 * Math.PI * R;
  const filled = (pct / 100) * circ;
  return (
    <div className="dial-wrap">
      <svg width={C * 2} height={C * 2} viewBox={`0 0 ${C * 2} ${C * 2}`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="#1C2535" strokeWidth={stroke} />
        <circle
          cx={C} cy={C} r={R} fill="none"
          stroke="#FF6B2B" strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={C} y={C - 4} textAnchor="middle" fill="#FF6B2B" fontSize="14" fontWeight="800" fontFamily="'Courier New', monospace">{pct}%</text>
        <text x={C} y={C + 12} textAnchor="middle" fill="#3B4A6B" fontSize="8" fontFamily="'Courier New', monospace">DONE</text>
      </svg>
    </div>
  );
}

/* ── 5. Quote banner ── */
function Quote() {
  const { q, loading, get } = useQuote();
  return (
    <div className="quote-row">
      <span className="quote-mark">"</span>
      <p className="quote-txt">{loading ? "Loading..." : q?.text}</p>
      <div className="quote-right">
        {!loading && <span className="quote-by">— {q?.by}</span>}
        <button className="icon-btn" onClick={get} title="New quote">↻</button>
      </div>
    </div>
  );
}

/* ── 6. Add form ── */
function AddForm() {
  const { add } = useTasks();
  const [txt, setTxt] = useState("");
  const [pri, setPri] = useState("medium");
  const ref = useRef();

  const submit = () => {
    if (!txt.trim()) { ref.current?.focus(); return; }
    add(txt.trim(), pri);
    setTxt("");
  };

  return (
    <div className="add-box">
      <div className="input-row">
        <input
          ref={ref}
          className="task-in"
          placeholder="What needs doing?"
          value={txt}
          onChange={e => setTxt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        <button className="add-btn" onClick={submit}>ADD</button>
      </div>
      <div className="pri-row">
        <span className="meta-label">PRIORITY</span>
        {Object.entries(PRI).map(([k, p]) => (
          <button
            key={k}
            className={`pri-pill ${pri === k ? "pri-active" : ""}`}
            style={{
              "--pc": p.hex,
              "--pd": p.dim,
              color: pri === k ? p.hex : "#3B4A6B",
              background: pri === k ? p.dim : "transparent",
              border: `1px solid ${pri === k ? p.hex : "#1C2535"}`,
            }}
            onClick={() => setPri(k)}
          >
            <span className="pri-dot" style={{ background: p.hex }} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 7. Filter tabs ── */
function Filters() {
  const { filter: active, filter: setF, tasks } = useTasks();
  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !t.done).length,
    completed: tasks.filter(t => t.done).length,
  };
  const { filter } = useTasks();
  return (
    <div className="filter-row">
      {["all", "active", "completed"].map(f => (
        <button
          key={f}
          className={`f-tab ${filter === f ? "f-active" : ""}`}
          onClick={() => setF(f)}
        >
          {f.toUpperCase()}
          <span className="f-count">[{counts[f]}]</span>
        </button>
      ))}
    </div>
  );
}

/* ── 8. Task card ── */
function TaskCard({ task, idx }) {
  const { toggle, del, setPri } = useTasks();
  const p = PRI[task.pri];
  const ts = new Date(task.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <li className={`task-card ${task.done ? "task-done" : ""}`} style={{ "--pc": p.hex }}>
      <div className="card-tab" style={{ background: p.hex }} />
      <button
        className={`check-box ${task.done ? "checked" : ""}`}
        onClick={() => toggle(task.id)}
        aria-label="Toggle"
      >
        {task.done && <span className="check-mark">✓</span>}
      </button>
      <div className="card-body">
        <p className="card-text">{task.text}</p>
        <span className="card-meta">{ts}</span>
      </div>
      <select
        className="pri-sel"
        style={{ color: p.hex }}
        value={task.pri}
        onChange={e => setPri(task.id, e.target.value)}
      >
        {Object.entries(PRI).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <button className="del-btn" onClick={() => del(task.id)} aria-label="Delete">✕</button>
    </li>
  );
}

/* ── 9. Task list ── */
function TaskList() {
  const { tasks, filter } = useTasks();
  const shown = useMemo(() => {
    if (filter === "active") return tasks.filter(t => !t.done);
    if (filter === "completed") return tasks.filter(t => t.done);
    return tasks;
  }, [tasks, filter]);

  if (!shown.length) return (
    <div className="empty">
      <span className="empty-icon">[ ]</span>
      <p className="empty-txt">
        {filter === "completed" ? "Nothing marked done yet." : "Queue is clear. Add a task above."}
      </p>
    </div>
  );

  return <ul className="task-list">{shown.map((t, i) => <TaskCard key={t.id} task={t} idx={i} />)}</ul>;
}

/* ── 10. Root ── */
export default function App() {
  return (
    <TaskProvider>
      <Inner />
    </TaskProvider>
  );
}

function Inner() {
  const { tasks } = useTasks();
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        {/* Header */}
        <header className="hdr">
          <div className="hdr-left">
            <p className="hdr-eyebrow">PRODUCTIVITY</p>
            <h1 className="hdr-title">TASK<br />FLOW</h1>
            <p className="hdr-sub">{tasks.length} task{tasks.length !== 1 ? "s" : ""} in queue</p>
          </div>
          <ArcDial pct={pct} />
        </header>

        <div className="divider" />

        <Quote />

        <div className="divider" />

        <AddForm />

        <div className="divider" />

        <Filters />

        <TaskList />

        <footer className="ftr">
          <a href="https://ahmedshah-portfolio.netlify.app/"> Ahmed Shah</a> | <a href="https://github.com/ahmedshah"> GitHub</a> | <a href="https://www.linkedin.com/in/ahmed-shah-web-developer-designer"> LinkedIn</a>

        </footer>
      </div>
    </>
  );
}

/* ── CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #080C14;
  color: #C8D0E0;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.shell {
  max-width: 560px;
  margin: 0 auto;
  padding: 36px 24px 60px;
  min-height: 100vh;
}

/* ─── Header ─── */
.hdr {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}
.hdr-eyebrow {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: #FF6B2B;
  margin-bottom: 6px;
}
.hdr-title {
  font-size: 52px;
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -2px;
  color: #F0F4FF;
}
.hdr-sub {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #3B4A6B;
  margin-top: 10px;
}
.dial-wrap { flex-shrink: 0; }

/* ─── Divider ─── */
.divider {
  height: 1px;
  background: #1C2535;
  margin: 20px 0;
}

/* ─── Quote ─── */
.quote-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0 4px;
}
.quote-mark {
  font-size: 28px;
  line-height: 1;
  color: #FF6B2B;
  font-weight: 900;
  flex-shrink: 0;
  margin-top: -4px;
}
.quote-txt {
  flex: 1;
  font-size: 13px;
  font-style: italic;
  color: #5A6A8A;
  line-height: 1.55;
}
.quote-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.quote-by {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #3B4A6B;
  white-space: nowrap;
}
.icon-btn {
  background: none;
  border: 1px solid #1C2535;
  color: #3B4A6B;
  width: 26px; height: 26px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.15s, color 0.15s;
}
.icon-btn:hover { border-color: #FF6B2B; color: #FF6B2B; }

/* ─── Add Form ─── */
.add-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input-row {
  display: flex;
  gap: 10px;
}
.task-in {
  flex: 1;
  background: #0E1420;
  border: 1px solid #1C2535;
  border-radius: 6px;
  color: #F0F4FF;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 12px 16px;
  outline: none;
  transition: border-color 0.2s;
}
.task-in::placeholder { color: #2A3550; }
.task-in:focus { border-color: #FF6B2B; }
.add-btn {
  background: #FF6B2B;
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 0 20px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.add-btn:hover { opacity: 0.85; }

.pri-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-label {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #3B4A6B;
  margin-right: 2px;
}
.pri-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.pri-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Filter ─── */
.filter-row {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #1C2535;
  margin-bottom: 20px;
}
.f-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #3B4A6B;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  padding: 10px 16px 10px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.f-tab:hover { color: #C8D0E0; }
.f-active { color: #FF6B2B !important; border-bottom-color: #FF6B2B !important; }
.f-count { color: #3B4A6B; }
.f-active .f-count { color: #FF6B2B; }

/* ─── Task cards ─── */
.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0E1420;
  border: 1px solid #1C2535;
  border-radius: 6px;
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s;
  animation: slideIn 0.22s ease forwards;
}
.task-card:hover {
  border-color: var(--pc, #FF6B2B);
  transform: translateX(2px);
}
.task-done { opacity: 0.45; }
.card-tab {
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
}
.check-box {
  width: 20px; height: 20px;
  border-radius: 3px;
  border: 1.5px solid #2A3550;
  background: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}
.checked {
  background: #FF6B2B !important;
  border-color: #FF6B2B !important;
}
.check-mark { font-size: 11px; color: #000; font-weight: 900; }
.card-body { flex: 1; padding: 12px 0; min-width: 0; }
.card-text {
  font-size: 14px;
  color: #C8D0E0;
  word-break: break-word;
  line-height: 1.4;
}
.task-done .card-text { text-decoration: line-through; color: #3B4A6B; }
.card-meta {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #2A3550;
  display: block;
  margin-top: 3px;
}
.pri-sel {
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  padding: 0 4px;
  flex-shrink: 0;
}
.pri-sel option { background: #0E1420; color: #C8D0E0; }
.del-btn {
  background: none;
  border: none;
  color: #2A3550;
  cursor: pointer;
  font-size: 12px;
  padding: 0 14px;
  align-self: stretch;
  display: flex; align-items: center;
  transition: color 0.15s, background 0.15s;
}
.del-btn:hover { color: #FF4545; background: rgba(255,69,69,0.08); }

/* ─── Empty ─── */
.empty {
  text-align: center;
  padding: 48px 20px;
  border: 1px dashed #1C2535;
  border-radius: 6px;
}
.empty-icon {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 28px;
  color: #2A3550;
  margin-bottom: 12px;
}
.empty-txt { font-size: 13px; color: #3B4A6B; }

/* ─── Footer ─── */
.ftr {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #1C2535;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #2A3550;
}

/* ─── Animation ─── */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ─── Mobile ─── */
@media (max-width: 480px) {
  .shell { padding: 24px 16px 48px; }
  .hdr-title { font-size: 38px; letter-spacing: -1.5px; }
  .hdr { margin-bottom: 20px; }

  .input-row { gap: 8px; }
  .task-in { padding: 11px 12px; font-size: 13px; }
  .add-btn { padding: 0 14px; font-size: 12px; }

  .pri-row { gap: 6px; }
  .pri-pill { padding: 4px 10px; font-size: 10px; }
  .meta-label { width: 100%; }

  .f-tab { padding: 10px 12px 10px 0; font-size: 10px; }

  .card-text { font-size: 13px; }
  .del-btn { padding: 0 10px; }

  .ftr { flex-direction: column; gap: 6px; }
}

@media (max-width: 360px) {
  .hdr-title { font-size: 30px; }
  .pri-row { gap: 4px; }
  .pri-pill { font-size: 9px; padding: 4px 8px; }
}
`;