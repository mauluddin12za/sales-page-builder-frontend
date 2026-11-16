"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { SalesPageToolbar } from "@/components/ui/SalesPageToolbar";
import { TemplateRenderer } from "@/components/ui/TemplateRenderer";
import { useSalesPage, useSalesPageEditor } from "@/hooks/sales-pages";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 1500;

export default function Page({ params }: PageProps) {
  const { slug } = React.use(params);
  const id = slug.split("-")[2];

  const router = useRouter();
  const { salesPage: page, isLoading, error, mutate } = useSalesPage(
    Number(id),
  );

  // useState so the retry count can trigger a re-render and update the loading condition
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If we land here without data (race condition after redirect), retry
  // fetching a few times before showing an error state.
  useEffect(() => {
    if (isLoading || page) return;

    if (retryCount < MAX_RETRIES) {
      retryTimer.current = setTimeout(() => {
        setRetryCount((n) => n + 1);
        mutate();
      }, RETRY_INTERVAL_MS);
    }

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [isLoading, page, error, mutate, retryCount]);

  const editor = useSalesPageEditor(page, Number(id));

  if (isLoading || (!page && retryCount < MAX_RETRIES)) {
    return <Loading />;
  }

  if (!page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Page not found or failed to load.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => { setRetryCount(0); mutate(); }}>
            Retry
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SalesPageToolbar router={router} page={page} {...editor} />

      <TemplateRenderer
        template={editor.draftTemplate}
        content={editor.draftContent}
        productName={page.product_name}
      />

      {editor.hasChanges && (
        <Button
          onClick={editor.handleApply}
          className="fixed bottom-10 right-10"
          isLoading={editor.isApplying}
          loadingText="Applying..."
        >
          Apply Changes
        </Button>
      )}
    </div>
  );
}
