import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let unreadCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Hollywood East <span className="text-indigo-600">PA</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          {!user && (
            <>
              <Link href="/login" className="hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
              >
                Get started
              </Link>
            </>
          )}
          {user && role === "pa" && (
            <>
              <Link href="/pa/dashboard" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/pa/onboarding" className="hover:text-slate-900">
                My Profile
              </Link>
            </>
          )}
          {user && role === "producer" && (
            <Link href="/producer/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
          )}
          {user && role === "admin" && (
            <Link href="/admin" className="hover:text-slate-900">
              Vetting Queue
            </Link>
          )}
          {user && (
            <Link href="/notifications" className="relative hover:text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          {user && (
            <form action={signOut}>
              <button type="submit" className="hover:text-slate-900">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
