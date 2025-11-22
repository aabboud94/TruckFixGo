import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (res.ok) return;

  const rawText = await res.text();
  let parsed: any = null;

  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Response body wasn't JSON; we'll fall back to the raw text
  }

  const message = parsed?.message || rawText || res.statusText;
  const error: any = new Error(message);
  error.status = res.status;
  error.response = {
    status: res.status,
    data: parsed ?? rawText ?? res.statusText,
  };

  throw error;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T>;

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T>;

export async function apiRequest<T = any>(
  arg1: string,
  arg2?: string | RequestInit,
  arg3?: unknown,
): Promise<T> {
  // Normalize arguments to support historical call patterns:
  // 1) apiRequest('POST', '/url', data)
  // 2) apiRequest('/url', 'POST', data)
  // 3) apiRequest('/url', { method: 'POST', body: ... })
  let method: string;
  let url: string;
  let data: unknown;
  let options: RequestInit | undefined;

  if (typeof arg2 === 'string') {
    // apiRequest('/url', 'POST', data) or apiRequest('POST', '/url', data)
    if (arg1.startsWith('/')) {
      url = arg1;
      method = arg2;
      data = arg3;
    } else {
      method = arg1;
      url = arg2;
      data = arg3;
    }
  } else if (typeof arg2 === 'object') {
    // apiRequest('/url', { ...fetchOptions })
    url = arg1;
    options = arg2;
    method = options.method || 'GET';
  } else {
    throw new Error('Invalid apiRequest arguments');
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include',
    ...options,
  };

  if (data !== undefined) {
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(url, fetchOptions);

  await throwIfResNotOk(res);
  
  // For DELETE requests, return true if successful (no body expected)
  if (method === "DELETE" && res.status === 204) {
    return true as T;
  }
  
  // Try to parse JSON, return empty object if no content
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // If response is not JSON, return the text
    return text as T;
  }
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
