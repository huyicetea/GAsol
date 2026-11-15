import numpy as np


def initialize_population(
    pop_size: int,
    variable_count: int,
    bounds: tuple[float, float],
    rng: np.random.Generator,
) -> np.ndarray:
    """Create a uniformly distributed population within the configured bounds."""
    return rng.uniform(bounds[0], bounds[1], size=(pop_size, variable_count))