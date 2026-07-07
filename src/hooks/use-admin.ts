/**
 * useAdmin hooks — manage admin operations and state.
 */

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminUser, AdminUserDetail, AdminStats } from "@/api/admin";
import * as adminApi from "@/api/admin";
import { toast } from "sonner";

/**
 * useAdminUsers — Load paginated list of users with filtering.
 */
export function useAdminUsers(search?: string, role?: string, banned?: "yes" | "no", limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", search, role, banned, limit],
    queryFn: () => adminApi.listAdminUsers({ search, role, banned, limit }),
  });

  return {
    users: data?.users ?? [],
    nextCursor: data?.nextCursor,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * useAdminUser — Load single user details.
 */
export function useAdminUser(userId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => (userId ? adminApi.getAdminUser(userId) : null),
    enabled: !!userId,
  });

  return {
    user: data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * useAdminStats — Load platform statistics.
 */
export function useAdminStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getAdminStats(),
  });

  return {
    stats: data,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useAdjustBalance — Adjust user wallet balance.
 */
export function useAdjustBalance() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
      return adminApi.adjustBalance(userId, amount, description);
    },
    onSuccess: (data, variables) => {
      toast.success("Balance adjusted successfully");
      qc.invalidateQueries({ queryKey: ["admin-user", variables.userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setError(null);
    },
    onError: (err: any) => {
      const message = err.message || "Failed to adjust balance";
      setError(message);
      toast.error(message);
    },
  });

  return {
    adjust: mutate.mutate,
    isPending: mutate.isPending,
    error,
  };
}

/**
 * useBanUser — Ban a user.
 */
export function useBanUser() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: async ({
      userId,
      reason,
      expiresInHours,
    }: {
      userId: string;
      reason: string;
      expiresInHours?: number;
    }) => {
      return adminApi.banUser(userId, reason, expiresInHours);
    },
    onSuccess: (data, variables) => {
      toast.success("User banned successfully");
      qc.invalidateQueries({ queryKey: ["admin-user", variables.userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setError(null);
    },
    onError: (err: any) => {
      const message = err.message || "Failed to ban user";
      setError(message);
      toast.error(message);
    },
  });

  return {
    ban: mutate.mutate,
    isPending: mutate.isPending,
    error,
  };
}

/**
 * useUnbanUser — Unban a user.
 */
export function useUnbanUser() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return adminApi.unbanUser(userId, reason);
    },
    onSuccess: (data, variables) => {
      toast.success("User unbanned successfully");
      qc.invalidateQueries({ queryKey: ["admin-user", variables.userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setError(null);
    },
    onError: (err: any) => {
      const message = err.message || "Failed to unban user";
      setError(message);
      toast.error(message);
    },
  });

  return {
    unban: mutate.mutate,
    isPending: mutate.isPending,
    error,
  };
}

/**
 * useAuditLog — Load recent admin audit log entries.
 */
export function useAuditLog(limit: number = 50) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-audit-log", limit],
    queryFn: () => adminApi.getAuditLog(limit),
  });

  return {
    logs: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
