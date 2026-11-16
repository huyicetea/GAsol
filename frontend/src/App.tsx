// ============================================================
// App.tsx – Dashboard chính của GAsol
// ============================================================

import { AlertTriangle, Atom, Dna, Loader2, Play, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useState } from 'react';
import ConvergenceChart from './components/ConvergenceChart';
import EquationForm from './components/EquationForm';
import ParameterConfig, { GA_DEFAULTS, type GAParams } from './components/ParameterConfig';
import ResultDisplay from './components/ResultDisplay';
import { solveEquation } from './services/api';
import type { SolveResponse, ValidateResponse } from './types/ga';

type AppState = 'idle' | 'solving' | 'done' | 'error';

export default function App() {
  const [equation, setEquation] = useState('x**2 - 9 = 0');
  const [validated, setValidated] = useState<ValidateResponse | null>(null);
  const [params, setParams] = useState<GAParams>({ ...GA_DEFAULTS });
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSolve =
    validated !== null &&
    validated.is_valid &&
    params.bounds[0] < params.bounds[1] &&
    appState !== 'solving';

  const handleSolve = useCallback(async () => {
    if (!canSolve || !validated) return;
    setAppState('solving');
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await solveEquation({
        equation: validated.normalized_equation ?? equation.trim(),
        bounds: params.bounds,
        pop_size: params.pop_size,
        max_generations: params.max_generations,
        crossover_rate: params.crossover_rate,
        mutation_rate: params.mutation_rate,
        tolerance: params.tolerance,
      });
      setResult(res);
      setAppState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
      setAppState('error');
    }
  }, [canSolve, equation, params, validated]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">GAsol</h1>
              <p className="text-xs text-slate-400">Genetic Algorithm Equation Solver</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Atom className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Powered by FastAPI + GA Engine</span>
          </div>
        </div>
      </header>

      {/* ── Global error banner ── */}
      {appState === 'error' && errorMsg && (
        <div className="border-b border-red-800/60 bg-red-950/60 px-4 py-2.5">
          <div className="mx-auto max-w-7xl flex items-start gap-2">
            {errorMsg.toLowerCase().includes('kết nối') ||
            errorMsg.toLowerCase().includes('network') ||
            errorMsg.toLowerCase().includes('timeout') ? (
              <WifiOff className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-red-300">Lỗi khi giải phương trình</p>
              <p className="text-xs text-red-400 mt-0.5">{errorMsg}</p>
              {(errorMsg.toLowerCase().includes('kết nối') ||
                errorMsg.toLowerCase().includes('network') ||
                errorMsg.toLowerCase().includes('econnrefused') ||
                errorMsg.toLowerCase().includes('timeout')) && (
                <p className="text-xs text-red-500 mt-1 font-mono">
                  Hãy đảm bảo backend đang chạy: <code>uvicorn app.main:app --reload</code>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout: 2 cột ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* ── Cột trái: Input + Params ── */}
          <div className="space-y-5">
            {/* Card: Phương trình */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1 rounded-full bg-indigo-500" />
                <h2 className="text-base font-semibold text-slate-100">Nhập phương trình</h2>
              </div>
              <EquationForm
                equation={equation}
                onChange={(eq) => {
                  setEquation(eq);
                  if (appState === 'done' || appState === 'error') {
                    setAppState('idle');
                    setResult(null);
                  }
                }}
                onValidated={setValidated}
              />
            </section>

            {/* Card: Tham số GA */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1 rounded-full bg-purple-500" />
                <h2 className="text-base font-semibold text-slate-100">Cấu hình GA</h2>
              </div>
              <ParameterConfig params={params} onChange={setParams} />
            </section>

            {/* Solve button */}
            <button
              type="button"
              disabled={!canSolve}
              onClick={() => void handleSolve()}
              className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-base font-bold transition-all shadow-lg
                ${
                  canSolve
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
            >
              {appState === 'solving' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang chạy thuật toán GA…
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Giải phương trình
                </>
              )}
            </button>

            {/* Hint when disabled */}
            {!canSolve && appState !== 'solving' && (
              <p className="text-center text-xs text-slate-500">
                {!validated || !validated.is_valid
                  ? 'Nhập phương trình hợp lệ để kích hoạt.'
                  : 'bounds[min] phải nhỏ hơn bounds[max].'}
              </p>
            )}
          </div>

          {/* ── Cột phải: Kết quả + Biểu đồ ── */}
          <div className="space-y-5">
            {appState === 'idle' && !result && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
                  <Wifi className="h-7 w-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">Chưa có kết quả</p>
                <p className="text-slate-500 text-sm mt-1">
                  Nhập phương trình và nhấn <strong className="text-slate-400">Giải phương trình</strong>
                </p>
              </div>
            )}

            {appState === 'solving' && (
              <div className="rounded-2xl border border-indigo-800/50 bg-indigo-950/30 p-10 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-400 mb-4" />
                <p className="text-indigo-300 font-medium">Thuật toán GA đang tiến hóa…</p>
                <p className="text-slate-500 text-sm mt-1">
                  Có thể mất vài giây tùy vào số thế hệ
                </p>
              </div>
            )}

            {(appState === 'done' || appState === 'error') && result && (
              <>
                {/* Kết quả */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 rounded-full bg-emerald-500" />
                    <h2 className="text-base font-semibold text-slate-100">Nghiệm & Thống kê</h2>
                  </div>
                  <ResultDisplay result={result} />
                </section>

                {/* Biểu đồ */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                  <ConvergenceChart history={result.history} />
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 mt-10 py-4 text-center text-xs text-slate-600">
        GAsol · React 19 + TypeScript + Vite · FastAPI + SymPy + NumPy
      </footer>
    </div>
  );
}
