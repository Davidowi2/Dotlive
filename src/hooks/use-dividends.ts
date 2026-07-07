/**
 * Dividends hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDividends,
  getDividendsByVenture,
  getMyDividends,
  declareDividend,
  markDividendAsPaid,
} from "@/api/dividends";

export function useDividends() {
  return useQuery({
    queryKey: ["dividends"],
    queryFn: listDividends,
  });
}

export function useDividendsByVenture(ventureId: string | undefined) {
  return useQuery({
    queryKey: ["dividends", "venture", ventureId],
    queryFn: () => getDividendsByVenture(ventureId!),
    enabled: !!ventureId,
  });
}

export function useMyDividends() {
  return useQuery({
    queryKey: ["dividends", "my"],
    queryFn: getMyDividends,
  });
}

export function useDeclareDividend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: declareDividend,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["dividends", "venture"] });
    },
  });
}

export function useMarkDividendAsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markDividendAsPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["dividends", "venture"] });
      qc.invalidateQueries({ queryKey: ["dividends", "my"] });
    },
  });
}
