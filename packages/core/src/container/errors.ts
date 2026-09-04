/** Thrown from InMemoryContainer.bind() when called on a child Container. */
export class RootOnlyOperationError extends Error {
  constructor() {
    super(
      "bind() can only be called on the root Container — a child Container " +
      "(created by createScope()) inherits bindings from the parent, it does not define its own.",
    );
    this.name = "RootOnlyOperationError";
  }
}
