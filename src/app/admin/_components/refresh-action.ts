"use server";

import { requireAdmin } from "@/lib/admin";
import { invalidateCore } from "@/lib/admin-console/data";

/** Drops the cached console data so the next render reads the database again. */
export async function refreshConsoleData(): Promise<void> {
  if (!(await requireAdmin())) return;
  invalidateCore();
}
