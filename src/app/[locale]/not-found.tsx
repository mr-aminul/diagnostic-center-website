import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or may have moved.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link href="/book" className={buttonVariants({ variant: "outline" })}>
          Book a test
        </Link>
        <Link href="/patient-portal" className={buttonVariants({ variant: "outline" })}>
          Patient Portal
        </Link>
      </div>
    </div>
  );
}
