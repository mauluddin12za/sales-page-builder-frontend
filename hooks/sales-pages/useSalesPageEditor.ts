import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { regenerateSalesPage } from "@/lib/api/salesPages";
import safeParseJSON from "@/lib/safeParseJson";
import { useUpdateSalesPage } from "@/hooks/sales-pages";
import { SectionKey, TemplateId } from "@/lib/mock-data";
import type { SalesPage } from "@/lib/types/salesPage";
import type { GeneratedContent } from "@/lib/sales-page/types";

export function useSalesPageEditor(
  page: SalesPage | null | undefined,
  id: number,
) {
  const { trigger: updateSalesPage, isMutating: isGenerating } =
    useUpdateSalesPage();

  const parsedContent = useMemo<GeneratedContent | null>(() => {
    if (!page) return null;
    return safeParseJSON(page.generated_content);
  }, [page]);

  // Track page ID to initialize or reset state when a page loads or switches
  const [prevPageId, setPrevPageId] = useState<number | null>(page?.id ?? null);

  const [persistedTemplate, setPersistedTemplate] = useState<TemplateId>(
    page?.template ?? "modern",
  );
  const [draftTemplate, setDraftTemplate] = useState<TemplateId>(
    page?.template ?? "modern",
  );

  const [persistedContent, setPersistedContent] =
    useState<GeneratedContent | null>(parsedContent);
  const [draftContent, setDraftContent] =
    useState<GeneratedContent | null>(parsedContent);

  const [ctaUrl, setCtaUrl] = useState(page?.cta_url ?? "");
  const [ctaLabel, setCtaLabel] = useState(page?.cta_label ?? "");

  const [regenLoading, setRegenLoading] = useState<SectionKey | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Sync state during render when a page loads asynchronously (avoids cascading renders from useEffect)
  if (page && page.id !== prevPageId) {
    setPrevPageId(page.id);
    setPersistedTemplate(page.template);
    setDraftTemplate(page.template);
    setPersistedContent(parsedContent);
    setDraftContent(parsedContent);
    setCtaUrl(page.cta_url ?? "");
    setCtaLabel(page.cta_label ?? "");
  }

  // Derive draft content with latest CTA label and URL dynamically
  const effectiveDraftContent = useMemo<GeneratedContent | null>(() => {
    if (!draftContent) return null;
    return {
      ...draftContent,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
    };
  }, [draftContent, ctaLabel, ctaUrl]);

  const hasChanges =
    draftTemplate !== persistedTemplate ||
    JSON.stringify(draftContent) !== JSON.stringify(persistedContent) ||
    ctaUrl !== (page?.cta_url ?? "") ||
    ctaLabel !== (page?.cta_label ?? "");

  // REGENERATE
  const handleRegenerate = async (section: SectionKey) => {
    if (!page || regenLoading) return;

    setRegenLoading(section);

    try {
      const res = await regenerateSalesPage({
        field: section,
        product_name: page.product_name,
        description: page.description,
        features: page.features,
        target_audience: page.target_audience,
        price: page.price || "",
        usp: page.usp || "",
        current_output: effectiveDraftContent ?? {},
      });

      setDraftContent((prev) => (prev ? { ...prev, ...res.data } : res.data));

      toast.success(`${section} updated`);
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setRegenLoading(null);
    }
  };

  // APPLY
  const handleApply = async () => {
    if (!page || !hasChanges) return;

    setIsApplying(true);

    try {
      await updateSalesPage({
        id,
        payload: {
          ...page,
          template: draftTemplate,
          generated_content: JSON.stringify(effectiveDraftContent),
          cta_label: ctaLabel,
          cta_url: ctaUrl,
        },
      });

      setPersistedTemplate(draftTemplate);
      setPersistedContent(draftContent);

      toast.success("Changes applied");
    } catch {
      toast.error("Failed to apply changes");
    } finally {
      setIsApplying(false);
    }
  };

  return {
    draftTemplate,
    setDraftTemplate,

    draftContent: effectiveDraftContent,
    setDraftContent,

    persistedTemplate,

    ctaUrl,
    setCtaUrl,
    ctaLabel,
    setCtaLabel,

    regenLoading,
    isApplying,
    isGenerating,
    hasChanges,

    handleRegenerate,
    handleApply,
  };
}
