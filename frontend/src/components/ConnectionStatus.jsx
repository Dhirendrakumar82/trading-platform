const LABELS = {
  connected: { icon: "🟢", text: "Connected" },
  connecting: { icon: "🟡", text: "Connecting" },
  disconnected: { icon: "🔴", text: "Disconnected" },
  error: { icon: "⚠️", text: "Error" },
};

export default function ConnectionStatus({ status }) {
  const { icon, text } = LABELS[status] || LABELS.error;
  return (
    <span className={`conn conn-${status}`} role="status" aria-live="polite">
      <span aria-hidden="true">{icon}</span> {text}
    </span>
  );
}
