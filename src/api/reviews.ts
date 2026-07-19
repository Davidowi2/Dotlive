import { dotApi } from "@/api/client";

export async function submitReview(orderId: string, data: { rating: number; comment: string }) {
  return dotApi.post(`/api/orders/${orderId}/review`, data);
}
