// ============================================================
// EquationForm.tsx – Nhập & kiểm tra phương trình
// ============================================================

import { CheckCircle, ChevronRight, FlaskConical, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { validateEquation } from '../services/api';
import type { ValidateResponse } from '../types/ga';

interface EquationFormProps {
  equation: string;
  onChange: (eq: string) => void;
  onValidated: (result: ValidateResponse | null) => void;
}

const PRESETS = [
  { label: 'Bậc 2 (1 ẩn)', value: 'x**2 - 9 = 0' },
  { label: 'Đa biến', value: 'x**2 + 2*y - 4 = 0' },
  { label: 'Lượng giác', value: 'sin(x) + cos(y) = 0' },
  { label: 'Phi tuyến', value: 'x**3 - 2*x - 5 = 0' },
  { label: 'Hỗn hợp', value: 'x**2 + y**2 - 25 = 0' },
];

export default function EquationForm({
  equation,
  onChange,
  onValidated,
}: EquationFormProps) {
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runValidate = useCallback(
    async (eq: string) => {
      if (!eq.trim()) {
        setStatus('idle');
        setResult(null);
        onValidated(null);
        return;
      }
      setStatus('validating');
      try {
        const res = await validateEquation(eq.trim());
        setResult(res);
        setStatus(res.is_valid ? 'valid' : 'invalid');
        onValidated(res.is_valid ? res : null);
      } catch {
        setResult({ is_valid: false, variables: [], message: 'Không kết nối được backend.' });
        setStatus('invalid');
        onValidated(null);
      }
    },
    [onValidated],
  );

  // Debounce 500ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runValidate(equation), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [equation, runValidate]);

  const borderColor =
    status === 'valid'
      ? 'ring-2 ring-emerald-500 border-emerald-500'
      : status === 'invalid'
        ? 'ring-2 ring-red-500 border-red-500'
        : 'border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500';

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Phương trình toán học
        </label>
        <div className={`relative flex items-center rounded-xl border bg-slate-800 transition-all ${borderColor}`}>
          <FlaskConical className="ml-3 h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={equation}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ví dụ: x**2 - 9 = 0"
            spellCheck={false}
            className="flex-1 bg-transparent px-3 py-3.5 text-base font-mono text-white placeholder:text-slate-500 focus:outline-none"
          />
          {status === 'validating' && (
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-indigo-400 shrink-0" />
          )}
          {status === 'valid' && (
            <CheckCircle className="mr-3 h-5 w-5 text-emerald-400 shrink-0" />
          )}
          {status === 'invalid' && (
            <XCircle className="mr-3 h-5 w-5 text-red-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Validation feedback */}
      {status === 'valid' && result && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-700/50 p-3 space-y-2">
          <p className="text-sm font-medium text-emerald-400">✓ Phương trình hợp lệ</p>
          {result.normalized_equation && (
            <p className="text-xs font-mono text-slate-300">
              Chuẩn hóa:{' '}
              <span className="text-emerald-300">{result.normalized_equation}</span>
            </p>
          )}
          {result.variables.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              <span className="text-xs text-slate-400">Ẩn số:</span>
              {result.variables.map((v) => (
                <span
                  key={v}
                  className="rounded-md bg-indigo-600/40 border border-indigo-500/50 px-2 py-0.5 text-xs font-mono font-semibold text-indigo-300"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'invalid' && result && (
        <div className="rounded-xl bg-red-950/60 border border-red-700/50 p-3">
          <p className="text-sm font-medium text-red-400">✗ Lỗi phương trình</p>
          <p className="text-xs text-red-300 mt-1">{result.message}</p>
        </div>
      )}

      {/* Preset buttons */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-2">Ví dụ nhanh:</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-indigo-500 hover:bg-slate-700 hover:text-indigo-300 active:scale-95"
            >
              <ChevronRight className="h-3 w-3" />
              <code className="font-mono">{p.value}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
