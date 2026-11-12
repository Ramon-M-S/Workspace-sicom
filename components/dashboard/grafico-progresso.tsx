"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type GraficoProgressoProps = {
  concluidas: number;
  emAndamento: number;
  pendentes: number;
  percentual: number;
};

export function GraficoProgresso({ concluidas, emAndamento, pendentes, percentual }: GraficoProgressoProps) {
  const dados = [
    { name: "Concluídas", value: concluidas, color: "#22c55e" },
    { name: "Em Andamento", value: emAndamento, color: "#3b82f6" },
    { name: "Pendentes", value: pendentes, color: "#e5e7eb" },
  ];

  return (
    <ResponsiveContainer width="100%" height={80}>
      <PieChart>
        <Pie data={dados} dataKey="value" innerRadius={24} outerRadius={34} paddingAngle={2}>
          {dados.map((item) => <Cell key={item.name} fill={item.color} />)}
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={24}
          fontWeight="bold"
        >
          {percentual}%
        </text>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
