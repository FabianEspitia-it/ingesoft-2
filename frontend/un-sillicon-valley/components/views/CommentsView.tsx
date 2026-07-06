"use client";

import { useState } from "react";

export default function SettingsView() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Comentarios admin</h1>
    </div>
  );
}