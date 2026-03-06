import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Calculator, RefreshCw } from 'lucide-react'
import type { PayrollEntry } from '@/types/hr.types'

const PayrollComputation = () => {
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setEntries([]); setIsLoading(false) }, 500)
  }

  const filtered = entries.filter(e => {
    const matchSearch = e.employee_name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && e.status === activeTab
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Computation"
        subtitle="Compute payroll per DBM salary standardization law"
        icon={<Calculator className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Entries" value={entries.length} />
        <StatCard label="Gross Pay" value={`₱${entries.reduce((s, e) => s + e.gross_pay, 0).toLocaleString()}`} color="primary" />
        <StatCard label="Total Deductions" value={`₱${entries.reduce((s, e) => s + e.total_deductions, 0).toLocaleString()}`} color="danger" />
        <StatCard label="Net Pay" value={`₱${entries.reduce((s, e) => s + e.net_pay, 0).toLocaleString()}`} color="success" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'draft', label: 'Draft' },
          { id: 'computed', label: 'Computed' },
          { id: 'approved', label: 'Approved' },
          { id: 'released', label: 'Released' },
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
          <Calculator className="w-4 h-4" />
          Compute Payroll
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollEntry>
        data={filtered}
        columns={[
          { key: 'employee_name', header: 'Employee' },
          { key: 'fund_type', header: 'Fund' },
          { key: 'basic_pay', header: 'Basic Pay', render: (item) => <span>₱{item.basic_pay.toLocaleString()}</span> },
          { key: 'pera', header: 'PERA', render: (item) => <span>₱{item.pera.toLocaleString()}</span> },
          { key: 'gross_pay', header: 'Gross', render: (item) => <span className="font-medium">₱{item.gross_pay.toLocaleString()}</span> },
          { key: 'gsis', header: 'GSIS', render: (item) => <span>₱{item.gsis.toLocaleString()}</span> },
          { key: 'philhealth', header: 'PhilHealth', render: (item) => <span>₱{item.philhealth.toLocaleString()}</span> },
          { key: 'pagibig', header: 'Pag-IBIG', render: (item) => <span>₱{item.pagibig.toLocaleString()}</span> },
          { key: 'bir_tax', header: 'BIR Tax', render: (item) => <span>₱{item.bir_tax.toLocaleString()}</span> },
          { key: 'total_deductions', header: 'Deductions', render: (item) => <span className="text-red-500">₱{item.total_deductions.toLocaleString()}</span> },
          { key: 'net_pay', header: 'Net Pay', render: (item) => <span className="font-bold text-green-600">₱{item.net_pay.toLocaleString()}</span> },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'released' ? 'bg-success/10 text-success' :
                item.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                item.status === 'computed' ? 'bg-purple-500/10 text-purple-500' :
                'bg-warning/10 text-warning'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
        ]}
        title={`Payroll Entries (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No payroll entries found."
      />
    </div>
  )
}

export default PayrollComputation
