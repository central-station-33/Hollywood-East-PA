import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Department, TrainingModule } from "@/lib/types/database";

export const metadata = {
  title: "Training & Union Pathways — Hollywood East PA",
  description:
    "Department-by-department training that takes a PA from set-ready to dept-head-endorsed to union-eligible.",
};

export default async function PublicTrainingPage() {
  const supabase = await createClient();

  const [{ data: departments }, { data: modules }] = await Promise.all([
    supabase.from("departments").select("*").order("sort_order"),
    supabase.from("training_modules").select("*").order("sort_order"),
  ]);

  const modulesByDept = new Map<string, TrainingModule[]>();
  for (const m of (modules ?? []) as TrainingModule[]) {
    const list = modulesByDept.get(m.department_id) ?? [];
    list.push(m);
    modulesByDept.set(m.department_id, list);
  }

  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
            The Path From PA to Union
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            A real training pipeline, department by department.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            PAs work through structured, department-specific training. Verified department heads —
            real Key Costumers, Gaffers, Location Managers, ADs — review that work and endorse
            PAs who are ready to shadow toward their department&apos;s union.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup?role=pa"
              className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start training as a PA
            </Link>
            <Link
              href="/signup?role=dept_head"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Apply as a Department Head
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="mb-3 text-sm font-semibold text-indigo-600">01</div>
            <h3 className="text-lg font-semibold text-slate-900">Train the department</h3>
            <p className="mt-2 text-sm text-slate-600">
              Each department has its own curriculum — foundations, hands-on practicum, and a
              dept-head shadow track — with a concrete skills checklist at every step.
            </p>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-indigo-600">02</div>
            <h3 className="text-lg font-semibold text-slate-900">Get endorsed</h3>
            <p className="mt-2 text-sm text-slate-600">
              Once training is complete, a verified department head — vetted by Hollywood East PA,
              working in that exact department — reviews the PA and issues an endorsement.
            </p>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-indigo-600">03</div>
            <h3 className="text-lg font-semibold text-slate-900">Move toward the union</h3>
            <p className="mt-2 text-sm text-slate-600">
              An endorsement is a credential the PA carries — a real department head&apos;s word
              that they&apos;re ready for the next step on that department&apos;s union path.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Departments</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
            Eight departments, each with its own curriculum and union path.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(departments ?? []).map((dept: Department) => {
              const deptModules = modulesByDept.get(dept.id) ?? [];
              return (
                <div key={dept.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{dept.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
                    Leads to: {dept.union_path}
                  </p>
                  <ol className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-700">
                    {deptModules.map((m, i) => (
                      <li key={m.id}>
                        {i + 1}. {m.title}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">For dept heads and unions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            This is a pipeline, not a shortcut — every endorsement carries a verified department
            head&apos;s name on it. If you head a department and want a hand in developing the
            next generation of your crew, or you represent a union interested in how this
            pipeline works, we&apos;d like to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup?role=dept_head"
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Apply as a Department Head
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
