from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

Rate = Annotated[float, Field(ge=0.0, le=1.0, allow_inf_nan=False)]


class ValidateRequest(BaseModel):
    equation: str


class ValidateResponse(BaseModel):
    is_valid: bool
    normalized_equation: str | None = None
    variables: list[str] = Field(default_factory=list)
    message: str


class SolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    equation: str
    bounds: tuple[
        Annotated[float, Field(allow_inf_nan=False)],
        Annotated[float, Field(allow_inf_nan=False)],
    ] = (-100.0, 100.0)
    pop_size: int = Field(default=100, ge=10, le=5000)
    max_generations: int = Field(default=500, ge=1, le=10000)
    crossover_rate: Rate = 0.8
    mutation_rate: Rate = 0.1
    tolerance: float = Field(default=1e-6, gt=0, allow_inf_nan=False)

    @model_validator(mode="after")
    def check_bounds(self) -> "SolveRequest":
        if self.bounds[0] >= self.bounds[1]:
            raise ValueError("bounds phải có dạng [min, max] với min < max")
        return self


class GenerationStatResponse(BaseModel):
    generation: int
    best_fitness: float
    min_error: float


class SolveResponse(BaseModel):
    status: str
    execution_time_ms: float
    generations_run: int
    best_solution: dict[str, float]
    best_fitness: float
    final_error: float
    history: list[GenerationStatResponse]
