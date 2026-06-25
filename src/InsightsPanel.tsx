import React from "react";

type Props = {
  insights: string;
};

const parseInsights = (text: string) => {
  const sections: { title: string; content: string }[] = [];
  const lines = text.split("\n");
  let current: { title: string; content: string } | null = null;

  lines.forEach((line) => {
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

const renderInline = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="ip-bold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i} className="ip-em">{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });

const renderTable = (rows: string[]) => {
  const headerCells = rows[0].split("|").map((c) => c.trim()).filter(Boolean);
  const bodyRows = rows.slice(2).map((row) =>
    row.split("|").map((c) => c.trim()).filter(Boolean)
  );

  return (
    <div className="ip-table-wrap">
      <table className="ip-table">
        <thead>
          <tr>
            {headerCells.map((cell, i) => (
              <th key={i} className="ip-th">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "ip-tr-even" : "ip-tr-odd"}>
              {row.map((cell, ci) => (
                <td key={ci} className={`ip-td ${ci === 0 ? "ip-td-primary" : "ip-td-secondary"}`}>
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
    const bullet    = line.match(/^\*\s+(.+)/);
    const plain     = line.trim();

    if (subBullet) {
      elements.push(
        <div key={i} className="ip-sub-bullet">
          <span className="ip-sub-dot">◦</span>
          <p className="ip-sub-text">{renderInline(subBullet[1])}</p>
        </div>
      );
    } else if (bullet) {
      elements.push(
        <div key={i} className="ip-bullet">
          <span className="ip-bullet-arrow">›</span>
          <p className="ip-bullet-text">{renderInline(bullet[1])}</p>
        </div>
      );
    } else if (plain) {
      elements.push(
        <p key={i} className="ip-plain-text">{renderInline(plain)}</p>
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
    <div className="ip-card">
      <div className="ip-header">
        <p className="ip-header-label">AI Analysis</p>
        <h2 className="ip-header-title">Spending Insights</h2>
        {summary && (
          <div className="ip-summary">
            <p className="ip-summary-text">{renderInline(summary)}</p>
          </div>
        )}
      </div>

      <div className="ip-sections">
        {sections.map((section, i) => {
          const meta = SECTION_META[section.title] ?? getFallbackMeta(i);
          return (
            <div
              key={i}
              className="ip-section"
              style={{ "--ip-accent": meta.accent } as React.CSSProperties}
            >
              <div className="ip-section-head">
                <span className="ip-section-icon">{meta.icon}</span>
                <h3 className="ip-section-title">{section.title}</h3>
              </div>
              <div className="ip-section-body">
                {renderContent(section.content)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="ip-footer">Generated by Gemini AI · based on your uploaded statement</p>
    </div>
  );
};

export default InsightsPanel;
