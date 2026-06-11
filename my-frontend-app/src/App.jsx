import "./App.css";
import { useState, useEffect, useRef } from "react";

// FIX — add delete
const storage = {
  get:    async (key)        => ({ value: localStorage.getItem(key) }),
  set:    async (key, value) => { localStorage.setItem(key, value); return { ok: true }; },
  delete: async (key)        => { localStorage.removeItem(key);     return { ok: true }; },
};

/* ── CONSTANTS ─────────────────────────────────────────────── */
const CATS = {
  UI:   { label: "Urgent & Important",    color: "#E05252", bg: "#FEF2F2" },
  UNI:  { label: "Urgent, Not Important",      color: "#D97706", bg: "#FFFBEB" },
  NUI:  { label: "Not Urgent, Important", color: "#2563EB", bg: "#EFF6FF" },
  NUNI: { label: "Not Urgent, Not Important",  color: "#16A34A", bg: "#F0FDF4" },
};
const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Done is better than perfect.",
  "Small steps lead to big wins.",
  "Clarity precedes mastery.",
  "Work smarter, not harder.",
  "Every expert was once a beginner.",
];
const UID   = () => Date.now() + Math.floor(Math.random() * 9999);
const PAD   = n  => String(n).padStart(2, "0");
const FMT_T = s  => `${PAD(Math.floor(s / 60))}:${PAD(s % 60)}`;
const TODAY = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* ── BUTTON STYLE HELPER ───────────────────────────────────── */
function bStyle(bg, col, small = false, extra = {}) {
  return {
    background: bg, color: col,
    border: `1px solid ${col}25`,
    borderRadius: small ? 5 : 8,
    padding: small ? "3px 9px" : "10px 18px",
    fontSize: small ? 11 : 14,
    fontWeight: 600, cursor: "pointer", lineHeight: 1.4,
    fontFamily: "inherit", ...extra,
  };
}

/* ── MARKDOWN RENDERER ─────────────────────────────────────── */
function Md({ text }) {
  if (!text) return null;

  const inline = (value, keyPrefix = "md") =>
    value.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
      }
      return <span key={`${keyPrefix}-${i}`}>{part}</span>;
    });

  return (
    <div style={{ fontSize: 14, lineHeight: 1.72, textAlign: "left" }}>
      {text.split("\n").map((raw, i) => {
        const line = raw.trimEnd();
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 10 }} />;
        if (/^---+$/.test(trimmed)) return <div key={i} style={{ borderTop: "1px solid #E5E7EB", margin: "14px 0" }} />;

        const h = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (h) {
          const size = h[1].length === 1 ? 22 : h[1].length === 2 ? 18 : 15;
          return <div key={i} style={{ fontSize: size, fontWeight: 800, margin: "16px 0 8px", lineHeight: 1.25 }}>{inline(h[2], `h-${i}`)}</div>;
        }

        const bullet = trimmed.match(/^[-•]\s+(.+)$/);
        if (bullet) {
          return <div key={i} style={{ display: "flex", gap: 8, margin: "5px 0", paddingLeft: 4 }}><span style={{ color: "#6B7280" }}>•</span><span>{inline(bullet[1], `b-${i}`)}</span></div>;
        }

        const num = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (num) {
          return <div key={i} style={{ display: "flex", gap: 8, margin: "5px 0", paddingLeft: 4 }}><span style={{ color: "#6B7280", minWidth: 22 }}>{num[1]}.</span><span>{inline(num[2], `n-${i}`)}</span></div>;
        }

        return <div key={i} style={{ margin: "4px 0" }}>{inline(trimmed, `p-${i}`)}</div>;
      })}
    </div>
  );
}

/* ── POMODORO RING ─────────────────────────────────────────── */
function PomRing({ t, total, phase, isFullScreen }) {
  const r = 62, c = 2 * Math.PI * r;
  const col = phase === "focus" ? "#E8703A" : "#16A34A";

  const textColor = isFullScreen ? "#ffffff" : "#1C1C1E";

  return (
    <svg width="156" height="156" viewBox="0 0 156 156" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="78" cy="78" r={r} fill="none" stroke="#F0EBE3" strokeWidth="9" />
      <circle cx="78" cy="78" r={r} fill="none" stroke={col} strokeWidth="9"
        strokeDasharray={c} strokeDashoffset={c * (t / total)}
        strokeLinecap="round" transform="rotate(-90 78 78)"
        style={{ transition: "stroke-dashoffset 1s linear" }} />
      <text x="78" y="72" textAnchor="middle" fontSize="24" fontWeight="700"
        fill="#17171a" fontFamily="monospace">{FMT_T(t)}</text>
      <text x="78" y="98" textAnchor="middle" fontSize="10" fill="#A1A1AA"
        letterSpacing="1.8" fontFamily="system-ui,sans-serif">
        {phase === "focus" ? "FOCUS" : "BREAK"}
      </text>
    </svg>
  );
}


/* ── WALL CLOCK ─────────────────────────────────────────────── */
function ClockWall({ now }) {
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hour = now.getHours() % 12;

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hourDeg = hour * 30 + min * 0.5;

  const hand = (deg, length, width, color, z = 2) => (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        height: length,
        background: color,
        borderRadius: 999,
        transformOrigin: "50% 100%",
        transform: `translate(-50%, -100%) rotate(${deg}deg)`,
        zIndex: z,
      }}
    />
  );

  return (
    <div style={{
      width: 126,
      height: 126,
      borderRadius: "50%",
      border: "8px solid #F0EBE3",
      background: "#fff",
      position: "relative",
      boxShadow: "inset 0 0 0 1px #F6F2EB",
      flexShrink: 0,
    }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = i * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 3,
              height: i % 3 === 0 ? 12 : 7,
              borderRadius: 999,
              background: i % 3 === 0 ? "#1C1C1E" : "#C7C7CC",
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-48px)`,
              transformOrigin: "center",
            }}
          />
        );
      })}
      {hand(hourDeg, 34, 5, "#1C1C1E", 2)}
      {hand(minDeg, 44, 4, "#1C1C1E", 3)}
      {hand(secDeg, 48, 2, "#E8703A", 4)}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#E8703A",
        transform: "translate(-50%, -50%)",
        zIndex: 5,
      }} />
    </div>
  );
}

/* ── TASK CARD ─────────────────────────────────────────────── */
function TaskCard({ task, onMove, onDelete, onUpdate, onLink, linked, expanded, onExpand }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edit, setEdit] = useState(task);

  const cat = CATS[task.category] || CATS.NUI;
  const diff = { easy: "●", medium: "●●", hard: "●●●" }[task.difficulty] || "●●";

  if (isEditing) {
    return (
      <div style={{ background: "#fff", border: "1px solid #F0ECE6", borderLeft: `4px solid ${cat.color}`, borderRadius: "0 8px 8px 0", padding: "10px 11px", marginBottom: 8, boxShadow: "0 3px 12px rgba(0,0,0,0.08)" }}>
        <input value={edit.name} onChange={e => setEdit({...edit, name: e.target.value})} style={{ width: "100%", padding: "6px 8px", fontSize: 13, fontWeight: 600, border: "1.5px solid #E8E2DA", borderRadius: 6, marginBottom: 6, outline: "none", fontFamily: "inherit" }} />
        
        <select value={edit.category} onChange={e => setEdit({...edit, category: e.target.value})} style={{ width: "100%", padding: "6px 8px", fontSize: 11, border: "1.5px solid #E8E2DA", borderRadius: 6, marginBottom: 6, outline: "none", fontFamily: "inherit", fontWeight: 600, color: CATS[edit.category]?.color }}>
          <option value="UI">🔴 Urgent & Important</option>
          <option value="UNI">🟡 Urgent, Not Important</option>
          <option value="NUI">🔵 Not Urgent, Important</option>
          <option value="NUNI">🟢 Not Urgent, Not Important</option>
        </select>
        
        <input
          type="date"
          value={edit.date || edit.createdAt || TODAY()}
          onChange={e => setEdit({ ...edit, date: e.target.value })}
          style={{
            width: "100%",
            padding: "6px 8px",
            fontSize: 11,
            border: "1.5px solid #E8E2DA",
            borderRadius: 6,
            marginBottom: 6,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <select value={edit.difficulty} onChange={e => setEdit({...edit, difficulty: e.target.value})} style={{ flex: 1, padding: "6px 8px", fontSize: 11, border: "1.5px solid #E8E2DA", borderRadius: 6, outline: "none", fontFamily: "inherit" }}>
            <option value="easy">● Easy</option>
            <option value="medium">●● Medium</option>
            <option value="hard">●●● Hard</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1.5px solid #E8E2DA", borderRadius: 6, padding: "0 8px" }}>
            <span style={{ fontSize: 11 }}>🍅</span>
            <input type="number" min="1" max="10" value={edit.pomodoroSuggested} onChange={e => setEdit({...edit, pomodoroSuggested: Math.max(1, +e.target.value)})} style={{ width: 30, border: "none", outline: "none", fontSize: 11, fontFamily: "inherit", textAlign: "center", background: "transparent" }} />
          </div>
        </div>
        
        <textarea value={edit.details} onChange={e => setEdit({...edit, details: e.target.value})} placeholder="Task details (optional)..." style={{ width: "100%", padding: "6px 8px", fontSize: 11, border: "1.5px solid #E8E2DA", borderRadius: 6, marginBottom: 8, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 46 }} />
        
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => { onUpdate(task.id, edit); setIsEditing(false); }} style={{ ...bStyle("#FFF7F0", "#E8703A", true), flex: 1 }}>Save</button>
          <button onClick={() => { setEdit(task); setIsEditing(false); }} style={{ ...bStyle("#F3F4F6", "#9CA3AF", true), flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("tid", String(task.id))}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}
      style={{
        background: "#fff", border: `1px solid #F0ECE6`, borderLeft: `4px solid ${cat.color}`,
        borderRadius: "0 8px 8px 0", padding: "10px 11px", marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "grab",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>
            {cat.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E", lineHeight: 1.35, wordBreak: "break-word" }}>
            {task.name}
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
            📅 {task.date || task.createdAt || TODAY()}
          </div>
        </div>
        <button onClick={() => onDelete(task.id)}
          style={{ background: "none", border: "none", color: "#D1D5DB", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 9, color: "#C4C4C4", letterSpacing: 1 }}>{diff}</span>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: Math.max(1, task.pomodoroSuggested || 2) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < (task.pomodoroCompleted || 0) ? "#E8703A" : "#E8E5E0" }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: "#C4C4C4" }}>{task.pomodoroCompleted || 0}/{task.pomodoroSuggested || 2} 🍅</span>
      </div>

      <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}>
        {task.status === "todo" && (
          <button onClick={() => onMove(task.id, "doing")} style={bStyle("#EEF2FF", "#4F46E5", true)}>→ Doing</button>
        )}
        {task.status === "doing" && <>
          <button onClick={() => onMove(task.id, "done")} style={bStyle("#F0FDF4", "#16A34A", true)}>✓ Done</button>
          <button onClick={() => onMove(task.id, "todo")} style={bStyle("#F3F4F6", "#6B7280", true)}>← Back</button>
        </>}
        <button onClick={() => onLink(task)}
          style={bStyle(linked ? "#FFF7ED" : "#F9F8F6", linked ? "#E8703A" : "#9CA3AF", true)}>
          🍅 {linked ? "Linked" : "Link"}
        </button>
        <button onClick={() => setIsEditing(true)} style={bStyle("#F3F4F6", "#9CA3AF", true)}>✎ Edit</button>
        {task.details && (
          <button onClick={() => onExpand(expanded ? null : task.id)}
            style={bStyle("#F3F4F6", "#9CA3AF", true)}>{expanded ? "▲" : "▼"}</button>
        )}
      </div>

      {expanded && task.details && (
        <div style={{ marginTop: 9, padding: "8px 10px", background: "#FAFAF7", borderRadius: 6, fontSize: 12, color: "#555", lineHeight: 1.6, borderLeft: `3px solid ${cat.color}` }}>
          {task.details}
        </div>
      )}
    </div>
  );
}

/* ── KANBAN COLUMN ─────────────────────────────────────────── */
function KanbanCol({ title, status, tasks, dot, onDrop, onMove, onDelete, onUpdate, onLink, linkedId, expanded, onExpand }) {
  const [over, setOver] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.6px" }}>{title}</span>
        <span style={{ fontSize: 10, color: "#C7C7CC", marginLeft: "auto" }}>{tasks.length}</span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { setOver(false); const id = +e.dataTransfer.getData("tid"); if (id) onDrop(id, status); }}
        style={{
          minHeight: 48, borderRadius: 8, padding: 4,
          background: over ? "rgba(232,112,58,0.05)" : "transparent",
          border: `2px dashed ${over ? "#E8703A" : "transparent"}`,
          transition: "all 0.12s",
        }}
      >
        {tasks.length === 0
          ? <div style={{ textAlign: "center", color: "#DDD8D0", fontSize: 11, padding: "12px 0" }}>Drop tasks here</div>
          : tasks.map(t => (
            <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} onUpdate={onUpdate}
              onLink={onLink} linked={linkedId === t.id}
              expanded={expanded === t.id} onExpand={onExpand} />
          ))}
      </div>
    </div>
  );
}

/* ── CALENDAR ──────────────────────────────────────────────── */
function Cal({ tasks, done, month, setMonth, selectedDate, setSelectedDate }) {
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const tod   = TODAY();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const all   = [...tasks, ...done];
  const getN  = d => {
    const ds = `${y}-${PAD(m+1)}-${PAD(d)}`;
    return all.filter(t => (t.date || t.createdAt) === ds || t.completedAt === ds).length;
  };
  const selectedTasks = all.filter(t => (t.date || t.createdAt) === selectedDate || t.completedAt === selectedDate);
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={() => setMonth(new Date(y, m-1, 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#8E8E93", padding: "0 3px" }}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E" }}>{MONTHS[m]} {y}</span>
        <button onClick={() => setMonth(new Date(y, m+1, 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#8E8E93", padding: "0 3px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, color: "#C7C7CC", fontWeight: 700, padding: "2px 0" }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds  = `${y}-${PAD(m+1)}-${PAD(d)}`;
          const isToday = ds === tod;
          const isSelected = ds === selectedDate;
          const n   = getN(d);
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(ds)}
              title={n ? `${n} task(s)` : "No tasks"}
              style={{
                textAlign: "center",
                padding: "5px 0",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: isToday || isSelected ? 700 : 400,
                color: isToday ? "#fff" : isSelected ? "#E8703A" : "#444",
                background: isToday ? "#E8703A" : isSelected ? "#FFF7F0" : "transparent",
                outline: isSelected && !isToday ? "1px solid #E8703A" : "none",
                position: "relative",
                cursor: "pointer",
              }}>
              {d}
              {n > 0 && <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: isToday ? "#fff" : "#E8703A" }} />}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, borderTop: "1px solid #EDE7DE", paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#1C1C1E" }}>
          Tasks on {selectedDate}
        </div>
        {selectedTasks.length === 0 ? (
          <div style={{ fontSize: 11, color: "#C7C7CC" }}>No tasks for this date</div>
        ) : (
          selectedTasks.map(t => (
            <div key={t.id} style={{
              fontSize: 11,
              padding: "6px 7px",
              borderRadius: 6,
              background: "#FAFAF7",
              borderLeft: `3px solid ${CATS[t.category]?.color || "#ccc"}`,
              marginBottom: 5,
            }}>
              <div style={{ fontWeight: 700 }}>{t.name}</div>
              <div style={{ color: "#9CA3AF", fontSize: 10 }}>
                {t.status === "done" ? "Done" : t.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── MAIN APP ──────────────────────────────────────────────── */
export default function DutyHelper() {
  const [screen,   setScreen]   = useState("loading");
  const [user,     setUser]     = useState({ name: "", role: "student", field: "" });
  const [tasks,    setTasks]    = useState([]);
  const [done,     setDone]     = useState([]);
  const [chat,     setChat]     = useState([]);
  const [input,    setInput]    = useState("");
  const [aiLoad,   setAiLoad]   = useState(false);
  const [phase,    setPhase]    = useState("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [total,    setTotal]    = useState(25 * 60);
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [running,  setRunning]  = useState(false);
  const [sets,     setSets]     = useState({ target: 4, fin: 0 });
  const [focusM,   setFocusM]   = useState(false);
  const [linked,   setLinked]   = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [addOpen,  setAddOpen]  = useState(false);
  const [addVal,   setAddVal]   = useState("");
  const [addCat, setAddCat] = useState("AUTO");
  const [addDate, setAddDate] = useState(TODAY());
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [now,      setNow]      = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(TODAY());
  const [formErr,  setFormErr]  = useState({});
  const [mode,     setMode]     = useState("pomodoro");
  const [colSizes, setColSizes] = useState({ left: 288, right: 252 });
  const [centerPomHeight, setCenterPomHeight] = useState(250);
  const [leftTodoHeight, setLeftTodoHeight] = useState(330);
  const [rightHeights, setRightHeights] = useState({ completed: 185, kanban: 185 });
  const [quote, setQuote] = useState(localStorage.getItem("dh_quote") || QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [quoteEdit, setQuoteEdit] = useState(false);
  const timerRef  = useRef(null);
  const chatRef   = useRef(null);
  const fileRef   = useRef(null);
  const todayRef  = useRef(TODAY());

  /* ── BOOT: load from persistent storage ── */
  useEffect(() => {
    (async () => {
      try {
        const u = await storage.get("dh_user");
        if (u?.value) {
          const parsed = JSON.parse(u.value);
          setUser(parsed);
          setScreen("dashboard");
          setChat([welcome(parsed)]);
        } else setScreen("onboard");
        const t = await storage.get("dh_tasks");
        if (t?.value) setTasks(JSON.parse(t.value));
        const d = await storage.get("dh_done");
        if (d?.value) setDone(JSON.parse(d.value));
      } catch { setScreen("onboard"); }
    })();
  }, []);

  const welcome = u => ({
    role: "assistant", id: UID(),
    content: `Welcome, ${u.name}! 👋 I'm your AI productivity coach — a specialist in **${u.field}**.\n\nDescribe your tasks, paste study notes, or upload a document. I'll analyse everything with the **Eisenhower Matrix**, estimate Pomodoro sessions, and flag the **10 most common pitfalls** to keep you on track. What are we tackling today?`,
  });

  /* ── CLOCK ── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const today = TODAY();

    if (todayRef.current !== today) {
      todayRef.current = today;
      setSelectedDate(today);
      setAddDate(today);
      setCalMonth(new Date());
    }
  }, [now]);

  /* ── PERSIST TASKS ── */
  useEffect(() => {
    if (screen === "dashboard")
      storage.set("dh_tasks", JSON.stringify(tasks)).catch(() => {});
  }, [tasks, screen]);

  useEffect(() => {
    if (screen === "dashboard")
      storage.set("dh_done", JSON.stringify(done)).catch(() => {});
  }, [done, screen]);

  /* ── AUTO-SCROLL CHAT ── */
  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  /* ── POMODORO TIMER ── */
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t > 1) return t - 1;
        clearInterval(timerRef.current);
        setRunning(false);
        if (phase === "focus") {
          setSets(s => ({ ...s, fin: s.fin + 1 }));
          if (linked) {
            setTasks(prev =>
              prev.map(tk =>
                tk.id === linked.id
                  ? { ...tk, pomodoroCompleted: (tk.pomodoroCompleted || 0) + 1 }
                  : tk
              )
            );
          }
          setPhase("break");
          setTotal(breakMin * 60);
          return breakMin * 60;
        }
        setPhase("focus");
        setTotal(focusMin * 60);
        return focusMin * 60;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, phase, linked, focusMin, breakMin]);

  /* ── HANDLERS ── */
  const handleOnboard = async () => {
    const e = {};
    if (!user.name.trim())  e.name  = true;
    if (!user.field.trim()) e.field = true;
    if (Object.keys(e).length) { setFormErr(e); return; }
    await storage.set("dh_user", JSON.stringify(user)).catch(() => {});
    setScreen("dashboard");
    setChat([welcome(user)]);
  };

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const callAI = async (msgs, sys, filesToUpload) => {
    const formData = new FormData();
    const currentMessage = msgs[msgs.length - 1].content;
    const pastHistory = msgs.slice(0, -1);

    formData.append("message", currentMessage);
    formData.append("history", JSON.stringify(pastHistory));
    formData.append("system", sys);

    if (filesToUpload && filesToUpload.length > 0) {
      filesToUpload.forEach(file => formData.append("files", file));
    }

    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      body: formData,
    });

    if (!r.ok) throw new Error("Backend API error");

    const d = await r.json();
    return d.text;
  };

  const SYS = u =>
    `You are a world-class ${u.field} expert and demanding-but-supportive productivity coach for ${u.name}, a ${u.role}.

When the user uploads notes/slides/documents or asks for study notes (for example "do notes for me"), reply in clean, well-structured Markdown like a study guide. Use clear headings, short bullets, numbered steps where useful, and generous spacing. Do NOT output JSON for study-note requests.

Today is ${TODAY()}. When the user asks to plan/split work for a specific date or day (for example "Saturday", "next week", "13 June", "tomorrow"), create separate concrete tasks and include a "date" field in each task using YYYY-MM-DD format. If one study session needs multiple tasks, split it into smaller tasks on that requested date.

For study notes, use this structure when relevant:
# Study Notes
## 1. Topic Overview
## 2. Key Concepts
## 3. Important Details
## 4. Study Checklist
## 5. Quick Review Questions

When the user clearly describes tasks/projects or asks you to add/classify tasks, output EXACTLY this JSON block:
\`\`\`json
{
  "tasks": [
    {
      "name": "concise task name (≤8 words)",
      "category": "UI|UNI|NUI|NUNI",
      "details": "Expert action plan specific to ${u.field} (2-3 sentences)",
      "pomodoroSuggested": 2,
      "difficulty": "easy|medium|hard",
      "date": "YYYY-MM-DD optional; use requested date if mentioned"
    }
  ],
  "pitfalls": ["pitfall 1", "pitfall 2", "...", "pitfall 10"],
  "message": "Expert advice and encouragement (2-3 direct sentences)"
}
\`\`\`

Eisenhower rules:
• UI  = Urgent + Important   → crises, hard deadlines
• UNI = Urgent + Not Imp.    → interruptions, delegate if possible
• NUI = Not Urgent + Imp.    → planning, learning, strategic work
• NUNI= Not Urgent + Not Imp.→ low-value, eliminate or defer

For simple questions or follow-ups (not task analysis) respond conversationally. Be direct and specific to ${u.field}.`;

  const sendMsg = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (aiLoad) return;

    const filesToSend = [...attachedFiles];
    const fileNames = filesToSend.map(f => f.name);
    const displayContent = `${input.trim() || "Please analyze the attached files."}${fileNames.length ? `

📎 **Attached:** ${fileNames.join(", ")}` : ""}`;
    const uMsg = { role: "user", id: UID(), content: displayContent };
    const history = [...chat, uMsg];
    setChat(history); setInput(""); setAiLoad(true);

    setAttachedFiles([]);

    try {
      const raw = await callAI(
        history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        SYS(user),
        filesToSend
      );
      const m = raw.match(/```json\s*([\s\S]*?)\s*```/);
      if (m) {
        try {
          const p = JSON.parse(m[1]);
          if (p.tasks?.length) {
            const newT = p.tasks.map(t => ({
              id: UID(), name: t.name,
              category: ["UI","UNI","NUI","NUNI"].includes(t.category) ? t.category : "NUI",
              details: t.details || "",
              pomodoroSuggested: Math.max(1, +t.pomodoroSuggested || 2),
              pomodoroCompleted: 0,
              difficulty: ["easy","medium","hard"].includes(t.difficulty) ? t.difficulty : "medium",
              status: "todo", createdAt: TODAY(), date: normalizeTaskDate(t.date, TODAY()),
            }));
            setTasks(prev => [...prev, ...newT]);
            let reply = (p.message || "") + "\n\n";
            if (p.pitfalls?.length)
              reply += `⚠️ **10 Pitfalls to Avoid:**\n${p.pitfalls.slice(0, 10).map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n`;
            reply += `✅ **${newT.length} task${newT.length > 1 ? "s" : ""} added** to your Kanban board!`;
            setChat([...history, { role: "assistant", id: UID(), content: reply }]);
            return;
          }
        } catch { /* fall through */ }
      }
      setChat([...history, { role: "assistant", id: UID(), content: raw }]);
    } catch {
      setChat([...history, { role: "assistant", id: UID(), content: "⚠️ Connection error. Please try again." }]);
    } finally { setAiLoad(false); }
  };

  const addTask = async () => {
    if (!addVal.trim()) return;
    setAiLoad(true);
    try {
      // If Auto, ask AI to classify. If manual, tell AI to force the category.
      const promptContent = addCat === "AUTO"
        ? `Classify this single task for a ${user.role} in ${user.field}: "${addVal}". Return ONLY valid JSON (no fences): {"name":"...","category":"UI|UNI|NUI|NUNI","details":"2-sentence expert plan","pomodoroSuggested":2,"difficulty":"easy|medium|hard"}`
        : `Analyze this single task for a ${user.role} in ${user.field}: "${addVal}". The category MUST be exactly "${addCat}". Return ONLY valid JSON (no fences): {"name":"...","category":"${addCat}","details":"2-sentence expert plan","pomodoroSuggested":2,"difficulty":"easy|medium|hard"}`;
      
      const raw = await callAI(
        [{ role: "user", content: promptContent }],
        "You are an Eisenhower Matrix classifier. Output ONLY valid JSON, nothing else."
      );
      
      const p = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setTasks(prev => [...prev, {
        id: UID(), name: p.name || addVal,
        category: addCat === "AUTO" ? (["UI","UNI","NUI","NUNI"].includes(p.category) ? p.category : "NUI") : addCat,
        details: p.details || "", pomodoroSuggested: Math.max(1, +p.pomodoroSuggested || 2),
        pomodoroCompleted: 0, difficulty: p.difficulty || "medium",
        status: "todo", createdAt: TODAY(), date: addDate || TODAY(),
      }]);
    } catch {
      setTasks(prev => [...prev, {
        id: UID(), name: addVal, category: addCat === "AUTO" ? "NUI" : addCat, details: "",
        pomodoroSuggested: 2, pomodoroCompleted: 0, difficulty: "medium",
        status: "todo", createdAt: TODAY(), date: addDate || TODAY(),
      }]);
    }
    setAddVal(""); setAddDate(TODAY()); setAddOpen(false); setAiLoad(false);
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setAttachedFiles(prev => {
      const newFiles = [...prev, ...files];
      if (newFiles.length > 10) {
        alert("⚠️ You can only attach up to 10 files per message.");
        return newFiles.slice(0, 10);
      }
      return newFiles;
    });
    
    e.target.value = ""; // Reset input so you can select the same file again if needed
  };

  const move = (id, newStatus) => {
    if (newStatus === "done") {
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      setDone(prev => [...prev, { ...t, status: "done", completedAt: TODAY() }]);
      setTasks(prev => prev.filter(x => x.id !== id));
      if (linked?.id === id) setLinked(null);
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const del = id => { setTasks(prev => prev.filter(t => t.id !== id)); if (linked?.id === id) setLinked(null); };
  const updateTask = (id, data) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)); if (linked?.id === id) setLinked({ ...linked, ...data }); };
  const resetPom = () => {
    setRunning(false);
    setPhase("focus");
    setTimeLeft(focusMin * 60);
    setTotal(focusMin * 60);
  };
  
  // FIX
  const handleReset = () => {
    const ok = window.confirm("Reset everything? This will delete all tasks, completed tasks, chat, quote, and user data.");
    if (!ok) return;

    ["dh_user", "dh_tasks", "dh_done", "dh_quote"].forEach(k => localStorage.removeItem(k));

    setScreen("onboard");
    setTasks([]);
    setDone([]);
    setChat([]);
    setLinked(null);
    setInput("");
    setAttachedFiles([]);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setUser({ name: "", role: "student", field: "" });
  };

  const FD = d => d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const FT = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const FT_SEC = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const normalizeTaskDate = (value, fallback = TODAY()) => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return fallback;
  };

  const startResize = (kind, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCols = { ...colSizes };
    const startPom = centerPomHeight;
    const startTodo = leftTodoHeight;
    const startRight = { ...rightHeights };

    const onMove = ev => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const viewportW = window.innerWidth || 1200;
      const maxSide = Math.max(220, Math.floor(viewportW * 0.42));

      if (kind === "left-col") {
        setColSizes(v => ({ ...v, left: Math.min(maxSide, Math.max(220, startCols.left + dx)) }));
      } else if (kind === "right-col") {
        setColSizes(v => ({ ...v, right: Math.min(maxSide, Math.max(220, startCols.right - dx)) }));
      } else if (kind === "center-pom") {
        setCenterPomHeight(Math.min(320, Math.max(220, startPom + dy)));
      } else if (kind === "left-todo") {
        setLeftTodoHeight(Math.min(window.innerHeight - 240, Math.max(130, startTodo + dy)));
      } else if (kind === "right-completed") {
        setRightHeights(v => ({ ...v, completed: Math.min(420, Math.max(115, startRight.completed + dy)) }));
      } else if (kind === "right-kanban") {
        setRightHeights(v => ({ ...v, kanban: Math.min(420, Math.max(115, startRight.kanban + dy)) }));
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = kind.includes("col") ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const rowHandle = kind => (
    <div
      onMouseDown={e => startResize(kind, e)}
      title="Drag to resize"
      style={{ height: 7, cursor: "row-resize", background: "#F4EFE7", borderTop: "1px solid #EDE7DE", borderBottom: "1px solid #EDE7DE", flexShrink: 0 }}
    />
  );

  const colHandle = kind => (
    <div
      onMouseDown={e => startResize(kind, e)}
      title="Drag to resize"
      style={{ width: 7, cursor: "col-resize", background: "#F4EFE7", borderLeft: "1px solid #EDE7DE", borderRight: "1px solid #EDE7DE", flexShrink: 0 }}
    />
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: LOADING
  ════════════════════════════════════════════════════════ */
  if (screen === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F6F2EB", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#E8703A", letterSpacing: "-0.5px" }}>Duty Helper</div>
        <div style={{ fontSize: 13, color: "#B0A99A", marginTop: 6 }}>Loading your workspace…</div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: ONBOARDING
  ══════════════════════════════════════════════════════════ */
  if (screen === "onboard") return (
    <div style={{ minHeight: "100vh", background: "#F6F2EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "46px 50px", maxWidth: 430, width: "100%", boxShadow: "0 6px 28px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.8px" }}>Duty Helper</div>
          <div style={{ fontSize: 13, color: "#8E8E93", marginTop: 6 }}>AI Task Assigner & Productivity Coach</div>
          <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 14 }}>
            {Object.values(CATS).map(c => (
              <div key={c.color} style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} />
            ))}
          </div>
        </div>

        {[["name","Your Name","e.g. Alex Johnson"],["field","Field of Focus","e.g. Computer Science, Law, Marketing…"]].map(([k, lbl, ph]) => (
          <div key={k} style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{lbl}</label>
            <input value={user[k]} onChange={e => { setUser({ ...user, [k]: e.target.value }); setFormErr({}); }}
              placeholder={ph} onKeyDown={e => e.key === "Enter" && handleOnboard()}
              style={{ width: "100%", padding: "11px 13px", fontSize: 14, border: `1.5px solid ${formErr[k] ? "#E05252" : "#E8E2DA"}`, borderRadius: 8, outline: "none", fontFamily: "inherit", background: "#FAFAF7", boxSizing: "border-box" }} />
          </div>
        ))}

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>I am a…</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["student","worker"].map(r => (
              <button key={r} onClick={() => setUser({ ...user, role: r })} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                border: `1.5px solid ${user.role === r ? "#E8703A" : "#E8E2DA"}`,
                background: user.role === r ? "#FFF7F0" : "#FAFAF7",
                color: user.role === r ? "#E8703A" : "#6B7280",
                fontWeight: 600, fontSize: 14,
              }}>
                {r === "student" ? "🎓 Student" : "💼 Worker"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleOnboard} style={{ width: "100%", padding: 13, background: "#E8703A", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Start my Duty Helper →
        </button>
        {Object.keys(formErr).length > 0 && (
          <div style={{ color: "#E05252", fontSize: 12, textAlign: "center", marginTop: 10 }}>Please fill in all required fields.</div>
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: FOCUS MODE OVERLAY
  ══════════════════════════════════════════════════════════ */
  if (focusM) return (
    <div style={{ position: "fixed", inset: 0, background: "#18181B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif", zIndex: 9999 }}>
      {/* Semi-transparent functional task list */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 280,
        padding: "20px 14px",
        overflowY: "auto",
        background: "rgba(255,255,255,0.06)",
        opacity: 0.72,
      }}>
        <div style={{ color: "#fff", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14 }}>
          Active Tasks
        </div>
        {tasks.filter(t => t.status !== "done").map(t => (
          <div key={t.id} style={{
            color: "#fff",
            fontSize: 11,
            padding: "8px 8px 8px 10px",
            borderLeft: `3px solid ${CATS[t.category]?.color || "#888"}`,
            marginBottom: 8,
            lineHeight: 1.35,
            background: linked?.id === t.id ? "rgba(232,112,58,0.34)" : "rgba(255,255,255,0.08)",
            borderRadius: "0 8px 8px 0",
            opacity: linked?.id && linked.id !== t.id ? 0.45 : 1,
            border: linked?.id === t.id ? "1px solid rgba(232,112,58,0.75)" : "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
              <span>{t.name}</span>
              {linked?.id === t.id && (
                <span style={{ fontSize: 9, color: "#FFD7C2", background: "rgba(232,112,58,0.25)", border: "1px solid rgba(232,112,58,0.6)", borderRadius: 999, padding: "2px 6px", flexShrink: 0 }}>
                  LINKED
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <button onClick={() => setLinked(t)} style={bStyle(linked?.id === t.id ? "rgba(232,112,58,0.45)" : "rgba(232,112,58,0.25)", "#fff", true)}>
                {linked?.id === t.id ? "🍅 Linked" : "🍅 Link"}
              </button>
              {t.status === "todo" && (
                <button onClick={() => move(t.id, "doing")} style={bStyle("rgba(79,70,229,0.25)", "#fff", true)}>→ Doing</button>
              )}
              {t.status === "doing" && (
                <>
                  <button onClick={() => move(t.id, "done")} style={bStyle("rgba(22,163,74,0.25)", "#fff", true)}>✓ Done</button>
                  <button onClick={() => move(t.id, "todo")} style={bStyle("rgba(255,255,255,0.12)", "#fff", true)}>← Back</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Centered Pomodoro / Clock */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {linked && <div style={{ color: "#E8703A", fontSize: 24, fontWeight: 700, marginBottom: 36, transform: "translateY(-26px)"}}>🍅 {linked.name}</div>}

        {mode === "clock" ? (
          <div style={{ fontSize: 84, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: 2 }}>
            {FT_SEC(now)}
          </div>
        ) : (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: "scale(1.8)" }}>
              <PomRing t={timeLeft} total={total} phase={phase} />
            </div>
            <div style={{ position: "absolute", color: "#ffffff", fontSize: 48, fontWeight: 800, fontFamily: "monospace" }}>
              {FMT_T(timeLeft)}
            </div>
          </div>
        )}

        {mode === "pomodoro" && <div style={{ color: "#A1A1AA", fontSize: 16, marginTop: 50 }}>{sets.fin} / {sets.target} sets completed</div>}

        <div style={{ display: "flex", gap: 15, justifyContent: "center", marginTop: 38 }}>
          {[
            ...(mode === "pomodoro"
              ? [
                  { lbl: running ? "⏸ Pause" : "▶ Start", fn: () => setRunning(r => !r), bg: "#E8703A", col: "#fff", border: "none" },
                  { lbl: "↺ Reset", fn: resetPom, bg: "transparent", col: "#fff", border: "1.5px solid #3F3F46" },
                ]
              : []),
            { lbl: "✕ Exit", fn: () => setFocusM(false), bg: "transparent", col: "#fff", border: "1.5px solid #3F3F46" },
          ].map(({ lbl, fn, bg, col, border }) => (
            <button key={lbl} onClick={fn} style={{ background: bg, color: col, border, borderRadius: 8, padding: "16px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{lbl}</button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     SCREEN: MAIN DASHBOARD
  ══════════════════════════════════════════════════════════ */
  const todoT  = tasks.filter(t => t.status === "todo");
  const doingT = tasks.filter(t => t.status === "doing");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui,sans-serif", background: "#F6F2EB", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "#18181B", color: "#fff", flexShrink: 0, minHeight: 44 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#E8703A", flexShrink: 0, letterSpacing: "-0.4px" }}>Duty Helper</span>
        <span style={{ color: "#3D3D42", flexShrink: 0 }}>|</span>
        <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{user.name}</span>
        <span style={{ background: "#27272A", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#A1A1AA", flexShrink: 0 }}>
          {user.role === "student" ? "🎓" : "💼"} {user.role}
        </span>
        <span style={{ background: "#E8703A", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#fff", flexShrink: 0 }}>{user.field}</span>
        {quoteEdit ? (
          <input
            value={quote}
            onChange={e => {
              setQuote(e.target.value);
              localStorage.setItem("dh_quote", e.target.value);
            }}
            onBlur={() => setQuoteEdit(false)}
            onKeyDown={e => e.key === "Enter" && setQuoteEdit(false)}
            autoFocus
            style={{ flex: 1, background: "#27272A", color: "#D4D4D8", border: "1px solid #3D3D42", borderRadius: 5, padding: "3px 8px", fontSize: 11, fontFamily: "inherit" }}
          />
        ) : (
          <span onClick={() => setQuoteEdit(true)} title="Click to edit quote" style={{ flex: 1, color: "#D4D4D8", fontSize: 12, fontStyle: "italic", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", cursor: "pointer" }}>
            "{quote}"
          </span>
        )}
        <span style={{ flexShrink: 0, fontSize: 12, color: "#D4D4D8", fontFamily: "monospace", fontWeight: 600 }}>{FD(now)} · {FT_SEC(now)}</span>
        <button onClick={handleReset} title="Reset all old data" style={{ background: "#E8703A", border: "1px solid #E8703A", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}>Reset</button>
      </div>

      {/* ── 3-COLUMN GRID ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>

        {/* ━━━━ LEFT: TASKS / KANBAN ━━━━ */}
        <div style={{ width: colSizes.left, minWidth: 220, maxWidth: "42vw", background: "#FAFAF7", borderRight: "1px solid #EDE7DE", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

          {/* Task header + add */}
          <div style={{ padding: "11px 13px", borderBottom: "1px solid #EDE7DE", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#1C1C1E", letterSpacing: "0.5px" }}>TASKS</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#C7C7CC" }}>{tasks.length + done.length} total</span>
                <button onClick={() => setAddOpen(s => !s)} style={{ background: "#E8703A", color: "#fff", border: "none", borderRadius: 6, width: 24, height: 24, fontSize: 17, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            {addOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                  <input value={addVal} onChange={e => setAddVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                    placeholder="Describe a task…" autoFocus
                    style={{ flex: 1, padding: "8px 10px", fontSize: 12, border: "1.5px solid #E8703A", borderRadius: 7, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  
                  {/* The New Priority Dropdown */}
                  <select value={addCat} onChange={e => setAddCat(e.target.value)}
                    style={{ padding: "8px", fontSize: 11, borderRadius: 7, border: "1.5px solid #E8E2DA", outline: "none", fontFamily: "inherit", background: "#FAFAF7", color: addCat === "AUTO" ? "#8E8E93" : CATS[addCat]?.color, fontWeight: 700 }}>
                    <option value="AUTO">✨ Auto AI</option>
                    <option value="UI">🔴 Urgent & Important</option>
                    <option value="UNI">🟡 Urgent, Not Important</option>
                    <option value="NUI">🔵 Not Urgent, Important</option>
                    <option value="NUNI">🟢 Not Urgent, Not Important</option>
                  </select>

                  <input
                    type="date"
                    value={addDate}
                    onChange={e => setAddDate(e.target.value)}
                    style={{
                      padding: "8px",
                      fontSize: 11,
                      borderRadius: 7,
                      border: "1.5px solid #E8E2DA",
                      outline: "none",
                      fontFamily: "inherit",
                      background: "#FAFAF7",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={addTask} disabled={aiLoad || !addVal.trim()}
                    style={{ ...bStyle("#FFF7F0", "#E8703A", true), flex: 1, opacity: aiLoad ? 0.6 : 1 }}>
                    {aiLoad ? "Processing…" : (addCat === "AUTO" ? "Add & Classify" : "Add Task")}
                  </button>
                  <button onClick={() => { setAddOpen(false); setAddCat("AUTO"); setAddDate(TODAY()); }} style={bStyle("#F3F4F6", "#9CA3AF", true)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Eisenhower legend */}
          <div style={{ padding: "7px 13px", display: "grid", gridTemplateColumns: "1fr", gap: 5, borderBottom: "1px solid #EDE7DE", background: "#fff", flexShrink: 0 }}>
            {Object.values(CATS).map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: c.color, fontWeight: 700 }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Kanban columns */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ height: leftTodoHeight, minHeight: 120, overflowY: "auto", padding: "10px 10px" }}>
              <KanbanCol title="To Do" status="todo" tasks={todoT} dot="#2563EB"
                onDrop={move} onMove={move} onDelete={del} onUpdate={updateTask} onLink={setLinked}
                linkedId={linked?.id} expanded={expanded} onExpand={setExpanded} />
            </div>
            {rowHandle("left-todo")}
            <div style={{ flex: 1, minHeight: 120, overflowY: "auto", padding: "10px 10px" }}>
              <KanbanCol title="Doing" status="doing" tasks={doingT} dot="#E8703A"
                onDrop={move} onMove={move} onDelete={del} onUpdate={updateTask} onLink={setLinked}
                linkedId={linked?.id} expanded={expanded} onExpand={setExpanded} />
            </div>
          </div>
        </div>

        {colHandle("left-col")}

        {/* ━━━━ CENTER: POMODORO + AI ━━━━ */}
        <div style={{ flex: 1, minWidth: 360, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Pomodoro / Clock */}
          <div style={{ height: centerPomHeight, minHeight: 220, background: "#fff", borderBottom: "1px solid #EDE7DE", padding: "10px 18px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, overflow: "hidden", boxSizing: "border-box" }}>
            {mode === "pomodoro" ? <PomRing t={timeLeft} total={total} phase={phase} isFullScreen={true}/> : <ClockWall now={now} />}
            <div style={{ flex: 1, textAlign: mode === "clock" ? "center" : "left" }}>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[["pomodoro","🍅 Pomodoro"],["clock","🕐 Clock"]].map(([m, lbl]) => (
                  <button key={m} onClick={() => setMode(m)} style={{ fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20, border: `1px solid ${mode === m ? "#E8703A" : "#E8E2DA"}`, background: mode === m ? "#FFF7F0" : "transparent", color: mode === m ? "#E8703A" : "#7C7C85", cursor: "pointer", fontFamily: "inherit" }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {mode === "clock" ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 46, fontWeight: 800, color: "#1C1C1E", fontFamily: "monospace", letterSpacing: 1 }}>{FT_SEC(now)}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700, marginTop: 4 }}>24-hour clock</div>
                  <button onClick={() => setFocusM(true)} style={{ ...bStyle("#18181B", "#fff", false, { border: "none", marginTop: 16, padding: "12px 22px", fontSize: 14 }) }}>
                    ⛶ Focus Mode
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1C1C1E", marginBottom: 4 }}>
                    {phase === "focus" ? "🍅 Focus Session" : "☕ Break Time"}
                  </div>
                  {linked && <div style={{ fontSize: 13, color: "#E8703A", fontStyle: "italic", marginBottom: 7, fontWeight: 600 }}>→ {linked.name}</div>}
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10, fontWeight: 600 }}>
                    {sets.fin} / {sets.target} sets · {Math.max(0, sets.target - sets.fin)} remaining
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 11 }}>
                    {Array.from({ length: sets.target }).map((_, i) => (
                      <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: i < sets.fin ? "#E8703A" : "#E8E5E0" }} />
                    ))}
                  </div>
                </>
              )}

              {/* Timer controls */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                {mode === "pomodoro" && (
                  <>
                    <button onClick={() => setRunning(r => !r)} style={bStyle("#FFF7F0", "#E8703A")}>
                      {running ? "⏸ Pause" : "▶ Start"}
                    </button>
                    <button onClick={resetPom} style={bStyle("#F3F4F6", "#9CA3AF")}>↺</button>
                  </>
                )}
                {mode === "pomodoro" && <button onClick={() => setFocusM(true)} style={bStyle("#18181B", "#fff", false, { border: "none" })}>⛶ Focus Mode</button>}

                {/* NEW: Sets & Manual Time Controls */}
                {mode === "pomodoro" && <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  
                  {/* Sets Adjuster */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Sets:</span>
                    
                    <button onClick={() => setSets(s => ({ ...s, target: Math.max(1, s.target - 1) }))}
                      style={{ 
                        width: 28, height: 28, border: "1.5px solid #1C1C1E", borderRadius: 6, 
                        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", 
                        justifyContent: "center", color: "#1C1C1E", fontWeight: "bold" 
                      }}>-</button>
                      
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{sets.target}</span>
                    
                    <button onClick={() => setSets(s => ({ ...s, target: s.target + 1 }))}
                      style={{ 
                        width: 28, height: 28, border: "1.5px solid #1C1C1E", borderRadius: 6, 
                        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", 
                        justifyContent: "center", color: "#1C1C1E", fontWeight: "bold" 
                      }}>+</button>
                  </div>

                  {/* Focus / Break Time Adjusters */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Focus:</span>
                    <input
                      type="number"
                      min="1"
                      value={focusMin}
                      onChange={(e) => {
                        const mins = Math.max(1, parseInt(e.target.value) || 1);
                        setFocusMin(mins);
                        if (phase === "focus") {
                          setTotal(mins * 60);
                          setTimeLeft(mins * 60);
                          setRunning(false);
                        }
                      }}
                      style={{ width: 52, padding: "6px", fontSize: 13, border: "1.5px solid #E8E2DA", borderRadius: 6, textAlign: "center" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Break:</span>
                    <input
                      type="number"
                      min="1"
                      value={breakMin}
                      onChange={(e) => {
                        const mins = Math.max(1, parseInt(e.target.value) || 1);
                        setBreakMin(mins);
                        if (phase === "break") {
                          setTotal(mins * 60);
                          setTimeLeft(mins * 60);
                          setRunning(false);
                        }
                      }}
                      style={{ width: 52, padding: "6px", fontSize: 13, border: "1.5px solid #E8E2DA", borderRadius: 6, textAlign: "center" }}
                    />
                  </div>
                </div>}
              </div>
            </div>
          </div>

          {rowHandle("center-pom")}

          {/* AI Command Center */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#C7C7CC", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8, flexShrink: 0 }}>
              🧠 AI Command Center · {user.field} Expert
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 8 }}>
              {chat.map((m, i) => (
                <div key={m.id || i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  <div style={{
                    maxWidth: m.role === "assistant" ? "94%" : "88%", padding: "12px 16px",
                    borderRadius: m.role === "user" ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
                    background: m.role === "user" ? "#E8703A" : "#fff",
                    color: m.role === "user" ? "#fff" : "#1C1C1E",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    <Md text={m.content} />
                  </div>
                </div>
              ))}
              {aiLoad && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                  <div style={{ background: "#fff", borderRadius: "3px 14px 14px 14px", padding: "9px 14px", fontSize: 12, color: "#9CA3AF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    Analysing ⏳
                  </div>
                </div>
              )}
              <div ref={chatRef} />
            </div>

            {/* ⬇️ NEW: Display Attached Files (Tiny UI) ⬇️ */}
            {attachedFiles.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8, padding: "0 4px" }}>
                {attachedFiles.map((f, i) => (
                  <div key={i} style={{ fontSize: 11, background: "#E8E2DA", color: "#1C1C1E", padding: "4px 8px", borderRadius: 6, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {f.name}</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#E05252", fontWeight: "bold" }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ flexShrink: 0, display: "flex", gap: 7, alignItems: "flex-end" }}>
              <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv" style={{ display: "none" }} onChange={handleFile} />
              <button onClick={() => fileRef.current?.click()} title="Upload document"
                style={{ ...bStyle("#FFF7F0", "#E8703A", false, { padding: "9px 14px", alignSelf: "stretch", flexShrink: 0, border: "1.5px solid #E8703A", minWidth: 54, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, }) }}>
                📎
              </button>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={`Describe tasks or paste ${user.field} content… (Enter to send, Shift+Enter = newline)`}
                rows={3} style={{ flex: 1, padding: "9px 11px", fontSize: 12, border: "1.5px solid #EDE7DE", borderRadius: 8, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5, background: "#fff", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#E8703A"}
                onBlur={e => e.target.style.borderColor = "#EDE7DE"}
              />
              <button onClick={sendMsg} disabled={aiLoad || (!input.trim() && attachedFiles.length === 0)}
                title="Send message"
                style={{ background: aiLoad || (!input.trim() && attachedFiles.length === 0) ? "#D1D5DB" : "#E8703A", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 17, cursor: aiLoad || (!input.trim() && attachedFiles.length === 0) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, alignSelf: "stretch", minWidth: 52, boxShadow: aiLoad || (!input.trim() && attachedFiles.length === 0) ? "none" : "0 4px 10px rgba(232,112,58,0.25)" }}>
                ↑
              </button>
            </div>
          </div>
        </div>

        {colHandle("right-col")}

        {/* ━━━━ RIGHT: COMPLETED + OVERVIEW + CALENDAR ━━━━ */}
        <div style={{ width: colSizes.right, minWidth: 220, maxWidth: "42vw", background: "#FAFAF7", borderLeft: "1px solid #EDE7DE", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

          {/* Completed Tasks */}
          <div style={{ height: rightHeights.completed, minHeight: 115, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 13px", background: "#fff", borderBottom: "1px solid #EDE7DE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: "#1C1C1E", letterSpacing: "0.5px" }}>✅ COMPLETED</span>
              <span style={{ fontSize: 10, color: "#C7C7CC" }}>{done.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px", background: "#fff", borderBottom: "1px solid #EDE7DE" }}>
              {done.length === 0 ? (
                <div style={{ textAlign: "center", color: "#DDD8D0", fontSize: 11, padding: "14px 0" }}>No completed tasks yet</div>
              ) : [...done].reverse().map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 7px", borderRadius: 6, marginBottom: 4, background: "#F9F8F5", borderLeft: `3px solid ${CATS[t.category]?.color || "#ccc"}` }}>
                  <span style={{ flex: 1, fontSize: 11, color: "#9CA3AF", textDecoration: "line-through", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.name}</span>
                  <span style={{ fontSize: 9, color: "#D1D5DB", flexShrink: 0 }}>{t.completedAt}</span>
                  <button
                    onClick={() => { setDone(prev => prev.filter(x => x.id !== t.id)); setTasks(prev => [...prev, { ...t, status: "todo", completedAt: undefined }]); }}
                    style={{ background: "none", border: "none", color: "#D1D5DB", cursor: "pointer", fontSize: 12, padding: 0, flexShrink: 0 }} title="Restore">↩</button>
                </div>
              ))}
            </div>
          </div>

          {rowHandle("right-completed")}

          {/* Kanban overview */}
          <div style={{ height: rightHeights.kanban, minHeight: 115, padding: "10px 13px", background: "#fff", borderBottom: "1px solid #EDE7DE", flexShrink: 0, overflowY: "auto", boxSizing: "border-box" }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#1C1C1E", letterSpacing: "0.5px", marginBottom: 9 }}>KANBAN BOARDS</div>
            {[["To Do", todoT.length, "#EEF2FF", "#4F46E5"], ["Doing", doingT.length, "#FFF7F0", "#E8703A"], ["Done", done.length, "#F0FDF4", "#16A34A"]].map(([lbl, n, bg, col]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{lbl}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: col, background: bg, borderRadius: 10, padding: "2px 9px" }}>{n}</span>
              </div>
            ))}
            {/* Eisenhower breakdown bar */}
            <div style={{ display: "flex", gap: 3, marginTop: 11 }}>
              {Object.entries(CATS).map(([k, c]) => {
                const n = [...tasks, ...done].filter(t => t.category === k).length;
                return (
                  <div key={k} style={{ flex: 1, textAlign: "center" }}>
                    <div title={`${c.label}: ${n}`} style={{ height: 5, borderRadius: 3, background: c.color, opacity: n ? 1 : 0.14 }} />
                    <div style={{ fontSize: 9, color: "#C7C7CC", marginTop: 3 }}>{n}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {rowHandle("right-kanban")}

          {/* Calendar */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 13px", background: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#1C1C1E", letterSpacing: "0.5px", marginBottom: 10 }}>CALENDAR</div>
            <Cal tasks={tasks} done={done} month={calMonth} setMonth={setCalMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          </div>
        </div>

      </div>
    </div>
  );
}