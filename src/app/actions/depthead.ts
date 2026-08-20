"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateDeptHeadProfile(formData: FormData) {
  const { supabase } = await requireUser();

  const departmentId = String(formData.get("department_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const company = String(formData.get("company") ?? "");
  const unionAffiliation = String(formData.get("union_affiliation") ?? "");
  const bio = String(formData.get("bio") ?? "");

  const { error } = await supabase.rpc("upsert_dept_head_profile", {
    p_department_id: departmentId || null,
    p_title: title || null,
    p_company: company || null,
    p_union_affiliation: unionAffiliation || null,
    p_bio: bio || null,
  });

  if (error) {
    redirect(`/depthead/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/depthead/onboarding");
  revalidatePath("/depthead/dashboard");
  redirect("/depthead/onboarding?saved=1");
}

export async function issueEndorsement(paId: string, departmentId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const note = String(formData.get("note") ?? "");

  const { error } = await supabase.rpc("issue_endorsement", {
    p_pa_id: paId,
    p_department_id: departmentId,
    p_note: note,
  });

  revalidatePath("/depthead/dashboard");

  if (error) {
    redirect(`/depthead/dashboard?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/depthead/dashboard?endorsed=1");
}
