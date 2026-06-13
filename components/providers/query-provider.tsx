"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";

function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 1 },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only surface background refetch failures — the initial load is
            // handled by each panel's own error/empty state.
            if (query.state.data === undefined) return;
            if (query.state.fetchFailureCount !== 1) return;
            toast.error(`Background refresh failed: ${describeError(error)}`);
          },
        }),
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
