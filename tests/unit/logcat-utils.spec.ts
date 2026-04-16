import { expect, test } from "@playwright/test";
import {
  compileLogcatFilterQuery,
  filterLogcatLines,
  mergeLogSnapshots,
  parseLogcatLevel,
} from "../../src/lib/logcat-utils";

test.describe("Unit: Logcat Utils", () => {
  test("compileLogcatFilterQuery splits keywords and regex tokens", () => {
    const compiled = compileLogcatFilterQuery("error,re:timeout|exception,/fatal/");

    expect(compiled.keywordTokens).toEqual(["error"]);
    expect(compiled.regexTokens).toHaveLength(2);
    expect(compiled.hasInvalidRegex).toBeFalsy();
  });

  test("compileLogcatFilterQuery flags invalid regex", () => {
    const compiled = compileLogcatFilterQuery("re:[unclosed");
    expect(compiled.hasInvalidRegex).toBeTruthy();
    expect(compiled.regexTokens).toHaveLength(0);
  });

  test("filterLogcatLines applies keyword and regex filters", () => {
    const lines = [
      "04-15 12:00:00.000  111  111 I Demo: startup done",
      "04-15 12:00:01.000  111  111 W Demo: timeout while syncing",
      "04-15 12:00:02.000  111  111 E Demo: fatal exception",
    ];

    const compiled = compileLogcatFilterQuery("demo,re:timeout|exception");
    const result = filterLogcatLines(lines, compiled);

    expect(result).toHaveLength(2);
    expect(result[0]).toContain("timeout");
    expect(result[1]).toContain("exception");
  });

  test("parseLogcatLevel extracts severity and falls back to I", () => {
    const errorLine = "04-15 12:00:02.000  111  111 E Demo: fatal exception";
    const unknownLine = "random text without level";

    expect(parseLogcatLevel(errorLine)).toBe("E");
    expect(parseLogcatLevel(unknownLine)).toBe("I");
  });

  test("mergeLogSnapshots appends only new tail lines based on overlap", () => {
    const previous = ["l1", "l2", "l3", "l4"];
    const snapshot = ["l3", "l4", "l5", "l6"];

    const merged = mergeLogSnapshots(previous, snapshot, 20);
    expect(merged).toEqual(["l1", "l2", "l3", "l4", "l5", "l6"]);
  });

  test("mergeLogSnapshots enforces max buffer", () => {
    const previous = ["a", "b", "c"];
    const snapshot = ["c", "d", "e", "f"];

    const merged = mergeLogSnapshots(previous, snapshot, 3);
    expect(merged).toEqual(["d", "e", "f"]);
  });
});
