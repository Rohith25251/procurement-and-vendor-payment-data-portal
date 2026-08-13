import { supabase } from '../supabaseClient';

export const authApi = {
  login: async (email, password) => {
    const rawInput = email.trim();
    const normalizedEmail = rawInput.toLowerCase();

    // 0. Super Admin accounts are blocked from logging into the Organization & Vendor Portal
    if (normalizedEmail === 'admin@procurehub.com') {
      throw new Error('Super Admin accounts must log in through the Super Admin Portal.');
    }

    const { data: superAdmins } = await supabase
      .from('super_admins')
      .select('id')
      .eq('email', normalizedEmail);

    if (superAdmins && superAdmins.length > 0) {
      throw new Error('Super Admin accounts must log in through the Super Admin Portal.');
    }

    // 1. Check the users table first (managers only by email or ID)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${normalizedEmail},id.eq.${rawInput}`)
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
          department: user.department || 'Procurement',
          companyName: user.company_name || 'KEC International',
          vendorId: null,
          avatar: user.avatar
        },
        token
      };
      localStorage.setItem('procure_session', JSON.stringify(session));
      return session;
    }

    // 1b. Check organizations table for manager accounts (by email OR organization ID)
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .or(`email.eq.${normalizedEmail},id.eq.${rawInput}`);

    if (orgs && orgs.length > 0) {
      const org = orgs[0];
      if (org.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      if (org.status === 'Pending') {
        throw new Error('Your organization registration is pending approval. Please wait for Super Admin approval.');
      }
      if (org.status === 'Rejected') {
        throw new Error('Your organization registration was rejected. Please contact support.');
      }
      const token = `mock-jwt-token-${org.id}-${Date.now()}`;
      const session = {
        user: {
          id: org.id,
          name: org.contact_person || org.name,
          email: org.email,
          role: 'manager',
          department: org.industry || 'Procurement',
          companyName: org.company_name || org.name,
          vendorId: null,
          avatar: null
        },
        token
      };
      localStorage.setItem('procure_session', JSON.stringify(session));
      return session;
    }

    // 2. Check the vendors table for vendors (by email OR vendor ID)
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .or(`email.eq.${normalizedEmail},id.eq.${rawInput}`);

    if (!vendorError && vendors && vendors.length > 0) {
      const vendor = vendors[0];
      if (vendor.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      if (vendor.status === 'Pending') {
        throw new Error('Your vendor registration is pending approval. Please wait for the manager to approve your account.');
      }
      if (vendor.status === 'Rejected') {
        throw new Error('Your vendor registration was rejected. Please contact support.');
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

    throw new Error('Invalid email, Organization ID, or password. Please check your credentials.');
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

  signupOrganization: async (formData) => {
    const orgId = `org_${Date.now()}`;
    const dbData = {
      id: orgId,
      name: formData.name,
      company_name: formData.name,
      contact_person: formData.contactPerson,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      industry: formData.industry,
      gstin: formData.gstin ? formData.gstin.toUpperCase() : null,
      address: formData.address || null,
      password: formData.password,
      status: 'Pending',
      joined_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert(dbData)
      .select('*');

    if (error) throw error;
    return data[0];
  },

  logout: async () => {
    localStorage.removeItem('procure_session');
    return true;
  }
};
