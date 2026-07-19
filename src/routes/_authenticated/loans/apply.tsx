/**
 * LoanApplicationForm — 17-field borrower application.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getMyVenture } from "@/api/ventures";
import { getLoanEligibility, submitLoanApplication } from "@/api/loan-applications";
import { toast } from "sonner";
import { AFRICAN_COUNTRIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/loans/apply")({
  head: () => ({ meta: [{ title: "Apply for a Loan — DOT" }] }),
  component: ApplyPage,
});

type FormState = {
  legalName: string;
  countryOfResidence: string;
  phoneNumber: string;
  nationalId: string;
  dateOfBirth: string;
  sourceOfIncome: string;
  ventureName: string;
  businessRegNumber: string;
  countryOfRegistration: string;
  monthlyRevenue: string;
  monthlyExpenses: string;
  outstandingDebts: string;
  amountRequested: string;
  purpose: string;
  repaymentPeriodMonths: string;
  collateral: string;
  termsAccepted: boolean;
  fraudAcknowledged: boolean;
  verificationAuthorized: boolean;
};

const emptyForm = (ventureName = ""): FormState => ({
  legalName: "",
  countryOfResidence: "",
  phoneNumber: "",
  nationalId: "",
  dateOfBirth: "",
  sourceOfIncome: "",
  ventureName,
  businessRegNumber: "",
  countryOfRegistration: "",
  monthlyRevenue: "",
  monthlyExpenses: "",
  outstandingDebts: "",
  amountRequested: "",
  purpose: "",
  repaymentPeriodMonths: "12",
  collateral: "",
  termsAccepted: false,
  fraudAcknowledged: false,
  verificationAuthorized: false,
});

function ApplyPage() {
  const { user } = useDotAuth();
  const venturesQ = useQuery({ queryKey: ["my-ventures"], queryFn: getMyVenture, enabled: !!user });
  const eligibilityQ = useQuery({ queryKey: ["loan-eligibility"], queryFn: getLoanEligibility, enabled: !!user });
  const [form, setForm] = useState<FormState>(() => emptyForm(venturesQ.data?.name));

  useEffect(() => {
    if (venturesQ.data?.name && !form.ventureName) {
      setForm((f) => ({ ...f, ventureName: venturesQ.data!.name }));
    }
  }, [venturesQ.data, form.ventureName]);

  const submitMut = useMutation({
    mutationFn: submitLoanApplication,
    onSuccess: () => toast.success("Loan application submitted"),
    onError: (e: any) => toast.error(e?.message ?? "Could not submit application"),
  });

  const eligible = eligibilityQ.data?.eligible ?? null;
  const reason = eligibilityQ.data?.reason ?? null;

  const maxAmount = 10_000;

  const estimatedRepayment = useMemo(() => {
    const amount = Number(form.amountRequested || 0);
    const months = Number(form.repaymentPeriodMonths || 0);
    if (!amount || !months) return null;
    const monthly = amount / months + amount * 0.02;
    return monthly * months;
  }, [form.amountRequested, form.repaymentPeriodMonths]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) {
      toast.error("You must be signed in to apply");
      return;
    }

    if (form.amountRequested && Number(form.amountRequested) > maxAmount) {
      toast.error(`Max loan amount is ${maxAmount} DOT`);
      return;
    }

    await submitMut.mutateAsync({
      ...form,
      userId: user.id,
      monthlyRevenue: Number(form.monthlyRevenue || 0),
      monthlyExpenses: Number(form.monthlyExpenses || 0),
      amountRequested: Number(form.amountRequested || 0),
      repaymentPeriodMonths: Number(form.repaymentPeriodMonths || 12),
    });
  }

  const disabled = submitMut.isPending || eligibilityQ.isLoading;

  return (
    <AppShell>
      <PageHeader title="Apply for a Loan" subtitle="Submit a verified loan application for admin review." />

      {eligibilityQ.isLoading && <p className="mt-4 text-sm text-muted-foreground">Checking eligibility…</p>}

      {!eligibilityQ.isLoading && eligible === false && (
        <Card className="mt-6">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="size-5 text-red-500" />
            <div>
              <p className="font-medium">You don’t meet the current loan requirements</p>
              <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/loans"><ArrowLeft className="mr-2 size-4" /> Back to loans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!eligibilityQ.isLoading && eligible !== false && (
        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full legal name" required>
              <Input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} required />
            </Field>
            <Field label="Country of residence" required>
              <Select value={form.countryOfResidence} onValueChange={(v) => update("countryOfResidence", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone number" required>
              <Input value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} required />
            </Field>
            <Field label="National ID / Passport" required>
              <Input value={form.nationalId} onChange={(e) => update("nationalId", e.target.value)} required />
            </Field>
            <Field label="Date of birth" required>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required />
            </Field>
            <Field label="Source of income" required>
              <Textarea value={form.sourceOfIncome} onChange={(e) => update("sourceOfIncome", e.target.value)} required />
            </Field>
            <Field label="Venture name">
              <Input value={form.ventureName} onChange={(e) => update("ventureName", e.target.value)} />
            </Field>
            <Field label="Business registration number" required>
              <Input value={form.businessRegNumber} onChange={(e) => update("businessRegNumber", e.target.value)} required />
            </Field>
            <Field label="Country of registration" required>
              <Select value={form.countryOfRegistration} onValueChange={(v) => update("countryOfRegistration", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Monthly revenue (DOT)" required>
              <Input type="number" value={form.monthlyRevenue} onChange={(e) => update("monthlyRevenue", e.target.value)} required />
            </Field>
            <Field label="Monthly expenses (DOT)" required>
              <Input type="number" value={form.monthlyExpenses} onChange={(e) => update("monthlyExpenses", e.target.value)} required />
            </Field>
            <Field label="Outstanding debts" required>
              <Textarea value={form.outstandingDebts} onChange={(e) => update("outstandingDebts", e.target.value)} required />
            </Field>
            <Field label="Amount requested (DOT)" required>
              <Input type="number" max={maxAmount} value={form.amountRequested} onChange={(e) => update("amountRequested", e.target.value)} required />
            </Field>
            <Field label="Purpose (100-1000 chars)" required>
              <Textarea value={form.purpose} onChange={(e) => update("purpose", e.target.value)} required />
            </Field>
            <Field label="Repayment period" required>
              <Select value={form.repaymentPeriodMonths} onValueChange={(v) => update("repaymentPeriodMonths", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Collateral (optional)">
              <Textarea value={form.collateral} onChange={(e) => update("collateral", e.target.value)} />
            </Field>
          </div>

          {estimatedRepayment !== null && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium">Estimated total repayment</p>
                <p className="font-display text-2xl font-bold tabular-nums">{estimatedRepayment.toFixed(2)} DOT</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.termsAccepted} onChange={(e) => update("termsAccepted", e.target.checked)} />
              I have read and accept the Loan Terms and Conditions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.fraudAcknowledged} onChange={(e) => update("fraudAcknowledged", e.target.checked)} />
              I understand that providing false information is fraud
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.verificationAuthorized} onChange={(e) => update("verificationAuthorized", e.target.checked)} />
              I authorize DOT to verify my information
            </label>
          </div>

          <Button type="submit" disabled={disabled} className="w-full">
            {disabled ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      )}
    </AppShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      {children}
    </div>
  );
}
