import { useState, useEffect } from 'react';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import type { Employee } from '@/types/hr.types';
import type { Office, Position } from '@/services/hrService';
import { fetchOffices, fetchPositions } from '@/services/hrService';

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeFormData) => void;
  employee?: Employee | null;
  isLoading?: boolean;
}

export interface EmployeeFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  pos_id: string;
  o_id: string;
  employment_status: 'permanent' | 'casual' | 'coterminous' | 'contractual' | 'job_order';
  date_hired: string;
  is_active: boolean;
}

const EmployeeDialog = ({
  open,
  onClose,
  onSubmit,
  employee,
  isLoading = false,
}: EmployeeDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<EmployeeFormData['employment_status']>('permanent');
  const [dateHired, setDateHired] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [offices, setOffices] = useState<Office[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load offices and positions
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name);
      setMiddleName(employee.middle_name);
      setLastName(employee.last_name);
      setPositionId(employee.position_id);
      setOfficeId(employee.office_id);
      setEmploymentStatus(employee.employment_status);
      setDateHired(employee.date_hired);
      setIsActive(employee.is_active);
    } else {
      // Reset form for new employee
      resetForm();
    }
  }, [employee]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const [officesData, positionsData] = await Promise.all([
      fetchOffices(),
      fetchPositions(),
    ]);
    setOffices(officesData);
    setPositions(positionsData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setPositionId('');
    setOfficeId('');
    setEmploymentStatus('permanent');
    setDateHired('');
    setIsActive(true);
  };

  const handleSubmit = () => {
    const employeeData: EmployeeFormData = {
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      pos_id: positionId,
      o_id: officeId,
      employment_status: employmentStatus,
      date_hired: dateHired,
      is_active: isActive,
    };

    onSubmit(employeeData);
  };

  const isFormValid = () => {
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      positionId !== '' &&
      officeId !== '' &&
      dateHired !== ''
    );
  };

  const selectedPosition = positions.find(p => p.id === positionId);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Add New Employee'}
      onSubmit={handleSubmit}
      submitLabel={employee ? 'Save Changes' : 'Add Employee'}
      isLoading={isLoading || loadingData}
    >
      <div className="space-y-4">
        {/* Name Fields */}
        <FormInput
          id="first-name"
          label="First Name"
          placeholder="Enter first name"
          value={firstName}
          onChange={setFirstName}
          required
        />

        <FormInput
          id="middle-name"
          label="Middle Name"
          placeholder="Enter middle name (optional)"
          value={middleName}
          onChange={setMiddleName}
        />

        <FormInput
          id="last-name"
          label="Last Name"
          placeholder="Enter last name"
          value={lastName}
          onChange={setLastName}
          required
        />

        {/* Position Selector */}
        <div className="space-y-1.5">
          <label htmlFor="position" className="block text-sm font-medium text-foreground">
            Position
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="position"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select a position --</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.item_no} - {position.description}
              </option>
            ))}
          </select>
          {selectedPosition && (
            <p className="text-xs text-muted mt-1">
              Item No: <span className="font-medium">{selectedPosition.item_no}</span>
            </p>
          )}
        </div>

        {/* Office Selector */}
        <div className="space-y-1.5">
          <label htmlFor="office" className="block text-sm font-medium text-foreground">
            Office
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="office"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select an office --</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.description}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Status */}
        <div className="space-y-1.5">
          <label htmlFor="employment-status" className="block text-sm font-medium text-foreground">
            Employment Type
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="employment-status"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value as EmployeeFormData['employment_status'])}
            required
          >
            <option value="permanent">Permanent</option>
            <option value="casual">Casual</option>
            <option value="coterminous">Coterminous</option>
            <option value="contractual">Contractual</option>
            <option value="job_order">Job Order</option>
          </select>
        </div>

        {/* Date Hired */}
        <div className="space-y-1.5">
          <label htmlFor="date-hired" className="block text-sm font-medium text-foreground">
            Date Hired
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="date-hired"
            type="date"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={dateHired}
            onChange={(e) => setDateHired(e.target.value)}
            required
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            id="is-active"
            type="checkbox"
            className="w-4 h-4 border border-border rounded text-success focus:ring-success"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="is-active" className="text-sm font-medium text-foreground">
            Active Employee
          </label>
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

export default EmployeeDialog;
