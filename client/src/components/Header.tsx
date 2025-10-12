const Header = () => (
  <header className="text-center mb-8">
    <div className="flex items-center justify-center gap-3">
      <span className="text-3xl text-emerald-400">
        <img src="/icon.svg" alt="medical icon" className="w-8 h-8" />
      </span>
      <h3 className="text-3xl sm:text-[36px] font-extrabold text-emerald-200">
        AI Symptom Checker
      </h3>
    </div>
    <p className="text-emerald-200/80 mt-2">
      Enter your symptoms for an AI-powered analysis.
    </p>
  </header>
);

export default Header;
