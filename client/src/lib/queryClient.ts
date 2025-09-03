import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log("apiRequest called with:", { method, url, dataType: data?.constructor?.name });
  
  let headers: Record<string, string> = {};
  let body: string | FormData | undefined;
  
  if (data) {
    if (data instanceof FormData) {
      console.log("Sending FormData, not setting Content-Type header");
      // Don't set Content-Type for FormData - browser will set it with boundary
      body = data;
    } else {
      console.log("Sending JSON data");
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  console.log("Making fetch request with headers:", headers);
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  console.log("Fetch response:", res.status, res.statusText);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
