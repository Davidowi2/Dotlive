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

export const FOUNDER_SECTIONS: VantageSection[] = [
  {
    key: "venture_stage",
    label: "Venture Stage",
    description: "How far along is the venture?",
    maxScore: 200,
    questions: [
      { id: "f1", text: "What is your current venture stage?", type: "select", maxScore: 200, options: [{ label: "Idea", score: 0 }, { label: "Building", score: 50 }, { label: "Launched", score: 100 }, { label: "Scaling", score: 150 }, { label: "Mature", score: 200 }] },
      { id: "f2", text: "How long has your venture been actively operating?", type: "select", maxScore: 80, options: [{ label: "<3 months", score: 0 }, { label: "3-6 months", score: 20 }, { label: "6-12 months", score: 40 }, { label: "1-2 years", score: 60 }, { label: "2+ years", score: 80 }] },
      { id: "f3", text: "Do you have a registered business entity?", type: "select", maxScore: 40, options: [{ label: "No, still informal", score: 0 }, { label: "Yes, registered in one country", score: 20 }, { label: "Yes, registered in multiple African countries", score: 40 }] },
      { id: "f4", text: "How many full-time team members do you have (including yourself)?", type: "select", maxScore: 50, options: [{ label: "Just me", score: 0 }, { label: "2-3", score: 15 }, { label: "4-10", score: 30 }, { label: "11+", score: 50 }] },
      { id: "f5", text: "What's your monthly revenue range (USD)?", type: "select", maxScore: 80, options: [{ label: "Pre-revenue", score: 0 }, { label: "<$1,000/month", score: 10 }, { label: "$1,000-$10,000/month", score: 30 }, { label: "$10,000-$100,000/month", score: 50 }, { label: "$100,000+/month", score: 80 }] },
    ],
  },
  {
    key: "traction",
    label: "Traction",
    description: "Customers, growth and retention.",
    maxScore: 200,
    questions: [
      { id: "f6", text: "How many active users/customers do you have?", type: "select", maxScore: 70, options: [{ label: "0-10", score: 0 }, { label: "11-100", score: 15 }, { label: "101-1,000", score: 30 }, { label: "1,001-10,000", score: 50 }, { label: "10,000+", score: 70 }] },
      { id: "f7", text: "What's your month-over-month growth rate?", type: "select", maxScore: 50, options: [{ label: "Negative or 0%", score: 0 }, { label: "1-5%", score: 10 }, { label: "5-15%", score: 20 }, { label: "15-30%", score: 30 }, { label: "30%+", score: 50 }] },
      { id: "f8", text: "What's your customer retention rate (after 30 days)?", type: "select", maxScore: 40, options: [{ label: "Don't know", score: 0 }, { label: "<20%", score: 5 }, { label: "20-40%", score: 15 }, { label: "40-70%", score: 30 }, { label: "70%+", score: 40 }] },
      { id: "f9", text: "Have you received any external funding?", type: "select", maxScore: 70, options: [{ label: "No, bootstrapped", score: 0 }, { label: "Yes, <$10K", score: 15 }, { label: "Yes, $10K-$100K", score: 30 }, { label: "Yes, $100K-$1M", score: 50 }, { label: "Yes, $1M+", score: 70 }] },
      { id: "f10", text: "Do you have paying customers?", type: "select", maxScore: 40, options: [{ label: "No", score: 0 }, { label: "Yes, inconsistently", score: 10 }, { label: "Yes, consistent monthly", score: 25 }, { label: "Yes, annual contracts", score: 40 }] },
    ],
  },
  {
    key: "team",
    label: "Team",
    description: "Experience, depth and advisors.",
    maxScore: 150,
    questions: [
      { id: "f11", text: "Rate your team's industry experience (1-10).", type: "scale", maxScore: 50, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 20 }, { label: "7-8", score: 35 }, { label: "9-10", score: 50 }] },
      { id: "f12", text: "Has your team built and shipped a product before?", type: "select", maxScore: 40, options: [{ label: "No", score: 0 }, { label: "As employees", score: 20 }, { label: "As founders of previous venture", score: 40 }] },
      { id: "f13", text: "Do you have advisors?", type: "select", maxScore: 30, options: [{ label: "No", score: 0 }, { label: "Informal advisors", score: 15 }, { label: "Formal board", score: 30 }] },
      { id: "f14", text: "Rate technical depth (1-10).", type: "scale", maxScore: 30, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 15 }, { label: "7-8", score: 25 }, { label: "9-10", score: 30 }] },
    ],
  },
  {
    key: "market_model",
    label: "Market & Model",
    description: "Unit economics and competitive position.",
    maxScore: 150,
    questions: [
      { id: "f15", text: "Target market size?", type: "select", maxScore: 60, options: [{ label: "<100K", score: 0 }, { label: "100K-1M", score: 20 }, { label: "1M-10M", score: 40 }, { label: "10M+", score: 60 }] },
      { id: "f16", text: "How do you make money?", type: "text", maxScore: 40 },
      { id: "f17", text: "Lifetime value vs customer acquisition cost (LTV vs CAC)?", type: "select", maxScore: 30, options: [{ label: "Don't know", score: 0 }, { label: "LTV < CAC", score: 5 }, { label: "LTV ≈ CAC", score: 15 }, { label: "LTV > CAC", score: 20 }, { label: "LTV > 2x CAC", score: 30 }] },
      { id: "f18", text: "Competitive moat?", type: "select", maxScore: 20, options: [{ label: "None", score: 0 }, { label: "Slight differentiation", score: 10 }, { label: "Strong moat", score: 20 }] },
    ],
  },
  {
    key: "founder_credibility",
    label: "Founder Credibility",
    description: "Commitment, prior work and self-awareness.",
    maxScore: 200,
    questions: [
      { id: "f19", text: "Personal commitment (1-10).", type: "scale", maxScore: 60, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 20 }, { label: "7-8", score: 40 }, { label: "9-10", score: 60 }] },
      { id: "f20", text: "Prior work on this venture?", type: "select", maxScore: 40, options: [{ label: "No prior work", score: 0 }, { label: "Research only", score: 15 }, { label: "Failed attempt", score: 25 }, { label: "Multiple iterations shipped", score: 40 }] },
      { id: "f21", text: "Why are you building this?", type: "text", maxScore: 50 },
      { id: "f22", text: "Biggest risk awareness?", type: "select", maxScore: 50, options: [{ label: "Don't know", score: 0 }, { label: "Know risk, no plan", score: 10 }, { label: "Know risk with concrete plan", score: 30 }, { label: "Survived it before", score: 50 }] },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    description: "Optional uploads to strengthen verification.",
    maxScore: 100,
    questions: [
      { id: "f23", text: "Upload pitch deck.", type: "file", maxScore: 40 },
      { id: "f24", text: "Upload financials.", type: "file", maxScore: 30 },
      { id: "f25", text: "Upload traction report.", type: "file", maxScore: 30 },
    ],
  },
];

export const FOUNDER_QUESTIONS = FOUNDER_SECTIONS.flatMap((s) => s.questions);

export function scoreFounderAssessment(answers: Record<string, string | number | undefined>) {
  const sectionScores: Record<string, number> = {};
  let total = 0;
  for (const section of FOUNDER_SECTIONS) {
    let sectionSum = 0;
    for (const q of section.questions) {
      const raw = answers[q.id];
      let score = 0;
      if (q.type === "file") {
        score = typeof raw === "string" && raw.trim().length > 0 ? q.maxScore ?? 0 : 0;
      } else if (q.type === "text") {
        const trimmed = typeof raw === "string" ? raw.trim() : "";
        if (!trimmed) score = 0;
        else if (trimmed.length < 30) score = 5;
        else if (trimmed.length < 80) score = Math.round((q.maxScore ?? 40) * 0.375);
        else score = q.maxScore ?? 40;
      } else if (q.type === "scale") {
        const opt = q.options?.find((o) => o.label === raw);
        score = opt?.score ?? 0;
      } else if (q.type === "select") {
        const opt = q.options?.find((o) => o.label === raw);
        score = opt?.score ?? 0;
      }
      sectionSum += score;
    }
    sectionScores[section.key] = sectionSum;
    total += sectionSum;
  }

  let badge = "Unverified";
  if (total >= 850) badge = "Elite";
  else if (total >= 700) badge = "Ready to Raise";
  else if (total >= 500) badge = "Established";
  else if (total >= 300) badge = "Emerging";
  else if (total >= 100) badge = "Building";

  return { totalScore: Math.min(total, 1000), sectionScores, badge };
}
