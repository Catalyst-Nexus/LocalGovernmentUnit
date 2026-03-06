import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
  IconButton,
} from "@/components/ui";
import {
  UserCheck,
  Plus,
  RefreshCw,
  Download,
  Link2,
  Link2Off,
  Edit,
  Trash2,
} from "lucide-react";
import type { Employee } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import LinkAccountDialog from "../components/LinkAccountDialog";
import EmployeeDialog, { type EmployeeFormData } from "../components/EmployeeDialog";
import { createEmployee, updateEmployee, deleteEmployee } from "@/services/hrService";

const fetchPersonnel = async (): Promise<Employee[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select(
      `
      id, first_name, middle_name, last_name,
      employment_status, date_hired, is_active, created_at, user_id,
      position:pos_id ( id, description, item_no ),
      office:o_id ( id, description )
    `,
    )
    .order("last_name");

  if (error) {
    console.error("Error fetching personnel:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    employee_number: row.position?.item_no ?? "—",
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    position_id: row.position?.id ?? "",
    position_title: row.position?.description ?? "Unassigned",
    office_id: row.office?.id ?? "",
    office_name: row.office?.description ?? "Unassigned",
    employment_status: row.employment_status,
    date_hired: row.date_hired,
    is_active: row.is_active,
    created_at: row.created_at,
    user_id: row.user_id,
  }));
};

const EmployeeMasterlist = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [linkEmployee, setLinkEmployee] = useState<Employee | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPersonnel();
    setEmployees(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Update the one row that was just linked/unlinked — no full refetch needed
  const handleLinked = (personnelId: string, userId: string | null) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === personnelId ? { ...e, user_id: userId } : e)),
    );
  };

  const handleOpenAddDialog = () => {
    setEditingEmployee(null);
    setEmployeeDialogOpen(true);
  };

  const handleOpenEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEmployeeDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmitEmployee = async (employeeData: EmployeeFormData) => {
    setIsSaving(true);
    
    if (editingEmployee) {
      // Update existing employee
      const result = await updateEmployee(editingEmployee.id, employeeData);
      if (result.success) {
        await loadEmployees();
        handleCloseDialog();
      } else {
        alert(`Failed to update employee: ${result.error}`);
      }
    } else {
      // Create new employee
      const result = await createEmployee(employeeData);
      if (result.success) {
        await loadEmployees();
        handleCloseDialog();
      } else {
        alert(`Failed to create employee: ${result.error}`);
      }
    }
    
    setIsSaving(false);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    const result = await deleteEmployee(employee.id);
    if (result.success) {
      await loadEmployees();
    } else {
      alert(`Failed to delete employee: ${result.error}`);
    }
  };

  const filtered = employees.filter((e) => {
    const matchSearch =
      `${e.first_name} ${e.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      e.employee_number.toLowerCase().includes(search.toLowerCase()) ||
      e.position_title.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    if (activeTab === "active") return matchSearch && e.is_active;
    if (activeTab === "inactive") return matchSearch && !e.is_active;
    return matchSearch && e.employment_status === activeTab;
  });

  // All user_ids currently claimed — used by the dialog to exclude already-linked accounts
  const linkedUserIds = employees
    .filter((e) => e.user_id !== null)
    .map((e) => e.user_id as string);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Masterlist"
        subtitle="Complete employee records per CSC and DBM standards"
        icon={<UserCheck className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard
          label="Active"
          value={employees.filter((e) => e.is_active).length}
          color="success"
        />
        <StatCard
          label="Permanent"
          value={
            employees.filter((e) => e.employment_status === "permanent").length
          }
          color="primary"
        />
        <StatCard
          label="Job Order"
          value={
            employees.filter((e) => e.employment_status === "job_order").length
          }
          color="warning"
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "permanent", label: "Permanent" },
          { id: "casual", label: "Casual" },
          { id: "contractual", label: "Contractual" },
          { id: "job_order", label: "Job Order" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4" />
          Add Employee
        </PrimaryButton>
        <PrimaryButton onClick={loadEmployees} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<Employee>
        data={filtered}
        columns={[
          { key: "employee_number", header: "Item No." },
          {
            key: "last_name",
            header: "Name",
            render: (item) => (
              <span>
                {item.last_name}, {item.first_name}
                {item.middle_name ? " " + item.middle_name : ""}
              </span>
            ),
          },
          { key: "position_title", header: "Position" },
          { key: "office_name", header: "Office" },
          {
            key: "employment_status",
            header: "Type",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.employment_status === "permanent"
                    ? "bg-green-500/10 text-green-500"
                    : item.employment_status === "casual"
                      ? "bg-blue-500/10 text-blue-500"
                      : item.employment_status === "job_order"
                        ? "bg-orange-500/10 text-orange-500"
                        : item.employment_status === "contractual"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {item.employment_status.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          { key: "date_hired", header: "Date Hired" },
          {
            key: "user_id",
            header: "System Account",
            render: (item) => (
              <div className="flex items-center gap-2">
                {item.user_id ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                    <Link2 className="w-3 h-3" /> Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-muted/10 text-muted">
                    <Link2Off className="w-3 h-3" /> No account
                  </span>
                )}
                <IconButton
                  onClick={() => setLinkEmployee(item)}
                  title="Manage account link"
                >
                  <Link2 className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
          {
            key: "id",
            header: "Actions",
            render: (item) => (
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => handleOpenEditDialog(item)}
                  title="Edit employee"
                >
                  <Edit className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteEmployee(item)}
                  title="Delete employee"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </IconButton>
              </div>
            ),
          },
        ]}
        title={`Employees (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, number, or position..."
        emptyMessage={isLoading ? "Loading employees…" : "No employees found."}
      />

      <EmployeeDialog
        open={employeeDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitEmployee}
        employee={editingEmployee}
        isLoading={isSaving}
      />

      <LinkAccountDialog
        open={linkEmployee !== null}
        onClose={() => setLinkEmployee(null)}
        employee={linkEmployee}
        linkedUserIds={linkedUserIds}
        onLinked={handleLinked}
      />
    </div>
  );
};

export default EmployeeMasterlist;
