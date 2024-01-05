import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { AsyncValue } from "./testutil.ts";
import { Lock } from "./lock.ts";

Deno.test("Lock", async (t) => {
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
    "Processing over multiple event loops is not atomic, but can be changed to atomic by using Lock",
    async () => {
      const count = new Lock(new AsyncValue(0));
      const operation = () => {
        return count.lock(async (count) => {
          const v = await count.get();
          await count.set(v + 1);
        });
      };
      await Promise.all([...Array(10)].map(() => operation()));
      assertEquals(await count.lock((v) => v.get()), 10);
    },
  );

  await t.step(
    "'lock' should allow only one operation at a time",
    async () => {
      let noperations = 0;
      const results: number[] = [];
      const count = new Lock(new AsyncValue(0));
      const operation = () => {
        return count.lock(async (count) => {
          noperations += 1;
          results.push(noperations);
          const v = await count.get();
          await count.set(v + 1);
          noperations -= 1;
        });
      };
      await Promise.all([...Array(10)].map(() => operation()));
      assertEquals(noperations, 0);
      assertEquals(results, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    },
  );
});
