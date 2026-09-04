import { Controller, Delete, Get, HttpRequestContext, InputValidationError, Post, Put } from "@rokke/http";
import { SqlToken } from "@rokke/orm";
import { Schema } from "@rokke/validation";
import { authenticatedUser } from "./auth";
import { Task } from "./task.model";

const taskInput = Schema.object({
  title: Schema.string().minLength(1),
  description: Schema.string(),
  completed: Schema.boolean(),
});

function presentTask(task: Task) {
  return { ...task, completed: Boolean(task.completed) };
}

function taskId(ctx: HttpRequestContext): number | null {
  const id = Number(ctx.params.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

@Controller("/tasks")
export class TasksController {
  @Get("")
  async index(ctx: HttpRequestContext): Promise<Response> {
    const user = await authenticatedUser(ctx);
    if (!user) return ctx.json({ error: "No autorizado" }, 401);
    const tasks = await Task.query().where("ownerId", "=", user.id).orderBy("id", "desc").toList();
    return ctx.json({ data: tasks.map(presentTask) });
  }

  @Post("")
  async create(ctx: HttpRequestContext): Promise<Response> {
    const user = await authenticatedUser(ctx);
    if (!user) return ctx.json({ error: "No autorizado" }, 401);
    try {
      const input = await ctx.input(taskInput);
      const now = new Date().toISOString();
      const sql = ctx.container.get(SqlToken);
      const rows = await sql.unsafe(
        `INSERT INTO tasks (ownerId, title, description, completed, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, ownerId, title, description, completed, createdAt, updatedAt`,
        [user.id, input.title, input.description, input.completed ? 1 : 0, now, now],
      ) as Task[];
      const task = rows[0];
      if (!task) throw new Error("SQLite did not return the created task");
      return ctx.created(`/tasks/${task.id}`, { data: presentTask(task) });
    } catch (error) {
      if (error instanceof InputValidationError) return ctx.json({ error: "Datos inválidos", issues: error.errors }, 422);
      throw error;
    }
  }

  @Get("/:id")
  async show(ctx: HttpRequestContext): Promise<Response> {
    const user = await authenticatedUser(ctx);
    if (!user) return ctx.json({ error: "No autorizado" }, 401);
    const id = taskId(ctx);
    if (!id) return ctx.json({ error: "Identificador inválido" }, 400);
    const task = await Task.query().where("id", "=", id).andWhere("ownerId", "=", user.id).first();
    return task ? ctx.json({ data: presentTask(task) }) : ctx.json({ error: "Tarea no encontrada" }, 404);
  }

  @Put("/:id")
  async update(ctx: HttpRequestContext): Promise<Response> {
    const user = await authenticatedUser(ctx);
    if (!user) return ctx.json({ error: "No autorizado" }, 401);
    const id = taskId(ctx);
    if (!id) return ctx.json({ error: "Identificador inválido" }, 400);
    try {
      const input = await ctx.input(taskInput);
      const sql = ctx.container.get(SqlToken);
      const rows = await sql.unsafe(
        `UPDATE tasks SET title = $1, description = $2, completed = $3, updatedAt = $4
         WHERE id = $5 AND ownerId = $6
         RETURNING id, ownerId, title, description, completed, createdAt, updatedAt`,
        [input.title, input.description, input.completed ? 1 : 0, new Date().toISOString(), id, user.id],
      ) as Task[];
      const task = rows[0];
      return task ? ctx.json({ data: presentTask(task) }) : ctx.json({ error: "Tarea no encontrada" }, 404);
    } catch (error) {
      if (error instanceof InputValidationError) return ctx.json({ error: "Datos inválidos", issues: error.errors }, 422);
      throw error;
    }
  }

  @Delete("/:id")
  async destroy(ctx: HttpRequestContext): Promise<Response> {
    const user = await authenticatedUser(ctx);
    if (!user) return ctx.json({ error: "No autorizado" }, 401);
    const id = taskId(ctx);
    if (!id) return ctx.json({ error: "Identificador inválido" }, 400);
    const sql = ctx.container.get(SqlToken);
    const rows = await sql.unsafe("DELETE FROM tasks WHERE id = $1 AND ownerId = $2 RETURNING id", [id, user.id]) as Array<{ id: number }>;
    return rows[0] ? ctx.noContent() : ctx.json({ error: "Tarea no encontrada" }, 404);
  }
}
