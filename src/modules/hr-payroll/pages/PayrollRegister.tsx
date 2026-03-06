import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable } from '@/components/ui'
import { FileSpreadsheet, RefreshCw, Download } from 'lucide-react'
import type { PayrollPeriod } from '@/types/hr.types'

const PayrollRegister = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setPeriods([]); setIsLoading(false) }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Register"
        subtitle="Summary of payroll periods and fund disbursements"
        icon={<FileSpreadsheet className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Periods" value={periods.length} />
        <StatCard label="Open" value={periods.filter(p => p.status === 'open').length} color="warning" />
        <StatCard label="Approved" value={periods.filter(p => p.status === 'approved').length} color="success" />
        <StatCard label="Closed" value={periods.filter(p => p.status === 'closed').length} />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export Register
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollPeriod>
        data={periods.filter(p =>
          p.period_name.toLowerCase().includes(search.toLowerCase())
        )}
        columns={[
          { key: 'period_name', header: 'Period' },
          { key: 'date_from', header: 'From' },
          { key: 'date_to', header: 'To' },
          { key: 'fiscal_year', header: 'FY' },
          { key: 'fund_type', header: 'Fund Type' },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'closed' ? 'bg-gray-500/10 text-gray-500' :
                item.status === 'approved' ? 'bg-success/10 text-success' :
                item.status === 'computed' ? 'bg-blue-500/10 text-blue-500' :
                'bg-warning/10 text-warning'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
        ]}
        title="Payroll Periods"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by period name..."
        emptyMessage="No payroll periods found."
      />
    </div>
  )
}

export default PayrollRegister
