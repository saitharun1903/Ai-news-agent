import React from "react";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";
import { SettingsView } from "@/components/settings/settings-view";
import { getEffectiveUserId } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function SettingsPage() {
  const userId = await getEffectiveUserId();
  const [profile, analytics] = await Promise.all([
    db.getUserProfile(userId),
    AnalyticsService.getSummary(userId),
  ]);
  return <SettingsView initialProfile={profile} initialAnalytics={analytics} />;
}
