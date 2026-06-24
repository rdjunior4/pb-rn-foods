export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="PB&RN Foods"
      className={`h-10 w-auto object-contain ${className}`}
    />
  );
}
