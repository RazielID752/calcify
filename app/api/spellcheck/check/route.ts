import { spellCheckDocument } from "cspell-lib";
import { NextResponse } from "next/server";

type SpellcheckRequest = {
  words?: unknown;
};

type SpellcheckIssue = {
  suggestions: string[];
  word: string;
};

const WORD_REGEX = /^[\p{L}À-ÿ]+(?:[~´`^¨][\p{L}À-ÿ]+)*$/u;
const MAX_WORDS_PER_REQUEST = 500;

const normalizeWord = (word: string) =>
  word
    .trim()
    .replace(/\u00A0/g, " ")
    .toLocaleLowerCase("pt-BR");

const shouldCheckWord = (word: string) =>
  word.length >= 2 && word.length <= 64 && WORD_REGEX.test(word);

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as SpellcheckRequest | null;

  if (!body || !Array.isArray(body.words)) {
    return NextResponse.json(
      { message: "Informe as palavras para validar." },
      { status: 400 },
    );
  }

  const words = Array.from(
    new Set(
      body.words
        .filter((word): word is string => typeof word === "string")
        .map(normalizeWord)
        .filter(shouldCheckWord),
    ),
  ).slice(0, MAX_WORDS_PER_REQUEST);

  const result = await spellCheckDocument(
    {
      languageId: "plaintext",
      locale: "pt_BR",
      text: words.join(" "),
      uri: "calcify-spellcheck.txt",
    },
    {
      generateSuggestions: true,
      noConfigSearch: true,
    },
    {
      import: ["@cspell/dict-pt-br/cspell-ext.json"],
      language: "pt_BR",
      numSuggestions: 3,
      suggestionsTimeout: 750,
    },
  );

  const issues: SpellcheckIssue[] = result.issues.map((issue) => {
    const suggestions = Array.from(
      new Set((issue.suggestions ?? []).map(normalizeWord)),
    ).slice(0, 3);

    return {
      suggestions,
      word: normalizeWord(issue.text),
    };
  });

  return NextResponse.json({ issues });
}
