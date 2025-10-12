const ErrorAlert = ({ message }: { message: string }) => (
  <div
    className="mt-6 bg-slate-800 border-l-4 border-red-600 text-red-300 p-4 rounded-md shadow-md"
    role="alert"
  >
    <p className="font-bold text-red-200">Error</p>
    <p className="text-red-200/90">{message}</p>
  </div>
);

export default ErrorAlert;
