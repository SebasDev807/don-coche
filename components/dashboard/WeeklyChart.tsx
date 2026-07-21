'use client';

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  dia: string;
  lavadero: number;
  serviteca: number;
}

interface WeeklyChartProps {
  data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-variant shadow-md">
        <p className="font-label-bold text-sm text-on-surface mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-on-surface-variant capitalize">{entry.name}:</span>
            <span className="font-bold text-on-surface">
              ${entry.value.toLocaleString('es-CO')}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-surface-variant flex justify-between gap-4 text-xs font-bold text-on-surface">
          <span>Total:</span>
          <span>
            ${payload.reduce((acc: number, curr: any) => acc + curr.value, 0).toLocaleString('es-CO')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '256px' }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 0,
            left: 0,
            bottom: 0,
          }}
          barGap={2}
          barSize={24}
        >
          <XAxis 
            dataKey="dia" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'var(--color-surface-container-high)', opacity: 0.4 }}
          />
          <Bar dataKey="lavadero" name="Lavadero" fill="var(--color-primary-container)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="serviteca" name="Serviteca" fill="var(--color-tertiary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
