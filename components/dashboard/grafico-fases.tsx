"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type GraficoFasesProps = {
  fases: Array<{ nome: string; progressoMedio: number }>;
};

export function GraficoFases({ fases }: GraficoFasesProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={fases} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-15} stroke="currentColor" className="text-muted-foreground" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" stroke="currentColor" className="text-muted-foreground" />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
          formatter={(value) => `${value}%`}
        />
        <Bar dataKey="progressoMedio" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
