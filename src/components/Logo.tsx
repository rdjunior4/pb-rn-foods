export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-black leading-none tracking-tight ${className}`}>
      <div className="text-brand-black text-2xl">PB&amp;RN</div>
      <div className="text-primary text-2xl -mt-1">FOODS</div>
    </div>
  );
}
