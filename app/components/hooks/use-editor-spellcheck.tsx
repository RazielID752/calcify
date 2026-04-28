import {
  type MouseEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SPELLCHECK_CUSTOM_WORDS } from "../editor-spellcheck-dictionary";

type SpellcheckIssue = {
  original: string;
  range: Range;
  rect: DOMRect;
  suggestions: string[];
};

type UseEditorSpellcheckOptions = {
  authToken: string | null;
  editorRef: RefObject<HTMLDivElement | null>;
  onEditorChange: () => void;
  refreshKey: string;
};

type HighlightRegistry = {
  delete: (name: string) => void;
  set: (name: string, highlight: Highlight) => void;
};

type HighlightConstructor = new (...ranges: Range[]) => Highlight;

type Highlight = {
  readonly size: number;
};

type SpellcheckIndex = {
  accentlessWords: Map<string, string>;
  candidateBuckets: Map<string, string[]>;
  suggestionCache: Map<string, string | null>;
};

type SpellcheckServerIssue = {
  suggestions?: string[];
  word: string;
};

type SpellcheckServerResponse = {
  issues?: SpellcheckServerIssue[];
};

const SPELLCHECK_HIGHLIGHT_NAME = "calcify-spelling-error";
const SPELLCHECK_HIGHLIGHT_STYLE_ID = "calcify-spelling-error-style";
const WORD_REGEX = /[\p{L}À-ÿ]+(?:[~´`^¨][\p{L}À-ÿ]+)*/gu;
const MAX_SUGGESTION_DISTANCE = 3;
const MIN_FUZZY_WORD_LENGTH = 5;
const SERVER_SPELLCHECK_DEBOUNCE_MS = 350;
const MAX_SERVER_SPELLCHECK_WORDS = 500;

const wordsToDictionary = (words: readonly string[]) =>
  Object.fromEntries(
    words.map((word) => {
      const normalizedWord = normalizeWord(word);
      return [normalizedWord, word];
    }),
  );

const ensureSpellcheckHighlightStyle = () => {
  if (document.getElementById(SPELLCHECK_HIGHLIGHT_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = SPELLCHECK_HIGHLIGHT_STYLE_ID;
  style.textContent = [
    `::highlight(${SPELLCHECK_HIGHLIGHT_NAME}) {`,
    "  text-decoration-line: underline;",
    "  text-decoration-style: wavy;",
    "  text-decoration-color: #dc2626;",
    "  text-decoration-thickness: 1.5px;",
    "  background-color: rgb(254 226 226 / 0.35);",
    "}",
  ].join("\n");
  document.head.append(style);
};
const getHighlightApi = () => {
  const cssWithHighlights = CSS as unknown as {
    highlights?: HighlightRegistry;
  };
  const highlightConstructor = (
    globalThis as typeof globalThis & {
      Highlight?: HighlightConstructor;
    }
  ).Highlight as HighlightConstructor | undefined;

  if (!cssWithHighlights.highlights || !highlightConstructor) {
    return null;
  }

  return {
    Highlight: highlightConstructor,
    highlights: cssWithHighlights.highlights,
  };
};

const normalizeWord = (word: string) => word.toLocaleLowerCase("pt-BR");

const normalizeForSearch = (word: string) =>
  normalizeWord(word)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const getCandidateBucketKey = (word: string) => {
  const searchableWord = normalizeForSearch(word);
  return `${searchableWord[0] ?? ""}:${searchableWord.length}`;
};

const getPluralSuggestion = (word: string) => {
  if (word.endsWith("ão")) {
    return `${word.slice(0, -2)}ões`;
  }

  if (word.endsWith("l")) {
    return `${word.slice(0, -1)}is`;
  }

  if (word.endsWith("m")) {
    return `${word.slice(0, -1)}ns`;
  }

  if (word.endsWith("r") || word.endsWith("s") || word.endsWith("z")) {
    return `${word}es`;
  }

  return `${word}s`;
};

const buildSpellcheckIndex = (dictionary: Record<string, string>) => {
  const accentlessWords = new Map<string, string>();
  const candidateBuckets = new Map<string, string[]>();

  for (const [word, suggestion] of Object.entries(dictionary)) {
    if (normalizeWord(suggestion) !== word) {
      continue;
    }

    const searchableWord = normalizeForSearch(word);

    if (!accentlessWords.has(searchableWord)) {
      accentlessWords.set(searchableWord, suggestion);
    }

    const bucketKey = getCandidateBucketKey(word);
    const bucket = candidateBuckets.get(bucketKey);

    if (bucket) {
      bucket.push(suggestion);
    } else {
      candidateBuckets.set(bucketKey, [suggestion]);
    }
  }

  return {
    accentlessWords,
    candidateBuckets,
    suggestionCache: new Map<string, string | null>(),
  };
};

const getEditDistanceWithinLimit = (
  firstWord: string,
  secondWord: string,
  limit: number,
) => {
  if (Math.abs(firstWord.length - secondWord.length) > limit) {
    return limit + 1;
  }

  let previousRow = Array.from(
    { length: secondWord.length + 1 },
    (_, index) => index,
  );

  for (let firstIndex = 1; firstIndex <= firstWord.length; firstIndex += 1) {
    const currentRow = [firstIndex];
    let rowMinimum = currentRow[0] ?? 0;

    for (
      let secondIndex = 1;
      secondIndex <= secondWord.length;
      secondIndex += 1
    ) {
      const substitutionCost =
        firstWord[firstIndex - 1] === secondWord[secondIndex - 1] ? 0 : 1;
      const distance = Math.min(
        (previousRow[secondIndex] ?? limit + 1) + 1,
        (currentRow[secondIndex - 1] ?? limit + 1) + 1,
        (previousRow[secondIndex - 1] ?? limit + 1) + substitutionCost,
      );

      currentRow[secondIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > limit) {
      return limit + 1;
    }

    previousRow = currentRow;
  }

  return previousRow[secondWord.length] ?? limit + 1;
};

const findBestApproximateSuggestion = (
  normalizedWord: string,
  index: SpellcheckIndex,
) => {
  const searchableWord = normalizeForSearch(normalizedWord);

  if (searchableWord.length < MIN_FUZZY_WORD_LENGTH) {
    return null;
  }

  let bestSuggestion: string | null = null;
  let bestDistance = MAX_SUGGESTION_DISTANCE + 1;
  const candidateLengths = [
    searchableWord.length,
    searchableWord.length - 1,
    searchableWord.length + 1,
    searchableWord.length - 2,
    searchableWord.length + 2,
    searchableWord.length - 3,
    searchableWord.length + 3,
  ];

  for (const candidateLength of candidateLengths) {
    const candidates = index.candidateBuckets.get(
      `${searchableWord[0] ?? ""}:${candidateLength}`,
    );

    if (!candidates) {
      continue;
    }

    for (const candidate of candidates) {
      const candidateSearch = normalizeForSearch(candidate);
      const distance = getEditDistanceWithinLimit(
        searchableWord,
        candidateSearch,
        Math.min(MAX_SUGGESTION_DISTANCE, bestDistance - 1),
      );

      if (distance < bestDistance) {
        bestSuggestion = candidate;
        bestDistance = distance;

        if (distance === 1) {
          return bestSuggestion;
        }
      }
    }
  }

  return bestSuggestion;
};

const findApproximateSuggestion = (
  normalizedWord: string,
  index: SpellcheckIndex,
) => {
  const searchableWord = normalizeForSearch(normalizedWord);
  const accentSuggestion = index.accentlessWords.get(searchableWord);

  if (accentSuggestion && normalizeWord(accentSuggestion) !== normalizedWord) {
    return accentSuggestion;
  }

  if (normalizedWord.endsWith("s")) {
    const singularWord = normalizedWord.slice(0, -1);
    const singularSuggestion =
      index.accentlessWords.get(normalizeForSearch(singularWord)) ??
      findBestApproximateSuggestion(singularWord, index);

    if (singularSuggestion) {
      return singularSuggestion.endsWith("s")
        ? singularSuggestion
        : getPluralSuggestion(singularSuggestion);
    }
  }

  return findBestApproximateSuggestion(normalizedWord, index);
};

const getSuggestionForWord = (
  word: string,
  ignoredWords: Set<string>,
  dictionary: Record<string, string>,
  index: SpellcheckIndex,
  serverSuggestions: Map<string, string[]>,
) => {
  const normalizedWord = normalizeWord(word);

  if (ignoredWords.has(normalizedWord)) {
    return null;
  }

  if (Object.hasOwn(dictionary, normalizedWord)) {
    return null;
  }

  if (serverSuggestions.has(normalizedWord)) {
    return (
      findApproximateSuggestion(normalizedWord, index) ??
      serverSuggestions.get(normalizedWord)?.[0] ??
      ""
    );
  }

  if (index.suggestionCache.has(normalizedWord)) {
    return index.suggestionCache.get(normalizedWord) ?? null;
  }

  index.suggestionCache.set(normalizedWord, null);
  return null;
};

const getSuggestionsForWord = (
  word: string,
  ignoredWords: Set<string>,
  dictionary: Record<string, string>,
  index: SpellcheckIndex,
  serverSuggestions: Map<string, string[]>,
) => {
  const normalizedWord = normalizeWord(word);
  const firstSuggestion = getSuggestionForWord(
    word,
    ignoredWords,
    dictionary,
    index,
    serverSuggestions,
  );

  if (firstSuggestion === null) {
    return [];
  }

  const allSuggestions = [
    firstSuggestion,
    ...(serverSuggestions.get(normalizedWord) ?? []),
  ].filter(Boolean);

  return Array.from(new Set(allSuggestions)).slice(0, 3);
};

const normalizeServerSuggestions = (issues: SpellcheckServerIssue[] = []) =>
  Object.fromEntries(
    issues.map((issue) => [
      normalizeWord(issue.word),
      Array.from(new Set((issue.suggestions ?? []).map(normalizeWord))).slice(
        0,
        3,
      ),
    ]),
  );

const fetchSpellcheckSuggestions = async (
  words: string[],
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/spellcheck/check", {
    body: JSON.stringify({ words }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    return {};
  }

  const result = (await response
    .json()
    .catch(() => null)) as SpellcheckServerResponse | null;

  return normalizeServerSuggestions(result?.issues);
};

const saveCustomDictionaryWord = async (
  wrongWord: string,
  correction: string,
) => {
  const response = await fetch("/api/spellcheck/dictionary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wrongWord,
      correction,
    }),
  });
  const result = (await response.json().catch(() => null)) as {
    correction?: string;
    message?: string;
    wrongWord?: string;
  } | null;

  if (!response.ok) {
    const message =
      result &&
      typeof result.message === "string" &&
      result.message.trim().length > 0
        ? result.message
        : "Não foi possível salvar no dicionário.";
    return { message, ok: false as const };
  }

  return {
    correction: normalizeWord(result?.correction ?? correction),
    ok: true as const,
  };
};

const collectWordsForServerSpellcheck = (
  editor: HTMLDivElement,
  ignoredWords: Set<string>,
  dictionary: Record<string, string>,
) => {
  const words = new Set<string>();

  for (const textNode of getEditorTextNodes(editor)) {
    const text = textNode.textContent ?? "";

    WORD_REGEX.lastIndex = 0;

    for (const match of text.matchAll(WORD_REGEX)) {
      const normalizedWord = normalizeWord(match[0]);

      if (
        ignoredWords.has(normalizedWord) ||
        Object.hasOwn(dictionary, normalizedWord)
      ) {
        continue;
      }

      words.add(normalizedWord);

      if (words.size >= MAX_SERVER_SPELLCHECK_WORDS) {
        return Array.from(words);
      }
    }
  }

  return Array.from(words);
};

const shouldSkipTextNode = (node: Text) => {
  const parentElement = node.parentElement;

  if (!parentElement) {
    return true;
  }

  return Boolean(
    parentElement.closest(
      "code,pre,kbd,samp,script,style,[data-calc-result='true']",
    ),
  );
};

const getEditorTextNodes = (editor: HTMLDivElement) => {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text) || shouldSkipTextNode(node)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode instanceof Text) {
      textNodes.push(currentNode);
    }

    currentNode = walker.nextNode();
  }

  return textNodes;
};

const buildWordRange = (node: Text, startOffset: number, endOffset: number) => {
  const range = document.createRange();
  range.setStart(node, startOffset);
  range.setEnd(node, endOffset);
  return range;
};

const applyOriginalCapitalization = (original: string, suggestion: string) => {
  if (original.toLocaleUpperCase("pt-BR") === original) {
    return suggestion.toLocaleUpperCase("pt-BR");
  }

  const firstLetter = original[0];

  if (firstLetter?.toLocaleUpperCase("pt-BR") === firstLetter) {
    return `${suggestion[0]?.toLocaleUpperCase("pt-BR") ?? ""}${suggestion.slice(1)}`;
  }

  return suggestion;
};

const getCaretRangeFromPoint = (x: number, y: number) => {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);

    if (!position?.offsetNode) {
      return null;
    }

    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }

  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y);
  }

  return null;
};

const findTextNodeNearCaret = (range: Range) => {
  if (range.startContainer instanceof Text) {
    return {
      offset: range.startOffset,
      textNode: range.startContainer,
    };
  }

  if (!(range.startContainer instanceof Element)) {
    return null;
  }

  const textNodes = getEditorTextNodes(range.startContainer as HTMLDivElement);
  const textNode = textNodes.find((node) => node.textContent?.trim());

  if (!textNode) {
    return null;
  }

  return {
    offset: 0,
    textNode,
  };
};

const getWordRangeFromCaret = (range: Range) => {
  const textNodeResult = findTextNodeNearCaret(range);

  if (!textNodeResult) {
    return null;
  }

  const { offset, textNode } = textNodeResult;
  const text = textNode.textContent ?? "";

  WORD_REGEX.lastIndex = 0;

  for (const match of text.matchAll(WORD_REGEX)) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;

    if (offset >= matchStart && offset <= matchEnd) {
      return {
        range: buildWordRange(textNode, matchStart, matchEnd),
        word: match[0],
      };
    }
  }

  return null;
};

export const useEditorSpellcheck = ({
  editorRef,
  onEditorChange,
  refreshKey,
}: UseEditorSpellcheckOptions) => {
  const ignoredWordsRef = useRef(new Set<string>());
  const [activeIssue, setActiveIssue] = useState<SpellcheckIssue | null>(null);
  const [customCorrection, setCustomCorrection] = useState("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customRuleMessage, setCustomRuleMessage] = useState("");
  const [isSavingCustomRule, setIsSavingCustomRule] = useState(false);
  const [serverSuggestions, setServerSuggestions] = useState<
    Record<string, string[]>
  >({});
  const [highlightRevision, setHighlightRevision] = useState(0);
  const dictionary = useMemo(
    () => wordsToDictionary([...SPELLCHECK_CUSTOM_WORDS, ...customWords]),
    [customWords],
  );
  const spellcheckIndex = useMemo(
    () => buildSpellcheckIndex(dictionary),
    [dictionary],
  );
  const serverSuggestionMap = useMemo(
    () => new Map(Object.entries(serverSuggestions)),
    [serverSuggestions],
  );

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      const words = collectWordsForServerSpellcheck(
        editor,
        ignoredWordsRef.current,
        dictionary,
      );

      if (words.length === 0) {
        setServerSuggestions({});
        return;
      }

      try {
        setServerSuggestions(
          await fetchSpellcheckSuggestions(words, abortController.signal),
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setServerSuggestions({});
        }
      }
    }, SERVER_SPELLCHECK_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [dictionary, editorRef, refreshKey, highlightRevision]);

  const refreshSpellcheck = useCallback(() => {
    const editor = editorRef.current;
    const highlightApi = getHighlightApi();

    if (!editor || !highlightApi) {
      return;
    }

    const ranges: Range[] = [];

    for (const textNode of getEditorTextNodes(editor)) {
      const text = textNode.textContent ?? "";

      WORD_REGEX.lastIndex = 0;

      for (const match of text.matchAll(WORD_REGEX)) {
        const word = match[0];
        const suggestion = getSuggestionForWord(
          word,
          ignoredWordsRef.current,
          dictionary,
          spellcheckIndex,
          serverSuggestionMap,
        );

        if (suggestion === null) {
          continue;
        }

        const startOffset = match.index ?? 0;
        const endOffset = startOffset + word.length;
        ranges.push(buildWordRange(textNode, startOffset, endOffset));
      }
    }

    highlightApi.highlights.delete(SPELLCHECK_HIGHLIGHT_NAME);

    if (ranges.length > 0) {
      highlightApi.highlights.set(
        SPELLCHECK_HIGHLIGHT_NAME,
        new highlightApi.Highlight(...ranges),
      );
    }
  }, [dictionary, editorRef, serverSuggestionMap, spellcheckIndex]);

  const scheduleSpellcheck = useCallback(() => {
    window.requestAnimationFrame(refreshSpellcheck);
  }, [refreshSpellcheck]);

  useEffect(() => {
    void highlightRevision;
    void refreshKey;
    ensureSpellcheckHighlightStyle();
    scheduleSpellcheck();

    return () => {
      getHighlightApi()?.highlights.delete(SPELLCHECK_HIGHLIGHT_NAME);
    };
  }, [highlightRevision, refreshKey, scheduleSpellcheck]);

  const handleSpellcheckClick = useCallback(
    async (event: MouseEvent<HTMLDivElement>) => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      const caretRange = getCaretRangeFromPoint(event.clientX, event.clientY);

      if (!caretRange || !editor.contains(caretRange.startContainer)) {
        setActiveIssue(null);
        return;
      }

      const wordRange = getWordRangeFromCaret(caretRange);

      if (!wordRange) {
        setActiveIssue(null);
        return;
      }

      const normalizedWord = normalizeWord(wordRange.word);
      let suggestion = getSuggestionForWord(
        wordRange.word,
        ignoredWordsRef.current,
        dictionary,
        spellcheckIndex,
        serverSuggestionMap,
      );

      const rect = wordRange.range.getBoundingClientRect();
      let suggestions = getSuggestionsForWord(
        wordRange.word,
        ignoredWordsRef.current,
        dictionary,
        spellcheckIndex,
        serverSuggestionMap,
      );
      let shouldOpenPopover =
        suggestion !== null || serverSuggestionMap.has(normalizedWord);

      if (!shouldOpenPopover && !Object.hasOwn(dictionary, normalizedWord)) {
        try {
          const nextServerSuggestions = await fetchSpellcheckSuggestions([
            normalizedWord,
          ]);
          const nextWordSuggestions = nextServerSuggestions[normalizedWord];

          if (nextWordSuggestions) {
            const mergedServerSuggestions = {
              ...serverSuggestions,
              ...nextServerSuggestions,
            };
            const nextServerSuggestionMap = new Map(
              Object.entries(mergedServerSuggestions),
            );

            setServerSuggestions(mergedServerSuggestions);
            suggestion = getSuggestionForWord(
              wordRange.word,
              ignoredWordsRef.current,
              dictionary,
              spellcheckIndex,
              nextServerSuggestionMap,
            );
            suggestions = getSuggestionsForWord(
              wordRange.word,
              ignoredWordsRef.current,
              dictionary,
              spellcheckIndex,
              nextServerSuggestionMap,
            );
            shouldOpenPopover = suggestion !== null;
          }
        } catch {
          // Se a rota ainda nao estiver publicada, apenas fecha o popover.
        }
      }

      if (!shouldOpenPopover) {
        setActiveIssue(null);
        return;
      }

      setCustomCorrection(suggestions[0] ?? "");
      setCustomRuleMessage("");
      setActiveIssue({
        original: wordRange.word,
        range: wordRange.range,
        rect,
        suggestions,
      });
    },
    [
      dictionary,
      editorRef,
      serverSuggestionMap,
      serverSuggestions,
      spellcheckIndex,
    ],
  );

  const handleIgnoreIssue = useCallback(() => {
    if (!activeIssue) {
      return;
    }

    ignoredWordsRef.current.add(normalizeWord(activeIssue.original));
    setActiveIssue(null);
    setHighlightRevision((currentRevision) => currentRevision + 1);
  }, [activeIssue]);

  const handleApplySuggestion = useCallback(() => {
    if (!activeIssue?.suggestions[0]) {
      return;
    }

    const replacement = applyOriginalCapitalization(
      activeIssue.original,
      activeIssue.suggestions[0],
    );
    activeIssue.range.deleteContents();
    activeIssue.range.insertNode(document.createTextNode(replacement));
    setActiveIssue(null);
    onEditorChange();
    setHighlightRevision((currentRevision) => currentRevision + 1);
  }, [activeIssue, onEditorChange]);

  const handleApplySelectedSuggestion = useCallback(
    (suggestion: string) => {
      if (!activeIssue) {
        return;
      }

      const replacement = applyOriginalCapitalization(
        activeIssue.original,
        suggestion,
      );
      activeIssue.range.deleteContents();
      activeIssue.range.insertNode(document.createTextNode(replacement));
      setActiveIssue(null);
      onEditorChange();
      setHighlightRevision((currentRevision) => currentRevision + 1);
    },
    [activeIssue, onEditorChange],
  );

  const handleSaveCustomRule = useCallback(() => {
    if (!activeIssue) {
      return;
    }

    const correction = customCorrection.trim();

    if (!correction) {
      setCustomRuleMessage("Informe uma correção para salvar.");
      return;
    }

    setIsSavingCustomRule(true);
    setCustomRuleMessage("");

    void saveCustomDictionaryWord(activeIssue.original, correction)
      .then((result) => {
        if (!result.ok) {
          setCustomRuleMessage(result.message);
          setIsSavingCustomRule(false);
          return;
        }

        setCustomWords((currentWords) =>
          currentWords.includes(result.correction)
            ? currentWords
            : [...currentWords, result.correction],
        );
        setActiveIssue((currentIssue) =>
          currentIssue
            ? {
                ...currentIssue,
                suggestions: [result.correction],
              }
            : currentIssue,
        );
        setCustomRuleMessage("Palavra correta adicionada à base local.");
        setHighlightRevision((currentRevision) => currentRevision + 1);
        setIsSavingCustomRule(false);
      })
      .catch((error) => {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Não foi possível salvar no dicionário.";
        setCustomRuleMessage(message);
        setIsSavingCustomRule(false);
      });
  }, [activeIssue, customCorrection]);

  const popover = useMemo(() => {
    if (!activeIssue) {
      return null;
    }

    return (
      <div
        className="fixed z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-xl shadow-zinc-900/10"
        style={{
          left: Math.min(activeIssue.rect.left, window.innerWidth - 272),
          top: activeIssue.rect.bottom + 8,
        }}
      >
        <div className="mb-2">
          <p className="text-xs font-medium text-zinc-500">
            Possível erro ortográfico
          </p>
          <p className="mt-1 text-zinc-800">
            <span className="font-semibold text-red-600">
              {activeIssue.original}
            </span>{" "}
            →{" "}
            <span className="font-semibold text-emerald-700">
              {activeIssue.suggestions[0] || "Sem sugestão"}
            </span>
          </p>
        </div>
        {activeIssue.suggestions.length > 1 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {activeIssue.suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                onClick={() => handleApplySelectedSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            className="h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            onClick={handleIgnoreIssue}
          >
            Ignorar
          </button>
          <button
            type="button"
            disabled={!activeIssue.suggestions[0]}
            className="h-8 flex-1 rounded-md bg-emerald-600 px-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            onClick={handleApplySuggestion}
          >
            Corrigir
          </button>
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <label
            className="text-xs font-medium text-zinc-600"
            htmlFor="spellcheck-custom-correction"
          >
            Adicionar palavra correta
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="spellcheck-custom-correction"
              type="text"
              value={customCorrection}
              disabled={isSavingCustomRule}
              onChange={(event) => setCustomCorrection(event.target.value)}
              className="h-8 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100 disabled:text-zinc-400"
            />
            <button
              type="button"
              disabled={isSavingCustomRule}
              className="h-8 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-950"
              onClick={handleSaveCustomRule}
            >
              {isSavingCustomRule ? "Salvando" : "Adicionar"}
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {customRuleMessage || "Salva a palavra correta na base local."}
          </p>
        </div>
      </div>
    );
  }, [
    activeIssue,
    customCorrection,
    customRuleMessage,
    handleApplySuggestion,
    handleApplySelectedSuggestion,
    handleIgnoreIssue,
    handleSaveCustomRule,
    isSavingCustomRule,
  ]);

  return {
    handleSpellcheckClick,
    popover,
    scheduleSpellcheck,
  };
};
