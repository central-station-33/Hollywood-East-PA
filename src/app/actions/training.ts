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

export async function setModuleProgress(moduleId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const mark = String(formData.get("mark") ?? "");

  const { error } =
    mark === "complete"
      ? await supabase
          .from("pa_module_progress")
          .upsert({ pa_id: user.id, module_id: moduleId, completed_at: new Date().toISOString() })
      : await supabase
          .from("pa_module_progress")
          .delete()
          .eq("pa_id", user.id)
          .eq("module_id", moduleId);

  revalidatePath("/pa/training");

  if (error) {
    redirect(`/pa/training?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/pa/training");
}
