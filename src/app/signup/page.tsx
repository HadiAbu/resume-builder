import { signupAction } from "@/actions/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export default async function SignupPage(props: PageProps<"/signup">) {
  const { error } = await props.searchParams;

  const res = await fetch(`${BACKEND_URL}/auth/setup-status`, { cache: "no-store" });
  const { needsSetup } = (await res.json()) as { needsSetup: boolean };

  if (!needsSetup) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-xl text-text">Owner account already exists</h1>
        <p className="text-muted">This deployment has already been set up.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-xl text-text">Create the owner account</h1>
      {error && (
        <p className="mb-4 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text">
          {error}
        </p>
      )}
      <form action={signupAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Display name
          <input
            name="displayName"
            type="text"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
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
            minLength={8}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90"
        >
          Create account
        </button>
      </form>
    </div>
  );
}
