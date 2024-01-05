import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { Barrier } from "./barrier.ts";

Deno.test("Barrier", async (t) => {
  await t.step(
    "'wait' waits until the number of waiters reached the size specified to the barrier",
    async () => {
      const barrier = new Barrier(5);
      const workers = [];
      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        workers.push((async () => {
          results.push(`before wait ${i}`);
          await barrier.wait();
          results.push(`after wait ${i}`);
        })());
      }
      await Promise.all(workers);
      assertEquals(results, [
        "before wait 0",
        "before wait 1",
        "before wait 2",
        "before wait 3",
        "before wait 4",
        "after wait 0",
        "after wait 1",
        "after wait 2",
        "after wait 3",
        "after wait 4",
      ]);
    },
  );
});
