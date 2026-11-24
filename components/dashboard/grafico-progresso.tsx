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
    { name: "Concluídas", value: concluidas, color: "hsl(var(--chart-1))" },
    { name: "Em Andamento", value: emAndamento, color: "hsl(var(--chart-2))" },
    { name: "Pendentes", value: pendentes, color: "hsl(var(--chart-5))" },
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
          fill="hsl(var(--foreground))"
        >
          {percentual}%
        </text>
        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
