const Spinner = ({ size = 8 }: { size?: number }) => {
  const sizeClass =
    size === 12 ? "w-12 h-12" : size === 10 ? "w-10 h-10" : "w-8 h-8";
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin`}
      />
    </div>
  );
};

export default Spinner;
