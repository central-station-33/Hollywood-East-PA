import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setTaxResidencyStatus, getTaxDocUrl, setDeptHeadVerified } from "@/app/actions/admin";
import type { DeptHeadProfile, PaProfile, Profile } from "@/lib/types/database";

const STATUS_STYLES: Record<string, string> = {
  unsubmitted: "bg-slate-100 text-slate-500",
  pending: "bg-amber-50 text-amber-800",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

type PaRow = PaProfile & { profiles: Pick<Profile, "full_name" | "phone"> | null };
type DeptHeadRow = DeptHeadProfile & {
  profiles: Pick<Profile, "full_name" | "phone" | "email"> | null;
  departments: { name: string } | null;
};

export default async function AdminPage({
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
  if (profile?.role !== "admin") redirect("/");

  const [{ data: paProfiles }, { data: deptHeadProfiles }] = await Promise.all([
    supabase
      .from("pa_profiles")
      .select("*, profiles(full_name, phone)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("dept_head_profiles")
      .select("*, profiles(full_name, phone, email), departments(name)")
      .order("updated_at", { ascending: false }),
  ]);

  const rows = (paProfiles ?? []) as unknown as PaRow[];
  const deptHeadRows = (deptHeadProfiles ?? []) as unknown as DeptHeadRow[];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">PA vetting queue</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review uploaded tax-residency documentation and mark PAs verified before they become
        dispatch-eligible.
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      )}
      {params.updated && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Updated.</p>
      )}

      <div className="mt-6 space-y-4">
        {rows.length === 0 && <p className="text-sm text-slate-500">No PA profiles yet.</p>}
        {rows.map((pa) => (
          <PaVettingRow key={pa.profile_id} pa={pa} />
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">Department head verification</h2>
      <p className="mt-1 text-sm text-slate-600">
        Verify that an applicant genuinely works in the department they claim before they can
        endorse PAs.
      </p>

      <div className="mt-6 space-y-4">
        {deptHeadRows.length === 0 && (
          <p className="text-sm text-slate-500">No department head applicants yet.</p>
        )}
        {deptHeadRows.map((dh) => (
          <DeptHeadVettingRow key={dh.profile_id} dh={dh} />
        ))}
      </div>
    </div>
  );
}

function DeptHeadVettingRow({ dh }: { dh: DeptHeadRow }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{dh.profiles?.full_name ?? "Dept Head"}</p>
          <p className="text-sm text-slate-600">
            {dh.departments?.name ?? "No department set"}
            {dh.title ? ` · ${dh.title}` : ""}
            {dh.company ? ` · ${dh.company}` : ""}
          </p>
          {dh.union_affiliation && (
            <p className="text-sm text-slate-500">Union: {dh.union_affiliation}</p>
          )}
          {dh.profiles?.email && <p className="text-sm text-slate-500">{dh.profiles.email}</p>}
          {dh.profiles?.phone && <p className="text-sm text-slate-500">{dh.profiles.phone}</p>}
          {dh.bio && <p className="mt-1 text-sm text-slate-600">{dh.bio}</p>}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            dh.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          {dh.verified ? "verified" : "pending"}
        </span>
      </div>

      <form action={setDeptHeadVerified} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="dept_head_id" value={dh.profile_id} />
        <input
          name="notes"
          placeholder="Optional note"
          defaultValue={dh.admin_notes ?? ""}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          name="verified"
          value="true"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Verify
        </button>
        <button
          type="submit"
          name="verified"
          value="false"
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
        >
          Revoke
        </button>
      </form>
    </div>
  );
}

async function PaVettingRow({ pa }: { pa: PaRow }) {
  const docUrl = pa.tax_residency_doc_path ? await getTaxDocUrl(pa.tax_residency_doc_path) : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{pa.profiles?.full_name ?? "PA"}</p>
          <p className="text-sm text-slate-600">
            {pa.home_state ?? "No state set"} · {pa.role_types?.join(", ") || "No roles set"} ·
            Course: {pa.course_completed_at ? `Passed (${pa.course_score}%)` : "Not passed"}
          </p>
          {pa.profiles?.phone && <p className="text-sm text-slate-500">{pa.profiles.phone}</p>}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[pa.tax_residency_status]}`}
        >
          {pa.tax_residency_status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
        {docUrl ? (
          <a href={docUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600">
            View uploaded document
          </a>
        ) : (
          <span className="text-sm text-slate-400">No document uploaded</span>
        )}
      </div>

      <form action={setTaxResidencyStatus} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="pa_id" value={pa.profile_id} />
        <input
          name="notes"
          placeholder="Optional note"
          defaultValue={pa.admin_notes ?? ""}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          name="status"
          value="verified"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Verify
        </button>
        <button
          type="submit"
          name="status"
          value="rejected"
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
        >
          Reject
        </button>
      </form>
    </div>
  );
}
