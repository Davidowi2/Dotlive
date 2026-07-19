/**
 * /admin/courses — Course management.
 *
 * List, create, edit, delete courses. Edit-in-place for everything except
 * description (which is multi-line). Whop product ID + URL fields are
 * right next to each other so the operator can paste both from the
 * Whop dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Save, Trash2, Plus, Loader2, ExternalLink, Check, X, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  listAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  type AdminCourse,
  type CourseInput,
} from "@/api/adminAcademy";
import { formatDot } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  head: () => ({ meta: [{ title: "Courses — Admin — DOT" }] }),
  component: AdminCoursesPage,
});

function AdminCoursesPage() {
  const qc = useQueryClient();
  const coursesQ = useQuery({
    queryKey: ["admin-courses"],
    queryFn: listAdminCourses,
    staleTime: 30_000,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Academy"
        title="Courses"
        subtitle="List, create, edit and unpublish courses shown on /academy."
        action={
          <Button onClick={() => setCreating(true)} disabled={creating}>
            <Plus className="size-4" /> New course
          </Button>
        }
      />

      {creating && (
        <CourseForm
          mode="create"
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            await createAdminCourse({ ...input, isPublished: input.isPublished ?? true });
            toast.success("Course created");
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin-courses"] });
            qc.invalidateQueries({ queryKey: ["academy-courses"] });
          }}
        />
      )}

      <section className="mt-6">
        {coursesQ.isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />)}
          </div>
        )}
        {coursesQ.isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load courses — {(coursesQ.error as any)?.message ?? "server error"}. Check Render logs.
          </div>
        )}
        {coursesQ.data && coursesQ.data.length === 0 && !coursesQ.isError && (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create one to surface it on /academy."
          />
        )}
        <div className="space-y-3">
          {coursesQ.data?.map((c) =>
            editingId === c.id ? (
              <CourseForm
                key={c.id}
                mode="edit"
                initial={c}
                onCancel={() => setEditingId(null)}
                onSave={async (input) => {
                  await updateAdminCourse(c.id, input);
                  toast.success("Course saved");
                  setEditingId(null);
                  qc.invalidateQueries({ queryKey: ["admin-courses"] });
                  qc.invalidateQueries({ queryKey: ["academy-courses"] });
                }}
                onDelete={async () => {
                  if (!confirm(`Delete "${c.title}"? This also removes all enrollments.`))
                    return;
                  await deleteAdminCourse(c.id);
                  toast.success("Course deleted");
                  setEditingId(null);
                  qc.invalidateQueries({ queryKey: ["admin-courses"] });
                  qc.invalidateQueries({ queryKey: ["academy-courses"] });
                }}
              />
            ) : (
              <CourseRow
                key={c.id}
                course={c}
                onEdit={() => setEditingId(c.id)}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}

function CourseRow({ course, onEdit }: { course: AdminCourse; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-semibold">{course.title}</h3>
            {course.isPublished ? (
              <Badge variant="default">Published</Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
            <Badge variant="outline">{course.category ?? "Uncategorised"}</Badge>
          </div>
          {course.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {course.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Reward:{" "}
              <span className="font-semibold text-foreground">
                {formatDot(course.dotReward)} DOT
              </span>
            </span>
            {course.vantageBoost > 0 && (
              <span>Vantage +{course.vantageBoost}</span>
            )}
            {course.whopProductId && (
              <span className="font-mono">prod: {course.whopProductId.slice(0, 12)}…</span>
            )}
          </div>
          {course.whopUrl && (
            <a
              href={course.whopUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" /> Whop checkout
            </a>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}

function CourseForm({
  mode,
  initial,
  onCancel,
  onSave,
  onDelete,
}: {
  mode: "create" | "edit";
  initial?: AdminCourse;
  onCancel: () => void;
  onSave: (input: CourseInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [whopUrl, setWhopUrl] = useState(initial?.whopUrl ?? "");
  const [whopProductId, setWhopProductId] = useState(initial?.whopProductId ?? "");
  const [dotReward, setDotReward] = useState(initial?.dotReward ?? 100);
  const [vantageBoost, setVantageBoost] = useState(initial?.vantageBoost ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div
      className={cn(
        "mt-4 rounded-2xl border bg-card p-5",
        mode === "create" ? "border-primary/30" : "border-primary/30",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          {mode === "create" ? "New course" : `Edit · ${initial?.title}`}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" /> Cancel
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Title
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="LEAPFROG" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One short paragraph about what the founder will learn."
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Category
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Fundamentals"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            DOT reward on completion
          </label>
          <Input
            type="number"
            min={0}
            value={dotReward}
            onChange={(e) => setDotReward(Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Whop checkout URL
          </label>
          <Input
            value={whopUrl}
            onChange={(e) => setWhopUrl(e.target.value)}
            placeholder="https://whop.com/checkout/plan_xxx"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Cover image URL <span className="text-muted-foreground/70">— optional, shown on academy page</span>
          </label>
          <Input
            value={(initial as any)?.coverImageUrl ?? ""}
            placeholder="https://cdn.whop.com/..."
            readOnly
            className="bg-muted/30 text-xs"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Auto-populated from Whop sync. Edit by re-syncing after updating your Whop product image.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Whop product ID{" "}
            <span className="text-muted-foreground/70">
              — paste from Whop → Developer → Products
            </span>
          </label>
          <Input
            value={whopProductId}
            onChange={(e) => setWhopProductId(e.target.value)}
            placeholder="prod_xxxxxxxxxxxx"
            className="font-mono"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Vantage boost on completion
          </label>
          <Input
            type="number"
            min={0}
            value={vantageBoost}
            onChange={(e) => setVantageBoost(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <label htmlFor="published" className="text-sm font-medium">
              Published (visible on /academy)
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {onDelete ? (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
            <Trash2 className="size-4" /> Delete
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !title.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  title: title.trim(),
                  description: description.trim() || null,
                  category: category.trim() || null,
                  whopUrl: whopUrl.trim() || null,
                  whopProductId: whopProductId.trim() || null,
                  dotReward: Number(dotReward) || 0,
                  vantageBoost: Number(vantageBoost) || 0,
                  isPublished,
                });
              } catch (e: any) {
                toast.error(e?.message ?? "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {mode === "create" ? "Create course" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
