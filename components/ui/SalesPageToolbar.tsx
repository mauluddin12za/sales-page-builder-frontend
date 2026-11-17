"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCw,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";

import { Input } from "@/components/ui/Input";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-dropdown-menu";

import { useRouter } from "next/navigation";
import { downloadHtmlFile } from "@/lib/export-html";
import toast from "react-hot-toast";
import { SectionKey, TemplateId, TEMPLATES } from "@/lib/sales-page/types";
import type { SalesPage } from "@/lib/types/salesPage";

interface Props {
  router: ReturnType<typeof useRouter>;
  page: SalesPage;

  draftTemplate: TemplateId;
  setDraftTemplate: (v: TemplateId) => void;

  ctaUrl: string;
  setCtaUrl: (v: string) => void;

  ctaLabel: string;
  setCtaLabel: (v: string) => void;

  handleApply: () => Promise<void>;
  isApplying: boolean;
  isGenerating: boolean;

  handleRegenerate: (section: SectionKey) => void;
  regenLoading: SectionKey | null;

  hasChanges: boolean;
}

type CtaType = "website" | "whatsapp";

export function SalesPageToolbar({
  router,
  page,

  draftTemplate,
  setDraftTemplate,

  ctaUrl,
  setCtaUrl,
  ctaLabel,
  setCtaLabel,

  handleApply,
  isGenerating,

  handleRegenerate,
  regenLoading,

  hasChanges,
}: Props) {
  const [navHidden, setNavHidden] = useState(false);

  const [ctaType, setCtaType] = useState<CtaType>(() => {
    return /^(?:https?:\/\/)?(?:www\.)?wa\.me/i.test(ctaUrl || "") ? "whatsapp" : "website";
  });
  const [prevCtaUrl, setPrevCtaUrl] = useState(ctaUrl);

  // Sync type when ctaUrl loads asynchronously from database
  if (ctaUrl !== prevCtaUrl) {
    setPrevCtaUrl(ctaUrl);
    if (/^(?:https?:\/\/)?(?:www\.)?wa\.me/i.test(ctaUrl || "")) {
      setCtaType("whatsapp");
    } else if (ctaUrl) {
      setCtaType("website");
    }
  }

  // Derive editable suffix directly from ctaUrl & ctaType (no cascading renders)
  const ctaValue = useMemo(() => {
    if (!ctaUrl) return "";
    if (ctaType === "whatsapp") {
      return ctaUrl.replace(/^(?:https?:\/\/)?(?:www\.)?wa\.me\/?/i, "");
    }
    return ctaUrl.replace(/^https?:\/\//i, "");
  }, [ctaUrl, ctaType]);

  const handleTypeChange = (newType: CtaType) => {
    setCtaType(newType);
    setCtaUrl("");
  };

  const handleValueChange = (raw: string) => {
    let clean = raw.trim();
    const prefix = ctaType === "whatsapp" ? "https://wa.me/" : "https://";

    if (ctaType === "whatsapp") {
      clean = clean.replace(/^(https?:\/\/)?(www\.)?wa\.me\/?/i, "");
      clean = clean.replace(/^\+/, "").replace(/[\s\-()]/g, "");
    } else {
      clean = clean.replace(/^https?:\/\//i, "");
    }

    if (!clean) {
      setCtaUrl("");
    } else {
      setCtaUrl(`${prefix}${clean}`);
    }
  };

  return (
    <>
      {/* TOP BAR */}
      {!navHidden && (
        <div className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-lg py-4">
          <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-4">
            {/* LEFT */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </div>

            {/* CENTER - TEMPLATE SWITCH */}
            <Select value={draftTemplate} onValueChange={setDraftTemplate}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">
              {/* EXPORT */}
              <Button
                size="sm"
                onClick={() => {
                  downloadHtmlFile({
                    ...page,
                    template: draftTemplate,
                  });
                  toast.success("HTML exported");
                }}
                className="bg-(image:--gradient-primary) text-primary-foreground hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Export</span>
              </Button>

              {/* SETTINGS SHEET */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Settings</span>
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md animate-dialog-in-right"
                >
                  <SheetHeader>
                    <SheetTitle>Page Settings</SheetTitle>
                    <SheetDescription>
                      Manage CTA, regenerate content, and edit page.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* CTA SETTINGS */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">CTA Settings</h3>
                        <span className="text-[11px] text-muted-foreground">Action button</span>
                      </div>

                      {/* Type picker */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">Link Destination</Label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => handleTypeChange("website")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                              ctaType === "website"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Website URL
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeChange("whatsapp")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                              ctaType === "whatsapp"
                                ? "bg-background text-foreground shadow-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* Predefined URL with Muted Prefix */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">
                          {ctaType === "whatsapp" ? "WhatsApp Phone Number" : "Target Web Address"}
                        </Label>
                        <div className="flex rounded-lg border border-input bg-background shadow-xs focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                          {/* Uneditable / Muted Predefined Prefix */}
                          <span className="inline-flex items-center px-3 bg-muted/60 text-muted-foreground text-xs font-mono select-none border-r border-input shrink-0">
                            {ctaType === "whatsapp" ? "https://wa.me/" : "https://"}
                          </span>
                          {/* User input for the rest */}
                          <input
                            type="text"
                            value={ctaValue}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder={
                              ctaType === "whatsapp" ? "6281234567890" : "yourproduct.com/checkout"
                            }
                            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {ctaType === "whatsapp"
                            ? "Prefix is locked. Enter phone number with country code (e.g. 6281234567890)."
                            : "Prefix https:// is locked. Enter your domain or page path."}
                        </p>
                      </div>

                      {/* Button Label */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">Button Text (Label)</Label>
                        <Input
                          value={ctaLabel}
                          onChange={(e) => setCtaLabel(e.target.value)}
                          placeholder={ctaType === "whatsapp" ? "Chat on WhatsApp" : "Get Started"}
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Live Full Link Preview */}
                      {ctaUrl && (
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] space-y-1">
                          <span className="text-muted-foreground font-medium block">Final Link Preview:</span>
                          <span className="text-primary font-mono break-all block">{ctaUrl}</span>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleApply}
                        isLoading={isGenerating}
                        disabled={!hasChanges}
                      >
                        Save CTA
                      </Button>
                    </section>

                    <Separator />

                    {/* REGENERATE */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        Regenerate Section
                      </h3>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "headline",
                          "subheadline",
                          "description",
                          "benefits",
                          "features",
                          "social_proof",
                          "pricing",
                          "cta",
                        ].map((key) => (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            disabled={!!regenLoading}
                            onClick={() => handleRegenerate(key as SectionKey)}
                            className="justify-start"
                          >
                            {regenLoading === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-2 truncate text-xs">
                              {key.replace("_", " ")}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </section>

                    <Separator />

                    {/* EDIT FULL */}
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">Edit Full Page</h3>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/generate?id=${page.id}`)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Open Editor
                      </Button>
                    </section>
                  </div>
                </SheetContent>
              </Sheet>

              {/* HIDE UI */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNavHidden(true)}
              >
                <EyeOff className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Hide</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE UI BUTTON */}
      {navHidden && (
        <button
          onClick={() => setNavHidden(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs shadow"
        >
          <Eye className="h-4 w-4" />
          Show toolbar
        </button>
      )}
    </>
  );
}
