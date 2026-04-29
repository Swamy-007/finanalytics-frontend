import React from "react";
import { PieChart, Pie, Tooltip } from "recharts";

type Transaction = {
  category: string;
  amount: number;
};

type Props = {
  transactions: Transaction[];
};

const SpendingChart: React.FC<Props> = ({ transactions }) => {
  const map: Record<string, number> = {};

  transactions.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
  });

  const data = Object.keys(map).map((k) => ({
    name: k,
    value: map[k],
  }));

  return (
    <PieChart width={400} height={400}>
      <Pie data={data} dataKey="value" outerRadius={120} />
      <Tooltip />
    </PieChart>
  );
};

export default SpendingChart;