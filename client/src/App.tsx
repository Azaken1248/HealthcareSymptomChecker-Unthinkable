import { useState, type FormEvent, useEffect, useRef } from "react";
import axios from "axios";
import { getAuthToken, auth } from "./utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import Header from "./components/Header";
import SymptomForm from "./components/SymptomForm";
import ErrorAlert from "./components/ErrorAlert";
import HistoryList from "./components/HistoryList";
import ChatWindow from "./components/ChatWindow";
import type { AnalysisResponse, HistoryItem } from "./types";

function App() {
  const [symptoms, setSymptoms] = useState<string>("");
  const [currentResponse, setCurrentResponse] =
    useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );

  const symptomInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getAuthToken();
        if (token) {
          try {
            const result = await axios.get<HistoryItem[]>(
              "http://localhost:8000/api/history",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
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
    const trimmed = symptoms.trim();
    if (!trimmed) {
      setError("Please enter your symptoms before analyzing.");
      return;
    }
    if (trimmed.length < 10) {
      setError("Please enter at least 10 characters describing your symptoms.");
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
      setSelectedHistoryId(null);
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

  const handleAddSymptom = (symptomToAdd: string) => {
    setSymptoms((prev) => {
      if (prev.toLowerCase().includes(symptomToAdd.toLowerCase())) return prev;
      return prev ? `${prev}, ${symptomToAdd}` : symptomToAdd;
    });
    symptomInputRef.current?.focus();
  };

  const selectedHistory =
    history.find((h) => h.id === selectedHistoryId) ?? null;

  const [mobileTab, setMobileTab] = useState<"chat" | "history">("chat");

  return (
    <div className="min-h-screen no-scrollbar bg-slate-950 font-sans flex flex-col items-center p-4 sm:p-8 text-emerald-100">
      <div className="w-full max-w-6xl">
        <Header />

        <div className="mt-6">
          <div className="sm:hidden mb-4">
            <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
              <button
                onClick={() => setMobileTab("chat")}
                className={`flex-1 py-2 text-center ${
                  mobileTab === "chat"
                    ? "bg-emerald-600 text-slate-900"
                    : "text-emerald-100"
                }`}
              >
                <i className="fas fa-comments mr-2" aria-hidden="true"></i>
                Chat
              </button>
              <button
                onClick={() => setMobileTab("history")}
                className={`flex-1 py-2 text-center ${
                  mobileTab === "history"
                    ? "bg-emerald-600 text-slate-900"
                    : "text-emerald-100"
                }`}
              >
                <i className="fas fa-history mr-2" aria-hidden="true"></i>
                History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <main className="w-full">
              <SymptomForm
                symptoms={symptoms}
                setSymptoms={setSymptoms}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                symptomInputRef={symptomInputRef}
              />

              {error && <ErrorAlert message={error} />}

              {/* Chat area: hide on mobile when 'history' tab is active; always show on sm+ */}
              <div
                className={`mt-6 ${
                  mobileTab === "history" ? "hidden sm:block" : "block"
                }`}
              >
                <ChatWindow
                  response={
                    selectedHistory ? selectedHistory.response : currentResponse
                  }
                  isLoading={isLoading}
                  onAddSymptom={handleAddSymptom}
                  currentSymptoms={symptoms}
                />
              </div>
            </main>
            <div
              className={`${
                mobileTab === "chat" ? "hidden sm:block" : "block"
              }`}
            >
              <HistoryList
                history={history}
                isLoading={isHistoryLoading}
                onSelect={(item) => {
                  setSelectedHistoryId(item.id);
                  setMobileTab("chat");
                }}
                selectedId={selectedHistoryId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
