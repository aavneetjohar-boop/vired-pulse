import { useState, useEffect } from "react";
import Papa from "papaparse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEVOPS_SYSTEM_PROMPT } from "@/lib/aiconfigDevops";

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

const SHEET_BASE = "https://docs.google.com/spreadsheets/d/1P7QSoaH-PTqPiVfC1i_x_nvIpC7qyb3lS5jOf9Sxt0o/gviz/tq?tqx=out:csv&gid=";
const SHEET_GIDS: Record<string, string> = {
  DevOps: "0",
  SIL: "693973699",
  LXAI: "758683324",
};

const steps = [
  { id: "opening", label: "Opening", prompt: "Confirm their current role and situation. Are they engaging?" },
  { id: "discovery", label: "Discovery", prompt: "Use probing questions. Listen for pain points, gaps, frustration, or lack of growth." },
  { id: "insight", label: "Insight + Hook", prompt: "Do they resonate? Look for agreement or acknowledgment." },
  { id: "mapping", label: "Mapping", prompt: "Check if they see relevance. Are they connecting it to their goals?" },
  { id: "proof", label: "Proof", prompt: "Use this to build trust. Watch for curiosity or interest." },
  { id: "objection", label: "Objections", prompt: "Encourage concerns. Real objections = buying intent." },
  { id: "close", label: "Close", prompt: "Look for readiness. Are they open to next steps?" },
];

export default function CallTab({ program }: CallTabProps) {
  // --- CORE STATE ---
  const [flowData, setFlowData] = useState<any>({});
  const [selectedPersona, setSelectedPersona] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedObjectionIdx, setSelectedObjectionIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // --- AI ENGINE STATE ---
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiFlowData, setAiFlowData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ctc, setCtc] = useState("");
  const [yearsExp, setYearsExp] = useState("");

  useEffect(() => {
    loadCallData();
  }, [program]);

  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/"""/g, "").replace(/^"|"$/g, "").replace(/\|\|/g, "\n").replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim();
  };

  const loadCallData = async () => {
    try {
      setLoading(true);
      const res = await fetch(SHEET_BASE + SHEET_GIDS[program]);
      const csvText = await res.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
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
            if (title && link) proofs.push({ title, link });
          }
        });

        newFlowData[persona] = {
          opening: cleanText(row["Opening"]),
          discovery: cleanText(row["Discovery"]),
          insight: cleanText(row["Insight"]),
          hook: cleanText(row["Hook"]),
          mapping: cleanText(row["Mapping"]),
          objections: Array.from({length: 8}, (_, i) => ({
            trigger: cleanText(row[`Objection${i+1}_Trigger`]),
            response: cleanText(row[`Objection${i+1}_Response`])
          })).filter(o => o.trigger),
          proof: proofs,
          close: cleanText(row["Close"]),
        };
      });

      setFlowData(newFlowData);
      const personas = Object.keys(newFlowData);
      if (personas.length > 0) setSelectedPersona(personas[0]);
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- SMART MODE: GEMINI AI LOGIC ---
  const handleResumeUpload = async (file: File | undefined) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      alert("AI Configuration missing. Please check your .env file.");
      return;
    }

    if (!file || !ctc || !yearsExp) {
      alert("Please enter CTC and Years of Experience before uploading.");
      return;
    }
    
    setIsAnalyzing(true);
    setIsAiMode(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const readFileAsBase64 = (f: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
      };

      const base64Data = await readFileAsBase64(file);

      const prompt = DEVOPS_SYSTEM_PROMPT(ctc, yearsExp);
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "application/pdf" } }
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      
      const sanitizedJson = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      const parsedData = JSON.parse(sanitizedJson);

      if (parsedData.error) throw new Error("Resume unreadable");

      setAiFlowData(parsedData);
      setCurrentStep(0);
      setSelectedObjectionIdx(null);

    } catch (err) {
      console.error("AI Mapping failed:", err);
      alert("Could not process resume. Reverting to standard persona mode.");
      setIsAiMode(false);
      setAiFlowData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentData = isAiMode ? aiFlowData : flowData[selectedPersona];
  const standardData = flowData[selectedPersona] || {}; // Backup for Proof/Objections
  const step = steps[currentStep];

  if (loading) return <div className="glass-card p-8 text-center text-white/60">Loading call flow...</div>;

  return (
    <div className="space-y-6">
      
      {/* SELECTION HEADER */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Option A: Select Persona</label>
          <Select
            value={isAiMode ? "" : selectedPersona}
            onValueChange={(val) => {
              setIsAiMode(false);
              setSelectedPersona(val);
              setCurrentStep(0);
              setAiFlowData(null);
            }}
          >
            <SelectTrigger className="w-full bg-slate-900/50 text-white border-white/10 h-11">
              <SelectValue placeholder="Standard Personas" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white border-white/10">
              {Object.keys(flowData).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 border-l border-white/10 pl-6">
          <label className="text-primary/80 text-[10px] uppercase font-bold tracking-wider">Option B: AI Resume Mapping</label>
          <div className="flex gap-2">
            <input 
              type="number" placeholder="CTC" value={ctc} onChange={(e) => setCtc(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-2 text-xs text-white outline-none focus:border-primary/50"
            />
            <input 
              type="number" placeholder="Exp" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-2 text-xs text-white outline-none focus:border-primary/50"
            />
            <input 
              type="file" id="resume-input" className="hidden" accept=".pdf"
              onChange={(e) => handleResumeUpload(e.target.files?.[0])}
            />
            <button 
              onClick={() => document.getElementById('resume-input')?.click()}
              disabled={isAnalyzing}
              className={`flex-1 text-[11px] font-bold uppercase rounded transition-all ${
                isAnalyzing ? "bg-white/10 text-white/40 cursor-not-allowed" : "vired-btn"
              }`}
            >
              {isAnalyzing ? "Analyzing..." : "Personalize Script ✨"}
            </button>
          </div>
        </div>
      </div>

      {/* STEP HEADER */}
      <div className="glass-card p-6 border-l-4 border-primary">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-bold text-white">
            {isAiMode && <span className="text-primary mr-2">✨ AI</span>}
            Step {currentStep + 1} — {step.label}
          </h3>
          {isAiMode && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">Personalized</span>}
        </div>
        <p className="text-white/60 text-xs italic">💡 {step.prompt}</p>
      </div>

      {/* SCRIPT CONTENT */}
      {currentData && (
        <div className="glass-card p-6 space-y-6 animate-in fade-in duration-500">
          
          {currentStep === 0 && <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">{currentData.opening}</p>}
          {currentStep === 1 && <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">{currentData.discovery}</p>}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">{currentData.insight}</p>
              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
                <p className="text-primary font-semibold text-sm italic">{currentData.hook}</p>
              </div>
            </div>
          )}

          {currentStep === 3 && <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">{currentData.mapping}</p>}
          
          {/* Change 1: Show all proofs from sheet for both AI and Standard modes */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(standardData.proof || []).map((p: any, idx: number) => (
                <a key={idx} href={p.link} target="_blank" rel="noopener noreferrer" className="vired-btn-secondary text-center py-2.5 text-xs">
                  {p.title}
                </a>
              ))}
              {isAiMode && standardData.proof?.length === 0 && (
                <p className="col-span-2 text-white/40 text-[10px] text-center">No standard proofs found for this program.</p>
              )}
            </div>
          )}

          {/* Change 2: Show AI objections PLUS common standard objections (now up to 8) */}
          {currentStep === 5 && (
            <div className="space-y-3">
              {/* Combine AI-specific objections with standard objections from the sheet */}
              {[...(currentData.objections || []), ...(isAiMode ? standardData.objections || [] : [])]
                .filter((v, i, a) => a.findIndex(t => t.trigger === v.trigger) === i) // Remove duplicates
                .map((o: any, idx: number) => (
                  <div key={idx}>
                    <button
                      onClick={() => setSelectedObjectionIdx(selectedObjectionIdx === idx ? null : idx)}
                      className="w-full text-left px-4 py-3 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors border border-white/5"
                    >
                      {o.trigger}
                    </button>
                    {selectedObjectionIdx === idx && (
                      <div className="mt-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-white/80 whitespace-pre-line animate-in slide-in-from-top-1">
                        {o.response}
                      </div>
                    )}
                  </div>
              ))}
            </div>
          )}

          {currentStep === 6 && <p className="text-white/90 leading-relaxed whitespace-pre-line font-medium text-sm pt-4 border-t border-white/10">{currentData.close}</p>}

          <div className="flex gap-3 pt-6 border-t border-white/10">
            <button 
              onClick={() => { setCurrentStep(Math.max(0, currentStep - 1)); setSelectedObjectionIdx(null); }} 
              disabled={currentStep === 0}
              className="vired-btn-secondary flex-1 disabled:opacity-30"
            >
              ← Back
            </button>
            <button 
              onClick={() => { setCurrentStep(Math.min(steps.length - 1, currentStep + 1)); setSelectedObjectionIdx(null); }} 
              disabled={currentStep === steps.length - 1}
              className="vired-btn flex-1 disabled:opacity-30"
            >
              Next Step →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}