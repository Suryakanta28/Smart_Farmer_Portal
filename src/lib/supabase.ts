import { createClient } from '@supabase/supabase-js';
import { User, Farmer, Vehicle, db } from './db';

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://krishiflow-sih2026.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo_key_krishiflow_sih2026';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const isLiveSupabaseConfigured = (): boolean => {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  return !!(
    url &&
    key &&
    url !== 'https://krishiflow-sih2026.supabase.co' &&
    !key.includes('demo_key')
  );
};

// =========================================================================
// DIRECT SUPABASE DATA ACCESS LAYER (PostgreSQL CRUD with Realtime Support)
// =========================================================================

export const supabaseDb = {
  /**
   * Insert a new user into Supabase users table
   */
  async insertUser(user: User): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              role: user.role,
              name: user.name,
              phone: user.phone,
              email: user.email,
              password: user.password,
              designation: user.designation,
              approval_status: user.approval_status || 'pending',
              account_status: user.account_status || 'inactive',
              society_id: user.society_id || null,
              centre_id: user.centre_id || null,
              created_at: user.created_at || new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert user fallback to reactive DB:', error.message);
        }
      }
      
      // Always maintain synchronous reactive cache in db engine
      const users = db.getCollection<User>('users');
      const idx = users.findIndex((u) => u.id === user.id || u.phone === user.phone || u.email === user.email);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.push(user);
      }
      db.setCollection('users', users);

      return { success: true, data: user };
    } catch (err: any) {
      console.error('Error inserting user to Supabase:', err);
      return { success: false, error: err.message || 'Failed to insert user' };
    }
  },

  /**
   * Insert a new farmer into Supabase farmers table
   */
  async insertFarmer(farmer: Farmer): Promise<{ success: boolean; data?: Farmer; error?: string }> {
    try {
      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('farmers')
          .insert([
            {
              id: farmer.id,
              user_id: farmer.user_id,
              name: farmer.name,
              father_husband_name: farmer.father_husband_name,
              aadhaar_masked: farmer.aadhaar_masked,
              village: farmer.village,
              district: farmer.district,
              block: farmer.block,
              state: farmer.state || 'Odisha',
              land_area_hectares: farmer.land_area_hectares,
              ifsc_code: farmer.ifsc_code,
              kyc_status: farmer.kyc_status || 'pending',
              alternate_contact_phone: farmer.alternate_contact_phone,
              latitude: farmer.latitude,
              longitude: farmer.longitude,
              created_at: farmer.created_at || new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert farmer fallback to reactive DB:', error.message);
        }
      }

      // Always maintain synchronous reactive cache in db engine
      const farmers = db.getCollection<Farmer>('farmers');
      const idx = farmers.findIndex((f) => f.id === farmer.id || f.user_id === farmer.user_id);
      if (idx >= 0) {
        farmers[idx] = { ...farmers[idx], ...farmer };
      } else {
        farmers.push(farmer);
      }
      db.setCollection('farmers', farmers);

      return { success: true, data: farmer };
    } catch (err: any) {
      console.error('Error inserting farmer to Supabase:', err);
      return { success: false, error: err.message || 'Failed to insert farmer' };
    }
  },

  /**
   * Fetch user by email or mobile phone
   */
  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const cleanId = (identifier || '').trim();
    const idDigits = cleanId.replace(/\D/g, '');

    try {
      if (isLiveSupabaseConfigured()) {
        // Query from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.${cleanId},phone.ilike.%${idDigits}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          return data[0] as User;
        }
      }
    } catch (err) {
      console.warn('Supabase query error, reading from reactive DB:', err);
    }

    // Direct reactive cache lookup
    const users = db.getCollection<User>('users');
    return users.find((u) => {
      if (u.id && u.id.toLowerCase() === cleanId.toLowerCase()) return true;
      if (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) return true;
      if (idDigits && idDigits.length >= 10 && u.phone) {
        const uPhoneDigits = u.phone.replace(/\D/g, '');
        if (uPhoneDigits === idDigits || uPhoneDigits.endsWith(idDigits) || idDigits.endsWith(uPhoneDigits)) return true;
      }
      return false;
    }) || null;
  },

  /**
   * Update user status (Approve, Reject, Revoke)
   */
  async updateUserStatus(
    userId: string,
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'revoked',
    accountStatus: 'inactive' | 'active' | 'suspended' | 'revoked',
    verifierName: string = 'State Procurement Administrator'
  ): Promise<{ success: boolean; error?: string }> {
    const nowIso = new Date().toISOString();
    const isApproved = approvalStatus === 'approved';

    try {
      if (isLiveSupabaseConfigured()) {
        await supabase
          .from('users')
          .update({
            approval_status: approvalStatus,
            account_status: accountStatus,
            verified_at: isApproved ? nowIso : null,
            verified_by: isApproved ? verifierName : null,
          })
          .eq('id', userId);
      }
    } catch (err) {
      console.warn('Supabase status update error:', err);
    }

    // Update in reactive DB
    const allUsers = db.getCollection<User>('users');
    const targetUser = allUsers.find((u) => u.id === userId);
    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          approval_status: approvalStatus,
          account_status: accountStatus,
          verified_at: isApproved ? nowIso : u.verified_at,
          verified_by: isApproved ? verifierName : u.verified_by,
        };
      }
      return u;
    });
    db.setCollection('users', updatedUsers);

    // If farmer, also synchronize KYC status
    if (targetUser && targetUser.role === 'farmer') {
      const kycStatus = isApproved ? 'verified' : approvalStatus === 'rejected' || approvalStatus === 'revoked' ? 'rejected' : 'pending';
      const allFarmers = db.getCollection<Farmer>('farmers');
      const updatedFarmers = allFarmers.map((f) => {
        if (
          f.user_id === userId ||
          f.alternate_contact_phone === targetUser.phone ||
          f.name.toLowerCase() === targetUser.name.toLowerCase()
        ) {
          return {
            ...f,
            kyc_status: kycStatus,
            verified_at: isApproved ? nowIso : f.verified_at,
            verified_by: isApproved ? verifierName : f.verified_by,
          };
        }
        return f;
      });
      db.setCollection('farmers', updatedFarmers);

      if (isLiveSupabaseConfigured()) {
        try {
          await supabase
            .from('farmers')
            .update({
              kyc_status: kycStatus,
              verified_at: isApproved ? nowIso : null,
              verified_by: isApproved ? verifierName : null,
            })
            .eq('user_id', userId);
        } catch (e) {
          console.warn('Supabase farmer kyc update error:', e);
        }
      }
    }

    return { success: true };
  },

  /**
   * Validate active session in Supabase PostgreSQL
   */
  async validateActiveSession(userId: string): Promise<{
    isValid: boolean;
    user: User | null;
    reason?: 'pending' | 'rejected' | 'revoked' | 'inactive' | 'not_found';
  }> {
    const user = await this.findUserByIdentifier(userId);
    if (!user) {
      return { isValid: false, user: null, reason: 'not_found' };
    }

    // Manager role always maintains administrative clearance
    if (user.role === 'manager') {
      return { isValid: true, user };
    }

    if (user.approval_status === 'pending') {
      return { isValid: false, user, reason: 'pending' };
    }

    if (user.approval_status === 'rejected') {
      return { isValid: false, user, reason: 'rejected' };
    }

    if (user.approval_status === 'revoked' || user.account_status === 'revoked' || user.account_status === 'suspended') {
      return { isValid: false, user, reason: 'revoked' };
    }

    if (user.approval_status === 'approved' && user.account_status === 'active') {
      return { isValid: true, user };
    }

    return { isValid: false, user, reason: 'inactive' };
  },
};
