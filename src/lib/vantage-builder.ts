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

export const BUILDER_SECTIONS: VantageSection[] = [
  {
    key: "skills",
    label: "Skills",
    description: "Core capabilities and depth.",
    maxScore: 150,
    questions: [
      { id: "b1", text: "What is your primary skill?", type: "select", maxScore: 50, options: [{ label: "Frontend", score: 30 }, { label: "Backend", score: 30 }, { label: "Full-stack", score: 30 }, { label: "Mobile", score: 30 }, { label: "Design", score: 30 }, { label: "Data/AI", score: 30 }, { label: "DevOps", score: 30 }] },
      { id: "b2", text: "Skill level (1-10).", type: "scale", maxScore: 50, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 25 }, { label: "7-8", score: 40 }, { label: "9-10", score: 50 }] },
      { id: "b3", text: "Years of experience?", type: "select", maxScore: 50, options: [{ label: "<1 year", score: 0 }, { label: "1-2 years", score: 15 }, { label: "3-5 years", score: 30 }, { label: "6+ years", score: 50 }] },
      { id: "b4", text: "Certifications?", type: "select", maxScore: 20, options: [{ label: "None", score: 0 }, { label: "One", score: 10 }, { label: "Multiple", score: 20 }] },
    ],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description: "Ship history and shown work.",
    maxScore: 200,
    questions: [
      { id: "b5", text: "How many projects have you built?", type: "select", maxScore: 80, options: [{ label: "0-1", score: 0 }, { label: "2-5", score: 30 }, { label: "6-10", score: 50 }, { label: "11+", score: 80 }] },
      { id: "b6", text: "Share a portfolio link or files.", type: "text", maxScore: 80 },
      { id: "b7", text: "Shipped products?", type: "select", maxScore: 40, options: [{ label: "No shipped products", score: 0 }, { label: "Personal projects", score: 20 }, { label: "Client delivery", score: 40 }] },
    ],
  },
  {
    key: "track_record",
    label: "Track Record",
    description: "Gigs, ratings and paid experience.",
    maxScore: 150,
    questions: [
      { id: "b8", text: "Gigs completed?", type: "select", maxScore: 60, options: [{ label: "0", score: 0 }, { label: "1-3", score: 20 }, { label: "4-10", score: 40 }, { label: "11+", score: 60 }] },
      { id: "b9", text: "Average rating?", type: "select", maxScore: 40, options: [{ label: "No ratings yet", score: 0 }, { label: "<4.0", score: 5 }, { label: "4.0-4.5", score: 20 }, { label: "4.6-5.0", score: 40 }] },
      { id: "b10", text: "Paid rate confidence (1-10).", type: "scale", maxScore: 50, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 25 }, { label: "7-8", score: 40 }, { label: "9-10", score: 50 }] },
    ],
  },
  {
    key: "reliability",
    label: "Reliability",
    description: "Delivery and availability.",
    maxScore: 50,
    questions: [
      { id: "b11", text: "Meeting deadlines (1-10).", type: "scale", maxScore: 35, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 15 }, { label: "7-8", score: 25 }, { label: "9-10", score: 35 }] },
      { id: "b12", text: "Availability?", type: "select", maxScore: 15, options: [{ label: "No", score: 0 }, { label: "Part-time", score: 10 }, { label: "Full-time", score: 15 }] },
    ],
  },
  {
    key: "builder_credibility",
    label: "Builder Credibility",
    description: "Motivation and communication.",
    maxScore: 100,
    questions: [
      { id: "b13", text: "Why do you do this work?", type: "text", maxScore: 40 },
      { id: "b14", text: "Proudest project?", type: "text", maxScore: 30 },
      { id: "b15", text: "Communication skills (1-10).", type: "scale", maxScore: 30, options: [{ label: "1-3", score: 0 }, { label: "4-6", score: 15 }, { label: "7-8", score: 25 }, { label: "9-10", score: 30 }] },
    ],
  },
];

export const BUILDER_QUESTIONS = BUILDER_SECTIONS.flatMap((s) => s.questions);

export function scoreBuilderAssessment(answers: Record<string, string | number | undefined>) {
  const sectionScores: Record<string, number> = {};
  let total = 0;
  for (const section of BUILDER_SECTIONS) {
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
    sectionScores[section.key] = sectionSum;
    total += sectionSum;
  }

  let badge = "Unverified";
  if (total >= 450) badge = "Elite";
  else if (total >= 300) badge = "Premium";
  else if (total >= 150) badge = "Trusted";
  else if (total >= 50) badge = "Available";

  return { totalScore: Math.min(total, 600), sectionScores, badge };
}
