import { ClinicApi, ReportJobApi, VoicebotApi } from "common";
import { PageTitle } from "../page-title";
import PageWrap from "../page-wrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, FC } from "react";
import { Button } from "../ui/button";
import { SERVER_HOST } from "@/constants";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { TablePagination } from "../table-pagination";
import { toast } from "sonner";

export const ReportDownloadLink: FC<{
  jobId: string;
  onDownload?: () => void;
}> = ({ jobId, onDownload }) => {
  const handleDownload = async () => {
    onDownload?.();
    try {
      const downloadUrl = `${SERVER_HOST}/reports/${jobId}/download`;
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Report not found.");
        }
        throw new Error("Failed to download report.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        `${err instanceof Error ? err.message : "Unknown error."} Please try again later.`,
      );
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload}>
      Download
    </Button>
  );
};

const getDefaultDates = () => {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  const startDate = monthAgo.toISOString().slice(0, 10);
  return { startDate, endDate };
};

const ReportJobForm = () => {
  // todo: validation with zod, react-hook-form
  const queryClient = useQueryClient();
  const defaultDates = useMemo(getDefaultDates, []);
  const [form, setForm] = useState({
    voicebotId: "",
    clinicId: "",
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });
  const [dateError, setDateError] = useState("");

  // Fetch voicebots and clinics from API
  const { data: voicebots = [], isLoading: loadingVoicebots } = useQuery<
    VoicebotApi[]
  >({
    queryKey: ["voicebots"],
    queryFn: () => fetch(`${SERVER_HOST}/voicebots`).then((res) => res.json()),
  });
  const { data: clinics = [], isLoading: loadingClinics } = useQuery<
    ClinicApi[]
  >({
    queryKey: ["clinics"],
    queryFn: () => fetch(`${SERVER_HOST}/clinics`).then((res) => res.json()),
  });

  // Filter voicebots based on selected clinic
  const filteredVoicebots = useMemo(() => {
    if (!form.clinicId) return voicebots;
    return voicebots.filter((vb) => vb.clinicId === form.clinicId);
  }, [form.clinicId, voicebots]);

  // Filter clinics based on selected voicebot
  const filteredClinics = useMemo(() => {
    if (!form.voicebotId) return clinics;
    const selectedVoicebot = voicebots.find((vb) => vb._id === form.voicebotId);
    if (!selectedVoicebot) return clinics;
    return clinics.filter((c) => c._id === selectedVoicebot.clinicId);
  }, [form.voicebotId, clinics, voicebots]);

  // If selection becomes invalid, clear it
  useEffect(() => {
    if (
      form.voicebotId &&
      !filteredVoicebots.some((v) => v._id === form.voicebotId)
    ) {
      setForm((f) => ({ ...f, voicebotId: "" }));
    }
    if (
      form.clinicId &&
      !filteredClinics.some((c) => c._id === form.clinicId)
    ) {
      setForm((f) => ({ ...f, clinicId: "" }));
    }
  }, [filteredVoicebots, filteredClinics, form.voicebotId, form.clinicId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (
        updated.startDate &&
        updated.endDate &&
        new Date(updated.endDate) < new Date(updated.startDate)
      ) {
        setDateError("End date cannot be earlier than start date.");
      } else {
        setDateError("");
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      setDateError("End date cannot be earlier than start date.");
      return;
    }
    setDateError("");
    const { voicebotId, clinicId, startDate, endDate } = form;
    const filters = {
      ...(voicebotId && { voicebotId }),
      ...(clinicId && { clinicId }),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };
    fetch(`${SERVER_HOST}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...filters }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create report");
        return res.json();
      })
      .then(() => {
        toast.success("Report job created successfully.");
        setForm({
          voicebotId: "",
          clinicId: "",
          startDate: defaultDates.startDate,
          endDate: defaultDates.endDate,
        });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      })
      .catch((error) => {
        console.error("Error creating report job:", error);
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex flex-wrap items-end gap-4"
    >
      <div>
        <label className="mb-1 block text-sm">Voicebot</label>
        <select
          name="voicebotId"
          value={form.voicebotId}
          onChange={handleChange}
          className="w-64 rounded border px-2 py-1"
          disabled={loadingVoicebots}
        >
          <option value="">All</option>
          {filteredVoicebots.map((vb) => (
            <option key={vb._id} value={vb._id}>
              {vb.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">Clinic</label>
        <select
          name="clinicId"
          value={form.clinicId}
          onChange={handleChange}
          className="w-64 rounded border px-2 py-1"
          disabled={loadingClinics}
        >
          <option value="">All</option>
          {filteredClinics.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">Start Date</label>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          className="rounded border px-2 py-1"
          required
          max={defaultDates.endDate}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm">End Date</label>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
          className="rounded border px-2 py-1"
          required
          min={form.startDate || undefined}
          max={defaultDates.endDate}
        />
      </div>
      {dateError && (
        <div className="w-full text-sm text-red-500">{dateError}</div>
      )}
      <Button type="submit">Generate Report</Button>
    </form>
  );
};

const formatDate = (date: string | Date) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString();
};

const reportColumns: ColumnDef<ReportJobApi>[] = [
  {
    header: "Created At",
    accessorFn: (row) => row.createdAt,
    cell: (info) => formatDate(info.getValue() as string),
  },
  {
    header: "Status",
    accessorFn: (row) => row.status,
    cell: (info) => {
      const status = info.getValue() as string;
      return (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
            status === "completed"
              ? "bg-green-100 text-green-800"
              : status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    header: "Date Range",
    accessorFn: (row) => row.filters,
    cell: (info) => {
      const filters = info.getValue() as ReportJobApi["filters"];
      return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
    },
  },
  {
    header: "Voicebot",
    accessorFn: (row) => row.filters.voicebotName,
    cell: (info) => info.getValue() || "All",
  },
  {
    header: "Clinic",
    accessorFn: (row) => row.filters.clinicName,
    cell: (info) => info.getValue() || "All",
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) =>
      row.original.status === "completed" ? (
        <ReportDownloadLink jobId={row.original._id} />
      ) : null,
  },
];

const PAGE_SIZE = 20;

const ReportsTable = () => {
  const { isLoading, error, data } = useQuery<ReportJobApi[]>({
    queryKey: ["reports"],
    queryFn: () => fetch(`${SERVER_HOST}/reports`).then((res) => res.json()),
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const table = useReactTable({
    data: data || [],
    columns: reportColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: false,
    pageCount: data ? Math.ceil(data.length / PAGE_SIZE) : -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching reports</div>;

  return (
    <div className="overflow-x-auto">
      <TablePagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        canPrevious={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
        onPrevious={table.previousPage}
        onNext={table.nextPage}
      />
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-500"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="bg-white">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border-border border-b px-4 py-2 text-sm"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data?.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          No reports found. Generate your first report using the form above.
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  return (
    <PageWrap>
      <PageTitle>Reports</PageTitle>
      <ReportJobForm />
      <ReportsTable />
    </PageWrap>
  );
};

export default Reports;
