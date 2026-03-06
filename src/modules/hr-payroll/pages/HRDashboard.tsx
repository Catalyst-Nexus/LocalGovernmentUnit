import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, DataTable, Tabs } from '@/components/ui'
import { Users, AlertCircle } from 'lucide-react'

interface HRAlert {
  id: string
  type: string
  message: string
  date: string
}

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary')
  const [alerts] = useState<HRAlert[]>([])

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR & Payroll Dashboard"
        subtitle="Human resource management, attendance, and payroll overview"
        icon={<Users className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Employees" value="0" color="primary" />
        <StatCard label="Permanent" value="0" color="success" />
        <StatCard label="Casual/JO" value="0" color="warning" />
        <StatCard label="Vacant Positions" value="0" color="danger" />
      </StatsRow>

      <StatsRow>
        <StatCard label="Pending Leaves" value="0" color="warning" />
        <StatCard label="Present Today" value="0" color="success" />
        <StatCard label="Payroll (Current)" value="₱0.00" />
        <StatCard label="Late Today" value="0" color="danger" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'alerts', label: 'Alerts' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Employment Breakdown</h3>
            <div className="space-y-3">
              {['Permanent', 'Casual', 'Coterminous', 'Contractual', 'Job Order'].map(type => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{type}</span>
                  <span className="font-semibold">0</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No upcoming events.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <DataTable<HRAlert>
          data={alerts}
          columns={[
            { key: 'type', header: 'Type' },
            { key: 'message', header: 'Message' },
            { key: 'date', header: 'Date' },
          ]}
          title="HR Alerts"
          emptyMessage="No alerts at this time."
        />
      )}
    </div>
  )
}

export default HRDashboard
