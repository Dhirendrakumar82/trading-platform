export default function Stat({ label, value, hint, tone = "" }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <b className={tone}>{value}</b>
      {hint && <small>{hint}</small>}
    </div>
  );
}
