export class HttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    // If a message isn’t provided, generate a default one.
    super(message || `HTTP Error: ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;

    // Maintain proper prototype chain for instances of this class.
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture the stack trace (if supported in the current environment).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
