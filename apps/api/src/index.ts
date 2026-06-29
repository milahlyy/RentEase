import { Hono } from "hono";
import { cors } from "hono/cors";
import { categories } from "@rentease/shared";
import { adminRoute } from "./admin";
import { auth, success, type Bindings } from "./auth";
import { bookingsRoute } from "./bookings";
import { conversationsRoute } from "./conversations";
import { listingsRoute } from "./listings";
import { uploadsRoute } from "./uploads";

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

app.get("/assets/*", async (c) => {
  const key = c.req.path.replace(/^\/assets\//, "");

  if (!key || key.includes("..")) {
    return c.json({ success: false, error: "Asset tidak valid" }, 400);
  }

  const object = await c.env.ASSETS.get(key);

  if (!object) {
    return c.json({ success: false, error: "Asset tidak ditemukan" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

app.route("/auth", auth);
app.route("/admin", adminRoute);
app.route("/listings", listingsRoute);
app.route("/bookings", bookingsRoute);
app.route("/conversations", conversationsRoute);
app.route("/uploads", uploadsRoute);

export default app;
