import { Notify, WaitOptions } from "./notify.ts";

/**
 * A stack implementation that allows for adding and removing elements, with optional waiting when
 * popping elements from an empty stack.
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
 * import { Stack } from "./stack.ts";
 *
 * const stack = new Stack<number>();
 * stack.push(1);
 * stack.push(2);
 * stack.push(3);
 * assertEquals(await stack.pop(), 3);
 * assertEquals(await stack.pop(), 2);
 * assertEquals(await stack.pop(), 1);
 * ```
 *
 * @template T The type of items in the stack.
 */
export class Stack<T> {
  #notify = new Notify();
  #items: T[] = [];

  /**
   * Gets the number of items in the queue.
   */
  get size(): number {
    return this.#items.length;
  }

  /**
   * Returns true if the stack is currently locked.
   */
  get locked(): boolean {
    return this.#notify.waiters > 0;
  }

  /**
   * Adds an item to the top of the stack and notifies any waiting consumers.
   *
   * @param {T} value The item to add to the stack.
   */
  push(value: T): void {
    this.#items.push(value);
    this.#notify.notify();
  }

  /**
   * Removes the next item from the stack, optionally waiting if the stack is currently empty.
   *
   * @param {WaitOptions} [options] Optional parameters to pass to the wait operation.
   * @param {AbortSignal} [options.signal] An optional AbortSignal used to abort the wait operation if the signal is aborted.
   * @returns {Promise<T>} A promise that resolves to the next item in the stack.
   * @throws {DOMException} Throws a DOMException with "Aborted" and "AbortError" codes if the wait operation was aborted.
   */
  async pop({ signal }: WaitOptions = {}): Promise<T> {
    while (!signal?.aborted) {
      const value = this.#items.pop();
      if (value) {
        return value;
      }
      await this.#notify.notified({ signal });
    }
    throw new DOMException("Aborted", "AbortError");
  }
}
