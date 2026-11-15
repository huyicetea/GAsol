import ast
import math
import operator
from dataclasses import dataclass
from typing import Any, Callable

import numpy as np
import sympy as sp


class EquationParseError(ValueError):
    """Raised when an equation is not a supported mathematical expression."""


_FUNCTIONS: dict[str, Callable[..., Any]] = {
    "abs": sp.Abs,
    "acos": sp.acos,
    "asin": sp.asin,
    "atan": sp.atan,
    "ceil": sp.ceiling,
    "cos": sp.cos,
    "cosh": sp.cosh,
    "exp": sp.exp,
    "floor": sp.floor,
    "ln": sp.log,
    "log": sp.log,
    "sin": sp.sin,
    "sinh": sp.sinh,
    "sqrt": sp.sqrt,
    "tan": sp.tan,
    "tanh": sp.tanh,
}
_CONSTANTS = {"E": sp.E, "pi": sp.pi}
_BINARY_OPERATORS: dict[type[ast.operator], Callable[[Any, Any], Any]] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
}
_UNARY_OPERATORS: dict[type[ast.unaryop], Callable[[Any], Any]] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}
_MAX_EQUATION_LENGTH = 512
_MAX_EXPRESSION_NODES = 128


@dataclass(frozen=True)
class ParsedEquation:
    """A normalized equation and its NumPy-vectorized objective function."""

    normalized_equation: str
    variables: tuple[str, ...]
    expression: sp.Expr
    _function: Callable[..., object]

    def evaluate(self, population: np.ndarray) -> np.ndarray:
        """Evaluate the residual for every row in an (individual, gene) matrix."""
        values = np.asarray(population, dtype=float)
        if values.ndim != 2 or values.shape[1] != len(self.variables):
            raise ValueError(
                "population must be a 2D array with one column per equation variable"
            )

        try:
            with np.errstate(all="ignore"):
                result = self._function(
                    *(values[:, index] for index in range(values.shape[1]))
                )
                residuals = np.broadcast_to(
                    np.asarray(result, dtype=float), (values.shape[0],)
                ).copy()
        except (OverflowError, TypeError, ValueError, ZeroDivisionError):
            return np.full(values.shape[0], np.inf, dtype=float)

        residuals[~np.isfinite(residuals)] = np.inf
        return residuals


class _ExpressionBuilder:
    def __init__(self) -> None:
        self.symbols: dict[str, sp.Symbol] = {}

    def build(self, node: ast.AST) -> Any:
        if isinstance(node, ast.Expression):
            return self.build(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
                raise EquationParseError("Chỉ hỗ trợ hằng số thực.")
            if isinstance(node.value, float) and not math.isfinite(node.value):
                raise EquationParseError("Hằng số phải là số hữu hạn.")
            return sp.Integer(node.value) if isinstance(node.value, int) else sp.Float(node.value)
        if isinstance(node, ast.Name):
            if node.id in _CONSTANTS:
                return _CONSTANTS[node.id]
            return self.symbols.setdefault(node.id, sp.Symbol(node.id, real=True))
        if isinstance(node, ast.BinOp):
            operation = _BINARY_OPERATORS.get(type(node.op))
            if operation is None:
                raise EquationParseError("Toán tử này không được hỗ trợ.")
            return operation(self.build(node.left), self.build(node.right))
        if isinstance(node, ast.UnaryOp):
            operation = _UNARY_OPERATORS.get(type(node.op))
            if operation is None:
                raise EquationParseError("Toán tử này không được hỗ trợ.")
            return operation(self.build(node.operand))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            function = _FUNCTIONS.get(node.func.id)
            if function is None or node.keywords:
                raise EquationParseError("Hàm toán học không được hỗ trợ.")
            return function(*(self.build(argument) for argument in node.args))
        raise EquationParseError("Biểu thức chứa cú pháp không được hỗ trợ.")


def parse_equation(equation: str) -> ParsedEquation:
    """Parse `f(x, ...) = 0` or `left = right` without evaluating Python code."""
    if not isinstance(equation, str) or not equation.strip():
        raise EquationParseError("Phương trình không được để trống.")
    if len(equation) > _MAX_EQUATION_LENGTH:
        raise EquationParseError("Phương trình vượt quá độ dài cho phép.")

    parts = equation.split("=")
    if len(parts) > 2:
        raise EquationParseError("Phương trình chỉ được chứa tối đa một dấu '='.")
    left = parts[0].strip().replace("^", "**")
    right = parts[1].strip().replace("^", "**") if len(parts) == 2 else "0"
    if not left or not right:
        raise EquationParseError("Hai vế của phương trình không được để trống.")

    try:
        left_tree = ast.parse(left, mode="eval")
        right_tree = ast.parse(right, mode="eval")
    except SyntaxError as exc:
        raise EquationParseError("Cú pháp phương trình không hợp lệ.") from exc
    if len(list(ast.walk(left_tree))) + len(list(ast.walk(right_tree))) > _MAX_EXPRESSION_NODES:
        raise EquationParseError("Biểu thức quá phức tạp.")

    builder = _ExpressionBuilder()
    try:
        expression: Any = builder.build(left_tree) - builder.build(right_tree)
    except (TypeError, ValueError, ZeroDivisionError) as exc:
        raise EquationParseError("Biểu thức toán học không hợp lệ.") from exc
    variables = tuple(sorted(builder.symbols))
    if not variables:
        raise EquationParseError("Phương trình phải chứa ít nhất một biến số.")

    function = sp.lambdify(
        [builder.symbols[name] for name in variables],
        expression,
        modules="numpy",
    )
    return ParsedEquation(
        normalized_equation=str(expression),
        variables=variables,
        expression=expression,
        _function=function,
    )