import React from "react";
import { db } from "@/lib/db";
import { SettingsView } from "@/components/settings/settings-view";
import { getEffectiveUserId } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ProfilePage() {
  const userId = await getEffectiveUserId();
  const profile = await db.getUserProfile(userId);
  return <SettingsView initialProfile={profile} />;
}
