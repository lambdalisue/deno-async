import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { deferred } from "https://deno.land/std@0.211.0/async/deferred.ts";
import { promiseState } from "./state.ts";

Deno.test(
  "promiseState() returns 'fulfilled' for resolved promise",
  async () => {
    const p = Promise.resolve("Resolved promise");
    assertEquals(await promiseState(p), "fulfilled");
  },
);

Deno.test(
  "promiseState() returns 'rejected' for rejected promise",
  async () => {
    const p = Promise.reject("Rejected promise");
    p.catch(() => undefined); // Avoid 'Uncaught (in promise) Rejected promise'
    assertEquals(await promiseState(p), "rejected");
  },
);

Deno.test(
  "promiseState() returns 'pending' for not resolved promise",
  async () => {
    const p = new Promise(() => undefined);
    assertEquals(await promiseState(p), "pending");
  },
);

Deno.test("promiseState() returns refreshed status", async () => {
  const d = deferred();
  const p = (async () => {
    await d;
  })();
  assertEquals(await promiseState(p), "pending");
  d.resolve();
  assertEquals(await promiseState(p), "fulfilled");
});
