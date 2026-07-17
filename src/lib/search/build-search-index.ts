import { siteConfig } from "@/config/site";
import type { ResolvedSiteConfig } from "@/lib/cms/types";
import { toNumber } from "@/lib/format";
import type { PackageWithTests, TestWithCategory } from "@/lib/data/catalog";
import type { SearchHit } from "@/lib/search/types";

type DoctorRow = {
  id: string;
  name: string;
  nameBn: string | null;
  specialty: string | null;
  specialtyBn: string | null;
  degrees: string | null;
  schedule: string | null;
  scheduleBn: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  nameBn: string | null;
};

type BranchRow = {
  id: string;
  name: string;
  nameBn: string | null;
  address: string | null;
  addressBn: string | null;
  phone: string | null;
};

function haystack(...parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}

function pageHits(features: ResolvedSiteConfig["features"], shortName: string): SearchHit[] {
  const pages: SearchHit[] = [
    {
      id: "page-book",
      category: "page",
      title: "Book a Test",
      titleBn: "টেস্ট বুক করুন",
      subtitle: "Schedule lab tests or packages",
      subtitleBn: "ল্যাব টেস্ট বা প্যাকেজ নির্ধারণ করুন",
      keywords: haystack(
        "book",
        "booking",
        "appointment",
        "test",
        "schedule",
        "বুক",
        "টেস্ট",
        "অ্যাপয়েন্টমেন্ট",
        "নির্ধারণ",
      ),
      href: { kind: "route", pathname: "/book" },
      price: null,
    },
    {
      id: "page-track",
      category: "page",
      title: "Patient Portal / Reports",
      titleBn: "পেশেন্ট পোর্টাল / রিপোর্ট",
      subtitle: "Track bookings and download reports",
      subtitleBn: "বুকিং ট্র্যাক ও রিপোর্ট ডাউনলোড",
      keywords: haystack(
        "report",
        "reports",
        "track",
        "result",
        "results",
        "patient portal",
        "download",
        "রিপোর্ট",
        "ট্র্যাক",
        "ফলাফল",
        "পোর্টাল",
        "ডাউনলোড",
      ),
      href: { kind: "route", pathname: "/patient-portal" },
      price: null,
    },
    {
      id: "page-services",
      category: "page",
      title: "Services & Tests",
      titleBn: "সেবা ও টেস্টসমূহ",
      subtitle: "Browse the full test catalog",
      subtitleBn: "সম্পূর্ণ টেস্ট ক্যাটালগ দেখুন",
      keywords: haystack("services", "tests", "catalog", "lab", "সেবা", "টেস্ট", "ক্যাটালগ"),
      href: { kind: "route", pathname: "/services" },
      price: null,
    },
    {
      id: "page-packages",
      category: "page",
      title: "Health Packages",
      titleBn: "হেলথ প্যাকেজ",
      subtitle: "Bundled checkup packages",
      subtitleBn: "সমন্বিত চেকআপ প্যাকেজ",
      keywords: haystack("packages", "checkup", "screening", "প্যাকেজ", "চেকআপ", "স্ক্রিনিং"),
      href: { kind: "route", pathname: "/packages" },
      price: null,
    },
    {
      id: "page-price-list",
      category: "page",
      title: "Price List",
      titleBn: "মূল্য তালিকা",
      subtitle: "Test prices and fees",
      subtitleBn: "টেস্টের মূল্য ও ফি",
      keywords: haystack(
        "price",
        "prices",
        "cost",
        "fee",
        "fees",
        "rate",
        "মূল্য",
        "দাম",
        "ফি",
        "রেট",
      ),
      href: { kind: "route", pathname: "/price-list" },
      price: null,
    },
    {
      id: "page-contact",
      category: "page",
      title: "Contact Us",
      titleBn: "যোগাযোগ",
      subtitle: "Phone, WhatsApp, email, and location",
      subtitleBn: "ফোন, হোয়াটসঅ্যাপ, ইমেইল ও ঠিকানা",
      keywords: haystack(
        "contact",
        "phone",
        "email",
        "whatsapp",
        "support",
        "help",
        "যোগাযোগ",
        "ফোন",
        "ইমেইল",
        "হোয়াটসঅ্যাপ",
        "সাপোর্ট",
      ),
      href: { kind: "route", pathname: "/contact" },
      price: null,
    },
    {
      id: "page-faq",
      category: "page",
      title: "FAQ",
      titleBn: "সাধারণ জিজ্ঞাসা",
      subtitle: "Common questions answered",
      subtitleBn: "সাধারণ প্রশ্নের উত্তর",
      keywords: haystack("faq", "questions", "help", "জিজ্ঞাসা", "প্রশ্ন", "সাহায্য"),
      href: { kind: "route", pathname: "/faq" },
      price: null,
    },
    {
      id: "page-about",
      category: "page",
      title: "About Us",
      titleBn: "আমাদের সম্পর্কে",
      subtitle: shortName,
      subtitleBn: shortName,
      keywords: haystack("about", "story", "mission", "সম্পর্কে", "মিশন"),
      href: { kind: "route", pathname: "/about" },
      price: null,
    },
    {
      id: "page-branches",
      category: "page",
      title: "Branches",
      titleBn: "শাখাসমূহ",
      subtitle: "Find a center near you",
      subtitleBn: "কাছের সেন্টার খুঁজুন",
      keywords: haystack("branch", "branches", "location", "address", "map", "শাখা", "ঠিকানা", "লোকেশন"),
      href: { kind: "route", pathname: "/branches" },
      price: null,
    },
  ];

  if (features.doctorsPage) {
    pages.push({
      id: "page-doctors",
      category: "page",
      title: "Find a Doctor",
      titleBn: "ডাক্তার খুঁজুন",
      subtitle: "Browse consultants and book a serial",
      subtitleBn: "কনসালট্যান্ট দেখুন ও সিরিয়াল বুক করুন",
      keywords: haystack(
        "doctor",
        "doctors",
        "consultant",
        "specialist",
        "appointment",
        "serial",
        "ডাক্তার",
        "চিকিৎসক",
        "বিশেষজ্ঞ",
        "সিরিয়াল",
        "অ্যাপয়েন্টমেন্ট",
      ),
      href: { kind: "route", pathname: "/doctors" },
      price: null,
    });
  }

  if (features.homeCollection) {
    pages.push({
      id: "page-home-collection",
      category: "page",
      title: "Home Sample Collection",
      titleBn: "হোম স্যাম্পল কালেকশন",
      subtitle: "We collect samples at your door",
      subtitleBn: "আপনার বাড়িতে নমুনা সংগ্রহ",
      keywords: haystack(
        "home collection",
        "home sample",
        "blood collection",
        "হোম",
        "স্যাম্পল",
        "কালেকশন",
        "রক্ত",
      ),
      href: { kind: "route", pathname: "/home-collection" },
      price: null,
    });
  }

  return pages;
}

function contactHits(site: ResolvedSiteConfig): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const phone of site.contact.phones) {
    const digits = phone.replace(/\s/g, "");
    hits.push({
      id: `contact-phone-${digits}`,
      category: "contact",
      title: phone,
      titleBn: phone,
      subtitle: "Call us",
      subtitleBn: "কল করুন",
      keywords: haystack(phone, digits, "phone", "call", "ফোন", "কল"),
      href: { kind: "external", url: `tel:${digits}` },
      price: null,
    });
  }

  hits.push({
    id: "contact-whatsapp",
    category: "contact",
    title: "WhatsApp",
    titleBn: "হোয়াটসঅ্যাপ",
    subtitle: site.contact.whatsapp,
    subtitleBn: site.contact.whatsapp,
    keywords: haystack(
      site.contact.whatsapp,
      "whatsapp",
      "chat",
      "হোয়াটসঅ্যাপ",
      "চ্যাট",
    ),
    href: {
      kind: "external",
      url: `https://wa.me/${site.contact.whatsapp.replace(/\D/g, "")}`,
    },
    price: null,
  });

  hits.push({
    id: "contact-email",
    category: "contact",
    title: site.contact.email,
    titleBn: site.contact.email,
    subtitle: "Email us",
    subtitleBn: "ইমেইল করুন",
    keywords: haystack(site.contact.email, "email", "mail", "ইমেইল"),
    href: { kind: "external", url: `mailto:${site.contact.email}` },
    price: null,
  });

  hits.push({
    id: "contact-hours",
    category: "contact",
    title: site.hours.en,
    titleBn: site.hours.bn,
    subtitle: "Working hours",
    subtitleBn: "কর্মঘণ্টা",
    keywords: haystack(
      site.hours.en,
      site.hours.bn,
      "hours",
      "open",
      "timing",
      "সময়",
      "খোলা",
      "কর্মঘণ্টা",
    ),
    href: { kind: "route", pathname: "/contact" },
    price: null,
  });

  return hits;
}

export function buildSearchIndex({
  tests,
  packages,
  doctors,
  categories,
  branches,
  site,
}: {
  tests: TestWithCategory[];
  packages: PackageWithTests[];
  doctors: DoctorRow[];
  categories: CategoryRow[];
  branches: BranchRow[];
  site: ResolvedSiteConfig;
}): SearchHit[] {
  const hits: SearchHit[] = [
    ...pageHits(site.features, site.shortName),
    ...contactHits(site),
  ];

  for (const test of tests) {
    hits.push({
      id: `test-${test.id}`,
      category: "test",
      title: test.name,
      titleBn: test.nameBn,
      subtitle: test.category.name,
      subtitleBn: test.category.nameBn,
      keywords: haystack(
        test.name,
        test.nameBn,
        test.category.name,
        test.category.nameBn,
        test.sampleType,
        test.preparation,
        test.preparationBn,
        test.turnaroundTime,
        "test",
        "price",
        "টেস্ট",
        "মূল্য",
      ),
      href: { kind: "route", pathname: "/book", query: { test: test.id } },
      price: toNumber(test.price),
    });
  }

  for (const pkg of packages) {
    const included = pkg.tests.map(({ test }) => test.name).join(" ");
    const includedBn = pkg.tests
      .map(({ test }) => test.nameBn)
      .filter(Boolean)
      .join(" ");
    hits.push({
      id: `package-${pkg.id}`,
      category: "package",
      title: pkg.name,
      titleBn: pkg.nameBn,
      subtitle: pkg.description,
      subtitleBn: pkg.descriptionBn,
      keywords: haystack(
        pkg.name,
        pkg.nameBn,
        pkg.description,
        pkg.descriptionBn,
        included,
        includedBn,
        "package",
        "checkup",
        "প্যাকেজ",
      ),
      href: { kind: "route", pathname: "/book", query: { package: pkg.id } },
      price: toNumber(pkg.price),
    });
  }

  for (const doctor of doctors) {
    hits.push({
      id: `doctor-${doctor.id}`,
      category: "doctor",
      title: doctor.name,
      titleBn: doctor.nameBn,
      subtitle: doctor.specialty,
      subtitleBn: doctor.specialtyBn,
      keywords: haystack(
        doctor.name,
        doctor.nameBn,
        doctor.specialty,
        doctor.specialtyBn,
        doctor.degrees,
        doctor.schedule,
        doctor.scheduleBn,
        "doctor",
        "appointment",
        "serial",
        "ডাক্তার",
        "সিরিয়াল",
      ),
      href: { kind: "route", pathname: `/doctors/${doctor.id}` },
      price: null,
    });
  }

  for (const category of categories) {
    hits.push({
      id: `category-${category.id}`,
      category: "category",
      title: category.name,
      titleBn: category.nameBn,
      subtitle: "Test category",
      subtitleBn: "টেস্ট ক্যাটাগরি",
      keywords: haystack(category.name, category.nameBn, "category", "department", "ক্যাটাগরি", "বিভাগ"),
      href: { kind: "route", pathname: "/services" },
      price: null,
    });
  }

  for (const branch of branches) {
    hits.push({
      id: `branch-${branch.id}`,
      category: "branch",
      title: branch.name,
      titleBn: branch.nameBn,
      subtitle: branch.address,
      subtitleBn: branch.addressBn,
      keywords: haystack(
        branch.name,
        branch.nameBn,
        branch.address,
        branch.addressBn,
        branch.phone,
        "branch",
        "location",
        "শাখা",
        "ঠিকানা",
      ),
      href: { kind: "route", pathname: "/branches" },
      price: null,
    });
  }

  // Static config branches if DB is empty
  if (branches.length === 0) {
    for (const branch of siteConfig.branches) {
      hits.push({
        id: `branch-config-${branch.id}`,
        category: "branch",
        title: branch.name.en,
        titleBn: branch.name.bn,
        subtitle: branch.address.en,
        subtitleBn: branch.address.bn,
        keywords: haystack(
          branch.name.en,
          branch.name.bn,
          branch.address.en,
          branch.address.bn,
          branch.phone,
          "branch",
          "location",
          "শাখা",
        ),
        href: { kind: "route", pathname: "/branches" },
        price: null,
      });
    }
  }

  return hits;
}
