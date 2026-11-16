import useSWRMutation from "swr/mutation";
import { mutate } from "swr";

import { createSalesPage } from "@/lib/api/salesPages";
import { SalesPage } from "@/lib/types/salesPage";
import { SWR_KEYS } from "@/lib/swrKeys";
import { ApiResponse } from "@/types";

type CreatePayload = Omit<
  SalesPage,
  "id" | "created_at" | "updated_at" | "user_id"
>;

export const useCreateSalesPage = () => {
  return useSWRMutation<ApiResponse<SalesPage>, any, string, CreatePayload>(
    "sales-pages-create",
    async (_, { arg }) => {
      try {
        const result = await createSalesPage(arg);

        // Pre-populate the individual page cache so the preview page
        // has data instantly without waiting for a second fetch.
        if (result?.data?.id) {
          await mutate(SWR_KEYS.salesPage(result.data.id), result.data, {
            revalidate: false,
            populateCache: true,
          });
        }

        // Invalidate the list so the dashboard reflects the new page.
        await mutate(
          (key) => Array.isArray(key) && key[0] === "sales-pages",
          undefined,
          { revalidate: true, populateCache: false },
        );

        return result;
      } catch (error) {
        console.error("Create failed:", error);
        throw error;
      }
    },
  );
};
