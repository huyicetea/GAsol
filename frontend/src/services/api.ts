// ============================================================
// GAsol – API Service Layer
// Giao tiếp với FastAPI backend qua Axios
// ============================================================

import axios, { type AxiosError } from 'axios';
import type {
  SolveRequest,
  SolveResponse,
  ValidateRequest,
  ValidateResponse,
} from '../types/ga';

// Axios instance – proxy Vite chuyển /api → http://localhost:8000
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120_000, // GA có thể chạy lâu với max_generations lớn
  headers: { 'Content-Type': 'application/json' },
});

/** Trích xuất message lỗi thân thiện từ FastAPI */
function extractErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<{
    detail?: string | Array<{ msg: string; loc: (string | number)[] }>;
  }>;
  if (axiosErr.response?.data?.detail) {
    const detail = axiosErr.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => `${d.loc.join('.')} – ${d.msg}`)
        .join('; ');
    }
  }
  if (axiosErr.message) return axiosErr.message;
  return 'Lỗi không xác định. Kiểm tra kết nối tới backend.';
}

/** POST /api/v1/validate */
export async function validateEquation(
  equation: string,
): Promise<ValidateResponse> {
  const body: ValidateRequest = { equation };
  try {
    const res = await apiClient.post<ValidateResponse>('/v1/validate', body);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/v1/solve */
export async function solveEquation(
  params: SolveRequest,
): Promise<SolveResponse> {
  try {
    const res = await apiClient.post<SolveResponse>('/v1/solve', params);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}
