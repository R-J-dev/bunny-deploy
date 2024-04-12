import { getBunnyClient } from "@/bunnyClient.js";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";
import { describe, it, expect, vi, afterEach } from "vitest";
import { deleteFiles } from "@/actions/delete/delete.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const bunnyClient = getBunnyClient("test", testServerUrl);
let concurrentDeletes = 0;
let maxConcurrentDeletes = 0;

describe("deleteFiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe.each([[1], [2], [5]])("Concurrency is set to %i", (concurrency) => {
    it(
      `should not delete more than ${concurrency} files concurrently`,
      {
        timeout: 7000, // Due to simulating slow delete requests
      },
      async () => {
        const deleteSpy = vi.spyOn(bunnyClient, "delete");
        concurrentDeletes = 0;
        maxConcurrentDeletes = 0;
        // Mock `delete` to track concurrent deletes
        // @ts-expect-error returning a mock so a type error will be expected.
        deleteSpy.mockImplementation(async () => {
          concurrentDeletes++;
          maxConcurrentDeletes = Math.max(
            maxConcurrentDeletes,
            concurrentDeletes,
          );
          // Simulate file delete delay
          await delay(400);
          concurrentDeletes--;

          return vi.fn();
        });

        const filesToDelete = new Set<string>();
        for (let i = 0; i < 10; i++) {
          filesToDelete.add(`testFile${i}`);
        }

        await deleteFiles({
          client: bunnyClient,
          filesToDelete,
          concurrency,
        });

        expect(maxConcurrentDeletes).toBeLessThanOrEqual(concurrency);
        filesToDelete.forEach((file) => {
          expect(deleteSpy).toHaveBeenCalledWith(file);
        });
      },
    );
  });
});
