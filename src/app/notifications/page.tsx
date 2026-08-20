import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  const rows = notifications ?? [];
  const unreadCount = rows.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="text-sm font-medium text-indigo-600">
              Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-slate-500">Nothing here yet.</p>
        )}
        {rows.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${
              n.read_at ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50"
            }`}
          >
            <div>
              <p className="text-sm text-slate-800">{n.message}</p>
              <p className="mt-1 text-xs text-slate-500">{formatTime(n.created_at)}</p>
            </div>
            {!n.read_at && (
              <form action={markNotificationRead.bind(null, n.id)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Mark read
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
