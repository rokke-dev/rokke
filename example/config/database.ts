export default {
  database: {
    url: Bun.env.DATABASE_URL ?? "sqlite://example.sqlite"
  }
};
