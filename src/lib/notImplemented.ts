/** A stub for an endpoint that is specified (docs/architecture/gateway) but not ported yet. Throws, never silently resolves. */
export class NotImplemented extends Error {
  constructor(public endpoint: string) {
    super(`Not implemented: ${endpoint}`);
    this.name = 'NotImplemented';
  }
}
export const notImplemented = (endpoint: string): never => {
  throw new NotImplemented(endpoint);
};
