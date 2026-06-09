import { Hono } from "hono";
import { cors } from "hono/cors";
import { categories } from "@rentease/shared";
import { auth, success, type Bindings } from "./auth";
import { listingsRoute } from "./listings";

type AppBindings = Bindings & {
  ASSETS: R2Bucket;
  MIDTRANS_SERVER_KEY: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: AppBindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/health", (c) => {
  return c.json(success({ service: "rentease-api" }));
});

app.get("/categories", (c) => {
  return c.json(success({ categories }));
});

app.route("/auth", auth);
app.route("/listings", listingsRoute);

export default app;
