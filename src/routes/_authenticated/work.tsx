import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Hammer,
  Loader2,
  Plus,
  Search,
  Star,
  Clock,
  Wallet,
  CheckCircle2,
  Package,
  Store,
  Pencil,
  Trash2,
  Briefcase,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { DeliveryDialog } from "@/components/app/DeliveryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  useMyBuilderProfile,
  useBuilderStats,
  useWallet,
} from "@/hooks/use-dot-data";
import {
  listServices,
  createService,
  updateService,
  deleteService,
  createOrder,
  listOrders,
  deliverOrder,
  completeOrder,
  cancelOrder,
  listJobs,
  createJob,
  updateJob,
  deleteJob,
} from "@/api/marketplace";
import type { Service, JobListing, ServiceOrder } from "@/types/api";
import {
  WORK_CATEGORIES,
  ORDER_STATUS_META,
  formatDot,
  dotToNaira,
  formatNaira,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/work")({
  head: () => ({
    meta: [
      { title: "DOT Work — Earn DOT" },
      { name: "description", content: "Hire builders, browse jobs, or sell your skills and earn DOT." },
    ],
  }),
  component: WorkPage,
});

const JOB_EMPLOYMENT_TYPES = [
  { value: "full_time",   label: "Full-time" },
  { value: "part_time",   label: "Part-time" },
  { value: "contract",    label: "Contract" },
  { value: "internship",  label: "Internship" },
] as const;

/* ═══════════════════════ PAGE SHELL ═══════════════════════ */
function WorkPage() {
  return (
    <AppShell>
      <PageHeader
        title="DOT Work"
        subtitle="Hire builders, browse jobs, or earn DOT with your skills."
      />
      <Tabs defaultValue="gigs" className="mt-6">
        <TabsList>
          <TabsTrigger value="gigs">Gigs</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
        <TabsContent value="gigs"><GigsTab /></TabsContent>
        <TabsContent value="jobs"><JobsTab /></TabsContent>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="sell"><SellTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ═══════════════════════ GIGS TAB ═══════════════════════ */
function GigsTab() {
  const { user } = useDotAuth();
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", category || "all", search || ""],
    queryFn: () => listServices({ category: category || undefined, search: search || undefined }),
  });
  const [order, setOrder] = useState<Service | null>(null);

  const visible = services.filter((s) => s.builderId !== user?.id);

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search gigs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {WORK_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageSkeleton.CardGrid count={6} cols={3} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Store} title="No gigs found" description="Try a different category or search term." />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <ServiceCard key={s.id} service={s} onOrder={() => setOrder(s)} />
          ))}
        </div>
      )}
      <OrderDialog service={order} onClose={() => setOrder(null)} />
    </div>
  );
}

function ServiceCard({ service, onOrder }: { service: Service; onOrder: () => void }) {
  const { data: stats } = useBuilderStats(service.builderId);
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{service.category}</Badge>
        {stats && Number(stats.review_count) > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-gold">
            <Star className="size-3 fill-current" /> {Number(stats.avg_rating)} ({Number(stats.review_count)})
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">{service.title}</h3>
      <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{service.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3" /> {service.deliveryDays}d delivery
        </span>
        {stats && <span>{Number(stats.orders_completed)} done</span>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold text-primary">{formatDot(service.priceDot)} DOT</p>
          <p className="text-xs text-muted-foreground">{formatNaira(dotToNaira(service.priceDot))}</p>
        </div>
        <Button variant="hero" onClick={onOrder}>Order</Button>
      </div>
    </div>
  );
}

function OrderDialog({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: balance = 0 } = useWallet();
  const [requirements, setRequirements] = useState("");
  const [busy, setBusy] = useState(false);

  async function placeOrder() {
    if (!service) return;
    if (service.priceDot > balance) {
      toast.error("Insufficient DOT balance — top up your wallet first.");
      return;
    }
    setBusy(true);
    try {
      await createOrder(service.id, requirements.trim() || undefined);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["orders", "client"] });
      toast.success("Order placed! DOT is held until you confirm delivery.");
      onClose();
      setRequirements("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!service} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order: {service?.title}</DialogTitle>
          <DialogDescription>
            {service && (
              <>{formatDot(service.priceDot)} DOT will be held from your wallet and released to the builder when you confirm the work is done.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="req">What do you need? (optional)</Label>
          <Textarea
            id="req"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe your requirements, links, brand assets…"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">Your balance: {formatDot(balance)} DOT</p>
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={placeOrder} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Pay {service ? formatDot(service.priceDot) : ""} DOT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════ JOBS TAB ═══════════════════════ */
function JobsTab() {
  const { roles } = useDotAuth();
  const isFounder = roles.includes("founder");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["job_listings", category || "all", search || ""],
    queryFn: () => listJobs({ category: category || undefined, search: search || undefined }),
  });
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  const filtered = jobs.filter((j) => {
    if (employmentType && j.employmentType !== employmentType) return false;
    if (minSalary && j.salaryDot < Number(minSalary)) return false;
    return true;
  });

  return (
    <div className="mt-4">
      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {WORK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={employmentType || "all"} onValueChange={(v) => setEmploymentType(v === "all" ? "" : v)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {JOB_EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Min DOT salary"
          type="number"
          min={0}
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
          className="sm:w-36"
        />
        {isFounder ? (
          <Button variant="hero" onClick={() => setShowPostForm(true)}>
            <Plus className="size-4" /> Post a Job
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/onboarding">
              <Lock className="size-4" /> Upgrade to Post
            </Link>
          </Button>
        )}
      </div>

      {/* Listing */}
      {isLoading ? (
        <PageSkeleton.TransactionRows rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="No open positions match your filters."
          action={
            isFounder ? (
              <Button variant="hero" onClick={() => setShowPostForm(true)}>
                <Plus className="size-4" /> Post the first job
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Founders can post jobs.{" "}
                <Link to="/onboarding" className="text-primary underline">Become a Founder</Link>
              </p>
            )
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} onView={() => setSelectedJob(j)} />
          ))}
        </div>
      )}

      <JobDetailDialog job={selectedJob} onClose={() => setSelectedJob(null)} />
      {showPostForm && <JobFormDialog onClose={() => setShowPostForm(false)} />}
    </div>
  );
}

function JobCard({ job, onView }: { job: JobListing; onView: () => void }) {
  const typeLabel = JOB_EMPLOYMENT_TYPES.find((t) => t.value === job.employmentType)?.label ?? job.employmentType;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-semibold">{job.title}</h3>
          <Badge variant="outline">{job.category}</Badge>
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Posted {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:items-end">
        <p className="font-display text-lg font-bold text-primary">{formatDot(job.salaryDot)} DOT</p>
        <p className="text-xs text-muted-foreground">{formatNaira(dotToNaira(job.salaryDot))}</p>
        <Button variant="hero" size="sm" onClick={onView}>View job</Button>
      </div>
    </div>
  );
}

function JobDetailDialog({ job, onClose }: { job: JobListing | null; onClose: () => void }) {
  const typeLabel = JOB_EMPLOYMENT_TYPES.find((t) => t.value === job?.employmentType)?.label ?? job?.employmentType;
  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{job?.title}</DialogTitle>
          <DialogDescription>
            <span className="inline-flex flex-wrap gap-2">
              <Badge variant="outline">{job?.category}</Badge>
              <Badge variant="secondary">{typeLabel}</Badge>
              <span className="font-semibold text-primary">{job ? formatDot(job.salaryDot) : ""} DOT / mo</span>
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">About this role</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{job?.description}</p>
          </div>
          {job?.requirements && (
            <div>
              <p className="font-medium text-foreground">Requirements</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{job.requirements}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={onClose}>Apply via DOT (coming soon)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobFormDialog({ job, onClose }: { job?: JobListing; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [category, setCategory] = useState(job?.category ?? WORK_CATEGORIES[0]);
  const [salary, setSalary] = useState(job?.salaryDot ?? 5000);
  const [empType, setEmpType] = useState(job?.employmentType ?? "full_time");
  const [requirements, setRequirements] = useState(job?.requirements ?? "");
  const [isOpen, setIsOpen] = useState(job?.isOpen ?? true);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (salary <= 0) {
      toast.error("Salary must be a positive number.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        salaryDot: Math.floor(salary),
        employmentType: empType,
        requirements: requirements.trim() || undefined,
        isOpen,
      };
      if (job) {
        await updateJob(job.id, payload);
      } else {
        await createJob(payload);
      }
      qc.invalidateQueries({ queryKey: ["job_listings"] });
      qc.invalidateQueries({ queryKey: ["my_job_listings"] });
      toast.success(job ? "Job updated." : "Job posted.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{job ? "Edit job" : "Post a job"}</DialogTitle>
          <DialogDescription>Only founders can post jobs. The listing will appear in the Jobs tab.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="j-title">Job title</Label>
            <Input id="j-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="j-desc">Description</Label>
            <Textarea id="j-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select value={empType} onValueChange={setEmpType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="j-salary">Salary (DOT / month)</Label>
            <Input id="j-salary" type="number" min={1} value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="j-req">Requirements (optional)</Label>
            <Textarea id="j-req" value={requirements} onChange={(e) => setRequirements(e.target.value)} maxLength={2000} rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} className="size-4 accent-primary" />
            Listing is open / accepting applications
          </label>
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {job ? "Save" : "Post job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════ ORDERS TAB ═══════════════════════ */
function OrdersTab() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "client", user?.id],
    enabled: !!user,
    queryFn: () => listOrders("client"),
  });
  const [review, setReview] = useState<{ id: string; title: string } | null>(null);

  async function handleComplete(orderId: string) {
    try {
      await completeOrder(orderId);
      qc.invalidateQueries({ queryKey: ["orders", "client"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Order completed — builder paid.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder(orderId);
      qc.invalidateQueries({ queryKey: ["orders", "client"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Order cancelled — you were refunded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  if (isLoading) return <PageSkeleton.TransactionRows rows={4} />;
  if (orders.length === 0) return (
    <EmptyState icon={Package} title="No orders yet" description="You haven't ordered any services yet." />
  );

  return (
    <div className="mt-4 space-y-3">
      {orders.map((o) => {
        const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META.in_progress;
        return (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDot(Number(o.amountDot))} DOT · {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary" className={cn("shrink-0", meta.tone)}>{meta.label}</Badge>
            </div>
            {o.deliveryNote && (
              <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                <span className="font-medium">Delivery: </span>{o.deliveryNote}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(o.status === "in_progress" || o.status === "delivered") && (
                <>
                  <Button variant="hero" size="sm" onClick={() => handleComplete(o.id)}>
                    <CheckCircle2 className="size-4" /> Confirm & pay
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCancel(o.id)}>
                    Cancel
                  </Button>
                </>
              )}
              {o.status === "completed" && (
                <Button variant="outline" size="sm" onClick={() => setReview({ id: o.id, title: o.title })}>
                  <Star className="size-4" /> Leave review
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <ReviewDialog order={review} onClose={() => setReview(null)} />
    </div>
  );
}

function ReviewDialog({ order, onClose }: { order: { id: string; title: string } | null; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!order) return;
    setBusy(true);
    try {
      await dotApi.post(`/api/orders/${order.id}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thanks for your review!");
      onClose();
      setRating(5);
      setComment("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review: {order?.title}</DialogTitle>
          <DialogDescription>How was the work?</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={cn("size-7", n <= rating ? "fill-gold text-gold" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience (optional)"
            maxLength={1000}
          />
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════ SELL TAB ═══════════════════════ */
function SellTab() {
  const { user, roles } = useDotAuth();
  const isFounder = roles.includes("founder");
  const { data: profile, isLoading: pLoading } = useMyBuilderProfile();
  const { data: services = [] } = useQuery({
    queryKey: ["my_services", user?.id],
    enabled: !!user,
    queryFn: () => listServices(),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "builder", user?.id],
    enabled: !!user,
    queryFn: () => listOrders("builder"),
  });
  const { data: myJobs = [] } = useQuery({
    queryKey: ["my_job_listings", user?.id],
    enabled: !!user,
    queryFn: () => listJobs(),
  });
  const { data: stats } = useBuilderStats(user?.id);
  const qc = useQueryClient();
  const [editService, setEditService] = useState<Service | null | "new">(null);
  const [editJob, setEditJob] = useState<JobListing | null | "new">(null);
  const [deliveryOrder, setDeliveryOrder] = useState<{ id: string; title: string } | null>(null);

  async function handleDeliver(orderId: string, note: string) {
    try {
      await deliverOrder(orderId, note || undefined);
      qc.invalidateQueries({ queryKey: ["orders", "builder"] });
      toast.success("Marked as delivered.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not deliver");
    }
  }

  async function handleDeleteService(id: string) {
    try {
      await deleteService(id);
      qc.invalidateQueries({ queryKey: ["my_services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  }

  async function handleDeleteJob(id: string) {
    try {
      await deleteJob(id);
      qc.invalidateQueries({ queryKey: ["job_listings"] });
      qc.invalidateQueries({ queryKey: ["my_job_listings"] });
      toast.success("Job listing removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  }

  if (pLoading) return <PageSkeleton.StatCards count={3} />;

  if (!profile) {
    return (
      <div className="mt-4">
        <BuilderProfileForm />
      </div>
    );
  }

  // Filter to only my own services for the sell tab
  const myServices = services.filter((s) => s.builderId === user?.id);
  // Filter my jobs
  const myOwnJobs = myJobs.filter((j) => j.ventureId === user?.id);
  const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "delivered");

  return (
    <div className="mt-4 space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Earned" value={`${formatDot(Number(stats?.total_earned ?? 0))} DOT`} icon={Wallet} accent="primary" />
        <StatCard label="Completed" value={String(Number(stats?.orders_completed ?? 0))} icon={CheckCircle2} accent="primary" />
        <StatCard
          label="Rating"
          value={Number(stats?.review_count ?? 0) > 0 ? String(Number(stats?.avg_rating)) : "—"}
          sub={Number(stats?.review_count ?? 0) > 0 ? "★ avg" : "no reviews yet"}
          icon={Star}
          accent="gold"
        />
      </div>

      <BuilderProfileForm existing={profile} />

      {/* My Gig Services */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your gig services</h2>
          <Button variant="hero" size="sm" onClick={() => setEditService("new")}>
            <Plus className="size-4" /> New service
          </Button>
        </div>
        {myServices.length === 0 ? (
          <EmptyState icon={Store} title="No services yet" description="Create a service to start earning DOT."
            action={<Button variant="hero" size="sm" onClick={() => setEditService("new")}><Plus className="size-4" /> New service</Button>}
          />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {myServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {formatDot(s.priceDot)} DOT {!s.isActive && "· hidden"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditService(s)} aria-label="Edit service">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteService(s.id)} aria-label="Delete service">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Job Listings (founders only) */}
      {isFounder && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Your job listings</h2>
            <Button variant="hero" size="sm" onClick={() => setEditJob("new")}>
              <Plus className="size-4" /> Post a job
            </Button>
          </div>
          {myOwnJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No job listings yet" description="Post a job to find full-time, part-time, or contract talent."
              action={<Button variant="hero" size="sm" onClick={() => setEditJob("new")}><Plus className="size-4" /> Post a job</Button>}
            />
          ) : (
            <div className="mt-4 space-y-3">
              {myOwnJobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{j.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.category} · {formatDot(j.salaryDot)} DOT {!j.isOpen && "· closed"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditJob(j)} aria-label="Edit job">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(j.id)} aria-label="Delete job">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Incoming gig orders */}
      <section>
        <h2 className="font-display text-lg font-semibold">Incoming orders</h2>
        {activeOrders.length === 0 ? (
          <EmptyState variant="inline" icon={Package} title="No active orders" description="No active orders right now." />
        ) : (
          <div className="mt-4 space-y-3">
            {activeOrders.map((o) => {
              const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META.in_progress;
              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDot(Number(o.amountDot))} DOT</p>
                    </div>
                    <Badge variant="secondary" className={cn("shrink-0", meta.tone)}>{meta.tone && meta.label}</Badge>
                  </div>
                  {o.requirements && (
                    <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Brief: </span>{o.requirements}
                    </p>
                  )}
                  {o.status === "in_progress" && (
                    <Button variant="hero" size="sm" className="mt-4"
                      onClick={() => setDeliveryOrder({ id: o.id, title: o.title })}>
                      Mark delivered
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editService !== null && (
        <ServiceFormDialog service={editService === "new" ? null : editService} onClose={() => setEditService(null)} />
      )}
      {editJob !== null && (
        <JobFormDialog job={editJob === "new" ? undefined : editJob} onClose={() => setEditJob(null)} />
      )}
      <DeliveryDialog
        orderId={deliveryOrder?.id ?? null}
        orderTitle={deliveryOrder?.title ?? ""}
        onClose={() => setDeliveryOrder(null)}
        onDeliver={handleDeliver}
      />
    </div>
  );
}

/* ═══════════════════════ SHARED FORMS ═══════════════════════ */
function BuilderProfileForm({ existing }: { existing?: { headline: string; bio: string | null; skills: string[]; available: boolean } }) {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [headline, setHeadline] = useState(existing?.headline ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [skills, setSkills] = useState((existing?.skills ?? []).join(", "));
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!user) return;
    if (!headline.trim()) {
      toast.error("Add a headline so clients know what you do.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await dotApi.post("/api/users/me/builder-profile", {
        headline: headline.trim(),
        bio: bio.trim() || null,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        available: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["builder_profile", user.id] });
      toast.success(existing ? "Profile updated." : "Builder profile created — start listing services!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">{existing ? "Builder profile" : "Become a builder"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell clients what you do, then list services to earn DOT.
      </p>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Brand & product designer for African startups" maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Figma, Branding, UI" />
        </div>
        <Button variant="hero" onClick={save} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {existing ? "Save profile" : "Create profile"}
        </Button>
      </div>
    </div>
  );
}

function ServiceFormDialog({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(service?.title ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [category, setCategory] = useState(service?.category ?? WORK_CATEGORIES[0]);
  const [price, setPrice] = useState(service?.priceDot ?? 1000);
  const [days, setDays] = useState(service?.deliveryDays ?? 3);
  const [active, setActive] = useState(service?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (price <= 0 || days <= 0) {
      toast.error("Price and delivery time must be positive.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priceDot: Math.floor(price),
        deliveryDays: Math.floor(days),
        isActive: active,
      };
      if (service) {
        await updateService(service.id, payload);
      } else {
        await createService(payload);
      }
      qc.invalidateQueries({ queryKey: ["my_services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(service ? "Service updated." : "Service published.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "New service"}</DialogTitle>
          <DialogDescription>Clients pay in DOT and you're paid on completion.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-title">Title</Label>
            <Input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-desc">Description</Label>
            <Textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-price">Price (DOT)</Label>
              <Input id="s-price" type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-days">Delivery (days)</Label>
              <Input id="s-days" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />
            Visible in marketplace
          </label>
        </div>
        <DialogFooter>
          <Button variant="hero" onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {service ? "Save" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
