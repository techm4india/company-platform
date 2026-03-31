import { useMemo, useRef, useState } from "react";
import * as api from "../api";

type LangId = "html" | "js" | "python";

const TEMPLATES: Record<LangId, { label: string; starter: string }> = {
  html: {
    label: "HTML Preview",
    starter: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>TechM4Schools</title>
    <style>
      body{font-family:system-ui;padding:24px;background:#f8fafc}
      .card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;max-width:520px}
      h1{margin:0 0 6px;color:#0f172a}
      .ok{color:#059669;font-weight:800}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Code Lab</h1>
      <div class="ok">Preview is working.</div>
      <p>Edit HTML and click RUN.</p>
    </div>
  </body>
</html>`
  },
  js: {
    label: "JavaScript",
    starter: `// Write JavaScript here
function add(a, b) { return a + b; }
console.log("Hello TechM4Schools:", add(2, 3));`
  },
  python: {
    label: "Python",
    starter: `# Write Python here
print("Hello TechM4Schools")
print(2 + 3)`
  }
};

export function CodeLabPage({ user }: { user: api.User }) {
  const [lang, setLang] = useState<LangId>("html");
  const [code, setCode] = useState(TEMPLATES.html.starter);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const header = useMemo(() => TEMPLATES[lang], [lang]);

  function select(l: LangId) {
    setLang(l);
    setCode(TEMPLATES[l].starter);
    setOutput("");
  }

  function run() {
    setRunning(true);
    setOutput("");
    setTimeout(() => {
      setRunning(false);
      if (lang === "html") {
        iframeRef.current!.srcdoc = code;
        return;
      }
      // Lightweight simulated runner (no server execution)
      setOutput(
        lang === "js"
          ? `Simulated JS console for ${user.name}\n\n${code}\n\n(Output)\nHello TechM4Schools: 5`
          : `Simulated Python runner for ${user.name}\n\n${code}\n\n(Output)\nHello TechM4Schools\n5`
      );
    }, 700);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>⚡ Code Lab</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Edit code, run preview, and submit via Submissions.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["html", "js", "python"] as const).map((l) => (
            <button
              key={l}
              onClick={() => select(l)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: `1.5px solid ${lang === l ? "#10B981" : "#E2E8F0"}`,
                background: lang === l ? "#F0FDF4" : "#fff",
                color: lang === l ? "#059669" : "#64748B",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              {TEMPLATES[l].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "#0F172A", alignItems: "center" }}>
          <div style={{ color: "#94A3B8", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{header.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCode(TEMPLATES[lang].starter)}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94A3B8", padding: "6px 10px", borderRadius: 10, fontWeight: 900, cursor: "pointer" }}
            >
              Reset
            </button>
            <button
              onClick={run}
              style={{ background: running ? "#6EE7B7" : "#10B981", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 10, fontWeight: 900, cursor: "pointer" }}
            >
              {running ? "Running..." : "RUN"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: 12, borderRight: "1px solid #E2E8F0" }}>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: "100%", minHeight: 420, border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.6, background: "#FAFAFA" }}
            />
          </div>
          <div style={{ padding: 12, background: "#F8FAFC" }}>
            {lang === "html" ? (
              <iframe ref={iframeRef} title="preview" sandbox="allow-scripts" style={{ width: "100%", height: 420, border: "1px solid #E2E8F0", borderRadius: 12, background: "#fff" }} />
            ) : (
              <pre style={{ margin: 0, height: 420, overflow: "auto", border: "1px solid #0F172A", borderRadius: 12, background: "#0F172A", color: "#E8F4FD", padding: 12, fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.6 }}>
                {output || "Press RUN to simulate output."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

