const ConfidenceBadge = ({
  confidence,
}: {
  confidence: "High" | "Medium" | "Low";
}) => {
  const confidenceStyles = {
    High: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Low: "bg-slate-700 text-slate-200 border-slate-600",
  } as const;
  const levelMap = {
    High: "Strong Match",
    Medium: "Possible Match",
    Low: "Partial Match",
  } as const;
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${confidenceStyles[confidence]}`}
    >
      {levelMap[confidence]}
    </span>
  );
};

export default ConfidenceBadge;
