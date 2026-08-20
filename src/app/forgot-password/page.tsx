import { requestPasswordReset } from "@/app/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {params.sent && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Check your email for a password reset link.
        </p>
      )}
      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      )}

      <form action={requestPasswordReset} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        <a href="/login" className="font-medium text-indigo-600">
          Back to log in
        </a>
      </p>
    </div>
  );
}
