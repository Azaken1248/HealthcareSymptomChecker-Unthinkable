import { useState, type FormEvent, useEffect, useRef } from "react";
import axios from "axios";
import { getAuthToken, auth } from "./utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

interface DifferentiatingSymptom {
  condition: string;
  symptomsToCheck: string[];
}

interface AnalysisResponse {
  criticalWarning?: string;
  summary: string;
  disclaimer: string;
  possibleConditions: {
    name: string;
    reasoning: string;
    confidence: "High" | "Medium" | "Low";
  }[];
  differentiatingSymptoms: DifferentiatingSymptom[];
  nextSteps: string[];
}

interface HistoryItem {
  id: string;
  symptoms: string;
  response: AnalysisResponse;
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
}

const ConfidenceBadge = ({
  confidence,
}: {
  confidence: "High" | "Medium" | "Low";
}) => {
  const confidenceStyles = {
    High: "bg-green-100 text-green-800 border-green-200",
    Medium: "bg-orange-100 text-orange-800 border-orange-200",
    Low: "bg-slate-100 text-slate-800 border-slate-200",
  };
  const levelMap = {
    High: "Strong Match",
    Medium: "Possible Match",
    Low: "Partial Match",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${confidenceStyles[confidence]}`}
    >
      {levelMap[confidence]}
    </span>
  );
};

function App() {
  const [symptoms, setSymptoms] = useState<string>("");
  const [currentResponse, setCurrentResponse] =
    useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const symptomInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getAuthToken();
        if (token) {
          try {
            const result = await axios.get<HistoryItem[]>(
              "http://localhost:8000/api/history",
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setHistory(result.data);
          } catch (err) {
            console.error("Failed to fetch history:", err);
            setError("Could not load your past history.");
          } finally {
            setIsHistoryLoading(false);
          }
        }
      } else {
        setIsHistoryLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!symptoms.trim()) {
      setError("Please enter your symptoms before analyzing.");
      return;
    }
    setIsLoading(true);
    setError("");
    setCurrentResponse(null);

    try {
      const token = await getAuthToken();
      if (!token)
        throw new Error("Authentication failed. Please refresh the page.");

      const result = await axios.post<AnalysisResponse>(
        "http://localhost:8000/api/check-symptoms",
        { symptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentResponse(result.data);
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        symptoms,
        response: result.data,
        timestamp: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
      };
      setHistory((prevHistory) => [newHistoryItem, ...prevHistory]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymptomClick = (symptomToAdd: string) => {
    setSymptoms((prevSymptoms) => {
      if (prevSymptoms.toLowerCase().includes(symptomToAdd.toLowerCase())) {
        return prevSymptoms;
      }
      return prevSymptoms ? `${prevSymptoms}, ${symptomToAdd}` : symptomToAdd;
    });
    symptomInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">
            AI Symptom Checker
          </h1>
          <p className="text-slate-600 mt-2">
            Enter your symptoms for an AI-powered analysis.
          </p>
        </header>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <label
            htmlFor="symptoms"
            className="block text-lg font-semibold text-slate-700 mb-2"
          >
            Your Symptoms
          </label>
          <textarea
            ref={symptomInputRef}
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full h-36 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="e.g., 'fever and body aches'"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors duration-200 shadow-md"
          >
            {isLoading ? "Analyzing..." : "Analyze Symptoms"}
          </button>
        </form>

        {error && (
          <div
            className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {currentResponse && (
          <article className="mt-8 bg-white p-6 rounded-xl shadow-lg animate-fade-in">
            {currentResponse.criticalWarning && (
              <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-md">
                <h3 className="font-bold text-lg">
                  ⚠️ Important Safety Notice
                </h3>
                <p>{currentResponse.criticalWarning}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-blue-900">Summary</h3>
              <p className="text-blue-800 mt-1">{currentResponse.summary}</p>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Possible Conditions
            </h2>
            <div className="space-y-4 mb-6">
              {currentResponse.possibleConditions.map((condition) => (
                <div
                  key={condition.name}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-blue-700 text-lg">
                      {condition.name}
                    </h3>
                    <ConfidenceBadge confidence={condition.confidence} />
                  </div>
                  <p className="text-slate-600 text-sm">
                    {condition.reasoning}
                  </p>
                </div>
              ))}
            </div>
            {currentResponse.differentiatingSymptoms?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  Refine Your Symptoms
                </h2>
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 space-y-4">
                  <p className="text-sm text-slate-600">
                    Click a symptom below to add it to your query and analyze
                    again.
                  </p>
                  {currentResponse.differentiatingSymptoms.map((item) => (
                    <div key={item.condition}>
                      <h4 className="font-semibold text-slate-700">
                        To check for{" "}
                        <span className="text-blue-700">{item.condition}</span>,
                        consider adding:
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.symptomsToCheck.map((symptom, index) => (
                          <button
                            key={index}
                            onClick={() => handleSymptomClick(symptom)}
                            className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
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
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Recommended Next Steps
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-6">
              {currentResponse.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
            <footer className="border-t border-slate-200 pt-4 mt-6">
              <p className="text-xs text-slate-500">
                {currentResponse.disclaimer}
              </p>
            </footer>
          </article>
        )}

        <section className="mt-12 w-full">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Your Query History
          </h2>
          {isHistoryLoading ? (
            <div className="text-center text-slate-500">Loading history...</div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200"
                >
                  <p
                    className="font-semibold text-slate-800 truncate"
                    title={item.symptoms}
                  >
                    {item.symptoms}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(item.timestamp._seconds * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-slate-500">
                Your past queries will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
