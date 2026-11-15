import unittest

from fastapi.testclient import TestClient

from app.main import app


class APITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_root_reports_ok(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_validate_returns_variables_for_valid_equation(self) -> None:
        response = self.client.post(
            "/api/v1/validate", json={"equation": "x^2 + 2*y - sin(z) = 4"}
        )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(body["is_valid"])
        self.assertEqual(body["variables"], ["x", "y", "z"])

    def test_validate_reports_errors_with_http_200(self) -> None:
        for equation in ("2 + 3 = 5", "abc(x) = 0", "x = 1 = 2", ""):
            with self.subTest(equation=equation):
                response = self.client.post(
                    "/api/v1/validate", json={"equation": equation}
                )
                body = response.json()
                self.assertEqual(response.status_code, 200)
                self.assertFalse(body["is_valid"])
                self.assertTrue(body["message"])

    def test_solve_returns_solution_and_history(self) -> None:
        response = self.client.post(
            "/api/v1/solve",
            json={
                "equation": "x^2 - 4 = 0",
                "bounds": [-10, 10],
                "tolerance": 1e-6,
            },
        )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["status"], "converged")
        self.assertAlmostEqual(abs(body["best_solution"]["x"]), 2.0, places=2)
        self.assertEqual(body["generations_run"], len(body["history"]))
        self.assertEqual(body["history"][0]["generation"], 1)

    def test_solve_rejects_out_of_range_parameters(self) -> None:
        invalid_payloads = (
            {"equation": "x = 0", "pop_size": 5},
            {"equation": "x = 0", "max_generations": 20000},
            {"equation": "x = 0", "mutation_rate": 1.5},
            {"equation": "x = 0", "tolerance": 0},
            {"equation": "x = 0", "bounds": [5, 5]},
        )
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/v1/solve", json=payload)
                self.assertEqual(response.status_code, 422)

    def test_solve_rejects_invalid_equation(self) -> None:
        response = self.client.post("/api/v1/solve", json={"equation": "1 + 2 = 3"})

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
