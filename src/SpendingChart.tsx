import React from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

type Transaction = {
  category: string;
  amount: number;
};

type Props = {
  transactions: Transaction[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Dining:        "#E86C3A",
  Groceries:     "#2EAF7D",
  Shopping:      "#6C63FF",
  Transport:     "#3B9EDB",
  Entertainment: "#F4B942",
  Subscriptions: "#E85D8A",
  Travel:        "#00BCD4",
  Health:        "#66BB6A",
  Utilities:     "#8D6E63",
  Transfer:      "#90A4AE",
  Other:         "#B0BEC5",
};

const FALLBACK_COLORS = [
  "#6C63FF", "#E86C3A", "#2EAF7D", "#F4B942",
  "#E85D8A", "#3B9EDB", "#00BCD4", "#66BB6A",
];

const getColor = (category: string, index: number): string =>
  CATEGORY_COLORS[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

// ── Tooltip types ───────────────────────────────────────────────
interface TooltipPayloadItem {
  payload: {
    name: string;
    value: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// ── Custom tooltip ──────────────────────────────────────────────
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div style={{
      background: "#1E1E2E",
      border: "1px solid #2E2E42",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ color: "#aaa", fontSize: 11, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {name}
      </p>
      <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
        {formatCurrency(value)}
      </p>
    </div>
  );
};

// ── Custom legend ───────────────────────────────────────────────
interface LegendItem {
  name: string;
  value: number;
  color: string;
}

const CustomLegend: React.FC<{ data: LegendItem[] }> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
      {data.map((item) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: item.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: "#ccc", whiteSpace: "nowrap" }}>
              {item.name}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#888", fontVariantNumeric: "tabular-nums" }}>
            {((item.value / total) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Chart data type ─────────────────────────────────────────────
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

// ── Main component ──────────────────────────────────────────────
const SpendingChart: React.FC<Props> = ({ transactions }) => {
  const map: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.amount !== 0) {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const data: ChartDataItem[] = Object.keys(map)
    .map((k, i) => ({ name: k, value: map[k], color: getColor(k, i) }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#666", padding: 40 }}>
        No spending data to display.
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(145deg, #16162A, #1E1E36)",
      borderRadius: 20,
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      maxWidth: 640,
    }}>

      {/* Header */}
      <div>
        <p style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Breakdown
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: 0 }}>
            Spending by Category
          </h2>
          <span style={{ color: "#E8C06A", fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Chart + Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 240px", height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.92} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend data={data} />
      </div>

      {/* Top 3 summary bar */}
      <div style={{ borderTop: "1px solid #2A2A40", paddingTop: 16, display: "flex", gap: 12 }}>
        {data.slice(0, 3).map((item) => (
          <div key={item.name} style={{
            flex: 1,
            background: "#12121E",
            borderRadius: 10,
            padding: "10px 12px",
            borderLeft: `3px solid ${item.color}`,
          }}>
            <p style={{ color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
              {item.name}
            </p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;