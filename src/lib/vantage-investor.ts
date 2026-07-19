export interface VantageOption {
  label: string;
  score: number;
}
export interface VantageQuestion {
  id: string;
  text: string;
  type: "select" | "scale" | "text" | "file";
  maxScore?: number;
  options?: VantageOption[];
}
export interface VantageSection {
  key: string;
  label: string;
  description?: string;
  maxScore: number;
  questions: VantageQuestion[];
}

export const INVESTOR_SECTIONS: VantageSection[] = [
  {
    key: "track_record",
    label: "Track Record",
    description: "Deployment volume and outcomes.",
    maxScore: 250,
    questions: [
      { id: "i1", text: "How many investments have you made?", type: "select", maxScore: 120, options: [{ label: "0", score: 0 }, { label: "1-3", score: 20 }, { label: "4-10", score: 50 }, { label: "11-25", score: 80 }, { label: "26+", score: 120 }] },
      { id: "i2", text: "Total capital deployed?", type: "select", maxScore: 150, options: [{ label: "<$10K", score: 0 }, { label: "$10K-$100K", score: 30 }, { label: "$100K-$1M", score: 60 }, { label: "$1M-$10M", score: 100 }, { label: "$10M+", score: 150 }] },
      { id: "i3", text: "Exits?", type: "select", maxScore: 60, options: [{ label: "0", score: 0 }, { label: "1-2", score: 15 }, { label: "3-5", score: 35 }, { label: "6+", score: 60 }] },
      { id: "i4", text: "Active investments?", type: "select", maxScore: 50, options: [{ label: "0", score: 0 }, { label: "1-5", score: 15 }, { label: "6-15", score: 30 }, { label: "16+", score: 50 }] },
      { id: "i5", text: "Success rate (1-10).", type: "scale", maxScore: 70, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 30 }, { label: "7-8", score: 50 }, { label: "9-10", score: 70 }] },
    ],
  },
  {
    key: "investment_style",
    label: "Investment Style",
    description: "Check size, stage and pacing.",
    maxScore: 150,
    questions: [
      { id: "i6", text: "Typical check size?", type: "select", maxScore: 50, options: [{ label: "<$10K", score: 10 }, { label: "$10K-$50K", score: 20 }, { label: "$50K-$250K", score: 30 }, { label: "$250K-$1M", score: 40 }, { label: "$1M+", score: 50 }] },
      { id: "i7", text: "Preferred stage?", type: "select", maxScore: 30, options: [{ label: "Idea", score: 5 }, { label: "Pre-seed", score: 10 }, { label: "Seed", score: 20 }, { label: "Series A", score: 15 }, { label: "Multi-stage", score: 30 }] },
      { id: "i8", text: "Deals per year?", type: "select", maxScore: 50, options: [{ label: "0-1", score: 0 }, { label: "2-3", score: 15 }, { label: "4-10", score: 30 }, { label: "11+", score: 50 }] },
      { id: "i9", text: "Lead/follow posture?", type: "select", maxScore: 30, options: [{ label: "Follow", score: 10 }, { label: "Co-lead", score: 20 }, { label: "Lead", score: 30 }] },
    ],
  },
  {
    key: "domain_expertise",
    label: "Domain Expertise",
    description: "Sector depth and operational knowledge.",
    maxScore: 100,
    questions: [
      { id: "i10", text: "Investment sectors.", type: "select", maxScore: 10, options: [{ label: "Climate", score: 10 }, { label: "Fintech", score: 10 }, { label: "Health", score: 10 }, { label: "SaaS", score: 10 }, { label: "Infrastructure", score: 10 }, { label: "Consumer", score: 10 }] },
      { id: "i11", text: "Years in primary sector?", type: "select", maxScore: 40, options: [{ label: "<2 years", score: 0 }, { label: "2-5 years", score: 15 }, { label: "5-10 years", score: 25 }, { label: "10+ years", score: 40 }] },
      { id: "i12", text: "Operational expertise narrative.", type: "text", maxScore: 30 },
    ],
  },
  {
    key: "network_support",
    label: "Network & Support",
    description: "Access and follow-on help.",
    maxScore: 100,
    questions: [
      { id: "i13", text: "Founders in your network?", type: "select", maxScore: 50, options: [{ label: "0-2", score: 0 }, { label: "3-10", score: 20 }, { label: "11-30", score: 35 }, { label: "31+", score: 50 }] },
      { id: "i14", text: "Support beyond capital?", type: "select", maxScore: 20, options: [{ label: "Capital only", score: 0 }, { label: "Intro + operational advice", score: 10 }, { label: "Active board support", score: 20 }] },
      { id: "i15", text: "Follow-on funding help?", type: "select", maxScore: 30, options: [{ label: "No help", score: 0 }, { label: "1-2 rounds", score: 15 }, { label: "3+ rounds", score: 30 }] },
    ],
  },
  {
    key: "credibility_motivation",
    label: "Credibility & Motivation",
    description: "Thesis and decision awareness.",
    maxScore: 100,
    questions: [
      { id: "i16", text: "Why do you invest?", type: "text", maxScore: 30 },
      { id: "i17", text: "Investment thesis.", type: "text", maxScore: 40 },
      { id: "i18", text: "What have failed investments taught you?", type: "text", maxScore: 30 },
      { id: "i19", text: "Post-investment involvement?", type: "select", maxScore: 20, options: [{ label: "Passive", score: 0 }, { label: "Advisory only", score: 5 }, { label: "Board observer", score: 10 }, { label: "Board seat", score: 20 }] },
      { id: "i20", text: "Portfolio concentration?", type: "select", maxScore: 20, options: [{ label: "Single large bet", score: 0 }, { label: "3-5 focused bets", score: 10 }, { label: "Diversified 10+", score: 20 }] },
    ],
  },
];

export const INVESTOR_QUESTIONS = INVESTOR_SECTIONS.flatMap((s) => s.questions);

function badgeFor(total: number) {
  if (total >= 600) return "Elite";
  if (total >= 450) return "Premium";
  if (total >= 250) return "Trusted";
  if (total >= 100) return "Active";
  return "Unverified";
}

export function scoreInvestorAssessment(answers: Record<string, string | number | undefined>) {
  const sectionScores: Record<string, number> = {};
  let total = 0;
  for (const section of INVESTOR_SECTIONS) {
    let sectionSum = 0;
    for (const q of section.questions) {
      const raw = answers[q.id];
      let score = 0;
      if (q.type === "text") {
        const trimmed = typeof raw === "string" ? raw.trim() : "";
        if (!trimmed) score = 0;
        else if (trimmed.length < 30) score = 5;
        else if (trimmed.length < 80) score = Math.round((q.maxScore ?? 20) * 0.375);
        else score = q.maxScore ?? 20;
      } else if (q.type === "scale") {
        const opt = q.options?.find((o) => o.label === raw);
        score = opt?.score ?? 0;
      } else if (q.type === "select") {
        const opt = q.options?.find((o) => o.label === raw);
        score = opt?.score ?? 0;
      }
      sectionSum += score;
    }
    const capped = Math.min(sectionSum, section.maxScore);
    sectionScores[section.key] = capped;
    total += capped;
  }

  return { totalScore: Math.min(total, 800), sectionScores, badge: badgeFor(total) };
}
