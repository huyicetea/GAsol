from fastapi import APIRouter, HTTPException

from .ga_engine import (
    EquationParseError,
    GAConfig,
    format_solution,
    parse_equation,
    solve,
)
from .schemas import (
    GenerationStatResponse,
    SolveRequest,
    SolveResponse,
    ValidateRequest,
    ValidateResponse,
)

router = APIRouter(prefix="/api/v1")


@router.post("/validate", response_model=ValidateResponse)
def validate_equation(request: ValidateRequest) -> ValidateResponse:
    """Kiểm tra cú pháp phương trình và trích xuất danh sách biến."""
    try:
        parsed = parse_equation(request.equation)
    except EquationParseError as exc:
        return ValidateResponse(is_valid=False, message=str(exc))
    return ValidateResponse(
        is_valid=True,
        normalized_equation=parsed.normalized_equation,
        variables=list(parsed.variables),
        message="Phương trình hợp lệ",
    )


# Hàm đồng bộ để FastAPI chạy trong threadpool, không chặn event loop.
@router.post("/solve", response_model=SolveResponse)
def solve_equation(request: SolveRequest) -> SolveResponse:
    """Chạy giải thuật di truyền và trả về nghiệm cùng lịch sử hội tụ."""
    try:
        config = GAConfig(
            bounds=request.bounds,
            pop_size=request.pop_size,
            max_generations=request.max_generations,
            crossover_rate=request.crossover_rate,
            mutation_rate=request.mutation_rate,
            tolerance=request.tolerance,
        )
        result = solve(request.equation, config)
        parsed = parse_equation(request.equation)
    except (EquationParseError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    best_solution: dict[str, float] = dict(result.best_solution)
    final_error = result.final_error
    best_fitness = result.best_fitness

    # Làm tròn nghiệm để hiển thị, chỉ dùng khi không làm sai số xấu đi.
    shown, shown_error = format_solution(parsed, result.best_solution, config.tolerance)
    if shown_error <= max(config.tolerance, result.final_error):
        best_solution = {name: float(value) for name, value in shown.items()}
        final_error = shown_error
        best_fitness = 1.0 / (1.0 + shown_error)

    return SolveResponse(
        status=result.status,
        execution_time_ms=result.execution_time_ms,
        generations_run=result.generations_run,
        best_solution=best_solution,
        best_fitness=best_fitness,
        final_error=final_error,
        history=[
            GenerationStatResponse(
                generation=item.generation,
                best_fitness=item.best_fitness,
                min_error=item.min_error,
            )
            for item in result.history
        ],
    )
