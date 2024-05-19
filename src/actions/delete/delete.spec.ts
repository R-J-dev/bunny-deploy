import { getBunnyClient } from "@/bunnyClient.js";
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  inject,
  beforeAll,
  beforeEach,
} from "vitest";
import { deleteFiles } from "@/actions/delete/delete.js";
import type { Got } from "got";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("deleteFiles", () => {
  let bunnyClient: Got, concurrentDeletes: number, maxConcurrentDeletes: number;

  beforeAll(() => {
    const testServerUrl = inject("testServerUrl");
    bunnyClient = getBunnyClient("test", testServerUrl);
  });

  beforeEach(() => {
    concurrentDeletes = 0;
    maxConcurrentDeletes = 0;
  });

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
