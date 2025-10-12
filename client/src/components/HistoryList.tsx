import { useState, useMemo } from "react";
import type { HistoryItem } from "../types";
import { downloadCumulative } from "../utils/pdf";

type Props = {
  history: HistoryItem[];
  isLoading: boolean;
  onSelect?: (item: HistoryItem) => void;
  selectedId?: string | null;
};

const EMERGENCY_KEYWORDS = [
  "emergency",
  "urgent",
  "call 911",
  "immediately",
  "seek care",
  "danger",
  "choking",
  "severe",
];

function isEmergencyItem(h: HistoryItem) {
  if (h.response.criticalWarning) return true;
  const haystack = (
    (h.response.summary || "") +
    " " +
    (h.response.nextSteps || []).join(" ") +
    " " +
    (h.symptoms || "")
  ).toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => haystack.includes(k));
}

const HistoryList = ({ history, isLoading, onSelect, selectedId }: Props) => {
  const [query, setQuery] = useState("");
  const [emergenciesOnly, setEmergenciesOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = (h: HistoryItem) => {
      if (!q) return true;
      if ((h.symptoms || "").toLowerCase().includes(q)) return true;
      if ((h.response.summary || "").toLowerCase().includes(q)) return true;
      if (
        ((h.response.nextSteps || []).join(" ") || "").toLowerCase().includes(q)
      )
        return true;
      if (
        (h.response.possibleConditions || []).some(
          (c) =>
            (c.name || "").toLowerCase().includes(q) ||
            (c.reasoning || "").toLowerCase().includes(q)
        )
      )
        return true;
      return false;
    };

    let out = history.filter((h) => matches(h));
    if (emergenciesOnly) out = out.filter((h) => isEmergencyItem(h));
    return out;
  }, [history, query, emergenciesOnly]);

  return (
    <section className="mt-12 w-full">
      <h2 className="text-2xl font-bold text-emerald-100 mb-4">
        Your Query History
      </h2>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() =>
            downloadCumulative(history, "Cumulative_Symptom_Reports")
          }
          className="text-sm bg-emerald-600 text-slate-900 px-3 py-1 rounded-md hover:bg-emerald-500"
        >
          Download All Reports (PDF)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400">Loading history...</div>
      ) : (
        <>
          <div className="mb-3">
            <div className="relative">
              <i
                className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                aria-hidden="true"
              ></i>
              <input
                aria-label="Search history"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search past queries"
                className="w-full pl-10 pr-10 py-2 bg-slate-800 text-emerald-100 placeholder-slate-500 border border-slate-700 rounded-md focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-200"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                className="accent-emerald-400"
                checked={emergenciesOnly}
                onChange={() => setEmergenciesOnly((v) => !v)}
              />
              Emergencies only
            </label>
          </div>

          {filtered.length > 0 ? (
            <div className="overflow-auto max-h-[60vh] no-scrollbar space-y-3 pr-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect?.(item)}
                  className={`w-full text-left bg-slate-800 p-3 rounded-lg shadow-sm border ${
                    selectedId === item.id
                      ? "border-emerald-500"
                      : "border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-emerald-100 truncate"
                        title={item.symptoms}
                      >
                        {item.symptoms}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(
                          (item.timestamp as any)?._seconds * 1000
                        ).toLocaleString()}
                      </p>
                    </div>
                    {isEmergencyItem(item) && (
                      <span className="ml-3 text-amber-400 text-xs font-semibold">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-700">
              <p className="text-slate-400">No matching queries.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default HistoryList;
