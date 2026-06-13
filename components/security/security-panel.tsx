"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { describeError } from "@/components/security/queries";
import type { TelemtResult } from "@/lib/telemt/client";

/** Shared loading/error chrome for a security card; renders `children(data)` on success. */
export function SecurityPanel<T>({
  query,
  children,
}: {
  query: UseQueryResult<TelemtResult<T>, unknown>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (query.isError) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 p-6">
          <EmptyState title="Couldn't load this panel" description={describeError(query.error)} />
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return <>{children(query.data.data)}</>;
}
