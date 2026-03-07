type Status =
  | "connecting"
  | "error"
  | "waiting-page"
  | "checking-module";

interface ConnectionStatusProps {
  status: Status;
  message?: string;
}

const messages: Record<Status, string> = {
  connecting: "Connecting to Sitecore…",
  error: "",
  "waiting-page": "Waiting for page context…",
  "checking-module": "Checking module status…",
};

export function ConnectionStatus({ status, message }: ConnectionStatusProps) {
  const text = status === "error" ? message : messages[status];

  if (status === "error") {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Connection Failed</p>
          <p className="mt-1 text-xs text-destructive/80">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
