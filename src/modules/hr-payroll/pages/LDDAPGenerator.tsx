import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable } from '@/components/ui'
import { FileText, RefreshCw, Printer } from 'lucide-react'

interface LDDAPEntry {
  id: string
  lddap_number: string
  fund_type: string
  payroll_period: string
  total_amount: number
  bank_name: string
  status: 'draft' | 'prepared' | 'approved' | 'transmitted'
  prepared_by: string
  date_prepared: string
}

const LDDAPGenerator = () => {
  const [entries, setEntries] = useState<LDDAPEntry[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setEntries([]); setIsLoading(false) }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="LDDAP-ADA Generator"
        subtitle="List of Due and Demandable Accounts Payable — Advice to Debit Account"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total LDDAP" value={entries.length} />
        <StatCard label="Draft" value={entries.filter(e => e.status === 'draft').length} color="warning" />
        <StatCard label="Approved" value={entries.filter(e => e.status === 'approved').length} color="success" />
        <StatCard label="Transmitted" value={entries.filter(e => e.status === 'transmitted').length} color="primary" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={() => {}}>
          <FileText className="w-4 h-4" />
          Generate LDDAP
        </PrimaryButton>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Printer className="w-4 h-4" />
          Print
        </PrimaryButton>
      </ActionsBar>

      <DataTable<LDDAPEntry>
        data={entries.filter(e =>
          e.lddap_number.toLowerCase().includes(search.toLowerCase()) ||
          e.payroll_period.toLowerCase().includes(search.toLowerCase())
        )}
        columns={[
          { key: 'lddap_number', header: 'LDDAP No.' },
          { key: 'fund_type', header: 'Fund Type' },
          { key: 'payroll_period', header: 'Period' },
          { key: 'total_amount', header: 'Amount', render: (item) => <span className="font-bold">₱{item.total_amount.toLocaleString()}</span> },
          { key: 'bank_name', header: 'Bank' },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'transmitted' ? 'bg-success/10 text-success' :
                item.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                item.status === 'prepared' ? 'bg-purple-500/10 text-purple-500' :
                'bg-warning/10 text-warning'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
          { key: 'prepared_by', header: 'Prepared By' },
          { key: 'date_prepared', header: 'Date' },
        ]}
        title="LDDAP-ADA Records"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by LDDAP no. or period..."
        emptyMessage="No LDDAP records found."
      />
    </div>
  )
}

export default LDDAPGenerator
