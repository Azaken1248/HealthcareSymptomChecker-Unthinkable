const Header = () => (
  <header className="text-center mb-8">
    <div className="flex items-center justify-center gap-3">
      <span className="text-3xl text-emerald-400">
        <i className="fas fa-stethoscope"></i>
      </span>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-200">
        AI Symptom Checker
      </h1>
    </div>
    <p className="text-emerald-200/80 mt-2">
      Enter your symptoms for an AI-powered analysis.
    </p>
  </header>
);

export default Header;
