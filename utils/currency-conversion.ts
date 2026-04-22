type CurrencyToken = {
  code: string;
  display: string;
};

export type ParsedConvertCommand = {
  amount: number;
  from: string;
  to: string;
  sourceDisplay: string;
  targetDisplay: string;
};

const CONVERT_COMMAND_REGEX = /^converts:\s*(.+?)\s+to\s+(.+?)\s*$/i;
const CONVERTED_LINE_REGEX = /^(.+?)\s*→\s*(R\$|\$|€|£|¥|[A-Za-z]{3})\s+([+-]?[\d.,]+)\s*$/i;

const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: "USD",
  "R$": "BRL",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
};

const CURRENCY_TOKEN_REGEX = /^(?:R\$|\$|€|£|¥|[A-Za-z]{3})$/i;

const SOURCE_TOKEN_PATTERNS = [
  /^([+-]?[\d.,]+)\s*(R\$|\$|€|£|¥|[A-Za-z]{3})$/i,
  /^(R\$|\$|€|£|¥)\s*([+-]?[\d.,]+)$/i,
];

function normalizeCommandText(value: string): string {
  return value.replaceAll("\u00A0", " ").replace(/\s+/g, " ").trim();
}

function parseAmountToken(value: string): number | null {
  const normalizedInput = value.replaceAll(/\s/g, "");

  if (!/^[+-]?[\d.,]+$/.test(normalizedInput)) {
    return null;
  }

  const hasComma = normalizedInput.includes(",");
  const hasDot = normalizedInput.includes(".");
  let normalizedValue = normalizedInput;

  if (hasComma && hasDot) {
    normalizedValue =
      normalizedInput.lastIndexOf(",") > normalizedInput.lastIndexOf(".")
        ? normalizedInput.replaceAll(".", "").replace(",", ".")
        : normalizedInput.replaceAll(",", "");
  } else if (hasComma) {
    normalizedValue = normalizedInput.replace(",", ".");
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeCurrencyToken(token: string): CurrencyToken | null {
  const trimmedToken = token.trim();

  if (!CURRENCY_TOKEN_REGEX.test(trimmedToken)) {
    return null;
  }

  if (trimmedToken.length === 3 && /^[A-Za-z]{3}$/.test(trimmedToken)) {
    const code = trimmedToken.toUpperCase();

    return {
      code,
      display: code,
    };
  }

  const code = CURRENCY_SYMBOL_TO_CODE[trimmedToken];

  if (!code) {
    return null;
  }

  return {
    code,
    display: trimmedToken,
  };
}

function parseSourceToken(token: string):
  | {
      amount: number;
      from: CurrencyToken;
      sourceDisplay: string;
    }
  | null {
  const trimmedToken = token.trim();

  for (const pattern of SOURCE_TOKEN_PATTERNS) {
    const match = trimmedToken.match(pattern);

    if (!match) {
      continue;
    }

    const firstPart = match[1].trim();
    const secondPart = match[2].trim();

    const amountCandidate = parseAmountToken(firstPart);
    const symbolFirstAmount = parseAmountToken(secondPart);

    if (amountCandidate !== null) {
      const currency = normalizeCurrencyToken(secondPart);

      if (!currency) {
        return null;
      }

      return {
        amount: amountCandidate,
        from: currency,
        sourceDisplay: trimmedToken,
      };
    }

    if (symbolFirstAmount === null) {
      return null;
    }

    const currency = normalizeCurrencyToken(firstPart);

    if (!currency) {
      return null;
    }

    return {
      amount: symbolFirstAmount,
      from: currency,
      sourceDisplay: trimmedToken,
    };
  }

  return null;
}

export function parseConvertCommand(text: string): ParsedConvertCommand | null {
  const trimmedText = normalizeCommandText(text);
  const commandMatch = trimmedText.match(CONVERT_COMMAND_REGEX);

  if (commandMatch) {
    const sourceToken = commandMatch[1].trim();
    const targetToken = commandMatch[2].trim();

    const source = parseSourceToken(sourceToken);
    const target = normalizeCurrencyToken(targetToken);

    if (!source || !target) {
      return null;
    }

    return {
      amount: source.amount,
      from: source.from.code,
      to: target.code,
      sourceDisplay: source.sourceDisplay,
      targetDisplay: target.display,
    };
  }

  const convertedLineMatch = trimmedText.match(CONVERTED_LINE_REGEX);

  if (!convertedLineMatch) {
    return null;
  }

  const sourceToken = convertedLineMatch[1].trim();
  const targetToken = convertedLineMatch[2].trim();
  const sourceAmount = parseAmountToken(convertedLineMatch[3].trim());

  const source = parseSourceToken(sourceToken);
  const target = normalizeCurrencyToken(targetToken);

  if (!source || !target || sourceAmount === null) {
    return null;
  }

  return {
    amount: source.amount,
    from: source.from.code,
    to: target.code,
    sourceDisplay: source.sourceDisplay,
    targetDisplay: target.display,
  };
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(from)}`,
  );

  if (!response.ok) {
    throw new Error(`Falha ao buscar cotacao de ${from}`);
  }

  const data = (await response.json()) as {
    rates?: Record<string, number>;
  };

  const rate = data.rates?.[to];

  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`Cotacao indisponivel para ${to}`);
  }

  return amount * rate;
}

export function formatCurrencyConversion(
  command: ParsedConvertCommand,
  convertedAmount: number,
): string {
  return `${command.sourceDisplay} → ${command.targetDisplay} ${convertedAmount.toFixed(2)}`;
}

export function renderCurrencyConversionLineHtml(line: string): string {
  const normalizedLine = normalizeCommandText(line);
  const separatorIndex = normalizedLine.lastIndexOf(" ");

  if (separatorIndex === -1) {
    return normalizedLine;
  }

  const prefix = normalizedLine.slice(0, separatorIndex + 1);
  const result = normalizedLine.slice(separatorIndex + 1);

  return `${prefix}<span data-calc-result="true" class="font-semibold text-emerald-600">${result}</span>`;
}