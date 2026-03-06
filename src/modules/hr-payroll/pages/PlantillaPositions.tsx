import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
} from "@/components/ui";
import { LayoutList, Plus, RefreshCw } from "lucide-react";
import type { PlantillaPosition } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

interface PositionRow {
  id: string;
  item_no: string;
  description: string;
  is_filled: boolean;
  created_at: string;
  office:
    | { id: string; description: string }[]
    | { id: string; description: string }
    | null;
  salary_rate: { description: string }[] | { description: string } | null;
  pos_type: { description: string }[] | { description: string } | null;
  personnel: { first_name: string; last_name: string }[] | null;
}

const fetchPositions = async (): Promise<PlantillaPosition[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .select(
      `
      id, item_no, description, is_filled, created_at,
      office:o_id ( id, description ),
      salary_rate:sr_id ( description ),
      pos_type:pt_id ( description ),
      personnel ( first_name, last_name )
    `,
    )
    .order("item_no");

  if (error) {
    console.error("Error fetching positions:", error);
    return [];
  }

  return ((data as unknown as PositionRow[]) || []).map((row) => {
    const office = Array.isArray(row.office) ? row.office[0] : row.office;
    const salaryRate = Array.isArray(row.salary_rate)
      ? row.salary_rate[0]
      : row.salary_rate;
    const posType = Array.isArray(row.pos_type)
      ? row.pos_type[0]
      : row.pos_type;
    return {
      id: row.id,
      item_number: row.item_no,
      position_title: row.description,
      salary_grade: salaryRate?.description ?? "—",
      office_id: office?.id ?? "",
      office_name: office?.description ?? "Unassigned",
      pos_type: posType?.description ?? "—",
      is_filled: row.is_filled,
      incumbent_name: row.personnel?.[0]
        ? `${row.personnel[0].last_name}, ${row.personnel[0].first_name}`
        : null,
      created_at: row.created_at,
    };
  });
};

const PlantillaPositions = () => {
  const [positions, setPositions] = useState<PlantillaPosition[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPositions();
    setPositions(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantilla of Positions"
        subtitle="Authorized positions per DBM-approved plantilla"
        icon={<LayoutList className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Positions" value={positions.length} />
        <StatCard
          label="Filled"
          value={positions.filter((p) => p.is_filled).length}
          color="success"
        />
        <StatCard
          label="Vacant"
          value={positions.filter((p) => !p.is_filled).length}
          color="danger"
        />
        <StatCard
          label="Fill Rate"
          value={
            positions.length
              ? `${Math.round((positions.filter((p) => p.is_filled).length / positions.length) * 100)}%`
              : "0%"
          }
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={() => {}}>
          <Plus className="w-4 h-4" />
          Add Position
        </PrimaryButton>
        <PrimaryButton onClick={loadPositions} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PlantillaPosition>
        data={positions.filter(
          (p) =>
            p.position_title.toLowerCase().includes(search.toLowerCase()) ||
            p.item_number.toLowerCase().includes(search.toLowerCase()) ||
            p.office_name.toLowerCase().includes(search.toLowerCase()),
        )}
        columns={[
          { key: "item_number", header: "Item No." },
          { key: "position_title", header: "Position Title" },
          { key: "salary_grade", header: "SG" },
          { key: "office_name", header: "Office" },
          { key: "pos_type", header: "Type" },
          {
            key: "is_filled",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.is_filled
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {item.is_filled ? "Filled" : "Vacant"}
              </span>
            ),
          },
          {
            key: "incumbent_name",
            header: "Incumbent",
            render: (item) => <span>{item.incumbent_name ?? "—"}</span>,
          },
        ]}
        title="Plantilla Positions"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item no., position, or office..."
        emptyMessage="No positions found."
      />
    </div>
  );
};

export default PlantillaPositions;
