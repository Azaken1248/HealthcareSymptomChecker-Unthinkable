import { type FormEvent, useMemo } from "react";

interface Props {
  symptoms: string;
  setSymptoms: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  symptomInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const SymptomForm = ({
  symptoms,
  setSymptoms,
  onSubmit,
  isLoading,
  symptomInputRef,
}: Props) => {
  const maxLength = 200;
  const charCount = useMemo(() => symptoms.length, [symptoms]);
  const minLength = 5;
  const isTooShort = charCount < minLength;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700"
    >
      <div className="relative rounded">
        <div className="absolute left-3 top-2 flex items-center gap-2 text-slate-400">
          <img src="/icon.svg" alt="medical icon" className="w-6 h-6" />
          <label htmlFor="symptoms" className="text-m text-emerald-200">
            Your Symptoms
          </label>
        </div>
        <div className="absolute left-3 right-3 top-10 border-b border-emerald-100" />

        <textarea
          ref={symptomInputRef}
          id="symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          maxLength={maxLength}
          className="w-full h-36 pt-10 mt-1 p-4 bg-slate-900 text-emerald-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-0 transition duration-200 shadow-inner resize-none"
          placeholder="Enter your symptoms here, e.g., headache, fever, cough..."
          required
        />

        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-slate-400">
            Add symptoms, separated by commas.
          </p>
          <p className="text-xs text-slate-400">
            {charCount} / {maxLength}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSymptoms(symptoms ? `${symptoms}, cough` : "cough")}
          className="text-sm bg-slate-800 text-emerald-200 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-700"
        >
          + cough
        </button>
        <button
          type="button"
          onClick={() => setSymptoms(symptoms ? `${symptoms}, fever` : "fever")}
          className="text-sm bg-slate-800 text-emerald-200 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-700"
        >
          + fever
        </button>
        <button
          type="button"
          onClick={() =>
            setSymptoms(symptoms ? `${symptoms}, headache` : "headache")
          }
          className="text-sm bg-slate-800 text-emerald-200 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-700"
        >
          + headache
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading || isTooShort}
        className="mt-4 w-full bg-emerald-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-emerald-400 disabled:bg-slate-600 transition-colors duration-200 shadow-md"
      >
        {isLoading ? "Analyzing..." : "Analyze Symptoms"}
      </button>
      {isTooShort && (
        <p className="text-xs text-amber-300 mt-2">
          Please enter at least {minLength} characters describing your symptoms.
        </p>
      )}
    </form>
  );
};

export default SymptomForm;
