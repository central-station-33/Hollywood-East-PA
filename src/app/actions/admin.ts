"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setDeptHeadVerified(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const deptHeadId = String(formData.get("dept_head_id") ?? "");
  const verified = formData.get("verified") === "true";
  const notes = String(formData.get("notes") ?? "");

  const { error } = await supabase
    .from("dept_head_profiles")
    .update({ verified, admin_notes: notes || null })
    .eq("profile_id", deptHeadId);

  revalidatePath("/admin");

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin?updated=1");
}
