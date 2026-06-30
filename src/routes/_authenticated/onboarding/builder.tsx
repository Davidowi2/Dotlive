/**
 * /onboarding/builder — Professional builder profile setup wizard.
 *
 * 3-step wizard for builders to create a LinkedIn-style professional profile:
 *   Step 1: Skills (min 3 skills required)
 *   Step 2: Rates & Experience (hourly rate, experience level, location)
 *   Step 3: Bio & Portfolio (professional bio, website, LinkedIn, GitHub)
 *
 * This runs after role selection for builders during onboarding.
 */

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Hammer, ArrowRight, ArrowLeft, Check, Sparkles, DollarSign, User,
  Globe, Linkedin, Github, MapPin, Briefcase, Star,
} from "lucide-react";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi, ApiError } from "@/api/client";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WORK_CATEGORIES, AFRICAN_COUNTRIES, formatDot } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding/builder")({
  head: () => ({ meta: [{ title: "Builder Profile Setup — DOT" }] }),
  component: BuilderOnboarding,
});

type Step = 1 | 2 | 3;

// Suggested skills based on categories - builders can add custom ones too
const SUGGESTED_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "JavaScript", "HTML/CSS",
  "Figma", "UI/UX Design", "Graphic Design", "Adobe Photoshop", "Illustrator",
  "Content Writing", "Copywriting", "SEO", "Social Media Marketing",
  "Video Editing", "Photography", "Motion Graphics",
  "Data Analysis", "Excel", "SQL", "Machine Learning",
  "Project Management", "Customer Support", "Sales",
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level", desc: "0-2 years" },
  { value: "intermediate", label: "Intermediate", desc: "2-5 years" },
  { value: "expert", label: "Expert", desc: "5+ years" },
] as const;

function BuilderOnboarding() {
  const navigate = useNavigate();
  const { user, refresh } = useDotAuth();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);

  // Step 1: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  // Step 2: Rates & Experience
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [location, setLocation] = useState("");

  // Step 3: Bio & Portfolio
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [available, setAvailable] = useState(true);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  }

  function addCustomSkill() {
    const skill = customSkill.trim();
    if (!skill) return;
    if (selectedSkills.includes(skill)) {
      toast.error("Skill already added");
      return;
    }
    setSelectedSkills((prev) => [...prev, skill]);
    setCustomSkill("");
  }

  function removeSkill(skill: string) {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSkills.length < 3) {
      toast.error("Please select at least 3 skills");
      return;
    }
    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }
    if (!experienceLevel) {
      toast.error("Please select your experience level");
      return;
    }
    setStep(3);
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!headline.trim()) {
      toast.error("Please enter a professional headline");
      return;
    }
    if (!bio.trim() || bio.trim().length < 50) {
      toast.error("Please write a bio of at least 50 characters");
      return;
    }

    setBusy(true);
    try {
      // Save builder profile
      await dotApi.post("/api/users/me/builder-profile", {
        headline: headline.trim(),
        bio: bio.trim(),
        skills: selectedSkills,
        hourlyDot: Number(hourlyRate),
        experienceLevel,
        location: location || undefined,
        portfolioUrl: portfolioUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        available,
      });

      await refresh();
      toast.success("Builder profile created!");
      
      // Check if they came from onboarding flow
      const fromOnboarding = sessionStorage.getItem("dot_onboarding_builder");
      if (fromOnboarding) {
        sessionStorage.removeItem("dot_onboarding_builder");
        // Return to main onboarding to complete consent step
        navigate({ to: "/onboarding" });
      } else {
        // Direct access - go to dashboard
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : "Could not save profile";
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border/60 bg-background/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {/* Progress bar */}
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              className="text-muted-foreground hover:text-foreground"
              disabled={busy}
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  s <= step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Step {step} of 3</span>
        </div>

        {/* ── STEP 1: Skills ── */}
        {step === 1 && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Hammer className="size-3" /> Builder Profile Setup
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">
                What are your skills?
              </h1>
              <p className="mt-2 text-muted-foreground">
                {user?.name ? `${user.name.split(" ")[0]}, ` : ""}
                Select at least 3 skills. These help clients find you.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="mt-8 space-y-6">
              {/* Selected skills */}
              {selectedSkills.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Your Skills ({selectedSkills.length})
                    </Label>
                    {selectedSkills.length >= 3 && (
                      <Badge variant="default" className="text-[10px]">
                        <Check className="mr-1 size-3" /> Ready
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom skill */}
              <div className="space-y-2">
                <Label htmlFor="custom-skill">Add a skill not listed below</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-skill"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="e.g. Webflow, 3D Modeling"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addCustomSkill} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              {/* Suggested skills */}
              <div className="space-y-2">
                <Label>Or pick from popular skills</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:border-primary/60"
                      onClick={() => toggleSkill(skill)}
                    >
                      {selectedSkills.includes(skill) && <Check className="mr-1 size-3" />}
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={selectedSkills.length < 3}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </>
        )}

        {/* ── STEP 2: Rates & Experience ── */}
        {step === 2 && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <DollarSign className="size-3" /> Rates & Experience
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">
                What's your hourly rate?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Set your rate in DOT. Clients see this on your profile.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="mx-auto mt-8 max-w-lg space-y-5">
              <div className="space-y-2">
                <Label htmlFor="hourly-rate">Hourly rate (DOT)</Label>
                <div className="relative">
                  <Input
                    id="hourly-rate"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="500"
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    DOT/hr
                  </span>
                </div>
                {hourlyRate && Number(hourlyRate) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ ₦{(Number(hourlyRate) * 15).toLocaleString()} per hour
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Experience level</Label>
                <div className="grid gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setExperienceLevel(level.value)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-primary/40",
                        experienceLevel === level.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      )}
                    >
                      <div>
                        <p className="font-medium">{level.label}</p>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                      </div>
                      {experienceLevel === level.value && (
                        <Check className="size-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Where are you based? (Optional)</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  className="flex-1"
                  disabled={!hourlyRate || !experienceLevel}
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: Bio & Portfolio ── */}
        {step === 3 && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <User className="size-3" /> Professional Profile
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">
                Tell clients about yourself
              </h1>
              <p className="mt-2 text-muted-foreground">
                Create your LinkedIn-style professional profile
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="mx-auto mt-8 max-w-lg space-y-5">
              <div className="space-y-2">
                <Label htmlFor="headline">Professional headline</Label>
                <Input
                  id="headline"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Full-stack Developer | React & Node.js Expert"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  A one-line summary of what you do (max 100 chars)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About you</Label>
                <Textarea
                  id="bio"
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients what you do, who you've worked with, and what makes your work different. Be specific and professional."
                  rows={6}
                  minLength={50}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/1000 characters (minimum 50)
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Portfolio & Social Links (Optional)
                </Label>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <Label htmlFor="portfolio" className="text-sm font-normal">
                      Portfolio / Website
                    </Label>
                  </div>
                  <Input
                    id="portfolio"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Linkedin className="size-4 text-muted-foreground" />
                    <Label htmlFor="linkedin" className="text-sm font-normal">
                      LinkedIn Profile
                    </Label>
                  </div>
                  <Input
                    id="linkedin"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Github className="size-4 text-muted-foreground" />
                    <Label htmlFor="github" className="text-sm font-normal">
                      GitHub Profile
                    </Label>
                  </div>
                  <Input
                    id="github"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">Available for hire</span>
                    <p className="text-xs text-muted-foreground">
                      Show clients you're accepting new projects
                    </p>
                  </div>
                </label>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                <p className="font-medium">Profile summary:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Skills: <strong className="text-foreground">{selectedSkills.length} skills</strong></li>
                  <li>Rate: <strong className="text-foreground">{formatDot(Number(hourlyRate))} DOT/hr</strong></li>
                  <li>Experience: <strong className="text-foreground">
                    {EXPERIENCE_LEVELS.find((l) => l.value === experienceLevel)?.label}
                  </strong></li>
                  {location && <li>Location: <strong className="text-foreground">{location}</strong></li>}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  className="flex-1"
                  disabled={busy || !headline.trim() || bio.trim().length < 50}
                >
                  {busy ? "Creating profile..." : "Complete profile"}
                  <Sparkles className="size-4" />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
