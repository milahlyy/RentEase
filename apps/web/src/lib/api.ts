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
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok && json.success) {
      return { success: false, error: "Request gagal diproses" };
    }

    return json;
  } catch {
    return { success: false, error: "API belum bisa dihubungi" };
  }
}
