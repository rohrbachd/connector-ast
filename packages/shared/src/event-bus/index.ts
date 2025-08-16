/**
 * Simple asynchronous event bus for internal communication.
 * Provides typed publish/subscribe functionality without
 * external dependencies.
 */
export type EventHandler<T> = (payload: T) => void | Promise<void>;

export class EventBus<Events extends Record<string, unknown>> {
  private readonly handlers: Map<keyof Events, Set<EventHandler<Events[keyof Events]>>> = new Map();

  /**
   * Subscribe to a specific event.
   * @param event Event name to subscribe to.
   * @param handler Handler invoked when the event is published.
   */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const existing = (this.handlers.get(event) as Set<EventHandler<Events[K]>> | undefined) ?? new Set();
    existing.add(handler);
    this.handlers.set(event, existing as Set<EventHandler<Events[keyof Events]>>);
  }

  /**
   * Unsubscribe a handler from an event.
   * @param event Event name to unsubscribe from.
   * @param handler Handler to remove.
   */
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const set = this.handlers.get(event) as Set<EventHandler<Events[K]>> | undefined;
    set?.delete(handler);
    if (set && set.size === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Publish an event with a payload.
   * Handlers are invoked sequentially and awaited if they return a Promise.
   * @param event Event name to publish.
   * @param payload Event payload.
   */
  async emit<K extends keyof Events>(event: K, payload: Events[K]): Promise<void> {
    const set = this.handlers.get(event) as Set<EventHandler<Events[K]>> | undefined;
    if (!set) return;
    for (const handler of Array.from(set)) {
      await handler(payload);
    }
  }

  /**
   * Remove all handlers. Useful for testing.
   */
  clear(): void {
    this.handlers.clear();
  }
}
