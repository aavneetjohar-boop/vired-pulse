import { useState, useEffect } from "react";
import Papa from "papaparse";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CallTabProps {
  program: string;
}

const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/1P7QSoaH-PTqPiVfC1i_x_nvIpC7qyb3lS5jOf9Sxt0o/gviz/tq?tqx=out:csv&gid=";

const SHEET_GIDS: Record<string, string> = {
  DevOps: "0",
  SIL: "693973699",
  LXAI: "758683324",
};

const steps = [
  { id: "opening", label: "Opening", prompt: "Confirm their current role and situation. Are they engaging?" },
  { id: "discovery", label: "Discovery", prompt: "Use probing questions. Listen for pain points, gaps, frustration, or lack of growth." },
  { id: "insight", label: "Insight + Hook", prompt: "Do they resonate with them? Look for agreement or acknowledgment." },
  { id: "mapping", label: "Mapping", prompt: "Check if they see relevance. Are they connecting it to their goals?" },
  { id: "proof", label: "Proof", prompt: "Use this to build trust. Watch for curiosity or interest." },
  { id: "objection", label: "Objections", prompt: "Encourage concerns. Real objections = buying intent." },
  { id: "close", label: "Close", prompt: "Look for readiness. Are they open to next steps?" },
];

export default function CallTab({ program }: CallTabProps) {
  const [flowData, setFlowData] = useState<any>({});
  const [selectedPersona, setSelectedPersona] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedObjectionIdx, setSelectedObjectionIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallData();
  }, [program]);

  /* 🔥 CLEAN TEXT */
  const cleanText = (text: string) => {
    if (!text) return "";

    return text
      .replace(/"""/g, "")
      .replace(/^"|"$/g, "")
      .replace(/\|\|/g, "\n")
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  };

  /* 🔥 LOAD DATA (FIXED) */
  const loadCallData = async () => {
    try {
      setLoading(true);

      const url = SHEET_BASE + SHEET_GIDS[program];
      const res = await fetch(url);
      const csvText = await res.text();

      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      const data = parsed.data as any[];

      const newFlowData: any = {};

      data.forEach((row: any) => {
        const persona = (row["Persona"] || "").trim();
        if (!persona || newFlowData[persona]) return;

        const proofs: any[] = [];

        Object.keys(row).forEach((key) => {
          if (key.includes("Proof") && key.includes("Title")) {
            const index = key.match(/\d+/)?.[0];
            const title = cleanText(row[`Proof${index}_Title`]);
            const link = cleanText(row[`Proof${index}_Link`]);

            if (title && link) {
              proofs.push({ title, link });
            }
          }
        });

        newFlowData[persona] = {
          opening: cleanText(row["Opening"]),
          discovery: cleanText(row["Discovery"]),
          insight: cleanText(row["Insight"]),
          hook: cleanText(row["Hook"]),
          mapping: cleanText(row["Mapping"]),

          objections: [
            { trigger: cleanText(row["Objection1_Trigger"]), response: cleanText(row["Objection1_Response"]) },
            { trigger: cleanText(row["Objection2_Trigger"]), response: cleanText(row["Objection2_Response"]) },
            { trigger: cleanText(row["Objection3_Trigger"]), response: cleanText(row["Objection3_Response"]) },
            { trigger: cleanText(row["Objection4_Trigger"]), response: cleanText(row["Objection4_Response"]) },
            { trigger: cleanText(row["Objection5_Trigger"]), response: cleanText(row["Objection5_Response"]) },
          ].filter((o) => o.trigger),

          proof: proofs,
          close: cleanText(row["Close"]),
        };
      });

      setFlowData(newFlowData);

      const personas = Object.keys(newFlowData);
      if (personas.length > 0) setSelectedPersona(personas[0]);

    } catch (err) {
      console.error("Error loading call data:", err);
    } finally {
      setLoading(false);
    }
  };

  const personas = Object.keys(flowData);
  const currentData = flowData[selectedPersona];
  const step = steps[currentStep];

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Loading call flow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PERSONA SELECT */}
      <div className="glass-card p-6">
        <label className="block text-white/60 text-sm mb-2">Select Persona</label>

        <Select
          value={selectedPersona}
          onValueChange={(value) => {
            setSelectedPersona(value);
            setCurrentStep(0);
            setSelectedObjectionIdx(null);
          }}
        >
          <SelectTrigger className="w-full bg-gray-900 text-white border border-gray-700">
            <SelectValue placeholder="Select Persona" />
          </SelectTrigger>

          <SelectContent className="bg-gray-900 text-white border border-gray-700">
            {personas.map((persona) => (
              <SelectItem key={persona} value={persona}>
                {persona}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STEP HEADER + PRO TIP */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-2">
          Step {currentStep + 1} of {steps.length} — {step.label}
        </h3>
        <p className="text-white/70">💡 {step.prompt}</p>
      </div>

      {/* CONTENT */}
      {currentData && (
        <div className="glass-card p-6 space-y-6">

          {currentStep === 0 && <p className="text-white/80 whitespace-pre-line">{currentData.opening}</p>}
          {currentStep === 1 && <p className="text-white/80 whitespace-pre-line">{currentData.discovery}</p>}

          {currentStep === 2 && (
            <>
              <p className="text-white/80 whitespace-pre-line">{currentData.insight}</p>
              <p className="text-white/80 whitespace-pre-line">{currentData.hook}</p>
            </>
          )}

          {currentStep === 3 && <p className="text-white/80 whitespace-pre-line">{currentData.mapping}</p>}

          {currentStep === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {currentData.proof.map((p: any, idx: number) => (
                <a key={idx} href={p.link} target="_blank" className="vired-btn text-center py-2">
                  {p.title}
                </a>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              {currentData.objections.map((o: any, idx: number) => (
                <div key={idx}>
                  <button
                    onClick={() =>
                      setSelectedObjectionIdx(
                        selectedObjectionIdx === idx ? null : idx
                      )
                    }
                    className="w-full text-left px-4 py-3 bg-white/5 text-white rounded-lg"
                  >
                    {o.trigger}
                  </button>

                  {selectedObjectionIdx === idx && (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg whitespace-pre-line">
                      {o.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep === 6 && <p className="text-white/80 whitespace-pre-line">{currentData.close}</p>}

          {/* 🔥 NAV (RESTORED PROPERLY) */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="vired-btn-secondary"
            >
              ← Back
            </button>

            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              className="vired-btn"
            >
              Next →
            </button>
          </div>

        </div>
      )}
    </div>
  );
}