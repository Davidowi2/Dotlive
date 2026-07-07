/**
 * use-vouches.ts — Vouch primitive hooks.
 *
 * Vouch shape returned by the backend (snake_case from drizzle):
 *   { id, voucherId, voucheeId, scope, score, createdAt, updatedAt }
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dotApi } from "@/api/client";

export type VouchScope = "founder" | "builder" | "capital";

export interface Vouch {
  id: string;
  voucherId: string;
  voucheeId: string;
  scope: VouchScope;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export function useVouches(userId: string | null | undefined) {
  return useQuery<Vouch[]>({
    queryKey: ["vouches", "received", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await dotApi.get<{ vouches: Vouch[] }>(
        `/api/vouches/received/${userId}`,
      );
      return res.vouches ?? [];
    },
    staleTime: 30_000,
  });
}

export function useGivenVouches(userId: string | null | undefined) {
  return useQuery<Vouch[]>({
    queryKey: ["vouches", "given", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await dotApi.get<{ vouches: Vouch[] }>(
        `/api/vouches/given/${userId}`,
      );
      return res.vouches ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCreateVouch(voucheeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scope: VouchScope) => {
      const res = await dotApi.post<{ vouch: Vouch }>(`/api/vouches`, {
        voucheeId,
        scope,
      });
      return res.vouch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vouches", "received", voucheeId] });
      qc.invalidateQueries({ queryKey: ["vouches", "given"] });
    },
  });
}

export function useDeleteVouch(voucheeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vouchId: string) => {
      await dotApi.delete(`/api/vouches/${vouchId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vouches"] });
      if (voucheeId) {
        qc.invalidateQueries({ queryKey: ["vouches", "received", voucheeId] });
      }
    },
  });
}
