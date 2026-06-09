import { Hono } from "hono";
import { cors } from "hono/cors";
import { categories } from "@rentease/shared";

type Bindings = {
  DB: D1Database;
  ASSETS: R2Bucket;
  JWT_SECRET: string;
  MIDTRANS_SERVER_KEY: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "rentease-api",
  });
});

app.get("/categories", (c) => {
  return c.json({ data: categories });
});

export default app;
