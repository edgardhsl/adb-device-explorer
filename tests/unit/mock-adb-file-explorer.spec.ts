import { expect, test } from "@playwright/test";
import { listMockDeviceFiles } from "../../src/lib/mock-adb";

test.describe("Unit: Mock ADB File Explorer", () => {
  test("returns default root entries when no path is provided", async () => {
    const entries = await listMockDeviceFiles("mock-device-01");

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.name === "Download" && entry.is_directory)).toBeTruthy();
  });

  test("returns specific directory entries for nested path", async () => {
    const entries = await listMockDeviceFiles("mock-device-01", "/sdcard/Download");

    expect(entries.some((entry) => entry.name === "build-debug.apk" && !entry.is_directory)).toBeTruthy();
    expect(entries.some((entry) => entry.name === "export.csv" && !entry.is_directory)).toBeTruthy();
  });
});
