import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/event-bus/index.js';

interface Events {
  foo: string;
}

/**
 * Creates a new EventBus instance for testing.
 */
function createBus() {
  return new EventBus<Events>();
}

describe('EventBus', () => {
  it('invokes subscribed handlers on emit', async () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('foo', handler);

    await bus.emit('foo', 'bar');

    expect(handler).toHaveBeenCalledWith('bar');
  });

  it('supports removing handlers', async () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('foo', handler);
    bus.off('foo', handler);

    await bus.emit('foo', 'baz');

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all handlers', async () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('foo', handler);
    bus.clear();

    await bus.emit('foo', 'baz');

    expect(handler).not.toHaveBeenCalled();
  });
});
