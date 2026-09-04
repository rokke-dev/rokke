import { expect, test, describe } from "bun:test";
import { Entity, readEntityMetadata } from "../src/decorators";
import { Model, MissingEntityMetadataError } from "../src/model";
import { Repository } from "../src/repository";
import { SQL } from "bun";
describe("orm classes", () => {
  test("Model.query sin @Entity lanza MissingEntityMetadataError", () => {
    class User extends Model<User> {}
    expect(() => User.query()).toThrow(MissingEntityMetadataError);
  });
  test("Repository<User> resuelve tabla via @Entity", () => {
    @Entity("users")
    class User {}
    class UserRepository extends Repository<User> {
      constructor(sql: SQL) { super(sql, User); }
      get() { return this.query(); }
    }
    const sql = {} as SQL;
    const repo = new UserRepository(sql);
    expect(() => repo.get()).not.toThrow(MissingEntityMetadataError);
  });
});
