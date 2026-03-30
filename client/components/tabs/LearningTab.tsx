import { useState, useEffect } from "react";
import Papa from "papaparse";

interface LearningTabProps {
  program: string;
}

const LEARN_SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/1yqqyX9pKZMBrNAS0AU9osiGWdzH7Stq_305ucN0tgF0/gviz/tq?tqx=out:csv&gid=";

const PROGRAM_SHEETS: Record<string, Record<string, string>> = {
  DevOps: {
    foundations: "0",
    personas: "1612887921",
    objections: "929831644",
    moments: "104759152",
    lines: "1397587998",
    competitors: "415140266",
  },
  SIL: { foundations: "2", personas: "2", objections: "2", moments: "2", lines: "2", competitors: "2" },
  LXAI: { foundations: "2", personas: "2", objections: "2", moments: "2", lines: "2", competitors: "2" },
};

interface LearningData {
  [key: string]: Record<string, string>[];
}

export default function LearningTab({ program }: LearningTabProps) {
  const [learningData, setLearningData] = useState<LearningData>({});
  const [currentPersona, setCurrentPersona] = useState<string | null>(null);
  const [selectedObjection, setSelectedObjection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/\r\n/g, "\n").replace(/\n+/g, "\n").replace(/^"|"$/g, "").trim();
  };

  useEffect(() => {
    loadLearningData();
  }, [program]);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      const programConfig = PROGRAM_SHEETS[program];
      if (!programConfig) return;

      const results = await Promise.all(
        Object.keys(programConfig).map(async (key) => {
          const res = await fetch(LEARN_SHEET_BASE + programConfig[key]);
          const text = await res.text();

          const { data } = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });

          return { key, data };
        })
      );

      const newData: LearningData = {};
      results.forEach((r) => (newData[r.key] = r.data as Record<string, string>[]));

      setLearningData(newData);
    } catch (err) {
      console.error("Error loading learning data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="glass-card p-8 text-center text-white/60">Loading learning centre...</div>;
  }

  const { foundations = [], personas = [], objections = [], competitors = [], moments = [], lines = [] } = learningData;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Expert Insights */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">🧠 Expert Insights</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {foundations.map((row, idx) => (
              <InsightCard key={idx} row={row} cleanText={cleanText} />
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Know Your Learner</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {personas.map((row, idx) => (
              <PersonaCard key={idx} row={row} cleanText={cleanText} setCurrentPersona={setCurrentPersona} />
            ))}
          </div>
        </div>

        {/* What Works */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">🏆 What Works</h3>

          {moments.map((m, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2 space-y-1">

              <ExpandableText
                label="🧩 Scenario"
                text={cleanText(m["Scenario"])}
              />

              <ExpandableText
                label="🔄 Pivot"
                text={cleanText(m["The \"Pivot\" or Tactic used"])}
              />

              <ExpandableText
                label="💬 Line"
                text={cleanText(lines?.[idx]?.["The \"Golden\" Line"])}
                highlight
              />

            </div>
          ))}
        </div>

        {/* Battle Cards */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-4">⚔️ Battle Cards</h3>

          {competitors.map((c, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
              <div className="font-semibold text-sm text-white">{c["Competitor"]}</div>

              <ExpandableText label="Strong" text={cleanText(c["Where they are strong:"])} />
              <ExpandableText label="Weak" text={cleanText(c["Where they are weak:"])} />
              <ExpandableText label="Edge" text={cleanText(c["Your actual advantage:"])} highlight />
            </div>
          ))}
        </div>
      </div>

      {/* Objection Engine */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Objection Engine</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {objections.map((obj, idx) => {
            const isActive = selectedObjection === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedObjection(isActive ? null : idx)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive ? "bg-primary text-white border border-primary" : "bg-white/5 text-white/70"
                }`}
              >
                {obj["Objection Statement"]}
              </button>
            );
          })}
        </div>

        {selectedObjection !== null && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
            <ExpandableText label="Why they actually say this" text={cleanText(objections[selectedObjection]["Why they actually say this"])} />
            <ExpandableText label="What LCs currently say" text={cleanText(objections[selectedObjection]["What LCs currently say (if you know)"])} />
            <ExpandableText label="What has worked" text={cleanText(objections[selectedObjection]["What has worked (if any examples)"])} />
          </div>
        )}
      </div>
    </div>
  );
}

/* Expandable Text */
const ExpandableText = ({ text, label, highlight }: any) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const short = text.slice(0, 120);

  return (
    <div className="text-xs text-white/70 mt-1 leading-relaxed">
      {label && <span className={highlight ? "text-primary" : "text-white/50"}>{label}: </span>}
      {expanded ? text : short + (text.length > 120 ? "..." : "")}

      {text.length > 120 && (
        <button
          className="ml-2 text-primary text-[10px]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

/* Persona Card */
const PersonaCard = ({ row, cleanText, setCurrentPersona }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-lg p-3 cursor-pointer"
      onClick={() => {
        setOpen(!open);
        setCurrentPersona(row["Persona Name"]);
      }}
    >
      <div className="font-semibold text-sm text-white">{row["Persona Name"]}</div>
      <div className="text-xs">💼 {cleanText(row["Current Role / Background"])}</div>
      <div className="text-xs">🎯 {cleanText(row["Primary Goal"])}</div>

      {open && (
        <div className="mt-2 space-y-1">
          <ExpandableText label="⚠️ Biggest Fear" text={cleanText(row["Biggest Fear"])} />
          <ExpandableText label="💡 Buying Trigger" text={cleanText(row["Buying Trigger"])} />
          <ExpandableText label="❌ Common Objections" text={cleanText(row["Common Objections"])} />
          <ExpandableText label="✅ What Convinces Them" text={cleanText(row["What Convinces Them"])} />
          <ExpandableText label="🚫 What Turns Them Off" text={cleanText(row["What Turns Them Off"])} />
        </div>
      )}
    </div>
  );
};

/* Insight Card */
const InsightCard = ({ row, cleanText }: any) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const sections = [
    "Target Audience",
    "Top 3 Career Outcomes",
    "Key Differentiators",
    "Top 5 Selling Points",
    "Program Price",
    "Average Scholarship",
    "Top 3 Reasons People Buy",
    "Top 3 Reasons People Hesitate",
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="font-semibold text-sm text-white mb-2">{row["Program Name"]}</div>

      {sections.map((section) => {
        const val = row[section];
        if (!val) return null;

        const isOpen = openSections[section];

        return (
          <div key={section} className="border rounded-lg mb-2">
            <div onClick={() => toggle(section)} className="px-3 py-2 flex justify-between cursor-pointer text-xs">
              <span>{section}</span>
              <span>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div className="px-3 pb-3">
                <ExpandableText text={cleanText(val)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};