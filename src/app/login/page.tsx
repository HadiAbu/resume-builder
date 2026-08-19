import Link from "next/link";

import { loginAction } from "@/actions/auth";
import { BACKEND_URL } from "@/lib/backend";

export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;

  const res = await fetch(`${BACKEND_URL}/auth/setup-status`, { cache: "no-store" });
  const { needsSetup } = (await res.json()) as { needsSetup: boolean };

  if (needsSetup) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-xl text-text">No owner account yet</h1>
        <p className="text-muted">
          This deployment hasn&apos;t been set up. Go to{" "}
          <Link href="/signup" className="text-accent hover:underline">
            /signup
          </Link>{" "}
          to create the owner account first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-xl text-text">Sign in</h1>
      {error && (
        <p className="mb-4 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text">
          {error}
        </p>
      )}
      <form action={loginAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
