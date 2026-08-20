import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setModuleProgress } from "@/app/actions/training";
import type { Department, TrainingModule } from "@/lib/types/database";

export default async function PaTrainingPage({
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
  if (profile?.role !== "pa") redirect("/");

  const [{ data: departments }, { data: modules }, { data: progress }, { data: endorsements }] =
    await Promise.all([
      supabase.from("departments").select("*").order("sort_order"),
      supabase.from("training_modules").select("*").order("sort_order"),
      supabase.from("pa_module_progress").select("module_id, completed_at").eq("pa_id", user.id),
      supabase
        .from("endorsements")
        .select("*, departments(name), dept_head_profiles(title, profiles(full_name))")
        .eq("pa_id", user.id),
    ]);

  const completedModuleIds = new Set(
    (progress ?? []).filter((p) => p.completed_at).map((p) => p.module_id)
  );

  const modulesByDept = new Map<string, TrainingModule[]>();
  for (const m of (modules ?? []) as TrainingModule[]) {
    const list = modulesByDept.get(m.department_id) ?? [];
    list.push(m);
    modulesByDept.set(m.department_id, list);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Training</h1>
      <p className="mt-1 text-sm text-slate-600">
        Work through a department&apos;s modules, then a verified department head can endorse
        you as ready for the next step toward that department&apos;s union.
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      )}

      {(endorsements ?? []).length > 0 && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-emerald-800">Your endorsements</h2>
          <ul className="mt-2 space-y-2">
            {(endorsements ?? []).map((e) => {
              const dept = e.departments as unknown as { name: string } | null;
              const head = e.dept_head_profiles as unknown as {
                title: string | null;
                profiles: { full_name: string } | null;
              } | null;
              return (
                <li key={e.id} className="text-sm text-emerald-900">
                  <strong>{dept?.name}</strong> — endorsed by {head?.profiles?.full_name ?? "a department head"}
                  {head?.title ? ` (${head.title})` : ""}
                  {e.note && <span className="block text-emerald-800">&ldquo;{e.note}&rdquo;</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-6">
        {(departments ?? []).map((dept: Department) => {
          const deptModules = modulesByDept.get(dept.id) ?? [];
          const completedCount = deptModules.filter((m) => completedModuleIds.has(m.id)).length;

          return (
            <section key={dept.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{dept.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{dept.description}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
                    Leads to: {dept.union_path}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {completedCount} of {deptModules.length} complete
                </span>
              </div>

              <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {deptModules.map((m) => {
                  const done = completedModuleIds.has(m.id);
                  return (
                    <li key={m.id} className="rounded-md border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {m.title}
                            {m.estimated_hours && (
                              <span className="ml-2 font-normal text-slate-400">
                                ~{m.estimated_hours} hrs
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                          <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                            {m.skills.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <form action={setModuleProgress.bind(null, m.id)} className="shrink-0">
                          <input type="hidden" name="mark" value={done ? "incomplete" : "complete"} />
                          <button
                            type="submit"
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                              done
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {done ? "✓ Completed" : "Mark complete"}
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
