import { t as supabase } from "./client-BF8hsLRA.mjs";
import { t as useAuth } from "./use-auth-DnlQb86O.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-dot-data-DSqFe_0n.js
function useWallet() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["wallet", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
			if (error) throw error;
			return data?.balance ?? 0;
		}
	});
}
function useFounderProfile() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["founder_profile", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("founder_profiles").select("*").eq("user_id", user.id).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
}
function useAssessments() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["assessments", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
}
function useMyEnrollments() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["enrollments", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("course_enrollments").select("*").eq("user_id", user.id);
			if (error) throw error;
			return data ?? [];
		}
	});
}
function useMyMembership() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["membership", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("community_members").select("*, communities(*)").eq("founder_id", user.id).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
}
function useMyBuilderProfile() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["builder_profile", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data, error } = await supabase.from("builder_profiles").select("*").eq("id", user.id).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
}
function useBuilderStats(builderId) {
	return useQuery({
		queryKey: ["builder_stats", builderId],
		enabled: !!builderId,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("get_builder_stats", { _builder_id: builderId });
			if (error) throw error;
			return data?.[0] ?? {
				orders_completed: 0,
				total_earned: 0,
				avg_rating: 0,
				review_count: 0
			};
		}
	});
}
//#endregion
export { useMyEnrollments as a, useMyBuilderProfile as i, useBuilderStats as n, useMyMembership as o, useFounderProfile as r, useWallet as s, useAssessments as t };
