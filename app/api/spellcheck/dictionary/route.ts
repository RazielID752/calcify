import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const DICTIONARY_PATH = path.join(
  process.cwd(),
  "app",
  "components",
  "editor-spellcheck-dictionary.ts",
);

const WORDS_MARKER = "const SPELLCHECK_WORDS = [";

const normalizeWord = (word: string) =>
  word
    .trim()
    .replace(/\u00A0/g, " ")
    .toLocaleLowerCase("pt-BR");

const toDictionaryLine = (word: string) => `  ${JSON.stringify(word)},`;

const parseWordLine = (line: string) => {
  const trimmedLine = line.trim();
  const quotedMatch = trimmedLine.match(/^("(?:\\.|[^"])*"),?$/);

  if (!quotedMatch?.[1]) {
    return null;
  }

  try {
    return JSON.parse(quotedMatch[1]) as string;
  } catch {
    return null;
  }
};

const upsertWord = (dictionarySource: string, word: string) => {
  const lines = dictionarySource.split("\n");
  const wordsStartIndex = lines.findIndex(
    (line) => line.trim() === WORDS_MARKER,
  );

  if (wordsStartIndex === -1) {
    throw new Error("Bloco SPELLCHECK_WORDS não encontrado.");
  }

  let wordsEndIndex = -1;
  const words = new Set<string>();

  for (let index = wordsStartIndex + 1; index < lines.length; index += 1) {
    if (lines[index]?.trim() === "] as const;") {
      wordsEndIndex = index;
      break;
    }

    const currentWord = parseWordLine(lines[index] ?? "");

    if (currentWord) {
      words.add(normalizeWord(currentWord));
    }
  }

  if (wordsEndIndex === -1) {
    throw new Error("Fim do bloco SPELLCHECK_WORDS não encontrado.");
  }

  words.add(word);

  const nextWordLines = Array.from(words)
    .sort((firstWord, secondWord) =>
      firstWord.localeCompare(secondWord, "pt-BR"),
    )
    .map(toDictionaryLine);

  lines.splice(
    wordsStartIndex + 1,
    wordsEndIndex - wordsStartIndex - 1,
    ...nextWordLines,
  );

  return lines.join("\n");
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    correction?: unknown;
    wrongWord?: unknown;
  } | null;

  if (
    !body ||
    typeof body.wrongWord !== "string" ||
    typeof body.correction !== "string"
  ) {
    return NextResponse.json(
      { message: "Informe a palavra e a correção." },
      { status: 400 },
    );
  }

  const correction = normalizeWord(body.correction);

  if (!correction) {
    return NextResponse.json(
      { message: "Informe uma correção para salvar." },
      { status: 400 },
    );
  }

  const dictionarySource = await fs.readFile(DICTIONARY_PATH, "utf8");
  await fs.writeFile(DICTIONARY_PATH, upsertWord(dictionarySource, correction));

  return NextResponse.json({
    correction,
    wrongWord: normalizeWord(body.wrongWord),
  });
}
