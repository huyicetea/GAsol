import unittest

import numpy as np

from app.ga_engine import (
    EquationParseError,
    GAConfig,
    format_solution,
    parse_equation,
    solve,
)
from app.ga_engine.operators import evaluate_population


class EquationParserTests(unittest.TestCase):
    def test_normalizes_equation_and_evaluates_vectorized_population(self) -> None:
        parsed = parse_equation(" y + x^2 = sin(z) ")
        population = np.array([[2.0, 1.0, 0.0], [1.0, 2.0, 1.0]])

        self.assertEqual(parsed.variables, ("x", "y", "z"))
        np.testing.assert_allclose(parsed.evaluate(population), [5.0, 3.0 - np.sin(1.0)])

    def test_rejects_unsupported_python_syntax_and_unknown_functions(self) -> None:
        for equation in (
            "x.__class__ = 1",
            "__import__('os')",
            "unknown(x) = 0",
            "sin(x, y) = 0",
        ):
            with self.subTest(equation=equation):
                with self.assertRaises(EquationParseError):
                    parse_equation(equation)

    def test_rejects_invalid_equations(self) -> None:
        for equation in ("", "1 + 2 = 3", "x = 1 = 2", "x + = 2"):
            with self.subTest(equation=equation):
                with self.assertRaises(EquationParseError):
                    parse_equation(equation)

    def test_non_finite_function_results_become_infinite_errors(self) -> None:
        parsed = parse_equation("sqrt(x)")
        residuals = parsed.evaluate(np.array([[-1.0], [4.0]]))

        self.assertTrue(np.isinf(residuals[0]))
        self.assertEqual(residuals[1], 2.0)


class GASolverTests(unittest.TestCase):
    def test_format_solution_prefers_integer_when_it_meets_tolerance(self) -> None:
        formatted, error = format_solution(
            parse_equation("x^2 - 4 = 0"), {"x": 2.0001}, tolerance=1e-8
        )

        self.assertEqual(formatted, {"x": 2})
        self.assertEqual(error, 0.0)

    def test_format_solution_uses_three_decimals_when_integer_error_is_high(self) -> None:
        formatted, error = format_solution(
            parse_equation("x = 0"), {"x": 1.23456}, tolerance=1e-8
        )

        self.assertEqual(formatted, {"x": 1.235})
        self.assertEqual(error, 1.235)

    def test_solves_a_simple_equation_and_returns_generation_history(self) -> None:
        result = solve(
            "x = 0",
            GAConfig(
                bounds=(-1.0, 1.0),
                pop_size=100,
                max_generations=100,
                mutation_rate=0.2,
                tolerance=1e-3,
                random_seed=42,
            ),
        )

        self.assertEqual(result.status, "converged")
        self.assertLessEqual(result.final_error, 1e-3)
        self.assertEqual(result.generations_run, len(result.history))
        self.assertEqual(result.best_fitness, 1.0 / (1.0 + result.final_error))
        self.assertEqual(result.to_dict()["history"][0]["generation"], 1)

    def test_non_converged_result_stops_at_generation_limit(self) -> None:
        result = solve(
            "x = 0",
            GAConfig(
                bounds=(1.0, 2.0),
                pop_size=10,
                max_generations=3,
                mutation_rate=0.0,
                tolerance=1e-12,
                random_seed=7,
            ),
        )

        self.assertEqual(result.status, "max_generations_reached")
        self.assertEqual(result.generations_run, 3)
        self.assertGreaterEqual(result.final_error, 1.0)

    def test_config_rejects_invalid_bounds(self) -> None:
        with self.assertRaises(ValueError):
            GAConfig(bounds=(1.0, 1.0))

    def test_config_rejects_non_integer_population_size(self) -> None:
        with self.assertRaises(ValueError):
            GAConfig(pop_size=10.5)

    def test_invalid_domain_individuals_receive_zero_fitness(self) -> None:
        parsed = parse_equation("sqrt(x)")
        errors, fitness = evaluate_population(
            parsed, np.array([[-1.0], [4.0]])
        )

        self.assertTrue(np.isinf(errors[0]))
        self.assertEqual(fitness[0], 0.0)
        self.assertGreater(fitness[1], 0.0)


if __name__ == "__main__":
    unittest.main()
