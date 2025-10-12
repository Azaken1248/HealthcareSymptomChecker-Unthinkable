import ConfidenceBadge from "./ConfidenceBadge";
import type { AnalysisResponse } from "../types";

const AnalysisResult = ({
  currentResponse,
  onSymptomClick,
}: {
  currentResponse: AnalysisResponse;
  onSymptomClick: (s: string) => void;
}) => {
  return (
    <article className="mt-8 bg-slate-900 p-6 rounded-xl shadow-lg animate-fade-in border border-slate-800">
      {currentResponse.criticalWarning && (
        <div className="mb-6 bg-slate-800 border-l-4 border-amber-600 text-amber-200 p-4 rounded-md shadow-md">
          <h3 className="font-bold text-lg">Important Safety Notice</h3>
          <p className="text-amber-100/95">{currentResponse.criticalWarning}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-800 rounded-lg">
        <h3 className="text-lg font-bold text-emerald-200">Summary</h3>
        <p className="text-emerald-100 mt-1">{currentResponse.summary}</p>
      </div>

      <h2 className="text-2xl font-bold text-emerald-100 mb-4">
        Possible Conditions
      </h2>
      <div className="space-y-4 mb-6">
        {currentResponse.possibleConditions.map((condition) => (
          <div
            key={condition.name}
            className="p-4 bg-slate-800 rounded-lg border border-slate-700"
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-emerald-200 text-lg">
                {condition.name}
              </h3>
              <ConfidenceBadge confidence={condition.confidence} />
            </div>
            <p className="text-slate-300 text-sm">{condition.reasoning}</p>
          </div>
        ))}
      </div>

      {currentResponse.differentiatingSymptoms?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-emerald-100 mb-4">
            Refine Your Symptoms
          </h2>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
            <p className="text-sm text-slate-300">
              Click a symptom below to add it to your query and analyze again.
            </p>
            {currentResponse.differentiatingSymptoms.map((item) => (
              <div key={item.condition}>
                <h4 className="font-semibold text-emerald-200">
                  To check for{" "}
                  <span className="text-emerald-300">{item.condition}</span>,
                  consider adding:
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.symptomsToCheck.map((symptom, index) => (
                    <button
                      key={index}
                      onClick={() => onSymptomClick(symptom)}
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

      <h2 className="text-2xl font-bold text-emerald-100 mb-4">
        Recommended Next Steps
      </h2>
      <ul className="list-disc list-inside space-y-2 text-slate-300 mb-6">
        {currentResponse.nextSteps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
      <footer className="border-t border-slate-800 pt-4 mt-6">
        <p className="text-xs text-slate-400">{currentResponse.disclaimer}</p>
      </footer>
    </article>
  );
};

export default AnalysisResult;
