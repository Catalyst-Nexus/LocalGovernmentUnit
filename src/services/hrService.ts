import { supabase, isSupabaseConfigured } from './supabase';

export interface Office {
  id: string;
  description: string;
}

export interface Position {
  id: string;
  description: string;
  item_no: string;
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

/**
 * Fetch all offices from hr.office table
 */
export const fetchOffices = async (): Promise<Office[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('office')
    .select('id, description')
    .order('description');

  if (error) {
    console.error('Error fetching offices:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all positions from hr.position table
 */
export const fetchPositions = async (): Promise<Position[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .select('id, description, item_no')
    .order('description');

  if (error) {
    console.error('Error fetching positions:', error);
    return [];
  }

  return data || [];
};

/**
 * Create a new employee in hr.personnel table
 */
export const createEmployee = async (
  employeeData: EmployeeFormData
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .insert([employeeData]);

  if (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing employee in hr.personnel table
 */
export const updateEmployee = async (
  id: string,
  employeeData: Partial<EmployeeFormData>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .update(employeeData)
    .eq('id', id);

  if (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete an employee from hr.personnel table
 */
export const deleteEmployee = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
