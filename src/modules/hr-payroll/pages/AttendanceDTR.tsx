import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
} from "@/components/ui";
import { Clock, RefreshCw, Download } from "lucide-react";
import type { AttendanceRecord } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

interface TimeRecordRow {
  id: string;
  per_id: string;
  date: string;
  in1: string | null;
  out1: string | null;
  in2: string | null;
  out2: string | null;
  ot_in: string | null;
  ot_out: string | null;
  pay_amount: number;
  created_at: string;
  personnel: {
    first_name: string;
    last_name: string;
  } | null;
}

const fetchTimeRecords = async (): Promise<AttendanceRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_record")
    .select(
      `
      id, per_id, date, in1, out1, in2, out2, ot_in, ot_out,
      pay_amount, created_at,
      personnel:per_id ( first_name, last_name )
    `,
    )
    .order("date", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching time records:", error);
    return [];
  }

  return ((data as TimeRecordRow[]) || []).map((row) => {
    const hasAnyTime = row.in1 || row.out1 || row.in2 || row.out2;
    let status: AttendanceRecord["status"] = "absent";
    if (hasAnyTime) {
      const hasAM = row.in1 && row.out1;
      const hasPM = row.in2 && row.out2;
      status =
        hasAM && hasPM ? "present" : hasAM || hasPM ? "halfday" : "absent";
    }

    return {
      id: row.id,
      employee_id: row.per_id,
      employee_name: row.personnel
        ? `${row.personnel.last_name}, ${row.personnel.first_name}`
        : "—",
      date: row.date,
      in1: row.in1,
      out1: row.out1,
      in2: row.in2,
      out2: row.out2,
      ot_in: row.ot_in,
      ot_out: row.ot_out,
      pay_amount: row.pay_amount,
      status,
      created_at: row.created_at,
    };
  });
};

const AttendanceDTR = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [isLoading, setIsLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchTimeRecords();
    setRecords(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance / DTR"
        subtitle="Daily Time Record tracking per CSC Memorandum Circular"
        icon={<Clock className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard
          label="Present"
          value={records.filter((r) => r.status === "present").length}
          color="success"
        />
        <StatCard
          label="Late"
          value={records.filter((r) => r.status === "late").length}
          color="warning"
        />
        <StatCard
          label="Absent"
          value={records.filter((r) => r.status === "absent").length}
          color="danger"
        />
        <StatCard
          label="Half Day"
          value={records.filter((r) => r.status === "halfday").length}
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "today", label: "Today" },
          { id: "weekly", label: "This Week" },
          { id: "monthly", label: "This Month" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={loadRecords} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export DTR
        </PrimaryButton>
      </ActionsBar>

      <DataTable<AttendanceRecord>
        data={records.filter((r) =>
          r.employee_name.toLowerCase().includes(search.toLowerCase()),
        )}
        columns={[
          { key: "employee_name", header: "Employee" },
          { key: "date", header: "Date" },
          {
            key: "in1",
            header: "AM In",
            render: (item) => <span>{item.in1 || "—"}</span>,
          },
          {
            key: "out1",
            header: "AM Out",
            render: (item) => <span>{item.out1 || "—"}</span>,
          },
          {
            key: "in2",
            header: "PM In",
            render: (item) => <span>{item.in2 || "—"}</span>,
          },
          {
            key: "out2",
            header: "PM Out",
            render: (item) => <span>{item.out2 || "—"}</span>,
          },
          {
            key: "pay_amount",
            header: "Pay",
            render: (item) => <span>₱{item.pay_amount.toFixed(2)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "present"
                    ? "bg-success/10 text-success"
                    : item.status === "late"
                      ? "bg-warning/10 text-warning"
                      : item.status === "absent"
                        ? "bg-danger/10 text-danger"
                        : item.status === "holiday"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
        ]}
        title="Attendance Records"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No attendance records found."
      />
    </div>
  );
};

export default AttendanceDTR;
