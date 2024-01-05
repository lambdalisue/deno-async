import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { Semaphore } from "./semaphore.ts";

Deno.test("Semaphore", async (t) => {
  await t.step(
    "regulates the number of workers concurrently running",
    async () => {
      let nworkers = 0;
      const results: number[] = [];
      const sem = new Semaphore(5);
      const worker = () => {
        return sem.lock(async () => {
          nworkers++;
          results.push(nworkers);
          await new Promise((resolve) => setTimeout(resolve, 10));
          nworkers--;
        });
      };
      await Promise.all([...Array(10)].map(() => worker()));
      assertEquals(nworkers, 0);
      assertEquals(results, [
        1,
        2,
        3,
        4,
        5,
        5,
        5,
        5,
        5,
        5,
      ]);
    },
  );
});
