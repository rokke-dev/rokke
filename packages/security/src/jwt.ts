function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlDecode(str: string): string {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4) padded += "=";
  return atob(padded);
}
function base64urlDecodeBytes(str: string): Uint8Array {
  return Uint8Array.from(base64urlDecode(str), (character) => character.charCodeAt(0));
}
export interface JwtOptions {
  readonly secret: string;
  readonly expiresInSeconds?: number;
}
export class Jwt {
  private readonly options: JwtOptions;
  constructor(options: JwtOptions) { this.options = options; }
  async sign(payload: Record<string, unknown>): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + (this.options.expiresInSeconds ?? 3600);
    const body = { ...payload, exp };
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedBody = base64url(JSON.stringify(body));
    const signature = await this.#sign(`${encodedHeader}.${encodedBody}`);
    return `${encodedHeader}.${encodedBody}.${signature}`;
  }
  async verify(token: string): Promise<Record<string, unknown>> {
    const [encodedHeader, encodedBody, signature] = token.split(".");
    if (!encodedHeader || !encodedBody || !signature) throw new InvalidTokenError("formato invalido");
    try {
      const key = await this.#key(["verify"]);
      const signatureBytes = base64urlDecodeBytes(signature);
      const signatureBuffer = signatureBytes.buffer.slice(
        signatureBytes.byteOffset,
        signatureBytes.byteOffset + signatureBytes.byteLength,
      ) as ArrayBuffer;
      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBuffer,
        new TextEncoder().encode(`${encodedHeader}.${encodedBody}`),
      );
      if (!valid) throw new InvalidTokenError("firma invalida");
      const body = JSON.parse(base64urlDecode(encodedBody)) as Record<string, unknown>;
      if (typeof body.exp === "number" && body.exp <= Math.floor(Date.now() / 1000)) throw new InvalidTokenError("token expirado");
      return body;
    } catch (error) {
      if (error instanceof InvalidTokenError) throw error;
      throw new InvalidTokenError("contenido invalido");
    }
  }
  async #sign(data: string): Promise<string> {
    const key = await this.#key(["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    return base64url(String.fromCharCode(...new Uint8Array(signature)));
  }
  #key(usages: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.options.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      usages,
    );
  }
}
export class InvalidTokenError extends Error {
  public readonly reason: string;
  constructor(reason: string) {
    super(`Token invalido: ${reason}`);
    this.name = "InvalidTokenError";
    this.reason = reason;
  }
}
