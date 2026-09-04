export function secureHeadersMiddleware(): import("@rokke/http").Middleware {
  return {
    async handle(ctx, next) {
      const response = await next();
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      return response;
    },
  };
}