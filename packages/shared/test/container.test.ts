import { describe, it, expect } from 'vitest';
import { Container } from '../src/container/index.js';

class Foo {
  value = Math.random();
}

class Bar {
  constructor(public foo: Foo) {}
}

/**
 * Creates a container preconfigured for tests.
 */
function createContainer() {
  return new Container();
}

describe('Container', () => {
  it('resolves a registered value', () => {
    const container = createContainer();
    const token = Symbol('token');
    container.register(token, { useValue: 42 });

    expect(container.resolve(token)).toBe(42);
  });

  it('handles class providers with dependency injection', () => {
    const container = createContainer();
    container.register(Foo, { useClass: Foo });
    container.register(Bar, { useClass: Bar, deps: [Foo] });

    const first = container.resolve(Bar);
    const second = container.resolve(Bar);

    expect(first.foo).toBe(second.foo);
  });

  it('creates new instances for transient scope', () => {
    const container = createContainer();
    container.register(Foo, { useClass: Foo, scope: 'transient' });

    const first = container.resolve(Foo);
    const second = container.resolve(Foo);

    expect(first).not.toBe(second);
  });
});
