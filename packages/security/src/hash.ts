export const Hash = {
  async make(password: string): Promise<string> {
    return Bun.password.hash(password);
  },
  async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  },
};