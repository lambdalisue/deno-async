import { delay } from "https://deno.land/std@0.211.0/async/delay.ts";
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.211.0/testing/asserts.ts";
import { promiseState } from "./state.ts";
import { Stack } from "./stack.ts";

Deno.test("Stack", async (t) => {
  await t.step("'pop' returns pushed items", async () => {
    const q = new Stack<number>();
    q.push(1);
    q.push(2);
    q.push(3);
    assertEquals(await q.pop(), 3);
    assertEquals(await q.pop(), 2);
    assertEquals(await q.pop(), 1);
  });

  await t.step("'pop' waits for an item is pushed", async () => {
    const q = new Stack<number>();
    const popper = q.pop();
    assertEquals(await promiseState(popper), "pending");
    q.push(1);
    assertEquals(await promiseState(popper), "fulfilled");
    assertEquals(await popper, 1);
  });

  await t.step("'pop' with non-aborted signal", async () => {
    const controller = new AbortController();
    const q = new Stack<number>();
    const popper = q.pop({ signal: controller.signal });
    assertEquals(await promiseState(popper), "pending");
  });

  await t.step("'pop' with signal aborted after delay", async () => {
    const controller = new AbortController();
    const q = new Stack<number>();

    delay(100).then(() => controller.abort());

    await assertRejects(
      () => q.pop({ signal: controller.signal }),
      DOMException,
      "Aborted",
    );
  });

  await t.step("'pop' with signal already aborted", async () => {
    const controller = new AbortController();
    const q = new Stack<number>();

    controller.abort();

    await assertRejects(
      () => q.pop({ signal: controller.signal }),
      DOMException,
      "Aborted",
    );
  });
});
