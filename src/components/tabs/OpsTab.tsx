import { useState, useEffect } from "react";

interface OpsTabProps {
  program: string;
}

const OPS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1ef3L9STpft5OmlGm-_pdxvlD_CgL95LQFIAWUDnEc68/gviz/tq?tqx=out:json";

interface OpsRowData {
  [key: string]: string;
}

interface ProgramColumn {
  name: string;
  index: number;
}

export default function OpsTab({ program }: OpsTabProps) {
  const [opsData, setOpsData] = useState<OpsRowData[]>([]);
  const [opsHeaders, setOpsHeaders] = useState<string[]>([]);
  const [programColumns, setProgramColumns] = useState<ProgramColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpsData();
  }, [program]);

  const loadOpsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(OPS_SHEET_URL);
      const text = await res.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));

      const rows = json.table.rows;
      if (!rows || !rows.length) {
        console.error("No data found in sheet");
        return;
      }

      // Get headers from first row
      const headers = rows[0].c.map((cell: any) => (cell ? cell.v : ""));
      setOpsHeaders(headers);

      // Get data from remaining rows
      const data = rows.slice(1).map((row: any) => {
        const rowData: OpsRowData = {};
        headers.forEach((header: string, i: number) => {
          const cell = row.c[i];
          rowData[header] = cell && cell.v ? cell.v : "";
        });
        return rowData;
      });

      setOpsData(data);

      // Detect program columns
      const names = ["DevOps", "SIL", "LXAI"];
      let counter = 0;
      const columns = headers
        .map((h: string, i: number) => {
          const hasLink = data.some((r: OpsRowData) => (r[h] || "").includes("http"));
          if (!hasLink) return null;
          return {
            name: names[counter++] || `Program ${counter}`,
            index: i,
          };
        })
        .filter(Boolean) as ProgramColumn[];

      setProgramColumns(columns);
    } catch (err) {
      console.error("Error loading Ops data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Loading operational tools...</p>
      </div>
    );
  }

  const groups: Record<string, OpsRowData[]> = {
    "While on Call": [],
    "Internal Support": [],
    Compliance: [],
  };

  opsData.forEach((row) => {
    const stage = (row[opsHeaders[0]] || "").toLowerCase();
    if (stage.includes("call") || stage.includes("live")) {
      groups["While on Call"].push(row);
    } else if (stage.includes("internal") || stage.includes("support")) {
      groups["Internal Support"].push(row);
    } else {
      groups["Compliance"].push(row);
    }
  });

  const whenIndex = opsHeaders.findIndex((h) => h.toLowerCase().includes("when"));
  const actionIndex = opsHeaders.findIndex((h) => h.toLowerCase().includes("action"));
  const selectedColumn = programColumns.find((p) => p.name === program);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, groupItems]) => (
        <div key={groupName}>
          <h3 className="text-2xl font-bold text-white mb-4">{groupName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupItems.map((row, idx) => {
              const name = row[opsHeaders[1]] || "";
              if (!name) return null;

              const whenText = whenIndex !== -1 ? row[opsHeaders[whenIndex]] : "—";
              const actionText = actionIndex !== -1 ? row[opsHeaders[actionIndex]] : "—";
              const link = selectedColumn ? row[opsHeaders[selectedColumn.index]] : "";

              return (
                <div
                  key={idx}
                  className="glass-card p-6 hover:bg-white/15 transition-all"
                >
                  <h4 className="text-lg font-semibold text-white mb-3">{name}</h4>
                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-white/80">
                      <span className="font-medium text-white">When:</span> {whenText}
                    </p>
                    <p className="text-white/80">
                      <span className="font-medium text-white">Action:</span> {actionText}
                    </p>
                  </div>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vired-btn inline-block text-sm"
                    >
                      Open →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
