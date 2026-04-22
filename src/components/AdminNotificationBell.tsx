import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AdminNotificationBell() {
  const { isAdmin } = useIsAdmin();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadCount() {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      setUnread(count || 0);
    }
    loadCount();

    const channel = supabase
      .channel("bell-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => loadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <Link
      to="/admin/notifications"
      className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary-foreground/10 transition-colors"
      title="Admin notifications"
    >
      <Bell className="w-4 h-4 text-primary-foreground" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
