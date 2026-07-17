import { cache } from "react";
import { siteConfig, type Branch } from "@/config/site";
import { getBranches } from "@/lib/data/branches";

/** DB branches shaped like siteConfig.branches; falls back to static config. */
export const getDisplayBranches = cache(async (): Promise<Branch[]> => {
  const rows = await getBranches();
  if (rows.length === 0) return siteConfig.branches;

  return rows.map((branch) => ({
    id: branch.id,
    name: {
      en: branch.name,
      bn: branch.nameBn ?? branch.name,
    },
    address: {
      en: branch.address,
      bn: branch.addressBn ?? branch.address,
    },
    phone: branch.phone,
    mapEmbedUrl: branch.mapUrl ?? undefined,
    isMain: branch.isMain,
  }));
});
