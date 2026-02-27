// components/ViewerCount.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewerCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel("live-viewers", {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="meta-chip fixed bottom-6 left-6 z-40">
      <i className="fas fa-circle text-green-500 text-xs animate-pulse"></i>
      {count}
    </div>
  );
}
