import { useState } from "react";
import LearningTab from "@/components/tabs/LearningTab";
import CallTab from "@/components/tabs/CallTab";
import OpsTab from "@/components/tabs/OpsTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";

interface DashboardPageProps {
  userEmail: string;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function DashboardPage({ userEmail, isAdmin, onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<"learn" | "call" | "ops" | "analytics">("learn");
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showProgramSelector, setShowProgramSelector] = useState(true);

  const programs = ["DevOps", "SIL", "LXAI"];

  const handleSelectProgram = (program: string) => {
    setSelectedProgram(program);
    setShowProgramSelector(false);
    setActiveTab("call");
  };

  const handleChangeProgram = () => {
    setShowProgramSelector(true);
  };

  const tabs = [
    { id: "learn" as const, label: "Learning Centre" },
    { id: "call" as const, label: "Call Mode" },
    { id: "ops" as const, label: "Ops" },
    ...(isAdmin ? [{ id: "analytics" as const, label: "Analytics" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Vired Pulse</h1>
            <p className="text-sm text-white/60">Welcome, {userEmail.split("@")[0]}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Hero section */}
      <div
        className="h-48 bg-cover bg-center relative flex items-center justify-center mb-8"
        style={{
          backgroundImage: "url('https://cdn.builder.io/api/v1/image/assets%2F88805948443b4c8f889eb67f299fc007%2F147ce9f561de4ad18f3a12346131fc96?format=webp&width=800&height=1200')",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <h2 className="relative text-4xl md:text-5xl font-bold text-white text-shadow">Vired Pulse</h2>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Program selector card */}
        {showProgramSelector && (
          <div className="glass-card p-6 md:p-8 mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">Select Program</h3>
            <div className="flex flex-wrap gap-3">
              {programs.map((program) => (
                <button
                  key={program}
                  onClick={() => handleSelectProgram(program)}
                  className="vired-btn"
                >
                  {program}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="glass-card p-1 mb-8 animate-fade-in">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/50"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {selectedProgram && (
              <button
                onClick={handleChangeProgram}
                className="ml-auto px-4 py-2 text-white/60 hover:text-white text-sm transition-all"
              >
                Change Program
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === "learn" && selectedProgram && (
            <LearningTab program={selectedProgram} />
          )}
          {activeTab === "call" && selectedProgram && (
            <CallTab program={selectedProgram} />
          )}
          {activeTab === "ops" && selectedProgram && (
            <OpsTab program={selectedProgram} />
          )}
          {activeTab === "analytics" && isAdmin && (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </div>
  );
}
