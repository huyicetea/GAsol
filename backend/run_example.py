from app.ga_engine import GAConfig, format_solution, parse_equation, solve


def main() -> None:
    equation = "x^2 - y^2 + 2*x = 0"
    config = GAConfig(
        bounds=(-10.0, 10.0),
        pop_size=150,
        max_generations=300,
        crossover_rate=0.8,
        mutation_rate=0.1,
        tolerance=1e-8,
        random_seed=42,
    )

    print(f"Equation: {equation}")
    print("Running Genetic Algorithm...")
    result = solve(equation, config)

    print("\nGeneration history:")
    for generation in result.history:
        print(
            f"Generation {generation.generation:>3}: "
            f"best_fitness={generation.best_fitness:.10f}, "
            f"min_error={generation.min_error:.10g}"
        )

    print("\nResult:")
    print(f"Status: {result.status}")
    print(f"Generations: {result.generations_run}")
    displayed_solution, displayed_error = format_solution(
        parse_equation(equation), result.best_solution, config.tolerance
    )
    print(f"Best solution: {displayed_solution}")
    print(f"Displayed solution error: {displayed_error:.10g}")
    print(f"GA solution error: {result.final_error:.10g}")
    print(f"Best fitness: {result.best_fitness:.10f}")
    print(f"Execution time: {result.execution_time_ms:.3f} ms")


if __name__ == "__main__":
    main()
