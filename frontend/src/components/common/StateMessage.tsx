
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

interface Props {
  kind: "loading" | "error" | "empty";
  message: string;
  onRetry?: () => void;
}

function StateMessage({ kind, message, onRetry }: Props) {
  const Icon =
    kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Icon
        size={28}
        className={
          kind === "error"
            ? "text-red-400"
            : kind === "loading"
              ? "animate-spin text-blue-500"
              : "text-slate-300"
        }
      />
      <p className="text-sm text-slate-500">{message}</p>
      {kind === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default StateMessage;
