import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Send, RefreshCw, Download } from 'lucide-react'

interface RemittanceRecord {
  id: string
  remittance_type: 'GSIS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR'
  period: string
  total_employer: number
  total_employee: number
  total_amount: number
  due_date: string
  status: 'pending' | 'remitted' | 'overdue'
  or_number: string | null
  date_remitted: string | null
}

const RemittanceReports = () => {
  const [records, setRecords] = useState<RemittanceRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setRecords([]); setIsLoading(false) }, 500)
  }

  const filtered = records.filter(r => {
    const matchSearch = r.period.toLowerCase().includes(search.toLowerCase()) ||
      r.remittance_type.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && r.remittance_type === activeTab
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remittance Reports"
        subtitle="Government mandatory remittances — GSIS, PhilHealth, Pag-IBIG, BIR"
        icon={<Send className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="GSIS" value={`₱${records.filter(r => r.remittance_type === 'GSIS').reduce((s, r) => s + r.total_amount, 0).toLocaleString()}`} />
        <StatCard label="PhilHealth" value={`₱${records.filter(r => r.remittance_type === 'PhilHealth').reduce((s, r) => s + r.total_amount, 0).toLocaleString()}`} />
        <StatCard label="Pag-IBIG" value={`₱${records.filter(r => r.remittance_type === 'Pag-IBIG').reduce((s, r) => s + r.total_amount, 0).toLocaleString()}`} />
        <StatCard label="BIR" value={`₱${records.filter(r => r.remittance_type === 'BIR').reduce((s, r) => s + r.total_amount, 0).toLocaleString()}`} />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'GSIS', label: 'GSIS' },
          { id: 'PhilHealth', label: 'PhilHealth' },
          { id: 'Pag-IBIG', label: 'Pag-IBIG' },
          { id: 'BIR', label: 'BIR' },
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
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<RemittanceRecord>
        data={filtered}
        columns={[
          { key: 'remittance_type', header: 'Agency' },
          { key: 'period', header: 'Period' },
          { key: 'total_employer', header: 'Employer Share', render: (item) => <span>₱{item.total_employer.toLocaleString()}</span> },
          { key: 'total_employee', header: 'Employee Share', render: (item) => <span>₱{item.total_employee.toLocaleString()}</span> },
          { key: 'total_amount', header: 'Total', render: (item) => <span className="font-bold">₱{item.total_amount.toLocaleString()}</span> },
          { key: 'due_date', header: 'Due Date' },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'remitted' ? 'bg-success/10 text-success' :
                item.status === 'overdue' ? 'bg-danger/10 text-danger' :
                'bg-warning/10 text-warning'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
          { key: 'or_number', header: 'OR No.', render: (item) => <span>{item.or_number || '—'}</span> },
        ]}
        title={`Remittances (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by period or agency..."
        emptyMessage="No remittance records found."
      />
    </div>
  )
}

export default RemittanceReports
