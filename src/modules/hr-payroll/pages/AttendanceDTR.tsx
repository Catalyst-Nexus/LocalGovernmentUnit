import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Clock, RefreshCw, Download } from 'lucide-react'
import type { AttendanceRecord } from '@/types/hr.types'

const AttendanceDTR = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setRecords([]); setIsLoading(false) }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance / DTR"
        subtitle="Daily Time Record tracking per CSC Memorandum Circular"
        icon={<Clock className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Present" value={records.filter(r => r.status === 'present').length} color="success" />
        <StatCard label="Late" value={records.filter(r => r.status === 'late').length} color="warning" />
        <StatCard label="Absent" value={records.filter(r => r.status === 'absent').length} color="danger" />
        <StatCard label="Half Day" value={records.filter(r => r.status === 'halfday').length} />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'today', label: 'Today' },
          { id: 'weekly', label: 'This Week' },
          { id: 'monthly', label: 'This Month' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export DTR
        </PrimaryButton>
      </ActionsBar>

      <DataTable<AttendanceRecord>
        data={records.filter(r =>
          r.employee_name.toLowerCase().includes(search.toLowerCase())
        )}
        columns={[
          { key: 'employee_name', header: 'Employee' },
          { key: 'date', header: 'Date' },
          { key: 'time_in', header: 'Time In', render: (item) => <span>{item.time_in || '—'}</span> },
          { key: 'time_out', header: 'Time Out', render: (item) => <span>{item.time_out || '—'}</span> },
          { key: 'hours_worked', header: 'Hours', render: (item) => <span>{item.hours_worked.toFixed(1)}</span> },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'present' ? 'bg-success/10 text-success' :
                item.status === 'late' ? 'bg-warning/10 text-warning' :
                item.status === 'absent' ? 'bg-danger/10 text-danger' :
                item.status === 'holiday' ? 'bg-blue-500/10 text-blue-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
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
  )
}

export default AttendanceDTR
