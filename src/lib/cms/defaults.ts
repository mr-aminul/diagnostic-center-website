import { siteConfig } from "@/config/site";
import type { CmsSiteSettings } from "@/lib/cms/types";

/** Defaults mirrored from siteConfig + messages/*.json so a fresh DB still looks correct. */
export function getDefaultCmsSettings(): CmsSiteSettings {
  return {
    branding: {
      name: siteConfig.name,
      shortName: siteConfig.shortName,
      tagline: { ...siteConfig.tagline },
      description: { ...siteConfig.description },
      logo: { ...siteConfig.logo },
      theme: { ...siteConfig.theme },
    },
    contact: {
      phones: [...siteConfig.contact.phones],
      whatsapp: siteConfig.contact.whatsapp,
      email: siteConfig.contact.email,
      hours: { ...siteConfig.hours },
      social: { ...siteConfig.social },
    },
    features: { ...siteConfig.features },
    payment: { ...siteConfig.payment },
    seo: { keywords: [...siteConfig.seo.keywords] },
    about: {
      missionTitle: {
        en: "Our Mission",
        bn: "আমাদের লক্ষ্য",
      },
      missionBody: {
        en: "To make accurate, affordable, and timely diagnostics accessible to every patient we serve.",
        bn: "আমরা যেসব রোগীকে সেবা দিই, তাদের সবার জন্য সঠিক, সাশ্রয়ী ও সময়মতো ডায়াগনস্টিক সেবা সহজলভ্য করা।",
      },
      accreditationTitle: {
        en: "Accreditation & Standards",
        bn: "স্বীকৃতি ও মানদণ্ড",
      },
      accreditationBody: {
        en: "Our laboratory follows standardized quality-control protocols with regular equipment calibration.",
        bn: "আমাদের ল্যাবরেটরি নিয়মিত যন্ত্রপাতি ক্যালিব্রেশনসহ মানসম্মত মাননিয়ন্ত্রণ প্রোটোকল অনুসরণ করে।",
      },
    },
    homeCollection: {
      title: {
        en: "Home Sample Collection",
        bn: "হোম স্যাম্পল কালেকশন",
      },
      subtitle: {
        en: "Skip the visit — our trained phlebotomists collect samples at your doorstep",
        bn: "কেন্দ্রে আসার ঝামেলা এড়ান — আমাদের প্রশিক্ষিত ফ্লেবোটোমিস্ট আপনার দোরগোড়ায় নমুনা সংগ্রহ করবেন",
      },
      howItWorksTitle: {
        en: "How It Works",
        bn: "কীভাবে কাজ করে",
      },
      cta: {
        en: "Request Home Collection",
        bn: "হোম কালেকশনের অনুরোধ",
      },
      steps: {
        book: {
          title: { en: "Book Online", bn: "অনলাইনে বুক করুন" },
          desc: {
            en: "Choose your tests and preferred time slot.",
            bn: "আপনার টেস্ট ও পছন্দের সময় বেছে নিন।",
          },
        },
        confirm: {
          title: { en: "Get Confirmation", bn: "নিশ্চিতকরণ পান" },
          desc: {
            en: "We'll send an SMS confirming your booking.",
            bn: "বুকিং নিশ্চিত করে আমরা SMS পাঠাব।",
          },
        },
        collect: {
          title: { en: "Sample Collection", bn: "নমুনা সংগ্রহ" },
          desc: {
            en: "Our technician visits your address to collect the sample.",
            bn: "আমাদের টেকনিশিয়ান আপনার ঠিকানায় গিয়ে নমুনা সংগ্রহ করবেন।",
          },
        },
        report: {
          title: { en: "Report Delivery", bn: "রিপোর্ট সরবরাহ" },
          desc: {
            en: "Download your report online once it's ready.",
            bn: "প্রস্তুত হলে অনলাইনে আপনার রিপোর্ট ডাউনলোড করুন।",
          },
        },
      },
    },
  };
}

export const DEFAULT_FAQ_ITEMS: Array<{
  questionEn: string;
  questionBn: string;
  answerEn: string;
  answerBn: string;
}> = [
  {
    questionEn: "Do I need to book an appointment before visiting?",
    questionBn: "ভিজিটের আগে কি অ্যাপয়েন্টমেন্ট বুক করতে হবে?",
    answerEn:
      "Walk-ins are welcome, but booking online in advance helps us reduce your waiting time.",
    answerBn:
      "ওয়াচ-ইন স্বাগতম। তবে আগে থেকে অনলাইনে বুক করলে আপনার অপেক্ষার সময় কমে যায়।",
  },
  {
    questionEn: "How do I get my test report?",
    questionBn: "আমি কীভাবে আমার টেস্ট রিপোর্ট পাব?",
    answerEn:
      "Once your report is ready, open Track / Reports, enter your mobile number, verify the SMS code, and download from your visit history. We'll also notify you by SMS.",
    answerBn:
      "রিপোর্ট প্রস্তুত হলে ট্র্যাক / রিপোর্ট খুলে মোবাইল নম্বর দিন, SMS কোড যাচাই করুন, তারপর আপনার ভিজিট তালিকা থেকে ডাউনলোড করুন। আমরা SMS-এও জানাব।",
  },
  {
    questionEn: "Is home sample collection available everywhere in the city?",
    questionBn: "শহরের সব এলাকায় কি হোম স্যাম্পল কালেকশন পাওয়া যায়?",
    answerEn:
      "We currently cover most areas within the city. Please mention your address while booking and our team will confirm availability.",
    answerBn:
      "বর্তমানে শহরের অধিকাংশ এলাকায় আমাদের সেবা আছে। বুকিংয়ের সময় আপনার ঠিকানা উল্লেখ করুন — আমাদের টিম উপলব্ধতা নিশ্চিত করবে।",
  },
  {
    questionEn: "How long does it take to get results?",
    questionBn: "ফলাফল পেতে কত সময় লাগে?",
    answerEn:
      "Most routine tests are ready within 24 hours. Specialized tests may take longer — the expected turnaround time is shown next to each test.",
    answerBn:
      "অধিকাংশ নিয়মিত টেস্ট ২৪ ঘণ্টার মধ্যে প্রস্তুত হয়। বিশেষায়িত টেস্টে বেশি সময় লাগতে পারে — প্রতিটি টেস্টের পাশে প্রত্যাশিত সময় দেখানো আছে।",
  },
  {
    questionEn: "What payment methods do you accept?",
    questionBn: "আপনারা কোন কোন পেমেন্ট পদ্ধতি গ্রহণ করেন?",
    answerEn:
      "You can pay in cash at the center or during home collection. Online payment shows a demo checkout (bKash / Nagad / card UI) until a live gateway is connected — no real charge in demo mode.",
    answerBn:
      "কেন্দ্রে বা হোম কালেকশনের সময় নগদে পরিশোধ করতে পারেন। অনলাইন পেমেন্টে ডেমো চেকআউট (বিকাশ / নগদ / কার্ড UI) দেখায় — লাইভ গেটওয়ে যুক্ত না হওয়া পর্যন্ত কোনো আসল চার্জ নেই।",
  },
  {
    questionEn: "Can I cancel or reschedule my booking?",
    questionBn: "আমি কি আমার বুকিং বাতিল বা পুনঃনির্ধারণ করতে পারি?",
    answerEn:
      "Yes. Open Track / Reports with your mobile number and the SMS code. While a booking is still pending or confirmed, you can cancel or pick a new date and time slot.",
    answerBn:
      "হ্যাঁ। মোবাইল নম্বর ও SMS কোড দিয়ে ট্র্যাক / রিপোর্ট খুলুন। বুকিং মুলতুবি বা নিশ্চিত থাকলে বাতিল বা নতুন তারিখ/সময় বেছে নিতে পারবেন।",
  },
];

export const DEFAULT_TESTIMONIALS: Array<{
  nameEn: string;
  nameBn: string;
  roleEn: string;
  roleBn: string;
  quoteEn: string;
  quoteBn: string;
}> = [
  {
    nameEn: "Rafiqul Islam",
    nameBn: "রফিকুল ইসলাম",
    roleEn: "Patient",
    roleBn: "রোগী",
    quoteEn:
      "Booked a home sample collection and got my report online within a day. Very smooth experience.",
    quoteBn:
      "হোম স্যাম্পল কালেকশন বুক করেছিলাম এবং এক দিনের মধ্যে অনলাইনে রিপোর্ট পেয়েছি। খুবই সহজ অভিজ্ঞতা।",
  },
  {
    nameEn: "Shirin Akter",
    nameBn: "শিরীন আক্তার",
    roleEn: "Patient",
    roleBn: "রোগী",
    quoteEn:
      "The staff were friendly and the reception area was clean. Highly recommend their health packages.",
    quoteBn:
      "কর্মীরা বন্ধুত্বপূর্ণ এবং রিসেপশন এলাকা পরিষ্কার ছিল। তাদের হেলথ প্যাকেজগুলো অত্যন্ত সুপারিশযোগ্য।",
  },
  {
    nameEn: "Tanvir Ahmed",
    nameBn: "তানভীর আহমেদ",
    roleEn: "Patient",
    roleBn: "রোগী",
    quoteEn:
      "Accurate results and the doctors explained everything clearly during my checkup.",
    quoteBn:
      "সঠিক ফলাফল এবং চেকআপের সময় ডাক্তাররা সবকিছু পরিষ্কারভাবে বুঝিয়ে দিয়েছেন।",
  },
];
