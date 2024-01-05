/**
 * A class that wraps a value and allows it to be set asynchronously.
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
 * import { AsyncValue } from "./testutil.ts";
 *
 * const v = new AsyncValue(0);
 * assertEquals(await v.get(), 0);
 * await v.set(1);
 * assertEquals(await v.get(), 1);
 * ```
 *
 * @typeParam T - The type of the value.
 */
export class AsyncValue<T> {
  #value: T;

  /**
   * Constructs a new AsyncValue with the given initial value.
   *
   * @param value - The initial value.
   */
  constructor(value: T) {
    this.#value = value;
  }

  /**
   * Returns the current value.
   */
  get(): Promise<T> {
    return new Promise((resolve) => resolve(this.#value));
  }

  /**
   * Sets the value.
   */
  set(value: T): Promise<void> {
    return new Promise((resolve) => {
      this.#value = value;
      resolve();
    });
  }
}
