import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { issueEndorsement } from "@/app/actions/depthead";
import type { Profile } from "@/lib/types/database";

type ProgressRow = {
  pa_id: string;
  module_id: string;
  completed_at: string | null;
  profiles: Pick<Profile, "full_name" | "phone"> | null;
};

export default async function DeptHeadDashboardPage({
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

  const { data: deptHead } = await supabase
    .from("dept_head_profiles")
    .select("*, departments(name)")
    .eq("profile_id", user.id)
    .maybeSingle();

  const departmentName = (deptHead?.departments as unknown as { name: string } | null)?.name;

  if (!deptHead) redirect("/depthead/onboarding");

  if (!deptHead.verified || !deptHead.department_id) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Department Head Dashboard</h1>
        <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {!deptHead.department_id
            ? "Select a department on your profile to continue."
            : `Your profile is pending admin verification. Once verified, you'll be able to review PAs training in ${departmentName ?? "your department"} and issue endorsements.`}
        </div>
        <Link href="/depthead/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600">
          Edit my profile
        </Link>
      </div>
    );
  }

  const departmentId = deptHead.department_id;

  const { data: modules } = await supabase
    .from("training_modules")
    .select("id")
    .eq("department_id", departmentId);

  const moduleIds = (modules ?? []).map((m) => m.id);
  const totalModules = moduleIds.length;

  const [{ data: progressRows }, { data: endorsements }] = await Promise.all([
    moduleIds.length
      ? supabase
          .from("pa_module_progress")
          .select("pa_id, module_id, completed_at, profiles(full_name, phone)")
          .in("module_id", moduleIds)
          .not("completed_at", "is", null)
      : Promise.resolve({ data: [] as ProgressRow[] }),
    supabase
      .from("endorsements")
      .select("pa_id")
      .eq("dept_head_id", user.id)
      .eq("department_id", departmentId),
  ]);

  const endorsedPaIds = new Set((endorsements ?? []).map((e) => e.pa_id));

  const roster = new Map<
    string,
    { name: string; phone: string | null; completedCount: number }
  >();
  for (const row of (progressRows ?? []) as unknown as ProgressRow[]) {
    const existing = roster.get(row.pa_id);
    if (existing) {
      existing.completedCount += 1;
    } else {
      roster.set(row.pa_id, {
        name: row.profiles?.full_name ?? "PA",
        phone: row.profiles?.phone ?? null,
        completedCount: 1,
      });
    }
  }

  const rosterList = Array.from(roster.entries()).sort(
    (a, b) => b[1].completedCount - a[1].completedCount
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Department Head Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Verified for <strong>{departmentName}</strong>. PAs below have logged progress in your
        department&apos;s training modules.
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      )}
      {params.endorsed && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Endorsement sent.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {rosterList.length === 0 && (
          <p className="text-sm text-slate-500">
            No PAs have started training in {departmentName} yet.
          </p>
        )}
        {rosterList.map(([paId, pa]) => {
          const readyForEndorsement = totalModules > 0 && pa.completedCount >= totalModules;
          const alreadyEndorsed = endorsedPaIds.has(paId);

          return (
            <div key={paId} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{pa.name}</p>
                  {pa.phone && <p className="text-sm text-slate-500">{pa.phone}</p>}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    readyForEndorsement
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {pa.completedCount} of {totalModules} modules
                </span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                {alreadyEndorsed ? (
                  <span className="text-sm font-medium text-emerald-700">✓ Endorsed</span>
                ) : readyForEndorsement ? (
                  <form
                    action={issueEndorsement.bind(null, paId, departmentId)}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="note"
                      placeholder="Optional note for this PA"
                      className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Endorse
                    </button>
                  </form>
                ) : (
                  <span className="text-sm text-slate-500">
                    Not yet finished with all modules in this department.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
