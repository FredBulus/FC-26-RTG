import { Lock } from "lucide-react";
import { login } from "@/app/admin/actions";
import { PageTitle } from "@/components/page-title";

const errors: Record<string, string> = {
  missing: "Enter an email and password.",
  invalid: "Those login details were not accepted.",
  unauthorized: "That account is not registered as an admin."
};

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const message = searchParams.error ? errors[searchParams.error] : null;

  return (
    <div className="mx-auto max-w-md">
      <PageTitle eyebrow="Admin" title="Secure Login">
        Tournament management is restricted to approved admins.
      </PageTitle>
      <form action={login} className="rounded-md border border-line bg-white p-5 shadow-glow">
        {message ? (
          <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {message}
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm font-black text-ink/70">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-line bg-pitch px-3 py-3 text-ink"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-black text-ink/70">Password</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded border border-line bg-pitch px-3 py-3 text-ink"
          />
        </label>
        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-black text-white transition hover:bg-gold"
        >
          <Lock size={18} />
          Login
        </button>
      </form>
    </div>
  );
}
