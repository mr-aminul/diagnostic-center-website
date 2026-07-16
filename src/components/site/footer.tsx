import { getLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig, type Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/site/brand-mark";

export async function Footer() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  // Static config — avoid a Postgres round-trip on every public page.
  const branches = siteConfig.branches;
  const mainBranch = branches.find((b) => b.isMain) ?? branches[0];

  return (
    <footer className="site-footer border-t border-white/10 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <BrandMark />
              <span>{siteConfig.shortName}</span>
            </div>
            <p className="mt-3 text-sm text-white/70">
              {siteConfig.tagline[locale]}
            </p>
            {siteConfig.social.facebook && (
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
                </svg>
                Facebook
              </a>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.quickLinks")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/about" className="hover:text-white">{t("nav.about")}</Link></li>
              {siteConfig.features.doctorsPage && (
                <li><Link href="/doctors" className="hover:text-white">{t("nav.doctors")}</Link></li>
              )}
              {branches.length > 0 && (
                <li><Link href="/branches" className="hover:text-white">{t("nav.branches")}</Link></li>
              )}
              <li><Link href="/faq" className="hover:text-white">{t("nav.faq")}</Link></li>
              <li><Link href="/patient-portal" className="hover:text-white">{t("nav.patientPortal")}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.ourServices")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/services" className="hover:text-white">{t("nav.services")}</Link></li>
              <li><Link href="/packages" className="hover:text-white">{t("nav.packages")}</Link></li>
              <li><Link href="/price-list" className="hover:text-white">{t("nav.priceList")}</Link></li>
              {siteConfig.features.homeCollection && (
                <li><Link href="/home-collection" className="hover:text-white">{t("nav.homeCollection")}</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.getInTouch")}</h3>
            <ul className="mt-3 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{siteConfig.contact.phones.join(", ")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </li>
              {mainBranch && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{mainBranch.address[locale]}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/70">
          &copy; {new Date().getFullYear()} {siteConfig.name}. {t("footer.rightsReserved")}
        </div>
      </div>
    </footer>
  );
}
