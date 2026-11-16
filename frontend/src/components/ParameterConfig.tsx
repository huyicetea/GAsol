// ============================================================
// ParameterConfig.tsx – Bảng điều khiển tham số GA
// ============================================================

import { Info, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { SolveRequest } from '../types/ga';

export type GAParams = Omit<SolveRequest, 'equation'>;

interface ParameterConfigProps {
  params: GAParams;
  onChange: (p: GAParams) => void;
}

const DEFAULTS: GAParams = {
  bounds: [-100, 100],
  pop_size: 100,
  max_generations: 500,
  crossover_rate: 0.8,
  mutation_rate: 0.1,
  tolerance: 1e-6,
};

interface TooltipProps {
  text: string;
}

function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-slate-500 hover:text-indigo-400 transition-colors"
        aria-label="Thông tin"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-xs text-slate-200 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

interface SliderRowProps {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

function SliderRow({ label, tooltip, value, min, max, step, onChange, format }: SliderRowProps) {
  const display = format ? format(value) : String(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          <Tooltip text={tooltip} />
        </div>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-right text-sm font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label={label}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-indigo-500"
        aria-label={`${label} slider`}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format ? format(min) : min}</span>
        <span className="text-indigo-400 font-mono">{display}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

export default function ParameterConfig({ params, onChange }: ParameterConfigProps) {
  const boundsError =
    params.bounds[0] >= params.bounds[1]
      ? 'bounds[min] phải nhỏ hơn bounds[max]'
      : null;

  return (
    <div className="space-y-5">
      {/* Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Tham số thuật toán GA</h3>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULTS })}
          className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-indigo-500 hover:text-indigo-300 active:scale-95"
        >
          <RotateCcw className="h-3 w-3" />
          Đặt lại mặc định
        </button>
      </div>

      {/* Bounds */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-300">Miền tìm kiếm (bounds)</span>
          <Tooltip text="Khoảng [min, max] chứa nghiệm. Thuật toán GA chỉ tìm trong miền này." />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-slate-400 shrink-0">Min</label>
            <input
              type="number"
              value={params.bounds[0]}
              step={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange({ ...params, bounds: [v, params.bounds[1]] });
              }}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <span className="text-slate-500">→</span>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-slate-400 shrink-0">Max</label>
            <input
              type="number"
              value={params.bounds[1]}
              step={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange({ ...params, bounds: [params.bounds[0], v] });
              }}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        {boundsError && (
          <p className="text-xs text-red-400">{boundsError}</p>
        )}
      </div>

      <div className="border-t border-slate-700" />

      {/* pop_size */}
      <SliderRow
        label="Kích thước quần thể"
        tooltip="Số cá thể trong mỗi thế hệ. Lớn hơn → đa dạng hơn nhưng chậm hơn."
        value={params.pop_size}
        min={10}
        max={1000}
        step={10}
        onChange={(v) => onChange({ ...params, pop_size: Math.round(v) })}
      />

      {/* max_generations */}
      <SliderRow
        label="Số thế hệ tối đa"
        tooltip="Thuật toán dừng khi đạt số thế hệ này (nếu chưa hội tụ)."
        value={params.max_generations}
        min={1}
        max={2000}
        step={50}
        onChange={(v) => onChange({ ...params, max_generations: Math.round(v) })}
      />

      {/* crossover_rate */}
      <SliderRow
        label="Tỷ lệ lai ghép"
        tooltip="Xác suất 2 cá thể cha mẹ trao đổi gen (BLX-α). Thường 0.6–0.9."
        value={params.crossover_rate}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ...params, crossover_rate: v })}
        format={(v) => v.toFixed(2)}
      />

      {/* mutation_rate */}
      <SliderRow
        label="Tỷ lệ đột biến"
        tooltip="Xác suất gen bị đột biến ngẫu nhiên. Giúp thoát cực trị cục bộ. Thường 0.01–0.2."
        value={params.mutation_rate}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ...params, mutation_rate: v })}
        format={(v) => v.toFixed(2)}
      />

      {/* tolerance */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-300">Sai số cho phép (ε)</span>
            <Tooltip text="Thuật toán dừng sớm và đánh dấu 'converged' khi sai số ≤ ε." />
          </div>
          <select
            value={params.tolerance}
            onChange={(e) => onChange({ ...params, tolerance: parseFloat(e.target.value) })}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-sm font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {[1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8].map((v) => (
              <option key={v} value={v}>{v.toExponential()}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export { DEFAULTS as GA_DEFAULTS };
