import React from "react";
import { db } from "@/lib/db";
import { SettingsView } from "@/components/settings/settings-view";

export const revalidate = 0;

export default async function SettingsPage() {
  const profile = await db.getUserProfile();
  return <SettingsView initialProfile={profile} />;
}
