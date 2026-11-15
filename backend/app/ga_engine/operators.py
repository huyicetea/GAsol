import numpy as np

from .parser import ParsedEquation


def evaluate_population(
    equation: ParsedEquation, population: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """Return absolute residuals and fitness values for the population."""
    errors = np.abs(equation.evaluate(population))
    fitness = np.zeros_like(errors)
    finite = np.isfinite(errors)
    fitness[finite] = 1.0 / (1.0 + errors[finite])
    return errors, fitness


def tournament_select(
    population: np.ndarray,
    fitness: np.ndarray,
    tournament_size: int,
    rng: np.random.Generator,
) -> np.ndarray:
    """Select one individual by tournament selection."""
    candidates = rng.integers(0, len(population), size=tournament_size)
    winner = candidates[np.argmax(fitness[candidates])]
    return population[winner].copy()


def blend_crossover(
    parent_one: np.ndarray,
    parent_two: np.ndarray,
    crossover_rate: float,
    alpha: float,
    bounds: tuple[float, float],
    rng: np.random.Generator,
) -> np.ndarray:
    """Create one child using BLX-alpha and clamp genes to their bounds."""
    if rng.random() < crossover_rate:
        beta = rng.uniform(-alpha, 1.0 + alpha, size=parent_one.shape)
        child = parent_one + beta * (parent_two - parent_one)
    else:
        child = parent_one.copy()
    return np.clip(child, bounds[0], bounds[1])


def gaussian_mutation(
    individual: np.ndarray,
    mutation_rate: float,
    bounds: tuple[float, float],
    rng: np.random.Generator,
) -> np.ndarray:
    """Mutate each gene independently with scale proportional to the search range."""
    mutated = individual.copy()
    mask = rng.random(mutated.shape) < mutation_rate
    if np.any(mask):
        sigma = (bounds[1] - bounds[0]) * 0.1
        mutated[mask] += rng.normal(0.0, sigma, size=np.count_nonzero(mask))
    return np.clip(mutated, bounds[0], bounds[1])