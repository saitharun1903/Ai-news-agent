/**
 * Lunor Desktop Morning Companion
 * Lightweight daemon that checks for the daily briefing and triggers a native desktop notification.
 */

import { exec } from "child_process";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

console.log("=== Lunor Desktop Companion Running ===");
console.log(`Target Application: ${APP_URL}`);

let lastNotifiedDate = "";

async function checkMorningBriefing() {
  try {
    const res = await fetch(`${APP_URL}/api/profile`);
    if (!res.ok) return;
    const profile = await res.json();

    if (!profile.desktopNotificationsEnabled) return;

    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];

    // Check if weekend notification disabled
    const dayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat
    if ((dayOfWeek === 0 || dayOfWeek === 6) && !profile.weekendNotificationsEnabled) {
      return;
    }

    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMins = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMins}`;

    const targetTime = profile.morningBriefingTime || "08:30";

    if (currentTimeStr === targetTime && lastNotifiedDate !== todayDateStr) {
      lastNotifiedDate = todayDateStr;
      triggerDesktopNotification();
    }
  } catch (err) {
    // App may still be booting
  }
}

function triggerDesktopNotification() {
  console.log("[Companion] Triggering Morning AI Briefing Notification...");
  const title = "Lunor · Today in AI";
  const message = "Your morning AI intelligence and recommended research paper are ready.";

  if (process.platform === "win32") {
    // Windows PowerShell Toast
    const psScript = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
      $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
      $textNodes = $template.GetElementsByTagName("text")
      $textNodes.Item(0).AppendChild($template.CreateTextNode("${title}")) | Out-Null
      $textNodes.Item(1).AppendChild($template.CreateTextNode("${message}")) | Out-Null
      $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Lunor").Show($toast)
    `;
    exec(`powershell -Command "${psScript.replace(/\n/g, " ")}"`, () => {});
  } else if (process.platform === "darwin") {
    exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
  }
}

// Initial check
checkMorningBriefing();
setInterval(checkMorningBriefing, CHECK_INTERVAL_MS);
