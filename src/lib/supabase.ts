import { createClient } from '@supabase/supabase-js';
import { User, Farmer, Vehicle, RegistrationRequest, db } from './db';
import { sendSms } from './sms';

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

const DEFAULT_SUPABASE_URL = 'https://nxhereipnyjztqecdxkw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_kJFwLvvVB9mmwAOjKaTtDQ_Pt1R9aRM';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

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
  return true;
};

export const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const resolveSocietyUUID = (socId?: string | null): string | null => {
  if (!socId) return null;
  if (isUUID(socId)) return socId;
  const map: Record<string, string> = {
    'soc-01': '11111111-1111-1111-1111-111111111101',
    'soc-02': '11111111-1111-1111-1111-111111111102',
    'soc-03': '11111111-1111-1111-1111-111111111103',
    'soc-04': '11111111-1111-1111-1111-111111111104',
  };
  return map[socId] || null;
};

export const resolveCentreUUID = (cenId?: string | null): string | null => {
  if (!cenId) return null;
  if (isUUID(cenId)) return cenId;
  const map: Record<string, string> = {
    'cen-01': '22222222-2222-2222-2222-222222222201',
    'cen-02': '22222222-2222-2222-2222-222222222202',
    'cen-03': '22222222-2222-2222-2222-222222222203',
    'cen-04': '22222222-2222-2222-2222-222222222204',
    'cen-05': '22222222-2222-2222-2222-222222222205',
  };
  return map[cenId] || null;
};

export const matchesSociety = (reqSocId?: string | null, officerSocId?: string | null): boolean => {
  if (!officerSocId) return true;
  if (!reqSocId) return true;
  const normReq = resolveSocietyUUID(reqSocId) || reqSocId;
  const normOff = resolveSocietyUUID(officerSocId) || officerSocId;
  return normReq === normOff;
};

// =========================================================================
// DIRECT SUPABASE DATA ACCESS LAYER (PostgreSQL CRUD with Realtime Support)
// =========================================================================

export const supabaseDb = {
  /**
   * Insert a new user into Supabase users table
   */
  async insertUser(user: User): Promise<{ success: boolean; data?: User; error?: string }> {
    const validUserId = isUUID(user.id) ? user.id : generateUUID();
    const cleanUser: User = {
      ...user,
      id: validUserId,
      society_id: resolveSocietyUUID(user.society_id) || undefined,
      centre_id: resolveCentreUUID(user.centre_id) || undefined,
      approval_status: user.approval_status || 'pending',
      account_status: user.account_status || 'inactive',
      created_at: user.created_at || new Date().toISOString(),
    };

    try {
      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('users')
          .upsert([
            {
              id: cleanUser.id,
              role: cleanUser.role,
              name: cleanUser.name,
              phone: cleanUser.phone,
              email: cleanUser.email,
              password: cleanUser.password,
              designation: cleanUser.designation || null,
              avatar_url: cleanUser.avatar_url || null,
              approval_status: cleanUser.approval_status,
              account_status: cleanUser.account_status,
              society_id: cleanUser.society_id || null,
              centre_id: cleanUser.centre_id || null,
              created_at: cleanUser.created_at,
            },
          ], { onConflict: 'phone' })
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert user error:', error.message);
        } else if (data) {
          cleanUser.id = data.id;
        }
      }
      
      // Maintain in reactive runtime cache
      const users = db.getCollection<User>('users');
      const idx = users.findIndex((u) => u.id === cleanUser.id || u.phone === cleanUser.phone || u.email === cleanUser.email);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...cleanUser };
      } else {
        users.push(cleanUser);
      }
      db.setCollection('users', users);

      return { success: true, data: cleanUser };
    } catch (err: any) {
      console.error('Error inserting user to Supabase:', err);
      return { success: false, error: err.message || 'Failed to insert user' };
    }
  },

  /**
   * Insert a new farmer into Supabase farmers table
   */
  async insertFarmer(farmer: Farmer): Promise<{ success: boolean; data?: Farmer; error?: string }> {
    const validFarmerId = isUUID(farmer.id) ? farmer.id : generateUUID();
    const validUserId = isUUID(farmer.user_id) ? farmer.user_id : generateUUID();

    const cleanFarmer: Farmer = {
      ...farmer,
      id: validFarmerId,
      user_id: validUserId,
      state: farmer.state || 'Odisha',
      kyc_status: farmer.kyc_status || 'pending',
      created_at: farmer.created_at || new Date().toISOString(),
    };

    try {
      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('farmers')
          .upsert([
            {
              id: cleanFarmer.id,
              user_id: cleanFarmer.user_id,
              name: cleanFarmer.name,
              father_husband_name: cleanFarmer.father_husband_name || null,
              aadhaar_masked: cleanFarmer.aadhaar_masked || 'XXXX-XXXX-9988',
              village: cleanFarmer.village,
              district: cleanFarmer.district,
              block: cleanFarmer.block || null,
              state: cleanFarmer.state,
              land_area_hectares: cleanFarmer.land_area_hectares || 1.5,
              bank_account: cleanFarmer.bank_account || null,
              ifsc_code: cleanFarmer.ifsc_code,
              kyc_status: cleanFarmer.kyc_status,
              alternate_contact_name: cleanFarmer.alternate_contact_name || null,
              alternate_contact_phone: cleanFarmer.alternate_contact_phone || null,
              latitude: cleanFarmer.latitude || null,
              longitude: cleanFarmer.longitude || null,
              created_at: cleanFarmer.created_at,
            },
          ], { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert farmer error:', error.message);
        } else if (data) {
          cleanFarmer.id = data.id;
        }
      }

      // Maintain in reactive runtime cache
      const farmers = db.getCollection<Farmer>('farmers');
      const idx = farmers.findIndex((f) => f.id === cleanFarmer.id || f.user_id === cleanFarmer.user_id);
      if (idx >= 0) {
        farmers[idx] = { ...farmers[idx], ...cleanFarmer };
      } else {
        farmers.push(cleanFarmer);
      }
      db.setCollection('farmers', farmers);

      return { success: true, data: cleanFarmer };
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
    verifierName: string = 'Dr. Alok Ranjan Rath (IAS)'
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
            verified_by: isApproved ? '00000000-0000-0000-0000-000000000001' : null,
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
              verified_by: isApproved ? '00000000-0000-0000-0000-000000000001' : null,
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
   * Submit a new registration request:
   * 1. Inserts into registration_requests (status: pending)
   * 2. Inserts into users table (approval_status: pending, account_status: inactive)
   * 3. If farmer, inserts into farmers table (kyc_status: pending)
   */
  async submitRegistrationRequest(req: Partial<RegistrationRequest>): Promise<{ success: boolean; data?: RegistrationRequest; error?: string }> {
    const validReqId = isUUID(req.id) ? req.id! : generateUUID();
    const validUserId = generateUUID();
    const validFarmerId = generateUUID();
    const resolvedSocId = resolveSocietyUUID(req.society_id);
    const resolvedCenId = resolveCentreUUID(req.centre_id);
    const nowIso = new Date().toISOString();

    const newReq: RegistrationRequest = {
      id: validReqId,
      full_name: req.full_name || '',
      role: req.role || 'farmer',
      mobile_number: req.mobile_number || '',
      email: req.email || `${req.role || 'user'}_${Date.now()}@krishiflow.ai`,
      password: req.password || '',
      land_area_hectares: req.land_area_hectares,
      aadhaar_masked: req.aadhaar_masked || 'XXXX-XXXX-9988',
      village: req.village || 'Odisha Rural',
      district: req.district || 'Sambalpur',
      block: req.block || 'Sadar',
      state: req.state || 'Odisha',
      bank_account: req.bank_account,
      ifsc_code: req.ifsc_code || 'SBIN0001234',
      society_id: resolvedSocId || undefined,
      centre_id: resolvedCenId || undefined,
      designation: req.designation,
      vehicle_reg_no: req.vehicle_reg_no,
      details: req.details || {},
      status: 'pending',
      requested_at: req.requested_at || nowIso,
      created_at: req.created_at || nowIso,
      updated_at: req.updated_at || nowIso,
    };

    try {
      if (isLiveSupabaseConfigured()) {
        // 1. Insert into registration_requests
        const { error: reqErr } = await supabase
          .from('registration_requests')
          .insert([
            {
              id: newReq.id,
              full_name: newReq.full_name,
              role: newReq.role,
              mobile_number: newReq.mobile_number,
              email: newReq.email,
              password: newReq.password,
              land_area_hectares: newReq.land_area_hectares,
              aadhaar_masked: newReq.aadhaar_masked,
              village: newReq.village,
              district: newReq.district,
              block: newReq.block,
              state: newReq.state,
              bank_account: newReq.bank_account,
              ifsc_code: newReq.ifsc_code,
              society_id: newReq.society_id || null,
              centre_id: newReq.centre_id || null,
              designation: newReq.designation,
              vehicle_reg_no: newReq.vehicle_reg_no,
              details: newReq.details,
              status: 'pending',
              requested_at: newReq.requested_at,
              created_at: newReq.created_at,
              updated_at: newReq.updated_at,
            },
          ]);

        if (reqErr) {
          console.warn('Supabase insert registration_requests warning:', reqErr.message);
        }

        // 2. Insert into users table as pending
        const { error: userErr } = await supabase
          .from('users')
          .upsert([
            {
              id: validUserId,
              role: newReq.role,
              name: newReq.full_name,
              phone: newReq.mobile_number,
              email: newReq.email,
              password: newReq.password,
              designation: newReq.designation || null,
              approval_status: 'pending',
              account_status: 'inactive',
              society_id: newReq.society_id || null,
              centre_id: newReq.centre_id || null,
              created_at: nowIso,
            },
          ], { onConflict: 'phone' });

        if (userErr) {
          console.warn('Supabase insert pending user warning:', userErr.message);
        }

        // 3. If farmer, insert into farmers table as pending
        if (newReq.role === 'farmer') {
          const { error: farErr } = await supabase
            .from('farmers')
            .upsert([
              {
                id: validFarmerId,
                user_id: validUserId,
                name: newReq.full_name,
                father_husband_name: 'Resident Farmer',
                aadhaar_masked: newReq.aadhaar_masked,
                village: newReq.village,
                district: newReq.district,
                block: newReq.block,
                state: newReq.state,
                land_area_hectares: newReq.land_area_hectares || 1.5,
                bank_account: newReq.bank_account,
                ifsc_code: newReq.ifsc_code,
                kyc_status: 'pending',
                alternate_contact_phone: newReq.mobile_number,
                created_at: nowIso,
              },
            ], { onConflict: 'id' });

          if (farErr) {
            console.warn('Supabase insert pending farmer warning:', farErr.message);
          }
        }
      }
    } catch (err: any) {
      console.warn('Supabase registration request error:', err);
    }

    // Always maintain in reactive DB cache
    const requests = db.getCollection<RegistrationRequest>('registration_requests');
    const existingIdx = requests.findIndex((r) => r.id === newReq.id || r.mobile_number === newReq.mobile_number);
    if (existingIdx >= 0) {
      requests[existingIdx] = { ...requests[existingIdx], ...newReq };
    } else {
      requests.unshift(newReq);
    }
    db.setCollection('registration_requests', requests);

    return { success: true, data: newReq };
  },

  /**
   * Fetch all registration requests from Supabase (or reactive cache)
   */
  async getRegistrationRequests(statusFilter?: string): Promise<RegistrationRequest[]> {
    try {
      if (isLiveSupabaseConfigured()) {
        let query = supabase.from('registration_requests').select('*').order('requested_at', { ascending: false });
        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          db.setCollection('registration_requests', data as RegistrationRequest[]);
          return data as RegistrationRequest[];
        }
      }
    } catch (err) {
      console.warn('Supabase get registration requests error:', err);
    }

    const requests = db.getCollection<RegistrationRequest>('registration_requests');
    if (statusFilter && statusFilter !== 'all') {
      return requests.filter((r) => r.status === statusFilter);
    }
    return requests;
  },

  /**
   * Fetch registration requests specifically for a PACS Society
   */
  async getRegistrationRequestsForSociety(societyId?: string, statusFilter?: string): Promise<RegistrationRequest[]> {
    const all = await this.getRegistrationRequests(statusFilter);
    return all.filter((r) => {
      if (r.role !== 'farmer') return false;
      if (!societyId) return true;
      return matchesSociety(r.society_id, societyId);
    });
  },

  /**
   * Find registration request by phone number or email
   */
  async findRegistrationRequestByIdentifier(identifier: string): Promise<RegistrationRequest | null> {
    const cleanId = (identifier || '').trim();
    const idDigits = cleanId.replace(/\D/g, '').slice(-10);

    try {
      if (isLiveSupabaseConfigured()) {
        let query = supabase.from('registration_requests').select('*');
        if (idDigits && idDigits.length >= 10) {
          query = query.or(`mobile_number.ilike.%${idDigits}%,email.ilike.${cleanId}`);
        } else {
          query = query.eq('email', cleanId);
        }
        const { data, error } = await query.order('requested_at', { ascending: false }).limit(1);
        if (!error && data && data.length > 0) {
          return data[0] as RegistrationRequest;
        }
      }
    } catch (err) {
      console.warn('Supabase find registration request error:', err);
    }

    // Local reactive search
    const requests = db.getCollection<RegistrationRequest>('registration_requests');
    return requests.find((r) => {
      if (cleanId && r.email && r.email.toLowerCase() === cleanId.toLowerCase()) return true;
      if (idDigits && idDigits.length >= 10 && r.mobile_number) {
        const rDigits = r.mobile_number.replace(/\D/g, '').slice(-10);
        return rDigits === idDigits;
      }
      return false;
    }) || null;
  },

  /**
   * Approve a registration request:
   * 1. Updates status to approved in registration_requests
   * 2. Activates and approves user in users table
   * 3. If farmer, verifies KYC in farmers table
   * 4. Dispatches SMS confirmation
   */
  async approveRegistrationRequest(
    requestId: string,
    managerId: string = '00000000-0000-0000-0000-000000000001',
    managerName: string = 'Dr. Alok Ranjan Rath (IAS)'
  ): Promise<{ success: boolean; error?: string }> {
    const nowIso = new Date().toISOString();
    const validManagerId = isUUID(managerId) ? managerId : '00000000-0000-0000-0000-000000000001';

    // 1. Get request details
    const allRequests = db.getCollection<RegistrationRequest>('registration_requests');
    let targetReq = allRequests.find((r) => r.id === requestId);

    if (!targetReq && isLiveSupabaseConfigured()) {
      const { data } = await supabase.from('registration_requests').select('*').eq('id', requestId).single();
      if (data) targetReq = data as RegistrationRequest;
    }

    if (!targetReq) {
      return { success: false, error: 'Registration request not found' };
    }

    // 2. Update registration_requests table
    try {
      if (isLiveSupabaseConfigured()) {
        await supabase
          .from('registration_requests')
          .update({
            status: 'approved',
            reviewed_by: validManagerId,
            reviewed_by_name: managerName,
            reviewed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', requestId);
      }
    } catch (err) {
      console.warn('Supabase update registration request error:', err);
    }

    // Update local requests collection
    const updatedRequests = allRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'approved' as const,
            reviewed_by: validManagerId,
            reviewed_by_name: managerName,
            reviewed_at: nowIso,
            updated_at: nowIso,
          }
        : r
    );
    db.setCollection('registration_requests', updatedRequests);

    // 3. Provision / Activate in public.users table
    const cleanUserId = generateUUID();
    const newUser: User = {
      id: cleanUserId,
      role: targetReq.role,
      name: targetReq.full_name,
      phone: targetReq.mobile_number,
      email: targetReq.email || `${targetReq.role}_${Date.now()}@krishiflow.ai`,
      password: targetReq.password,
      designation: targetReq.designation,
      society_id: targetReq.society_id,
      centre_id: targetReq.centre_id,
      approval_status: 'approved',
      account_status: 'active',
      verified_at: nowIso,
      verified_by: managerName,
      created_at: targetReq.requested_at || nowIso,
    };

    const userRes = await this.insertUser(newUser);
    const finalUserId = userRes.data?.id || cleanUserId;

    // 4. If Farmer, provision / activate in public.farmers table
    if (targetReq.role === 'farmer') {
      const newFarmer: Farmer = {
        id: generateUUID(),
        user_id: finalUserId,
        name: targetReq.full_name,
        father_husband_name: 'Resident Farmer',
        aadhaar_masked: targetReq.aadhaar_masked || 'XXXXXXXX9988',
        village: targetReq.village || 'Village Central',
        district: targetReq.district || 'Sambalpur',
        block: targetReq.block || 'Sadar',
        state: targetReq.state || 'Odisha',
        land_area_hectares: targetReq.land_area_hectares || 2.0,
        bank_account: targetReq.bank_account || '98765432101234',
        ifsc_code: targetReq.ifsc_code || 'SBIN0001234',
        kyc_status: 'verified',
        alternate_contact_phone: targetReq.mobile_number,
        verified_at: nowIso,
        verified_by: managerName,
        latitude: 21.4669,
        longitude: 83.9812,
        created_at: targetReq.requested_at || nowIso,
      };

      await this.insertFarmer(newFarmer);
    }

    // 5. Send SMS confirmation
    try {
      const roleLabel = targetReq.role === 'farmer' ? 'Farmer (Kisan)' : targetReq.role === 'society_officer' ? 'Society Officer' : 'Procurement Officer';
      await sendSms({
        phone: targetReq.mobile_number,
        message: `Dear ${targetReq.full_name}, Congratulations! Aapka KrishiFlow-AI ${roleLabel} registration State Manager dwara APPROVE kar diya gaya hai. Ab aap apne registered mobile (+91 ${targetReq.mobile_number.slice(-10)}) aur password se login kar sakte hain.`,
        type: 'transactional',
      });
    } catch (e) {
      console.warn('SMS dispatch error:', e);
    }

    return { success: true };
  },

  /**
   * Reject a registration request: updates status to rejected with mandatory reason
   */
  async rejectRegistrationRequest(
    requestId: string,
    reason: string,
    managerId: string = '00000000-0000-0000-0000-000000000001',
    managerName: string = 'Dr. Alok Ranjan Rath (IAS)'
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Mandatory rejection reason required' };
    }

    const nowIso = new Date().toISOString();
    const cleanReason = reason.trim();
    const validManagerId = isUUID(managerId) ? managerId : '00000000-0000-0000-0000-000000000001';

    // 1. Get request
    const allRequests = db.getCollection<RegistrationRequest>('registration_requests');
    let targetReq = allRequests.find((r) => r.id === requestId);

    if (!targetReq && isLiveSupabaseConfigured()) {
      const { data } = await supabase.from('registration_requests').select('*').eq('id', requestId).single();
      if (data) targetReq = data as RegistrationRequest;
    }

    if (!targetReq) {
      return { success: false, error: 'Registration request not found' };
    }

    // 2. Update registration_requests table
    try {
      if (isLiveSupabaseConfigured()) {
        await supabase
          .from('registration_requests')
          .update({
            status: 'rejected',
            rejection_reason: cleanReason,
            reviewed_by: validManagerId,
            reviewed_by_name: managerName,
            reviewed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', requestId);
      }
    } catch (err) {
      console.warn('Supabase reject registration request error:', err);
    }

    // Update local requests collection
    const updatedRequests = allRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'rejected' as const,
            rejection_reason: cleanReason,
            reviewed_by: validManagerId,
            reviewed_by_name: managerName,
            reviewed_at: nowIso,
            updated_at: nowIso,
          }
        : r
    );
    db.setCollection('registration_requests', updatedRequests);

    // 3. If user exists in users table, update status to rejected
    const allUsers = db.getCollection<User>('users');
    const existingUser = allUsers.find(
      (u) => (targetReq?.mobile_number && u.phone === targetReq.mobile_number) || (targetReq?.email && u.email === targetReq.email)
    );
    if (existingUser) {
      await this.updateUserStatus(existingUser.id, 'rejected', 'inactive', managerName);
    }

    // 4. Send SMS notification about rejection
    try {
      await sendSms({
        phone: targetReq.mobile_number,
        message: `Dear ${targetReq.full_name}, Aapka KrishiFlow-AI registration State Manager dwara reject kar diya gaya hai. Karan: ${cleanReason}. Sahayata ke liye PACS kendra par sampark karein.`,
        type: 'alert',
      });
    } catch (e) {
      console.warn('SMS dispatch error:', e);
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
    rejectionReason?: string;
  }> {
    const user = await this.findUserByIdentifier(userId);
    if (!user) {
      // Check if there is a pending or rejected registration request
      const regReq = await this.findRegistrationRequestByIdentifier(userId);
      if (regReq) {
        if (regReq.status === 'pending') {
          return { isValid: false, user: null, reason: 'pending' };
        }
        if (regReq.status === 'rejected') {
          return { isValid: false, user: null, reason: 'rejected', rejectionReason: regReq.rejection_reason };
        }
      }
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
      const regReq = await this.findRegistrationRequestByIdentifier(userId);
      return { isValid: false, user, reason: 'rejected', rejectionReason: regReq?.rejection_reason };
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
