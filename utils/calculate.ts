import { evaluate } from "mathjs";

type SupportedCurrency = "BRL" | "USD" | "EUR";

function detectCurrencyHint(input: string): SupportedCurrency | null {
  if (/\bBRL\b/i.test(input) || /R\$/i.test(input)) {
    return "BRL";
  }

  if (/\bUSD\b/i.test(input) || /\$/i.test(input)) {
    return "USD";
  }

  if (/\bEUR\b/i.test(input) || /€/i.test(input)) {
    return "EUR";
  }

  return null;
}

function formatValue(
  value: unknown,
  currency: SupportedCurrency | null,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }

  if (!currency) {
    return String(value);
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

function normalizeExpression(expression: string): string {
  const withoutCurrencyPrefixes = expression.replace(
    /(^|[\s(,:;])(?:R\$|\$|€)\s*/g,
    "$1",
  );

  const withoutCurrency = withoutCurrencyPrefixes.replace(
    /\b(?:BRL|USD|EUR)\b/gi,
    "",
  );

  const withNormalizedThousands = withoutCurrency.replace(
    /\b\d{1,3}(?:\.\d{3})+,\d+\b/g,
    (value) => value.replace(/\./g, "").replace(",", "."),
  );

  const withNormalizedDecimals = withNormalizedThousands.replace(
    /\b\d+,\d+\b/g,
    (value) => value.replace(",", "."),
  );

  return withNormalizedDecimals;
}

function tryEvaluateExpression(
  expression: string,
  scope: Record<string, unknown>,
): { ok: true; value: unknown } | { ok: false } {
  try {
    const normalizedExpression = normalizeExpression(expression);
    const parsedExpression = applyAddSubPercentage(normalizedExpression);
    const value = evaluate(parsedExpression, scope);

    if (value === undefined) {
      return { ok: false };
    }

    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

function tryEvaluateTrailingExpression(
  line: string,
  scope: Record<string, unknown>,
): { ok: true; value: unknown } | { ok: false } {
  const tokens = line.trim().split(/\s+/);

  if (tokens.length < 2) {
    return { ok: false };
  }

  for (let startIndex = 1; startIndex < tokens.length; startIndex += 1) {
    const candidate = tokens.slice(startIndex).join(" ");

    if (!/[+\-*/^%]/.test(candidate)) {
      continue;
    }

    const evaluatedCandidate = tryEvaluateExpression(candidate, scope);

    if (evaluatedCandidate.ok) {
      return evaluatedCandidate;
    }
  }

  return { ok: false };
}

function applyAddSubPercentage(expression: string): string {
  let normalized = expression;

  // Resolve patterns like "200 + 10%" and "500 - 20%".
  // It also works in sequence, e.g. "200 + 10% - 5%".
  const percentPattern = /(\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)\s*%/g;

  while (true) {
    percentPattern.lastIndex = 0;

    if (!percentPattern.test(normalized)) {
      break;
    }

    normalized = normalized.replace(
      percentPattern,
      (_full, base, operator, percent) => {
        const baseValue = Number(base);
        const percentValue = Number(percent);
        const delta = (baseValue * percentValue) / 100;

        return String(operator === "+" ? baseValue + delta : baseValue - delta);
      },
    );
  }

  return normalized;
}

export function calculateLines(text: string): string[] {
  const lines = text.split("\n");
  const scope: Record<string, unknown> = {};

  return lines.map((line) => {
    try {
      if (line.trim() === "") return "";

      const assignmentMatch = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.+)\s*$/);

      if (assignmentMatch) {
        const variableName = assignmentMatch[1];
        const rhs = assignmentMatch[2];
        const currencyHint = detectCurrencyHint(rhs);
        const parsedRhs = applyAddSubPercentage(normalizeExpression(rhs));
        const result = evaluate(`${variableName} = ${parsedRhs}`, scope);

        return `${variableName} = ${formatValue(result, currencyHint)}`;
      }

      const trailingEqualsMatch = line.match(/^(.*?)=\s*$/);

      if (trailingEqualsMatch) {
        const expression = trailingEqualsMatch[1].trim();
        const currencyHint = detectCurrencyHint(expression);

        if (expression === "") {
          return line;
        }

        const evaluatedExpression = tryEvaluateExpression(expression, scope);

        if (evaluatedExpression.ok) {
          const result = evaluatedExpression.value;

          return `${expression} = ${formatValue(result, currencyHint)}`;
        }

        const trailingExpression = tryEvaluateTrailingExpression(
          expression,
          scope,
        );

        if (!trailingExpression.ok) {
          return line;
        }

        return `${expression} = ${formatValue(trailingExpression.value, currencyHint)}`;
      }

      const resolvedLineMatch = line.match(/^(.*?)\s*=\s*(.+)\s*$/);

      if (resolvedLineMatch) {
        const expression = resolvedLineMatch[1].trim();
        const currencyHint = detectCurrencyHint(expression);

        if (expression === "") {
          return line;
        }

        const evaluatedExpression = tryEvaluateExpression(expression, scope);

        if (evaluatedExpression.ok) {
          return `${expression} = ${formatValue(evaluatedExpression.value, currencyHint)}`;
        }

        const trailingExpression = tryEvaluateTrailingExpression(
          expression,
          scope,
        );

        if (trailingExpression.ok) {
          return `${expression} = ${formatValue(trailingExpression.value, currencyHint)}`;
        }

        return line;
      }

      const currencyHint = detectCurrencyHint(line);

      const evaluatedLine = tryEvaluateExpression(line, scope);

      if (evaluatedLine.ok) {
        return `${line} = ${formatValue(evaluatedLine.value, currencyHint)}`;
      }

      const trailingExpression = tryEvaluateTrailingExpression(line, scope);

      if (trailingExpression.ok) {
        return `${line} = ${formatValue(trailingExpression.value, currencyHint)}`;
      }

      return line;
    } catch {
      return line;
    }
  });
}
