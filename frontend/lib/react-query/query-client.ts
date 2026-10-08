import {
  MutationCache,
  QueryCache,
  QueryClient
} from "@tanstack/react-query";
import { authQueryKeys } from "@/features/auth/constants/auth-query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "../api/client";

export const LOGIN_MUTATION_KEY = ["auth", "login"] as const;

const PASSWORD_CHANGE_REQUIRED = "Password change required";

let isRedirectingToLogin = false;

function handleGlobalApiError(
  error: unknown,
  client: () => QueryClient,
  options: { isLoginRequest?: boolean; isCurrentUserQuery?: boolean } = {}
) {
  if (!(error instanceof ApiError)) return;

  if (error.status === 401) {
    if (options.isLoginRequest) return;
    if (typeof window === "undefined" || isRedirectingToLogin) return;
    if (window.location.pathname === ROUTES.login) return;

    isRedirectingToLogin = true;
    const queryClient = client();
    void queryClient
      .cancelQueries()
      .catch(() => undefined)
      .then(() => {
        queryClient.clear();
        useAuthStore.getState().clearAuth();
        window.location.replace(ROUTES.login);
      });
    return;
  }

  if (
    error.status === 403 &&
    error.message === PASSWORD_CHANGE_REQUIRED &&
    !options.isCurrentUserQuery
  ) {
    void client().invalidateQueries({ queryKey: authQueryKeys.currentUser() });
  }
}

export function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) =>
        handleGlobalApiError(error, () => queryClient, {
          isCurrentUserQuery: query.queryKey[0] === authQueryKeys.all[0]
        })
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        handleGlobalApiError(error, () => queryClient, {
          isLoginRequest: mutation.options.mutationKey?.[1] === "login"
        })
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
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

  return queryClient;
}
