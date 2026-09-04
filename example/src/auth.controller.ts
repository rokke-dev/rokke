import { Controller, Get, HttpRequestContext, InputValidationError, Post } from "@rokke/http";
import { SqlToken } from "@rokke/orm";
import { Hash } from "@rokke/security";
import { Schema } from "@rokke/validation";
import { authenticatedUser, jwt } from "./auth";
import { User } from "./user.model";

const credentials = Schema.object({
  username: Schema.string().minLength(3),
  password: Schema.string().minLength(8),
});

@Controller("/auth")
export class AuthController {
  @Post("/register")
  async register(ctx: HttpRequestContext): Promise<Response> {
    try {
      const input = await ctx.input(credentials);
      const existing = await User.query().where("username", "=", input.username).first();
      if (existing) return ctx.json({ error: "El usuario ya existe" }, 409);

      const sql = ctx.container.get(SqlToken);
      const passwordHash = await Hash.make(input.password);
      const rows = await sql.unsafe(
        "INSERT INTO users (username, passwordHash) VALUES ($1, $2) RETURNING id, username",
        [input.username, passwordHash],
      ) as Array<{ id: number; username: string }>;
      const user = rows[0];
      if (!user) throw new Error("SQLite did not return the registered user");
      return ctx.created(`/users/${user.id}`, { data: user });
    } catch (error) {
      if (error instanceof InputValidationError) return ctx.json({ error: "Datos inválidos", issues: error.errors }, 422);
      throw error;
    }
  }

  @Post("/login")
  async login(ctx: HttpRequestContext): Promise<Response> {
    try {
      const input = await ctx.input(credentials);
      const user = await User.query().where("username", "=", input.username).first();
      if (!user || !(await Hash.verify(input.password, user.passwordHash))) {
        return ctx.json({ error: "Credenciales inválidas" }, 401);
      }
      const token = await jwt.sign({ sub: user.id, username: user.username });
      return ctx.json({ token, tokenType: "Bearer", expiresIn: 3600 });
    } catch (error) {
      if (error instanceof InputValidationError) return ctx.json({ error: "Datos inválidos", issues: error.errors }, 422);
      throw error;
    }
  }

  @Get("/me")
  async me(ctx: HttpRequestContext): Promise<Response> {
    const principal = await authenticatedUser(ctx);
    if (!principal) return ctx.json({ error: "No autorizado" }, 401);
    const user = await User.query().where("id", "=", principal.id).first();
    return user
      ? ctx.json({ data: { id: user.id, username: user.username } })
      : ctx.json({ error: "No autorizado" }, 401);
  }
}
