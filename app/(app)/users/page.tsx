import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";
import { UsersTable } from "@/components/users/users-table";
import type { UserInfo } from "@/lib/telemt/schemas/users";

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<T | null> {
  try {
    return (await p).data;
  } catch {
    return null;
  }
}

export default async function UsersPage() {
  const current = await getCurrentInstance();
  const users = await safe<UserInfo[]>(telemt.users.list(current.id));

  return <UsersTable instanceId={current.id} initialUsers={users ?? undefined} />;
}
