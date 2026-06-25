import React from "react";
import {
  PieChart,
  Pie,
  Tooltip,
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

interface TooltipPayloadItem {
  payload: { name: string; value: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="sc-tooltip">
      <p className="sc-tooltip-name">{name}</p>
      <p className="sc-tooltip-value">{formatCurrency(value)}</p>
    </div>
  );
};

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  fill: string;
  fillOpacity: number;
}

const SpendingChart: React.FC<Props> = ({ transactions }) => {
  const map: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.amount !== 0) {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const data: ChartDataItem[] = Object.keys(map)
    .map((k, i) => ({ name: k, value: map[k], color: getColor(k, i), fill: getColor(k, i), fillOpacity: 0.92 }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return <div className="sc-empty">No spending data to display.</div>;
  }

  return (
    <div className="sc-card">

      {/* Header */}
      <div>
        <p className="sc-header-label">Breakdown</p>
        <div className="sc-header-row">
          <h2 className="sc-header-title">Spending by Category</h2>
          <span className="sc-header-total">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Chart + Legend */}
      <div className="sc-body">
        <div className="sc-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="38%"
                outerRadius="80%"
                paddingAngle={3}
                strokeWidth={0}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="sc-legend">
          {data.map((item) => (
            <div key={item.name} className="sc-legend-item">
              <div className="sc-legend-name-group">
                <div className="sc-legend-dot" style={{ background: item.color }} />
                <span className="sc-legend-name">{item.name}</span>
              </div>
              <span className="sc-legend-pct">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top-3 summary */}
      <div className="sc-summary-bar">
        {data.slice(0, 3).map((item) => (
          <div
            key={item.name}
            className="sc-summary-item"
            style={{ "--sc-item-color": item.color } as React.CSSProperties}
          >
            <p className="sc-summary-label">{item.name}</p>
            <p className="sc-summary-value">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;
