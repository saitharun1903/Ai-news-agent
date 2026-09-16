import React from "react";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";
import { SettingsView } from "@/components/settings/settings-view";

export const revalidate = 0;

export default async function SettingsPage() {
  const profile = await db.getUserProfile();
  const analytics = await AnalyticsService.getSummary(profile.id);
  return <SettingsView initialProfile={profile} initialAnalytics={analytics} />;
}
