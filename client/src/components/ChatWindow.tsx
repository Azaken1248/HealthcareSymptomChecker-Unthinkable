import type { AnalysisResponse } from "../types";
import Spinner from "./Spinner";
import ConfidenceBadge from "./ConfidenceBadge";
import { downloadReport } from "../utils/pdf";

const ChatWindow = ({
  response,
  isLoading,
  onAddSymptom,
  currentSymptoms,
}: {
  response: AnalysisResponse | null;
  isLoading: boolean;
  onAddSymptom?: (s: string) => void;
  currentSymptoms?: string;
}) => {
  return (
    <div className="flex flex-col h-[60vh] bg-slate-900 rounded-lg border border-slate-800 p-4">
      <div className="flex-1 overflow-auto mb-4 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner size={12} />
            <p className="text-slate-400 mt-3">
              Analyzing symptoms — this may take a few moments.
            </p>
          </div>
        ) : response ? (
          <div className="space-y-4">
            {response.criticalWarning && (
              <div className="mb-2 bg-amber-900/20 border border-amber-700 text-amber-100 p-3 rounded">
                <h4 className="font-semibold">Important Safety Notice</h4>
                <p className="text-amber-100/90 text-sm mt-1">
                  {response.criticalWarning}
                </p>
              </div>
            )}

            <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
              <h3 className="font-semibold text-emerald-200">Summary</h3>
              <p className="text-slate-200 mt-1">{response.summary}</p>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => downloadReport(response, "Symptom_Report")}
                  className="text-sm bg-emerald-600 text-slate-900 px-3 py-1 rounded-md hover:bg-emerald-500"
                >
                  Download Report (PDF)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {response.possibleConditions.map((c) => (
                <div
                  key={c.name}
                  className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-emerald-100 flex items-center gap-3">
                      <ConfidenceBadge confidence={c.confidence} />
                      <span>{c.name}</span>
                    </h4>
                  </div>
                  <p className="text-slate-300 text-sm mt-2">{c.reasoning}</p>
                </div>
              ))}
            </div>

            {response.differentiatingSymptoms?.length > 0 && (
              <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-emerald-100 mb-2">
                  Refine Your Symptoms
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Click a symptom to add it to the input.
                </p>
                <div className="space-y-3">
                  {response.differentiatingSymptoms.map((group) => (
                    <div key={group.condition}>
                      <div className="text-emerald-200 font-semibold">
                        {group.condition}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {group.symptomsToCheck
                          .filter(
                            (symptom) =>
                              !(currentSymptoms || "")
                                .toLowerCase()
                                .includes(symptom.toLowerCase())
                          )
                          .map((symptom, i) => (
                            <button
                              key={i}
                              onClick={() => onAddSymptom?.(symptom)}
                              className="text-sm bg-slate-800 text-emerald-200 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-700"
                            >
                              + {symptom}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.nextSteps.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-emerald-100 mb-3">
                  Recommended Next Steps
                </h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />
                  <div className="space-y-4 pl-8">
                    {response.nextSteps.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute left-[-1.35rem] top-2 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900" />
                        <div className="w-full text-left bg-slate-800 p-3 rounded-lg border border-slate-700">
                          <div className="font-medium text-emerald-100">
                            Step {idx + 1}
                          </div>
                          <p className="mt-2 text-slate-300 text-sm">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No analysis yet. Enter symptoms to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
