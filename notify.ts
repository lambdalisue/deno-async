import {
  Deferred,
  deferred,
} from "https://deno.land/std@0.211.0/async/deferred.ts";

export type WaitOptions = {
  signal?: AbortSignal;
};

/**
 * Async notifier that allows one or more "waiters" to wait for a notification.
 *
 * ```ts
 * import { assertEquals } from "https://deno.land/std@0.211.0/testing/asserts.ts";
 * import { promiseState } from "./state.ts";
 * import { Notify } from "./notify.ts";
 *
 * const notify = new Notify();
 * const waiter1 = notify.notified();
 * const waiter2 = notify.notified();
 * notify.notify();
 * assertEquals(await promiseState(waiter1), "fulfilled");
 * assertEquals(await promiseState(waiter2), "pending");
 * notify.notify();
 * assertEquals(await promiseState(waiter1), "fulfilled");
 * assertEquals(await promiseState(waiter2), "fulfilled");
 * ```
 */
export class Notify {
  #waiters: Deferred<void>[] = [];

  /**
   * Returns the number of waiters that are waiting for notification.
   */
  get waiters(): number {
    return this.#waiters.length;
  }

  /**
   * Notifies `n` waiters that are waiting for notification. Resolves each of the notified waiters.
   * If there are fewer than `n` waiters, all waiters are notified.
   */
  notify(n = 1): void {
    for (const _ of Array(n)) {
      const waiter = this.#waiters.shift();
      if (!waiter) {
        break;
      }
      waiter.resolve();
    }
  }

  /**
   * Notifies all waiters that are waiting for notification. Resolves each of the notified waiters.
   */
  notifyAll(): void {
    this.notify(this.#waiters.length);
  }

  /**
   * Asynchronously waits for notification. The caller's execution is suspended until
   * the `notify` method is called. The method returns a Promise that resolves when the caller is notified.
   * Optionally takes an AbortSignal to abort the waiting if the signal is aborted.
   *
   * @param options Optional parameters.
   * @param options.signal An optional AbortSignal to abort the waiting if the signal is aborted.
   * @throws {DOMException} If the signal is aborted.
   */
  async notified({ signal }: WaitOptions = {}): Promise<void> {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const waiter = deferred<void>();
    const abort = () => {
      removeItem(this.#waiters, waiter);
      waiter.reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    this.#waiters.push(waiter);
    await waiter;
    signal?.removeEventListener("abort", abort);
  }
}

function removeItem<T>(array: T[], item: T): void {
  const index = array.indexOf(item);
  array.splice(index, 1);
}
