import type { StoreErrorShape } from "./types";

export class StoreError extends Error implements StoreErrorShape {
  readonly error: StoreErrorShape["error"];

  constructor(code: string, message: string) {
    super(message);
    this.name = "StoreError";
    this.error = { code, message };
  }
}
