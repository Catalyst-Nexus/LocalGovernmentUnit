import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs, IconButton } from '@/components/ui'
import { CalendarOff, Plus, RefreshCw, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import type { LeaveApplication } from '@/types/hr.types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import LeaveDialog, { type LeaveFormData } from '../components/LeaveDialog'
import { createLeaveApplication, updateLeaveApplication, deleteLeaveApplication } from '@/services/hrService'

const fetchLeaveApplications = async (): Promise<LeaveApplication[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel_leave_out')
    .select(
      `
      id, status, remarks, credits, applied_date, created_at,
      personnel:per_id ( id, first_name, middle_name, last_name ),
      leave_subtype:los_id ( id, description, code )
    `
    )
    .order('applied_date', { ascending: false });

  if (error) {
    console.error('Error fetching leave applications:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    employee_id: row.personnel?.id ?? '',
    employee_name: row.personnel
      ? `${row.personnel.last_name}, ${row.personnel.first_name} ${row.personnel.middle_name || ''}`.trim()
      : 'Unknown',
    leave_type: row.leave_subtype?.code ?? 'N/A',
    date_from: row.applied_date,
    date_to: row.applied_date, // Note: This is simplified; real implementation would fetch from leave_out_dates
    days: row.credits ?? 0,
    reason: row.remarks,
    status: row.status,
    approved_by: null,
    created_at: row.created_at,
  }));
};

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<LeaveApplication | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchLeaveApplications();
    setLeaves(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleOpenAddDialog = () => {
    setEditingLeave(null);
    setLeaveDialogOpen(true);
  };

  const handleOpenEditDialog = (leave: LeaveApplication) => {
    setEditingLeave(leave);
    setLeaveDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setLeaveDialogOpen(false);
    setEditingLeave(null);
  };

  const handleSubmitLeave = async (leaveData: LeaveFormData) => {
    setIsSaving(true);
    
    if (editingLeave) {
      // Update existing leave
      const result = await updateLeaveApplication(editingLeave.id, leaveData);
      if (result.success) {
        await loadLeaves();
        handleCloseDialog();
      } else {
        alert(`Failed to update leave application: ${result.error}`);
      }
    } else {
      // Create new leave
      const result = await createLeaveApplication(leaveData);
      if (result.success) {
        await loadLeaves();
        handleCloseDialog();
      } else {
        alert(`Failed to file leave application: ${result.error}`);
      }
    }
    
    setIsSaving(false);
  };

  const handleDeleteLeave = async (leave: LeaveApplication) => {
    if (!confirm(`Are you sure you want to delete this leave application for ${leave.employee_name}?`)) {
      return;
    }

    const result = await deleteLeaveApplication(leave.id);
    if (result.success) {
      await loadLeaves();
    } else {
      alert(`Failed to delete leave application: ${result.error}`);
    }
  };

  const handleApprove = async (leave: LeaveApplication) => {
    const result = await updateLeaveApplication(leave.id, { status: 'approved' });
    if (result.success) {
      await loadLeaves();
    } else {
      alert(`Failed to approve leave: ${result.error}`);
    }
  };

  const handleDeny = async (leave: LeaveApplication) => {
    const result = await updateLeaveApplication(leave.id, { status: 'denied' });
    if (result.success) {
      await loadLeaves();
    } else {
      alert(`Failed to deny leave: ${result.error}`);
    }
  };

  const filtered = leaves.filter(l => {
    const matchSearch = l.employee_name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && l.status === activeTab
  })

  const leaveTypeLabel: Record<string, string> = {
    VL: 'Vacation Leave',
    SL: 'Sick Leave',
    ML: 'Maternity Leave',
    PL: 'Paternity Leave',
    SPL: 'Special Privilege Leave',
    FL: 'Forced Leave',
    CL: 'Compensatory Leave',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Leave applications and tracking per CSC rules"
        icon={<CalendarOff className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Applications" value={leaves.length} />
        <StatCard label="Pending" value={leaves.filter(l => l.status === 'pending').length} color="warning" />
        <StatCard label="Approved" value={leaves.filter(l => l.status === 'approved').length} color="success" />
        <StatCard label="Denied" value={leaves.filter(l => l.status === 'denied').length} color="danger" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'denied', label: 'Denied' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4" />
          File Leave
        </PrimaryButton>
        <PrimaryButton onClick={loadLeaves} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<LeaveApplication>
        data={filtered}
        columns={[
          { key: 'employee_name', header: 'Employee' },
          { key: 'leave_type', header: 'Type', render: (item) => <span title={leaveTypeLabel[item.leave_type]}>{item.leave_type}</span> },
          { key: 'date_from', header: 'From' },
          { key: 'date_to', header: 'To' },
          { key: 'days', header: 'Days' },
          { key: 'reason', header: 'Reason' },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'approved' ? 'bg-success/10 text-success' :
                item.status === 'pending' ? 'bg-warning/10 text-warning' :
                item.status === 'denied' ? 'bg-danger/10 text-danger' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
          {
            key: 'id',
            header: 'Actions',
            render: (item) => (
              <div className="flex items-center gap-1">
                {item.status === 'pending' && (
                  <>
                    <IconButton
                      onClick={() => handleApprove(item)}
                      title="Approve leave"
                    >
                      <CheckCircle className="w-4 h-4 text-success" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeny(item)}
                      title="Deny leave"
                    >
                      <XCircle className="w-4 h-4 text-error" />
                    </IconButton>
                  </>
                )}
                <IconButton
                  onClick={() => handleOpenEditDialog(item)}
                  title="Edit leave"
                >
                  <Edit className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteLeave(item)}
                  title="Delete leave"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </IconButton>
              </div>
            ),
          },
        ]}
        title={`Leave Applications (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage={isLoading ? 'Loading leave applications...' : 'No leave applications found.'}
      />

      <LeaveDialog
        open={leaveDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitLeave}
        leave={editingLeave}
        isLoading={isSaving}
      />
    </div>
  )
}

export default LeaveManagement
