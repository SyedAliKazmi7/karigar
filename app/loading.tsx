import Logo from "../components/Logo";

export default function Loading() {
  return (
    <div className="loader-wrap flex-col gap-6" role="status" aria-label="Loading">
      <div className="pulse-logo">
        <Logo size={48} />
      </div>
      <span className="spinner" />
    </div>
  );
}