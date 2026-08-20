import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateGig } from "@/app/actions/gigs";

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditGigPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: gig } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", id)
    .eq("producer_id", user.id)
    .maybeSingle();

  if (!gig) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Edit gig</h1>
      <p className="mt-1 text-sm text-slate-600">
        Any PA who already accepted will be notified that details changed.
      </p>

      {query.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{query.error}</p>
      )}

      <form action={updateGig.bind(null, gig.id)} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            name="title"
            required
            defaultValue={gig.title}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select
            name="role_type"
            required
            defaultValue={gig.role_type}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="set_pa">Set PA</option>
            <option value="office_pa">Office PA</option>
            <option value="coordinator">Coordinator</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">State</label>
          <select
            name="location_state"
            required
            defaultValue={gig.location_state}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="NY">New York</option>
            <option value="NJ">New Jersey</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Location detail</label>
          <input
            name="location_detail"
            defaultValue={gig.location_detail ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Call time</label>
          <input
            name="call_time"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(gig.call_time)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Headcount needed</label>
          <input
            name="headcount"
            type="number"
            min={1}
            defaultValue={gig.headcount}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Rate</label>
          <input
            name="rate_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={gig.rate_amount ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Rate unit</label>
          <select
            name="rate_unit"
            defaultValue={gig.rate_unit ?? "day"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="day">Per day</option>
            <option value="hour">Per hour</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={gig.description ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save changes
          </button>
          <a
            href="/producer/dashboard"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
