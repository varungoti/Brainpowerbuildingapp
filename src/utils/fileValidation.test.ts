// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  MAX_BACKUP_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  validateBackupFile,
  validateImageFile,
} from "./fileValidation";

function makeFile(size: number, type: string, name = "file.bin"): File {
  // Build a synthetic blob at the requested byte size WITHOUT actually
  // allocating `size` bytes of real data — we only need `.size` and `.type`.
  const blob = new Blob([""]);
  Object.defineProperty(blob, "size", { value: size });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFile", () => {
  it("accepts a well-formed PNG under the cap", () => {
    const result = validateImageFile(makeFile(1024, "image/png", "photo.png"));
    expect(result.ok).toBe(true);
  });

  it("rejects oversized images with a human-readable reason", () => {
    const result = validateImageFile(
      makeFile(MAX_IMAGE_UPLOAD_BYTES + 1, "image/jpeg", "huge.jpg"),
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/too large/i);
  });

  it("rejects disallowed MIME types", () => {
    const result = validateImageFile(makeFile(1024, "application/pdf", "doc.pdf"));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/supported/i);
  });

  it("rejects zero-byte files", () => {
    expect(validateImageFile(makeFile(0, "image/png", "empty.png")).ok).toBe(false);
  });
});

describe("validateBackupFile", () => {
  it("accepts a small JSON backup", () => {
    const result = validateBackupFile(
      makeFile(2048, "application/json", "neurospark-backup.json"),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts JSON-named files even when MIME is empty", () => {
    const result = validateBackupFile(makeFile(2048, "", "backup.json"));
    expect(result.ok).toBe(true);
  });

  it("rejects oversized backups", () => {
    const result = validateBackupFile(
      makeFile(MAX_BACKUP_UPLOAD_BYTES + 1, "application/json", "huge.json"),
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/too large/i);
  });

  it("rejects non-JSON files by MIME AND name", () => {
    const result = validateBackupFile(makeFile(1024, "image/png", "pic.png"));
    expect(result.ok).toBe(false);
  });
});
