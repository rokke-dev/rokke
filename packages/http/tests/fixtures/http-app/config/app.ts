const port = Number(Bun.env.ROKKE_HTTP_INTEGRATION_PORT);

export default {
  app: {
    name: "HTTP integration",
    env: "development" as const,
    debug: false,
  },
  http: {
    port,
    prefix: "/api",
  },
  discovery: {
    controllers: "src/**/*.controller.ts",
  },
};
