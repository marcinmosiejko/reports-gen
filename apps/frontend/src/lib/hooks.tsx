import { ReportDownloadLink } from "@/components/pages/reports";
import { SERVER_HOST } from "@/constants";
import { QueryClient } from "@tanstack/react-query";
import { JobStatus, ReportJobApi } from "common";
import { useEffect } from "react";
import { toast } from "sonner";

type ReportUpdateEvent = Partial<ReportJobApi> & {
  _id: ReportJobApi["_id"];
  status: ReportJobApi["status"];
  ownerId: ReportJobApi["ownerId"];
};
export const useReportUpdates = (queryClient: QueryClient) => {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout | null = null;
    const maxRetries = 5;

    const connect = () => {
      eventSource = new EventSource(`${SERVER_HOST}/reports/subscribe`);

      eventSource.addEventListener("update", (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as ReportUpdateEvent;
          queryClient.invalidateQueries({ queryKey: ["reports"] });
          if (data.status === JobStatus.Completed) {
            // todo: more informative toast
            const t = toast.success("Report job completed.", {
              action: (
                <ReportDownloadLink
                  onDownload={() => toast.dismiss(t)}
                  jobId={data._id}
                />
              ),
            });
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      });

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        eventSource?.close();
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          retryTimeout = setTimeout(() => {
            retryCount++;
            connect();
          }, delay);
        } else {
          console.error("Max SSE retry attempts reached.");
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [queryClient]);
};
