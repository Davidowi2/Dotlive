import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-CWBSyrer.mjs";
import { Nt as Award, jt as BookOpen, st as ExternalLink, tt as Gift, vt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as dotApi } from "./client-BT9fM0ow.mjs";
import { n as useDotAuth } from "./DotAuthContext-CxecINp9.mjs";
import { t as Badge } from "./badge-DGcaxcNU.mjs";
import { l as formatDot } from "./constants-DV8g_Ppd.mjs";
import { t as AppShell } from "./AppShell-B0eeGyU0.mjs";
import { t as PageHeader } from "./PageHeader-CYlCrZl0.mjs";
import { t as EmptyState } from "./EmptyState-DLXqcaS0.mjs";
import { t as PageSkeleton } from "./PageSkeleton-NlnwrOgm.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/academy-D31-ksdz.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Academy API — wraps the Fastify /api/academy/* endpoints.
*/
async function listCourses() {
	return (await dotApi.get("/api/academy/courses")).courses ?? [];
}
async function getMyEnrollments() {
	return (await dotApi.get("/api/academy/enrollments")).enrollments ?? [];
}
async function enrollInCourse(courseId) {
	return (await dotApi.post(`/api/academy/enroll/${courseId}`)).enrollment;
}
async function completeCourse(courseId) {
	return dotApi.post(`/api/academy/complete/${courseId}`);
}
function AcademyPage() {
	const { user } = useDotAuth();
	const qc = useQueryClient();
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ["courses"],
		queryFn: listCourses
	});
	const { data: enrollments = [] } = useQuery({
		queryKey: ["my-enrollments"],
		queryFn: getMyEnrollments,
		enabled: !!user
	});
	const enrollMutation = useMutation({
		mutationFn: (courseId) => enrollInCourse(courseId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["my-enrollments"] })
	});
	const completeMutation = useMutation({
		mutationFn: (courseId) => completeCourse(courseId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-enrollments"] });
			qc.invalidateQueries({ queryKey: ["wallet"] });
		}
	});
	const enrollMap = new Map(enrollments.map((e) => [e.courseId, e]));
	async function enroll(courseId, whopUrl) {
		if (!user) return;
		try {
			await enrollMutation.mutateAsync(courseId);
			toast.success("Enrolled! Opening course on Whop.");
			if (whopUrl) window.open(whopUrl, "_blank", "noopener");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not enroll");
		}
	}
	async function complete(courseId, reward) {
		if (!user) return;
		try {
			await completeMutation.mutateAsync(courseId);
			toast.success(reward > 0 ? `Completed! +${formatDot(reward)} DOT earned.` : "Marked complete!");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update");
		}
	}
	const completedCount = enrollments.filter((e) => e.status === "completed").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "DOT Academy",
		subtitle: "Founder education delivered via Whop. Complete tracks to earn DOT and boost Vantage.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "secondary",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "mr-1 size-3" }),
				" ",
				completedCount,
				" completed"
			]
		})
	}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton.CardGrid, {
		count: 6,
		cols: 3
	}) : courses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: BookOpen,
		title: "No courses yet",
		description: "Check back soon — new learning tracks are being added."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: courses.map((c) => {
			const enr = enrollMap.get(c.id);
			const done = enr?.status === "completed";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col rounded-2xl border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5" })
						}), c.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: c.category
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 font-display text-lg font-semibold",
						children: c.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 flex-1 text-sm text-muted-foreground",
						children: c.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-3 text-xs text-muted-foreground",
						children: [c.dotReward > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-gold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-3" }),
								" +",
								formatDot(c.dotReward),
								" DOT"
							]
						}), c.vantageBoost > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"+",
							c.vantageBoost,
							" Vantage"
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex gap-2",
						children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "flex-1",
							disabled: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-primary" }), " Completed"]
						}) : enr ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "flex-1",
							onClick: () => c.whopUrl && window.open(c.whopUrl, "_blank", "noopener"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4" }), " Open"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "hero",
							onClick: () => complete(c.id, c.dotReward),
							children: "Mark done"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "hero",
							className: "flex-1",
							onClick: () => enroll(c.id, c.whopUrl),
							children: ["Enroll ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4" })]
						})
					})
				]
			}, c.id);
		})
	})] });
}
//#endregion
export { AcademyPage as component };
