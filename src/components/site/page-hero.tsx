import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export function PageHero({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="border-b bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 sm:gap-4">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className={buttonVariants({
                size: "icon-lg",
                className: "mt-0.5 shrink-0 sm:mt-1",
              })}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
