"use client";
import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Check, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionStatus: string;
  streak: number;
  onboarded: boolean;
  goals: string;
}

export function UserManagementSheet() {
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("demo");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const [usersRes, dashRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/getUserDashboard"),
      ]);
      const usersData = await usersRes.json();
      const dashData = await dashRes.json();
      setUsers(usersData.users || []);
      setActiveUserId(dashData?.user?.id || "demo");
    } catch {
      toast.error(locale === "fa" ? "بارگذاری ناموفق" : "Failed to load");
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function createUser() {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(locale === "fa" ? "کاربر ساخته شد" : "User created");
      setNewName("");
      await loadUsers();
    } catch {
      toast.error(locale === "fa" ? "ساخت ناموفق" : "Failed to create");
    }
  }

  async function switchUser(userId: string) {
    try {
      const res = await fetch("/api/switchUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(locale === "fa" ? "کاربر تغییر یافت" : "User switched");
      setActiveUserId(userId);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error(locale === "fa" ? "تغییر ناموفق" : "Failed to switch");
    }
  }

  async function deleteUser(userId: string) {
    if (userId === "demo") {
      toast.error(locale === "fa" ? "کاربر دمو قابل حذف نیست" : "Cannot delete demo user");
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(locale === "fa" ? "کاربر حذف شد" : "User deleted");
      await loadUsers();
    } catch {
      toast.error(locale === "fa" ? "حذف ناموفق" : "Failed to delete");
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <User className="h-4 w-4" />
          {locale === "fa" ? "مدیریت کاربران" : "User Management"}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/* Create new user */}
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-ios">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {locale === "fa" ? "ساخت کاربر جدید" : "Create New User"}
          </p>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={locale === "fa" ? "نام کاربر" : "User name"}
              className="rounded-xl bg-secondary border-0"
              onKeyDown={(e) => e.key === "Enter" && createUser()}
            />
            <Button onClick={createUser} disabled={!newName.trim()} className="rounded-xl">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User list */}
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {locale === "fa" ? "کاربران" : "Users"} ({users.length})
        </p>
        {loading && <p className="py-4 text-center text-sm text-muted-foreground">{t("loading")}</p>}
        <div className="space-y-2">
          {users.map((u, i) => {
            const isActive = u.id === activeUserId;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors",
                  isActive ? "border-foreground bg-card" : "border-border bg-card"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-streak to-protein text-sm font-bold text-white">
                  {(u.displayName ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{u.displayName ?? "User"}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.email} · {locale === "fa" ? "استمرار" : "Streak"}: {u.streak}
                  </div>
                </div>
                {isActive ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => switchUser(u.id)}
                      className="flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs font-medium transition-transform active:scale-95"
                    >
                      {locale === "fa" ? "فعال‌سازی" : "Switch"}
                    </button>
                    {u.id !== "demo" && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            {locale === "fa"
              ? "💡 کاربر فعال با علامت تیک مشخص می‌شود. برای تغییر کاربر، روی «فعال‌سازی» بزنید."
              : "💡 The active user is marked with a check. Tap 'Switch' to change the active user."}
          </p>
        </div>
      </div>
    </div>
  );
}
