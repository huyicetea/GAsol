// ============================================================
// ResultDisplay.tsx – Hiển thị kết quả nghiệm GA
// ============================================================

import { CheckCircle2, Clock, Copy, Hash, Target, TrendingDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { SolveResponse } from '../types/ga';

interface ResultDisplayProps {
  result: SolveResponse;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function MetricCard({ icon, label, value, sub, accent }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? 'border-indigo-700/60 bg-indigo-950/40'
          : 'border-slate-700/60 bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={accent ? 'text-indigo-400' : 'text-slate-400'}>{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-lg font-bold font-mono ${accent ? 'text-indigo-300' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const isConverged = result.status === 'converged';

  const solutionText = Object.entries(result.best_solution)
    .map(([k, v]) => `${k} = ${v.toFixed(8)}`)
    .join('\n');

  const handleCopy = () => {
    void navigator.clipboard.writeText(
      `Phương trình: ${result.status}\n${solutionText}\nSai số: ${result.final_error.toExponential(4)}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-slate-200">Kết quả</h3>
        {isConverged ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-900/60 border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Hội tụ thành công
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-900/60 border border-amber-600/50 px-3 py-1 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Đạt giới hạn thế hệ
          </span>
        )}
      </div>

      {/* Metric cards 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Thời gian tính toán"
          value={`${result.execution_time_ms.toFixed(1)} ms`}
        />
        <MetricCard
          icon={<Hash className="h-4 w-4" />}
          label="Số thế hệ đã chạy"
          value={result.generations_run.toLocaleString()}
        />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Sai số cuối cùng"
          value={result.final_error.toExponential(4)}
          accent={result.final_error < 1e-4}
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label="Độ thích nghi tốt nhất"
          value={result.best_fitness.toFixed(8)}
          accent={result.best_fitness > 0.999}
        />
      </div>

      {/* Solution values */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-200">Nghiệm tìm được</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-400 transition-all hover:border-indigo-500 hover:text-indigo-300 active:scale-95"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Đã sao chép!' : 'Sao chép'}
          </button>
        </div>
        <div className="p-4 space-y-2">
          {Object.entries(result.best_solution).map(([varName, varValue]) => (
            <div
              key={varName}
              className="flex items-center justify-between rounded-lg bg-slate-900/60 border border-slate-700/50 px-4 py-2.5"
            >
              <span className="font-mono text-lg font-bold text-indigo-400">{varName}</span>
              <div className="text-right">
                <p className="font-mono text-base font-semibold text-white">
                  ≈ {varValue.toFixed(6)}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {varValue.toPrecision(10)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
