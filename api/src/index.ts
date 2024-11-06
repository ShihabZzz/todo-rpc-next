import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq } from "drizzle-orm";
import { prettyJSON } from "hono/pretty-json";
import { db } from "../connection";
import { usersTable, todosTable } from "./db/schema";
import {
  findUser,
  findByTodoID,
  hasInvalidkeys,
  titleValidation,
  statusValidation,
} from "../utils";

const app = new Hono()
  .use(prettyJSON())
  .use(
    "*",
    cors({
      origin: "http://localhost:3000",
      allowMethods: ["GET", "POST", "PUT", "DELETE"],
      allowHeaders: ["Content-Type"],
    }),
  )
  .get("/:user/todos", async (c) => {
    try {
      const user = c.req.param("user");
      const userExist = await findUser(user);
      if (!userExist) {
        await db.insert(usersTable).values({ user }).execute();
        // return c.json({ message: "User not found" }, 404);
      }
      const data = await db
        .select({
          id: todosTable.id,
          title: todosTable.title,
          status: todosTable.status,
          createdAt: todosTable.createdAt,
          updatedAt: todosTable.updatedAt,
        })
        .from(todosTable)
        .where(eq(todosTable.user, user));
      return c.json(data);
    } catch (error) {
      return c.json({ message: "Internal Server Error" }, 500);
    }
  })
  .get("/:user/todos/:id", async (c) => {
    try {
      const user = c.req.param("user");
      const id = c.req.param("id");
      const userExist = await findUser(user);
      const todoExist = await findByTodoID(id);
      if (!userExist || !todoExist) {
        return c.json({ message: "Todo not found" }, 404);
      }
      const data = await db
        .select({
          id: todosTable.id,
          title: todosTable.title,
          status: todosTable.status,
          createdAt: todosTable.createdAt,
          updatedAt: todosTable.updatedAt,
        })
        .from(todosTable)
        .where(eq(todosTable.id, id));
      return c.json(data);
    } catch (error) {
      return c.json({ message: "Internal Server Error" }, 500);
    }
  })
  .post("/:user/todos", async (c) => {
    try {
      const user = c.req.param("user");
      const body = await c.req.json();
      const bodyKeys = Object.keys(body);
      if (hasInvalidkeys(bodyKeys)) {
        return c.json(
          {
            message: "Invalid request body",
          },
          400,
        );
      }
      const titleValidationResult = titleValidation.safeParse(body.title);
      if (!titleValidationResult.success) {
        return c.json(
          { message: titleValidationResult.error.errors[0].message },
          400,
        );
      }
      const statusValidationResult = statusValidation.safeParse(body.status);
      if (!statusValidationResult.success) {
        return c.json(
          { message: statusValidationResult.error.errors[0].message },
          400,
        );
      }
      const todo = {
        title: body.title,
        id: crypto.randomUUID(),
        status: body.status || "todo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const userExist = await findUser(user);
      if (!userExist) {
        await db.insert(usersTable).values({ user }).execute();
      }
      await db
        .insert(todosTable)
        .values({ ...todo, user })
        .execute();
      return c.json({ message: "Todo created", todo }, 201);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({ message: "Failed to parse JSON" }, 400);
      }
      return c.json({ message: "Internal Server Error" }, 500);
    }
  })
  .put("/:user/todos/:id", async (c) => {
    try {
      const user = c.req.param("user");
      const id = c.req.param("id");
      const body = await c.req.json();
      const userExist = await findUser(user);
      const todoExist = await findByTodoID(id);
      if (!userExist || !todoExist) {
        return c.json({ message: "Todo not found" }, 404);
      }
      const bodyKeys = Object.keys(body);
      const validations = [
        {
          valid: !hasInvalidkeys(bodyKeys) && bodyKeys.length > 0,
          message: "Invalid request body",
        },
        {
          valid:
            !bodyKeys.includes("title") ||
            titleValidation.safeParse(body.title).success,
          message: titleValidation.safeParse(body.title).error?.errors[0]
            .message,
        },
        {
          valid: statusValidation.safeParse(body.status).success,
          message: statusValidation.safeParse(body.status).error?.errors[0]
            .message,
        },
      ];
      for (const validation of validations) {
        if (!validation.valid) {
          return c.json({ message: validation.message }, 400);
        }
      }
      const oldTodo = await db
        .select()
        .from(todosTable)
        .where(eq(todosTable.id, id));
      await db
        .update(todosTable)
        .set({
          ...oldTodo,
          ...body,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(todosTable.id, id))
        .execute();
      const todo = await db
        .select({
          id: todosTable.id,
          title: todosTable.title,
          status: todosTable.status,
          createdAt: todosTable.createdAt,
          updatedAt: todosTable.updatedAt,
        })
        .from(todosTable)
        .where(eq(todosTable.id, id));
      return c.json({ message: "Todo updated", todo }, 200);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({ message: "Failed to parse JSON" }, 400);
      }
      return c.json({ message: "Internal Server Error" }, 500);
    }
  })
  .delete("/:user/todos/:id", async (c) => {
    try {
      const user = c.req.param("user");
      const id = c.req.param("id");
      const userExist = await findUser(user);
      const todoExist = await findByTodoID(id);
      if (!userExist || !todoExist) {
        return c.json({ message: "Todo not found" }, 404);
      }
      await db.delete(todosTable).where(eq(todosTable.id, id)).execute();
      return c.json({ message: "Todo deleted successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Internal Server Error" }, 500);
    }
  })
  .delete("/:user/todos", async (c) => {
    try {
      const user = c.req.param("user");
      const userExist = await findUser(user);
      if (!userExist) {
        return c.json({ message: "User not found" }, 404);
      }
      await db.delete(todosTable).where(eq(todosTable.user, user)).execute();
      return c.json({ message: "All todos deleted successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Internal Server Error" }, 500);
    }
  });

export type appType = typeof app;
export default app;

const port = process.env.PORT ? +process.env.PORT : 4000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
