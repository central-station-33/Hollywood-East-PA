import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateDeptHeadProfile } from "@/app/actions/depthead";

export default async function DeptHeadOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "dept_head") redirect("/");

  const [{ data: deptHead }, { data: departments }] = await Promise.all([
    supabase.from("dept_head_profiles").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase.from("departments").select("*").order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">My Department Head Profile</h1>

      <div
        className={`mt-4 rounded-md px-4 py-3 text-sm font-medium ${
          deptHead?.verified
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {deptHead?.verified
          ? "You're verified — you can review PAs training in your department and issue endorsements."
          : deptHead
            ? "Profile submitted — pending admin verification before you can issue endorsements."
            : "Fill out your profile below to apply for department-head verification."}
      </div>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      )}
      {params.saved && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profile saved.
        </p>
      )}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <form action={updateDeptHeadProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Department</label>
            <select
              name="department_id"
              required
              defaultValue={deptHead?.department_id ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select the department you head
              </option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              name="title"
              placeholder="Key Costumer, Gaffer, Location Manager…"
              defaultValue={deptHead?.title ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Company / production</label>
            <input
              name="company"
              defaultValue={deptHead?.company ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Union affiliation</label>
            <input
              name="union_affiliation"
              placeholder="IATSE Local 52, DGA, Teamsters Local 817…"
              defaultValue={deptHead?.union_affiliation ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Bio</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Credits, years in the department, what you look for in a PA who's ready to move up."
              defaultValue={deptHead?.bio ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save profile
          </button>
        </form>
      </section>
    </div>
  );
}
