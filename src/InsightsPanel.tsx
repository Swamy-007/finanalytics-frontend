import React from "react";

type Props = {
  insights: string;
};

const parseInsights = (text: string) => {
  const sections: { title: string; content: string }[] = [];
  const lines = text.split("\n");
  let current: { title: string; content: string } | null = null;

  lines.forEach((line) => {
    // Matches: ### 1. Title  OR  ### **1. Title**  OR  ### **Title**
    const headingMatch = line.match(/^###\s+\**\d*\.?\**\s*\**(.+?)\**\s*$/);
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

// Render markdown table into a styled HTML table
const renderTable = (rows: string[]) => {
  const headerCells = rows[0]
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  // rows[1] is the separator line (| :--- | :--- |), skip it
  const bodyRows = rows.slice(2).map((row) =>
    row.split("|").map((c) => c.trim()).filter(Boolean)
  );

  return (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headerCells.map((cell, i) => (
              <th key={i} style={{
                textAlign: "left",
                padding: "8px 12px",
                color: "#888",
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderBottom: "0.5px solid #2A2A45",
                whiteSpace: "nowrap",
              }}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "#16162A" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "8px 12px",
                  color: ci === 0 ? "#fff" : "#bbb",
                  fontWeight: ci === 0 ? 500 : 400,
                  borderBottom: "0.5px solid #1E1E35",
                  whiteSpace: "nowrap",
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderContent = (content: string) => {
  const lines = content
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "" && l.trim() !== "---");

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table block: line starts with |
    if (line.trim().startsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableRows.push(lines[i]);
        i++;
      }
      if (tableRows.length >= 2) {
        elements.push(<div key={`table-${i}`}>{renderTable(tableRows)}</div>);
      }
      continue;
    }

    const subBullet = line.match(/^\s{4,}\*\s+(.+)/);
    const bullet = line.match(/^\*\s+(.+)/);
    const plain = line.trim();

    if (subBullet) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 20, marginBottom: 5 }}>
          <span style={{ color: "#555", fontSize: 12, marginTop: 2, flexShrink: 0 }}>◦</span>
          <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {renderInline(subBullet[1])}
          </p>
        </div>
      );
    } else if (bullet) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <span style={{ color: "#6C63FF", fontSize: 16, marginTop: 1, flexShrink: 0 }}>›</span>
          <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            {renderInline(bullet[1])}
          </p>
        </div>
      );
    } else if (plain) {
      elements.push(
        <p key={i} style={{ color: "#bbb", fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>
          {renderInline(plain)}
        </p>
      );
    }

    i++;
  }

  return elements;
};

const SECTION_META: Record<string, { icon: string; accent: string }> = {
  "Top Categories":                  { icon: "📊", accent: "#6C63FF" },
  "Top Categories (by Spend)":       { icon: "📊", accent: "#6C63FF" },
  "Saving Tips":                     { icon: "💡", accent: "#2EAF7D" },
  "Unusual Spending":                { icon: "🔍", accent: "#E86C3A" },
  "Unusual Spending & Observations": { icon: "🔍", accent: "#E86C3A" },
  "Observations":                    { icon: "📌", accent: "#F4B942" },
  "Recommendations":                 { icon: "✅", accent: "#3B9EDB" },
};

const getFallbackMeta = (index: number) => {
  const accents = ["#6C63FF", "#2EAF7D", "#E86C3A", "#3B9EDB", "#F4B942"];
  const icons   = ["📋", "💰", "📌", "📈", "🧾"];
  return { icon: icons[index % icons.length], accent: accents[index % accents.length] };
};

const InsightsPanel: React.FC<Props> = ({ insights }) => {
  const sections = parseInsights(insights);

  const summaryMatch = insights.match(
    /^(?!###)(Based on|Here is|Your total|The total)[^\n]+\n?[^\n]*/m
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

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section, i) => {
          const meta = SECTION_META[section.title] ?? getFallbackMeta(i);
          return (
            <div key={i} style={{
              background: "#1A1A2C",
              border: "0.5px solid #2A2A40",
              borderLeft: `3px solid ${meta.accent}`,
              borderRadius: 12,
              overflow: "hidden",
            }}>
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
              <div style={{ padding: "14px 16px" }}>
                {renderContent(section.content)}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: "#333", fontSize: 11, textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        Generated by Gemini AI · based on your uploaded statement
      </p>
    </div>
  );
};

export default InsightsPanel;