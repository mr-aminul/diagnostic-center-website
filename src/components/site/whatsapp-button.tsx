"use client";

export function WhatsappButton({ whatsapp }: { whatsapp: string }) {
  const digitsOnly = whatsapp.replace(/[^\d]/g, "");

  return (
    <a
      href={`https://wa.me/${digitsOnly}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-5 bottom-5 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 lg:flex"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.86.5 3.6 1.44 5.12L2 22l5.2-1.51a9.87 9.87 0 0 0 4.84 1.24h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.79 14.06c-.24.68-1.42 1.3-1.96 1.36-.5.06-1.13.09-1.83-.11-.42-.12-.96-.31-1.65-.6-2.9-1.25-4.79-4.16-4.93-4.35-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.77-.36h.55c.18 0 .42-.07.65.5.24.58.82 2.02.9 2.16.07.15.12.32.02.51-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.28.29-.12.57.16.28.71 1.18 1.53 1.91.99.88 1.83 1.16 2.14 1.29.31.13.49.11.67-.07.19-.19.79-.92.99-1.24.2-.31.4-.26.68-.16.28.1 1.75.83 2.05 1 .3.16.5.24.57.38.08.14.08.79-.16 1.47Z" />
      </svg>
    </a>
  );
}
