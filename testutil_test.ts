import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { AsyncValue } from "./testutil.ts";

Deno.test("AsyncValue", async (t) => {
  await t.step(
    "'get' returns a promise that resolves to the value set by 'set'",
    async () => {
      const v = new AsyncValue(0);
      assertEquals(await v.get(), 0);
      await v.set(1);
      assertEquals(await v.get(), 1);
    },
  );
});
