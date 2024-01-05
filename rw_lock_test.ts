import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { deferred } from "https://deno.land/std@0.211.0/async/deferred.ts";
import { promiseState } from "./state.ts";
import { AsyncValue } from "./testutil.ts";
import { RwLock } from "./rw_lock.ts";

Deno.test("RwLock", async (t) => {
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
    "Processing over multiple event loops is not atomic, but can be changed to atomic by using RwLock",
    async () => {
      const count = new RwLock(new AsyncValue(0));
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
    "'lock' should allow only one writer at a time",
    async () => {
      let nwriters = 0;
      const results: number[] = [];
      const count = new RwLock(new AsyncValue(0));
      const writer = () => {
        return count.lock(async (count) => {
          nwriters += 1;
          results.push(nwriters);
          await count.set(await count.get() + 1);
          nwriters -= 1;
        });
      };
      await Promise.all([...Array(10)].map(() => writer()));
      assertEquals(nwriters, 0);
      assertEquals(results, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    },
  );

  await t.step(
    "'rlock' should allow multiple readers at a time",
    async () => {
      let nreaders = 0;
      const results: number[] = [];
      const count = new RwLock(new AsyncValue(0));
      const reader = () => {
        return count.rlock(async (count) => {
          nreaders += 1;
          results.push(nreaders);
          assertEquals(await count.get(), 0);
          nreaders -= 1;
        });
      };
      await Promise.all([...Array(10)].map(() => reader()));
      assertEquals(nreaders, 0);
      assertEquals(results, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    },
  );

  await t.step(
    "'lock' should block until all readers are done",
    async () => {
      const count = new RwLock(new AsyncValue(0));
      const waiter = deferred();
      const writer = () => {
        return count.lock(() => {
          // Do nothing
        });
      };
      const reader = () => {
        return count.rlock(async () => {
          await waiter;
        });
      };
      const r = reader();
      const w = writer();
      assertEquals(await promiseState(r), "pending");
      assertEquals(await promiseState(w), "pending");
      waiter.resolve();
      assertEquals(await promiseState(r), "fulfilled");
      assertEquals(await promiseState(w), "fulfilled");
    },
  );

  await t.step(
    "'rlock' should block until all writers are done",
    async () => {
      const count = new RwLock(new AsyncValue(0));
      const waiter = deferred();
      const writer = () => {
        return count.lock(async () => {
          await waiter;
        });
      };
      const reader = () => {
        return count.rlock(() => {
          // Do nothing
        });
      };
      const w = writer();
      const r = reader();
      assertEquals(await promiseState(w), "pending");
      assertEquals(await promiseState(r), "pending");
      waiter.resolve();
      assertEquals(await promiseState(w), "fulfilled");
      assertEquals(await promiseState(r), "fulfilled");
    },
  );
});
