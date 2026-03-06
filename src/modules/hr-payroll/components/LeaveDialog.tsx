import { useState, useEffect, useRef } from 'react';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import type { LeaveApplication } from '@/types/hr.types';
import type { LeaveSubtype } from '@/services/hrService';
import { fetchLeaveSubtypes, fetchPersonnelForLeave } from '@/services/hrService';

interface LeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (leaveData: LeaveFormData) => void;
  leave?: LeaveApplication | null;
  isLoading?: boolean;
}

export interface LeaveFormData {
  per_id: string;
  los_id: string;
  date_from: string;
  date_to: string;
  days: number;
  remarks: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
}

interface PersonnelOption {
  id: string;
  name: string;
}

const LeaveDialog = ({
  open,
  onClose,
  onSubmit,
  leave,
  isLoading = false,
}: LeaveDialogProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<LeaveFormData['status']>('pending');

  const [employees, setEmployees] = useState<PersonnelOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveSubtype[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Searchable employee dropdown states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<PersonnelOption[]>([]);
  
  // Ref for click-outside detection
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Load dropdown data
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (leave) {
      setEmployeeId(leave.employee_id);
      // Find and set employee name for search display
      const employee = employees.find(emp => emp.id === leave.employee_id);
      if (employee) {
        setEmployeeSearch(employee.name);
      }
      // setLeaveTypeId - would need to map from leave_type code to los_id
      setDateFrom(leave.date_from);
      setDateTo(leave.date_to);
      setDays(leave.days.toString());
      setReason(leave.reason);
      setStatus(leave.status);
    } else {
      resetForm();
    }
  }, [leave, employees]);

  // Auto-calculate days when dates change
  useEffect(() => {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      setDays(diffDays.toString());
    }
  }, [dateFrom, dateTo]);

  // Filter employees based on search input
  useEffect(() => {
    if (employeeSearch.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearch, employees]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const [employeesData, leaveTypesData] = await Promise.all([
      fetchPersonnelForLeave(),
      fetchLeaveSubtypes(),
    ]);
    setEmployees(employeesData);
    setLeaveTypes(leaveTypesData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setEmployeeId('');
    setEmployeeSearch('');
    setLeaveTypeId('');
    setDateFrom('');
    setDateTo('');
    setDays('');
    setReason('');
    setStatus('pending');
    setShowEmployeeDropdown(false);
  };

  const handleEmployeeSelect = (employee: PersonnelOption) => {
    setEmployeeId(employee.id);
    setEmployeeSearch(employee.name);
    setShowEmployeeDropdown(false);
  };

  const handleSubmit = () => {
    // Validate form before submitting
    if (!isFormValid()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    const leaveData: LeaveFormData = {
      per_id: employeeId,
      los_id: leaveTypeId,
      date_from: dateFrom,
      date_to: dateTo,
      days: parseInt(days, 10),
      remarks: reason.trim(),
      status: status,
    };

    onSubmit(leaveData);
  };

  const isFormValid = () => {
    return (
      employeeId !== '' &&
      leaveTypeId !== '' &&
      dateFrom !== '' &&
      dateTo !== '' &&
      days !== '' &&
      !isNaN(parseInt(days, 10)) &&
      parseInt(days, 10) > 0 &&
      reason.trim() !== ''
    );
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={leave ? 'Edit Leave Application' : 'File Leave Application'}
      onSubmit={handleSubmit}
      submitLabel={leave ? 'Save Changes' : 'File Leave'}
      isLoading={isLoading || loadingData}
    >
      <div className="space-y-4">
        {/* Employee Selector - Searchable */}
        <div className="space-y-1.5">
          <label htmlFor="employee" className="block text-sm font-medium text-foreground">
            Employee
            <span className="text-error ml-1">*</span>
          </label>
          <div className="relative" ref={employeeDropdownRef}>
            <input
              id="employee"
              type="text"
              placeholder="Search employee by name..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setShowEmployeeDropdown(true);
                if (e.target.value === '') {
                  setEmployeeId('');
                }
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
              disabled={loadingData}
              autoComplete="off"
            />
            {showEmployeeDropdown && filteredEmployees.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleEmployeeSelect(emp)}
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            )}
            {showEmployeeDropdown && filteredEmployees.length === 0 && employeeSearch && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm text-muted-foreground">
                No employees found
              </div>
            )}
          </div>
        </div>

        {/* Leave Type Selector */}
        <div className="space-y-1.5">
          <label htmlFor="leave-type" className="block text-sm font-medium text-foreground">
            Leave Type
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="leave-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select leave type --</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.description} ({type.code})
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <label htmlFor="date-from" className="block text-sm font-medium text-foreground">
            From
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="date-from"
            type="date"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            required
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label htmlFor="date-to" className="block text-sm font-medium text-foreground">
            To
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="date-to"
            type="date"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom}
            required
          />
        </div>

        {/* Days (auto-calculated) */}
        <div className="space-y-1.5">
          <label htmlFor="days" className="block text-sm font-medium text-foreground">
            Days
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="days"
            type="number"
            min="1"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            readOnly
          />
          <p className="text-xs text-muted">Auto-calculated from date range</p>
        </div>

        {/* Reason */}
        <FormInput
          id="reason"
          label="Reason"
          type="textarea"
          rows={3}
          placeholder="Enter reason for leave application..."
          value={reason}
          onChange={setReason}
          required
        />

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            Status
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="status"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeaveFormData['status'])}
            required
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {!isFormValid() && (
          <p className="text-xs text-error">
            * Please fill in all required fields
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default LeaveDialog;
