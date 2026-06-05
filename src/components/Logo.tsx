const LOGO_URL = "http://sharkscompany.online/wp-content/uploads/2026/05/ChatGPT-Image-8-de-mai.-de-2026-19_29_58-1-e1778280353107.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="PB&RN Foods"
      className={`h-10 w-auto object-contain ${className}`}
    />
  );
}
