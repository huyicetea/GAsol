import math
import time
from dataclasses import asdict, dataclass

import numpy as np

from .operators import (
    blend_crossover,
    evaluate_population,
    gaussian_mutation,
    tournament_select,
)
from .parser import ParsedEquation, parse_equation
from .population import initialize_population


@dataclass(frozen=True)
class GAConfig:
    bounds: tuple[float, float] = (-100.0, 100.0)
    pop_size: int = 100
    max_generations: int = 500
    crossover_rate: float = 0.8
    mutation_rate: float = 0.1
    tolerance: float = 1e-6
    tournament_size: int = 3
    elitism_count: int = 2
    blend_alpha: float = 0.5
    random_seed: int | None = None

    def __post_init__(self) -> None:
        lower, upper = self.bounds
        if not math.isfinite(lower) or not math.isfinite(upper) or lower >= upper:
            raise ValueError("bounds must contain finite values with min < max")
        if isinstance(self.pop_size, bool) or not isinstance(self.pop_size, int):
            raise ValueError("pop_size must be an integer")
        if not 10 <= self.pop_size <= 5000:
            raise ValueError("pop_size must be between 10 and 5000")
        if isinstance(self.max_generations, bool) or not isinstance(
            self.max_generations, int
        ):
            raise ValueError("max_generations must be an integer")
        if not 1 <= self.max_generations <= 10000:
            raise ValueError("max_generations must be between 1 and 10000")
        if not 0.0 <= self.crossover_rate <= 1.0:
            raise ValueError("crossover_rate must be between 0 and 1")
        if not 0.0 <= self.mutation_rate <= 1.0:
            raise ValueError("mutation_rate must be between 0 and 1")
        if not math.isfinite(self.tolerance) or self.tolerance <= 0:
            raise ValueError("tolerance must be a finite positive number")
        if isinstance(self.tournament_size, bool) or not isinstance(
            self.tournament_size, int
        ):
            raise ValueError("tournament_size must be an integer")
        if not 1 <= self.tournament_size <= self.pop_size:
            raise ValueError("tournament_size must be between 1 and pop_size")
        if isinstance(self.elitism_count, bool) or not isinstance(
            self.elitism_count, int
        ):
            raise ValueError("elitism_count must be an integer")
        if not 1 <= self.elitism_count < self.pop_size:
            raise ValueError("elitism_count must be between 1 and pop_size - 1")
        if not math.isfinite(self.blend_alpha) or self.blend_alpha < 0:
            raise ValueError("blend_alpha must be a finite non-negative number")
        if self.random_seed is not None and (
            isinstance(self.random_seed, bool) or not isinstance(self.random_seed, int)
        ):
            raise ValueError("random_seed must be an integer or None")


@dataclass(frozen=True)
class GenerationStat:
    generation: int
    best_fitness: float
    min_error: float


@dataclass(frozen=True)
class GAResult:
    status: str
    execution_time_ms: float
    generations_run: int
    best_solution: dict[str, float]
    best_fitness: float
    final_error: float
    history: tuple[GenerationStat, ...]

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["history"] = [asdict(item) for item in self.history]
        return result


def format_solution(
    equation: ParsedEquation,
    solution: dict[str, float],
    tolerance: float,
) -> tuple[dict[str, int | float], float]:
    """Prefer integer display values when they still satisfy the error tolerance."""
    if not math.isfinite(tolerance) or tolerance <= 0:
        raise ValueError("tolerance must be a finite positive number")

    values = np.array([solution[name] for name in equation.variables], dtype=float)
    integer_values = np.rint(values)
    integer_error = float(
        np.abs(equation.evaluate(integer_values.reshape(1, -1))[0])
    )
    if integer_error <= tolerance:
        return (
            {
                name: int(integer_values[index])
                for index, name in enumerate(equation.variables)
            },
            integer_error,
        )

    decimal_values = np.round(values, 3)
    decimal_error = float(
        np.abs(equation.evaluate(decimal_values.reshape(1, -1))[0])
    )
    return (
        {
            name: float(decimal_values[index])
            for index, name in enumerate(equation.variables)
        },
        decimal_error,
    )


def solve(equation: str, config: GAConfig = GAConfig()) -> GAResult:
    """Run the genetic algorithm and return the best candidate and its history."""
    started_at = time.perf_counter()
    parsed = parse_equation(equation)
    rng = np.random.default_rng(config.random_seed)
    population = initialize_population(
        config.pop_size, len(parsed.variables), config.bounds, rng
    )
    history: list[GenerationStat] = []
    status = "max_generations_reached"

    for generation in range(1, config.max_generations + 1):
        errors, fitness = evaluate_population(parsed, population)
        best_index = int(np.argmin(errors))
        best_error = float(errors[best_index])
        best_fitness = float(fitness[best_index])
        history.append(
            GenerationStat(
                generation=generation,
                best_fitness=best_fitness,
                min_error=best_error,
            )
        )
        if best_error <= config.tolerance:
            status = "converged"
            break
        if generation == config.max_generations:
            break

        elite_indices = np.argsort(fitness)[-config.elitism_count :][::-1]
        next_population = [population[index].copy() for index in elite_indices]
        while len(next_population) < config.pop_size:
            parent_one = tournament_select(
                population, fitness, config.tournament_size, rng
            )
            parent_two = tournament_select(
                population, fitness, config.tournament_size, rng
            )
            child = blend_crossover(
                parent_one,
                parent_two,
                config.crossover_rate,
                config.blend_alpha,
                config.bounds,
                rng,
            )
            next_population.append(
                gaussian_mutation(child, config.mutation_rate, config.bounds, rng)
            )
        population = np.asarray(next_population, dtype=float)

    elapsed_ms = (time.perf_counter() - started_at) * 1000.0
    final_errors, final_fitness = evaluate_population(parsed, population)
    best_index = int(np.argmin(final_errors))
    return GAResult(
        status=status,
        execution_time_ms=elapsed_ms,
        generations_run=len(history),
        best_solution={
            name: float(population[best_index, index])
            for index, name in enumerate(parsed.variables)
        },
        best_fitness=float(final_fitness[best_index]),
        final_error=float(final_errors[best_index]),
        history=tuple(history),
    )