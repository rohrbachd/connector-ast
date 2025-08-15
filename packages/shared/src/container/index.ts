/**
 * Lightweight dependency injection container.
 * Allows registering classes, factory functions, or values
 * and resolving them with optional singleton or transient scope.
 */
export type Token<T = unknown> = string | symbol | (new (...args: any[]) => T);

export interface ClassProvider<T> {
  useClass: new (...args: any[]) => T;
  deps?: Token[];
  scope?: 'singleton' | 'transient';
}

export interface FactoryProvider<T> {
  useFactory: (container: Container) => T;
  scope?: 'singleton' | 'transient';
}

export interface ValueProvider<T> {
  useValue: T;
}

export type Provider<T> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

export class Container {
  private readonly registry = new Map<Token, Provider<any>>();
  private readonly singletons = new Map<Token, any>();

  /**
   * Register a dependency provider.
   * @param token Identifier for the dependency.
   * @param provider Provider configuration.
   */
  register<T>(token: Token<T>, provider: Provider<T>): void {
    this.registry.set(token, provider);
  }

  /**
   * Resolve a dependency by token.
   * @param token Identifier for the dependency.
   * @throws If no provider registered for token.
   */
  resolve<T>(token: Token<T>): T {
    const provider = this.registry.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    if ('useValue' in provider) {
      return provider.useValue;
    }

    if ('useFactory' in provider) {
      if (provider.scope === 'singleton') {
        if (this.singletons.has(token)) {
          return this.singletons.get(token);
        }
        const instance = provider.useFactory(this);
        this.singletons.set(token, instance);
        return instance;
      }
      return provider.useFactory(this);
    }

    // useClass
    const { useClass, deps = [], scope } = provider as ClassProvider<T>;
    if (scope !== 'transient') {
      if (this.singletons.has(token)) {
        return this.singletons.get(token);
      }
      const instance = new useClass(...deps.map((d) => this.resolve(d)));
      this.singletons.set(token, instance);
      return instance;
    }
    return new useClass(...deps.map((d) => this.resolve(d)));
  }

  /**
   * Clear all registrations and singletons. Useful for testing.
   */
  clear(): void {
    this.registry.clear();
    this.singletons.clear();
  }
}

