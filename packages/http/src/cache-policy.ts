export interface CachePolicy {
  readonly public?: boolean;
  readonly maxAge?: number;
  readonly staleWhileRevalidate?: number;
  readonly mustRevalidate?: boolean;
  readonly noStore?: boolean;
}
