export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (headers.get("Authorization") === "Bearer cookie-session") {
      headers.delete("Authorization");
    }

    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok && json.success) {
      return { success: false, error: "Permintaan gagal diproses" };
    }

    return json;
  } catch {
    return { success: false, error: "API belum bisa dihubungi" };
  }
}
