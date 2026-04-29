import React from "react";

type Props = {
  insights: string;
};

// Parse the markdown into structured sections
const parseInsights = (text: string) => {
  const sections: { title: string; content: string }[] = [];
  const lines = text.split("\n");
  let current: { title: string; content: string } | null = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^###\s+\d+\.\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { title: headingMatch[1].trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  });

  if (current) sections.push(current);
  return sections;
};

// Convert inline markdown (**bold**, *italic*) to JSX
const renderInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: "#fff", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i} style={{ color: "#aaa" }}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
};

// Render bullet lines with nesting support
const renderContent = (content: string) => {
  const lines = content
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "" && l.trim() !== "---");

  return lines.map((line, i) => {
    const subBullet = line.match(/^\s{4,}\*\s+(.+)/);
    const bullet = line.match(/^\*\s+(.+)/);
    const plain = line.trim();

    if (subBullet) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 20, marginBottom: 5 }}>
          <span style={{ color: "#555", fontSize: 12, marginTop: 2, flexShrink: 0 }}>◦</span>
          <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {renderInline(subBullet[1])}
          </p>
        </div>
      );
    }

    if (bullet) {
      return (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <span style={{ color: "#6C63FF", fontSize: 16, marginTop: 1, flexShrink: 0 }}>›</span>
          <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            {renderInline(bullet[1])}
          </p>
        </div>
      );
    }

    if (plain) {
      return (
        <p key={i} style={{ color: "#bbb", fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>
          {renderInline(plain)}
        </p>
      );
    }

    return null;
  });
};

const SECTION_META: Record<string, { icon: string; accent: string }> = {
  "Top Categories (by Spend)": { icon: "📊", accent: "#6C63FF" },
  "Saving Tips":               { icon: "💡", accent: "#2EAF7D" },
  "Unusual Spending & Observations": { icon: "🔍", accent: "#E86C3A" },
};

const getFallbackMeta = (index: number) => {
  const accents = ["#6C63FF", "#2EAF7D", "#E86C3A", "#3B9EDB", "#F4B942"];
  const icons   = ["📋", "💰", "📌", "📈", "🧾"];
  return { icon: icons[index % icons.length], accent: accents[index % accents.length] };
};

const InsightsPanel: React.FC<Props> = ({ insights }) => {
  const sections = parseInsights(insights);

  // Pull the summary line (first non-heading paragraph)
  const summaryMatch = insights.match(
    /^(?!###)(Based on|Here is|Your total)[^\n]+\n?[^\n]*/m
  );
  const summary = summaryMatch ? summaryMatch[0].trim() : null;

  return (
    <div style={{
      background: "linear-gradient(160deg, #13131F, #1A1A2E)",
      borderRadius: 20,
      padding: "28px 28px 20px",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 720,
      boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#555", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
          AI Analysis
        </p>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: "0 0 10px" }}>
          Spending Insights
        </h2>
        {summary && (
          <div style={{
            background: "#1E1E35",
            border: "0.5px solid #2A2A45",
            borderRadius: 10,
            padding: "10px 14px",
          }}>
            <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {renderInline(summary)}
            </p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section, i) => {
          const meta = SECTION_META[section.title] ?? getFallbackMeta(i);
          return (
            <div
              key={i}
              style={{
                background: "#1A1A2C",
                border: `0.5px solid #2A2A40`,
                borderLeft: `3px solid ${meta.accent}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderBottom: "0.5px solid #222236",
              }}>
                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {section.title}
                </h3>
              </div>

              {/* Section body */}
              <div style={{ padding: "14px 16px" }}>
                {renderContent(section.content)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{ color: "#333", fontSize: 11, textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        Generated by Gemini AI · based on your uploaded statement
      </p>
    </div>
  );
};

export default InsightsPanel;