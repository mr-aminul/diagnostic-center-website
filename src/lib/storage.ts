import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Report files are stored behind this small interface so the default local
 * disk implementation can be swapped for S3/MinIO later (e.g. once a center
 * runs multiple app servers) without touching booking/report business logic.
 */
interface ReportStorage {
  save(fileBuffer: Buffer, originalFileName: string): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

class LocalDiskStorage implements ReportStorage {
  private get baseDir(): string {
    // The turbopackIgnore comment tells the build tracer this dynamic path
    // isn't a module require — without it, Turbopack traces the entire
    // project into the standalone build "just in case" (see build warning:
    // https://nextjs.org/docs/messages/unexpected-fs-usage).
    return path.resolve(/* turbopackIgnore: true */ process.env.REPORTS_STORAGE_DIR ?? "./storage/reports");
  }

  async save(fileBuffer: Buffer, originalFileName: string): Promise<string> {
    await mkdir(/* turbopackIgnore: true */ this.baseDir, { recursive: true });
    const extension = path.extname(originalFileName) || ".pdf";
    const storageKey = `${randomUUID()}${extension}`;
    await writeFile(path.join(/* turbopackIgnore: true */ this.baseDir, storageKey), fileBuffer);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(path.join(/* turbopackIgnore: true */ this.baseDir, this.safeKey(storageKey)));
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(path.join(/* turbopackIgnore: true */ this.baseDir, this.safeKey(storageKey))).catch(
      () => undefined
    );
  }

  /** Guard against path traversal — a storage key must never contain a path separator. */
  private safeKey(storageKey: string): string {
    if (storageKey.includes("/") || storageKey.includes("..")) {
      throw new Error("Invalid storage key");
    }
    return storageKey;
  }
}

export const reportStorage: ReportStorage = new LocalDiskStorage();
