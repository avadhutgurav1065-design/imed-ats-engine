"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  message: string;
  type: "drive" | "mentorship" | "referral" | "system";
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "created_at">) => {
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
      ...n,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    // Subscribe to campus_drives inserts
    const driveChannel = supabase
      .channel("drive-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "campus_drives" },
        (payload: any) => {
          addNotification({
            type: "drive",
            message: `🎯 New campus drive posted: ${payload.new.company_name} — ${payload.new.role_title}`,
          });
        }
      )
      .subscribe();

    // Subscribe to mentorship_pairs inserts (alumni accepted)
    const mentorChannel = supabase
      .channel("mentor-notifications")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mentorship_pairs", filter: "status=eq.active" },
        (payload: any) => {
          addNotification({
            type: "mentorship",
            message: `✅ Your mentorship request has been accepted!`,
          });
        }
      )
      .subscribe();

    // Subscribe to job_referrals inserts
    const referralChannel = supabase
      .channel("referral-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_referrals" },
        (payload: any) => {
          addNotification({
            type: "referral",
            message: `💼 New alumni referral: ${payload.new.role_title} at ${payload.new.company}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(driveChannel);
      supabase.removeChannel(mentorChannel);
      supabase.removeChannel(referralChannel);
    };
  }, [supabase, addNotification]);

  return { notifications, unreadCount, markAllRead };
}
