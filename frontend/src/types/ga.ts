// ============================================================
// GAsol – TypeScript Type Definitions
// Khớp 1-1 với backend Pydantic schemas (backend/app/schemas.py)
// ============================================================

export interface ValidateRequest {
  equation: string;
}

export interface ValidateResponse {
  is_valid: boolean;
  normalized_equation?: string | null;
  variables: string[];
  message: string;
}

export interface SolveRequest {
  equation: string;
  bounds: [number, number];
  pop_size: number;
  max_generations: number;
  crossover_rate: number;
  mutation_rate: number;
  tolerance: number;
}

export interface GenerationStat {
  generation: number;
  best_fitness: number;
  min_error: number;
}

export interface SolveResponse {
  status: string;
  execution_time_ms: number;
  generations_run: number;
  best_solution: Record<string, number>;
  best_fitness: number;
  final_error: number;
  history: GenerationStat[];
}

export type SolveStatus = 'converged' | 'max_generations_reached';
