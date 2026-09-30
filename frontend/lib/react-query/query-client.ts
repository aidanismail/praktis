import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Do not retry on client errors (401, 403, 404, 422)
          if (
            error instanceof ApiError &&
            [401, 403, 404, 422].includes(error.status)
          ) {
            return false;
          }
          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
