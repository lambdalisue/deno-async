import {
  Deferred,
  deferred,
} from "https://deno.land/std@0.211.0/async/deferred.ts";

/**
 * A mutex (mutual exclusion) is a synchronization primitive that grants
 * exclusive access to a shared resource.
 *
 * This is a low-level primitive. Use `Lock` instead of `Mutex` if you need to access a shared value
 * concurrently.
 *
 * ```ts
 * import { AsyncValue } from "./testutil.ts";
 * import { Mutex } from "./mutex.ts";
 *
 * const count = new AsyncValue(0);
 *
 * async function doSomething() {
 *   const v = await count.get();
 *   await count.set(v + 1);
 * }
 *
 * // Critical section
 * const mu = new Mutex();
 * await mu.acquire();
 * try {
 *   await doSomething();
 * } finally {
 *   mu.release();
 * }
 * ```
 */
export class Mutex {
  #waiters: Deferred<void>[] = [];

  /**
   * Returns true if the mutex is locked, false otherwise.
   */
  get locked(): boolean {
    return this.#waiters.length > 0;
  }

  /**
   * Acquire the mutex, waiting if necessary for it to become available.
   * @returns A Promise that resolves when the mutex is acquired.
   */
  async acquire(): Promise<void> {
    const waiters = [...this.#waiters];
    this.#waiters.push(deferred());
    if (waiters.length) {
      await Promise.all(waiters);
    }
  }

  /**
   * Release the mutex, allowing the next pending acquirer to proceed.
   */
  release(): void {
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter.resolve();
    }
  }
}
