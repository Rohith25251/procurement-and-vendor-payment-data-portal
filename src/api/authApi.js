import { supabase } from '../supabaseClient';

export const authApi = {
  login: async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check the users table first (managers only)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('role', 'manager');

    if (!userError && users && users.length > 0) {
      const user = users[0];
      if (user.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      const token = `mock-jwt-token-${user.id}-${Date.now()}`;
      const session = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'manager',
          department: user.department || null,
          companyName: user.company_name || null,
          vendorId: null,
          avatar: user.avatar
        },
        token
      };
      localStorage.setItem('procure_session', JSON.stringify(session));
      return session;
    }

    // 2. Check the vendors table for approved vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('status', 'Approved');

    if (!vendorError && vendors && vendors.length > 0) {
      const vendor = vendors[0];
      if (vendor.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      const token = `mock-jwt-token-${vendor.id}-${Date.now()}`;
      const session = {
        user: {
          id: vendor.id,
          name: vendor.name,
          email: vendor.email,
          role: 'vendor',
          department: null,
          companyName: vendor.name,
          vendorId: vendor.id,
          avatar: null
        },
        token
      };
      localStorage.setItem('procure_session', JSON.stringify(session));
      return session;
    }

    // 3. If vendor exists but is not yet approved
    const { data: pendingVendors } = await supabase
      .from('vendors')
      .select('status')
      .eq('email', normalizedEmail);

    if (pendingVendors && pendingVendors.length > 0) {
      const status = pendingVendors[0].status;
      if (status === 'Pending') {
        throw new Error('Your vendor registration is pending approval. Please wait for the manager to approve your account.');
      }
      if (status === 'Rejected') {
        throw new Error('Your vendor registration was rejected. Please contact support.');
      }
    }

    throw new Error('Invalid email or password. Please check your credentials.');
  },

  getCurrentSession: async () => {
    const stored = localStorage.getItem('procure_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  updateUserProfile: async (userId, profileData) => {
    const isVendor = userId.startsWith('vnd_');

    const updateData = {};
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.password !== undefined) updateData.password = profileData.password;

    if (isVendor) {
      // Vendor profiles live in the vendors table
      if (profileData.contactPerson !== undefined) updateData.contact_person = profileData.contactPerson;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;

      const { data, error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', userId)
        .select('*');

      if (error || !data || data.length === 0) {
        throw new Error(error?.message || 'Failed to update profile');
      }

      const v = data[0];
      const currentSessionStr = localStorage.getItem('procure_session');
      if (currentSessionStr) {
        try {
          const session = JSON.parse(currentSessionStr);
          if (session.user.id === userId) {
            session.user = { ...session.user, name: v.name, email: v.email };
            localStorage.setItem('procure_session', JSON.stringify(session));
          }
        } catch (e) { console.error('Session update error', e); }
      }

      return {
        id: v.id,
        name: v.name,
        email: v.email,
        role: 'vendor',
        department: null,
        companyName: v.name,
        vendorId: v.id,
        avatar: null
      };
    }

    // Manager profiles live in the users table
    if (profileData.department !== undefined) updateData.department = profileData.department;
    if (profileData.companyName !== undefined) updateData.company_name = profileData.companyName;
    if (profileData.avatar !== undefined) updateData.avatar = profileData.avatar;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*');

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'Failed to update profile');
    }

    const updatedUserObj = data[0];

    // Update active session in localStorage
    const currentSessionStr = localStorage.getItem('procure_session');
    if (currentSessionStr) {
      try {
        const session = JSON.parse(currentSessionStr);
        if (session.user.id === userId) {
          session.user = {
            ...session.user,
            name: updatedUserObj.name,
            email: updatedUserObj.email,
            department: updatedUserObj.department,
            companyName: updatedUserObj.company_name,
            avatar: updatedUserObj.avatar
          };
          localStorage.setItem('procure_session', JSON.stringify(session));
        }
      } catch (e) {
        console.error("Session update error", e);
      }
    }

    return {
      id: updatedUserObj.id,
      name: updatedUserObj.name,
      email: updatedUserObj.email,
      role: updatedUserObj.role,
      department: updatedUserObj.department || null,
      companyName: updatedUserObj.company_name || null,
      vendorId: null,
      avatar: updatedUserObj.avatar
    };
  },

  logout: async () => {
    localStorage.removeItem('procure_session');
    return true;
  }
};
