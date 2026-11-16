// ============================================================
// ConvergenceChart.tsx – Biểu đồ hội tụ GA
// ============================================================

import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GenerationStat } from '../types/ga';

interface ConvergenceChartProps {
  history: GenerationStat[];
}

type ChartTab = 'fitness' | 'error';

// Custom Tooltip component for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: number;
  tab: ChartTab;
}

function CustomTooltip({ active, payload, label, tab }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">Thế hệ {label}</p>
      <p className="font-mono font-semibold text-white">
        {tab === 'fitness'
          ? `Fitness: ${(val ?? 0).toFixed(8)}`
          : `Min Error: ${(val ?? 0).toExponential(4)}`}
      </p>
    </div>
  );
}

export default function ConvergenceChart({ history }: ConvergenceChartProps) {
  const [tab, setTab] = useState<ChartTab>('fitness');

  // Subsample nếu quá nhiều điểm (giữ tốc độ render)
  const data =
    history.length > 500
      ? history.filter((_, i) => i % Math.ceil(history.length / 500) === 0)
      : history;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Biểu đồ hội tụ</h3>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {(
            [
              { key: 'fitness' as ChartTab, label: 'Best Fitness' },
              { key: 'error' as ChartTab, label: 'Min Error' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                tab === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.6} />
            <XAxis
              dataKey="generation"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              label={{
                value: 'Thế hệ',
                position: 'insideBottom',
                offset: -2,
                fill: '#64748b',
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v: number) =>
                tab === 'fitness' ? v.toFixed(3) : v.toExponential(1)
              }
              width={tab === 'error' ? 70 : 56}
            />
            <Tooltip content={<CustomTooltip tab={tab} />} />
            {tab === 'fitness' ? (
              <Line
                type="monotone"
                dataKey="best_fitness"
                name="Best Fitness"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#818cf8' }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="min_error"
                name="Min Error"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#fbbf24' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-slate-500 mt-1">
          {history.length} thế hệ
          {data.length < history.length ? ` (hiển thị ${data.length} điểm mẫu)` : ''}
        </p>
      </div>
    </div>
  );
}
