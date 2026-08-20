"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendGigAcceptedEmail, sendGigInviteEmail } from "@/lib/email";
import type { LocationState, RateUnit, RoleType } from "@/lib/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createGig(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "");
  const roleType = String(formData.get("role_type") ?? "") as RoleType;
  const locationState = String(formData.get("location_state") ?? "") as LocationState;
  const locationDetail = String(formData.get("location_detail") ?? "");
  const callTime = String(formData.get("call_time") ?? "");
  const rateAmount = formData.get("rate_amount") ? Number(formData.get("rate_amount")) : null;
  const rateUnit = String(formData.get("rate_unit") ?? "") as RateUnit;
  const headcount = Number(formData.get("headcount") ?? 1);
  const description = String(formData.get("description") ?? "");

  const { data: gig, error } = await supabase
    .from("gigs")
    .insert({
      producer_id: user.id,
      title,
      role_type: roleType,
      location_state: locationState,
      location_detail: locationDetail || null,
      call_time: callTime ? new Date(callTime).toISOString() : new Date().toISOString(),
      rate_amount: rateAmount,
      rate_unit: rateUnit || null,
      headcount: Number.isFinite(headcount) && headcount > 0 ? headcount : 1,
      description: description || null,
    })
    .select("id")
    .single();

  if (error || !gig) {
    redirect(`/producer/dashboard?error=${encodeURIComponent(error?.message ?? "Could not create gig")}`);
  }

  const { error: dispatchError } = await supabase.rpc("dispatch_gig_to_matches", {
    p_gig_id: gig.id,
  });

  if (!dispatchError) {
    const { data: invited } = await supabase
      .from("dispatches")
      .select("profiles(full_name, email)")
      .eq("gig_id", gig.id)
      .eq("status", "invited");

    await Promise.allSettled(
      (invited ?? []).map((row) => {
        const pa = row.profiles as unknown as { full_name: string; email: string } | null;
        if (!pa) return Promise.resolve();
        return sendGigInviteEmail({
          to: pa.email,
          paName: pa.full_name,
          gigTitle: title,
          locationState,
          locationDetail: locationDetail || null,
          callTime,
        });
      })
    );
  }

  revalidatePath("/producer/dashboard");

  if (dispatchError) {
    redirect(
      `/producer/dashboard?warning=${encodeURIComponent(
        `Gig created but auto-dispatch failed: ${dispatchError.message}`
      )}`
    );
  }

  redirect("/producer/dashboard?created=1");
}

export async function acceptDispatch(dispatchId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("accept_dispatch", { p_dispatch_id: dispatchId });

  if (!error) {
    const { data: dispatch } = await supabase
      .from("dispatches")
      .select("gig_id")
      .eq("id", dispatchId)
      .single();

    if (dispatch) {
      const [{ data: gig }, { data: paProfile }, { count: filledCount }] = await Promise.all([
        supabase.from("gigs").select("title, headcount, producer_id").eq("id", dispatch.gig_id).single(),
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase
          .from("dispatches")
          .select("*", { count: "exact", head: true })
          .eq("gig_id", dispatch.gig_id)
          .in("status", ["accepted", "confirmed"]),
      ]);

      if (gig && paProfile) {
        const { data: producerProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", gig.producer_id)
          .single();

        if (producerProfile) {
          await sendGigAcceptedEmail({
            to: producerProfile.email,
            paName: paProfile.full_name,
            gigTitle: gig.title,
            filledCount: filledCount ?? 1,
            headcount: gig.headcount,
          });
        }
      }
    }
  }

  revalidatePath("/pa/dashboard");

  if (error) {
    redirect(`/pa/dashboard?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/pa/dashboard?accepted=1");
}

export async function declineDispatch(dispatchId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("decline_dispatch", { p_dispatch_id: dispatchId });

  revalidatePath("/pa/dashboard");

  if (error) {
    redirect(`/pa/dashboard?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/pa/dashboard?declined=1");
}
