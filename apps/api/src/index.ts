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
  ALLOWED_ORIGINS?: string;
  MIDTRANS_SERVER_KEY: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: AppBindings }>();
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://rentease.milahly.top",
];

function getAllowedOrigins(value?: string) {
  const configured =
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  return new Set([...defaultAllowedOrigins, ...configured]);
}

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (!origin) {
        return null;
      }

      return getAllowedOrigins(c.env.ALLOWED_ORIGINS).has(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
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
