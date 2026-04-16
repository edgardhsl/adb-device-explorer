export type LogcatFilterCompilation = {
  regexTokens: RegExp[];
  keywordTokens: string[];
  hasInvalidRegex: boolean;
};

export function compileLogcatFilterQuery(query: string): LogcatFilterCompilation {
  const rawTokens = query
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const regexTokens: RegExp[] = [];
  const keywordTokens: string[] = [];
  let hasInvalidRegex = false;

  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    const regexBody =
      lower.startsWith("re:")
        ? token.slice(3).trim()
        : token.startsWith("/") && token.endsWith("/") && token.length > 2
          ? token.slice(1, -1)
          : null;

    if (regexBody !== null) {
      try {
        regexTokens.push(new RegExp(regexBody, "i"));
      } catch {
        hasInvalidRegex = true;
      }
      continue;
    }

    keywordTokens.push(lower);
  }

  return { regexTokens, keywordTokens, hasInvalidRegex };
}

export function filterLogcatLines(
  lines: string[],
  compiled: LogcatFilterCompilation
): string[] {
  return lines.filter((line) => {
    const lower = line.toLowerCase();
    const matchesRegex =
      compiled.regexTokens.length === 0 ||
      compiled.regexTokens.every((regex) => regex.test(line));
    const matchesKeywords =
      compiled.keywordTokens.length === 0 ||
      compiled.keywordTokens.every((keyword) => lower.includes(keyword));
    return matchesRegex && matchesKeywords;
  });
}

export function parseLogcatLevel(line: string): string {
  const match = line.match(
    /^\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s+\d+\s+\d+\s+([VDIWEAF])\s+/
  );
  return match?.[1] ?? "I";
}

export function mergeLogSnapshots(
  previous: string[],
  nextSnapshot: string[],
  maxBuffer: number
): string[] {
  if (nextSnapshot.length === 0) return previous.slice(-maxBuffer);
  if (previous.length === 0) return nextSnapshot.slice(-maxBuffer);

  const maxOverlap = Math.min(previous.length, nextSnapshot.length);
  let overlap = 0;

  for (let size = maxOverlap; size > 0; size -= 1) {
    let matches = true;
    for (let i = 0; i < size; i += 1) {
      if (previous[previous.length - size + i] !== nextSnapshot[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      overlap = size;
      break;
    }
  }

  const merged = [...previous, ...nextSnapshot.slice(overlap)];
  return merged.slice(-maxBuffer);
}
