import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { AsyncValue } from "./testutil.ts";
import { Mutex } from "./mutex.ts";

Deno.test("Mutex", async (t) => {
  await t.step(
    "Processing over multiple event loops is not atomic",
    async () => {
      const count = new AsyncValue(0);
      const operation = async () => {
        const v = await count.get();
        await count.set(v + 1);
      };
      await Promise.all([...Array(10)].map(() => operation()));
      assertEquals(await count.get(), 1);
    },
  );

  await t.step(
    "Processing over multiple event loops is not atomic, but can be changed to atomic by using Mutex",
    async () => {
      const mu = new Mutex();
      const count = new AsyncValue(0);
      const operation = async () => {
        await mu.acquire();
        try {
          const v = await count.get();
          await count.set(v + 1);
        } finally {
          mu.release();
        }
      };
      await Promise.all([...Array(10)].map(() => operation()));
      assertEquals(await count.get(), 10);
    },
  );
});
