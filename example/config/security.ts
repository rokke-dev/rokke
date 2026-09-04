export default {
  jwt: {
    secret: Bun.env.JWT_SECRET ?? crypto.randomUUID(),
    expiresInSeconds: 3600
  }
};
