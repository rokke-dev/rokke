export interface Principal {
  readonly id: string;
  readonly roles: readonly string[];
  hasRole(role: string): boolean;
  hasAuthority(authority: string): boolean;
}