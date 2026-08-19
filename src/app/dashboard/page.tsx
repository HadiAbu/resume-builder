import { signOutAction } from "@/actions/auth";
import { requireCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-xl capitalize text-text">Welcome, {user.displayName}</h1>
      <p className="mb-6 text-muted">{user.email}</p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-surface-hover"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
