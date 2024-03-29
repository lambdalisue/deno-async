/**
 * A mutex (mutual exclusion) is a synchronization primitive that grants
 * exclusive access to a shared resource.
 *
 * This is a low-level primitive. Use `Lock` instead of `Mutex` if you need to access a shared value
 * concurrently.
 *
 * ```ts
 * import { AsyncValue } from "https://deno.land/x/async@$MODULE_VERSION/testutil.ts";
 * import { Mutex } from "https://deno.land/x/async@$MODULE_VERSION/mutex.ts";
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
  #waiters: { promise: Promise<void>; resolve: () => void }[] = [];

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
    const { promise, resolve } = Promise.withResolvers<void>();
    this.#waiters.push({ promise, resolve });
    if (waiters.length) {
      await Promise.all(waiters.map(({ promise }) => promise));
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
