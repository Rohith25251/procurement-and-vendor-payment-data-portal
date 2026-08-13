import { supabase } from '../supabaseClient';
import { activityLogger } from './activityLogger';
import { notificationApi } from './notificationApi';

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

      const isDeactivated = user.status === 'Deactivated';
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
          avatar: user.avatar,
          status: user.status || 'Approved',
          isDeactivated,
          deactivationReason: user.deactivation_reason || 'Account deactivated due to suspicious activity.',
          reactivationStatus: user.reactivation_status || 'None',
          reactivationReason: user.reactivation_reason || null,
          warningReason: user.warning_reason || null
        },
        token
      };

      localStorage.setItem('procure_session', JSON.stringify(session));

      // Log login event
      activityLogger.logActivity({
        userId: user.id,
        userName: user.name,
        userRole: 'manager',
        action: isDeactivated ? 'Deactivated Account Login' : 'User Logged In',
        details: isDeactivated ? `Attempted login on deactivated account (${user.email})` : `Manager logged in (${user.email})`
      });

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

      const isDeactivated = org.status === 'Deactivated' || org.status === 'Removed';
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
          avatar: null,
          status: org.status || 'Approved',
          isDeactivated,
          deactivationReason: org.deactivation_reason || 'Organization account deactivated due to suspicious activity.',
          reactivationStatus: org.reactivation_status || 'None',
          reactivationReason: org.reactivation_reason || null,
          warningReason: org.warning_reason || null
        },
        token
      };

      localStorage.setItem('procure_session', JSON.stringify(session));

      // Log activity
      activityLogger.logActivity({
        userId: org.id,
        userName: org.name,
        userRole: 'manager',
        action: isDeactivated ? 'Deactivated Account Login' : 'Organization Logged In',
        details: isDeactivated ? `Attempted login on deactivated organization (${org.email})` : `Organization logged in (${org.email})`
      });

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

      const isDeactivated = vendor.status === 'Deactivated' || vendor.status === 'Removed';
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
          avatar: null,
          status: vendor.status || 'Approved',
          isDeactivated,
          deactivationReason: vendor.deactivation_reason || 'Vendor account deactivated due to suspicious activity.',
          reactivationStatus: vendor.reactivation_status || 'None',
          reactivationReason: vendor.reactivation_reason || null,
          warningReason: vendor.warning_reason || null
        },
        token
      };

      localStorage.setItem('procure_session', JSON.stringify(session));

      // Log activity
      activityLogger.logActivity({
        userId: vendor.id,
        userName: vendor.name,
        userRole: 'vendor',
        action: isDeactivated ? 'Deactivated Account Login' : 'Vendor Logged In',
        details: isDeactivated ? `Attempted login on deactivated vendor (${vendor.email})` : `Vendor logged in (${vendor.email})`
      });

      return session;
    }

    throw new Error('Invalid email, Organization ID, or password. Please check your credentials.');
  },

  getCurrentSession: async () => {
    const stored = localStorage.getItem('procure_session');
    if (!stored) return null;
    try {
      const session = JSON.parse(stored);

      // Re-verify latest status from database if possible
      try {
        const u = session.user;
        let dbUser = null;
        if (u.role === 'vendor' || u.id?.startsWith('vnd_')) {
          const { data } = await supabase.from('vendors').select('*').eq('id', u.id).single();
          dbUser = data;
        } else if (u.id?.startsWith('org_')) {
          const { data } = await supabase.from('organizations').select('*').eq('id', u.id).single();
          dbUser = data;
        } else {
          const { data } = await supabase.from('users').select('*').eq('id', u.id).single();
          dbUser = data;
        }

        if (dbUser) {
          const isDeactivated = dbUser.status === 'Deactivated' || dbUser.status === 'Removed';
          session.user = {
            ...session.user,
            status: dbUser.status,
            isDeactivated,
            deactivationReason: dbUser.deactivation_reason || session.user.deactivationReason,
            reactivationStatus: dbUser.reactivation_status || session.user.reactivationStatus || 'None',
            reactivationReason: dbUser.reactivation_reason || session.user.reactivationReason,
            warningReason: dbUser.warning_reason || session.user.warningReason
          };
          localStorage.setItem('procure_session', JSON.stringify(session));
        }
      } catch (checkErr) {
        // Fallback to cached session
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Submit Reactivation Request by Deactivated User
   */
  submitReactivationRequest: async (userId, userRole, explanation) => {
    const isVendor = userId.startsWith('vnd_');
    const isOrg = userId.startsWith('org_');
    const table = isVendor ? 'vendors' : (isOrg ? 'organizations' : 'users');

    const updateData = {
      reactivation_status: 'Pending',
      reactivation_reason: explanation
    };

    try {
      await supabase.from(table).update(updateData).eq('id', userId);
    } catch (e) {
      console.warn(`Failed to update ${table} in DB:`, e);
    }

    // Update current active session in localStorage
    const stored = localStorage.getItem('procure_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.user?.id === userId) {
          session.user.reactivationStatus = 'Pending';
          session.user.reactivationReason = explanation;
          localStorage.setItem('procure_session', JSON.stringify(session));
        }
      } catch (e) {}
    }

    // Log Activity
    activityLogger.logActivity({
      userId,
      userName: userId,
      userRole,
      action: 'Submitted Account Reactivation Request',
      details: `Appeal Explanation: "${explanation}"`
    });

    // Notify Super Admin
    try {
      await notificationApi.createNotification({
        recipientRole: 'admin',
        title: 'New Account Reactivation Request',
        message: `Deactivated user (${userId}) requested reactivation: "${explanation}"`,
        type: 'governance',
        link: '/admin/governance'
      });
    } catch (nErr) {}

    return true;
  },

  /**
   * Admin Decision on Reactivation Request (Accept or Decline)
   */
  decideReactivationRequest: async (userId, userRole, decision, adminReason = '') => {
    const isVendor = userId.startsWith('vnd_');
    const isOrg = userId.startsWith('org_');
    const table = isVendor ? 'vendors' : (isOrg ? 'organizations' : 'users');

    const isAccepted = decision === 'Accepted';

    const updateData = isAccepted ? {
      status: 'Approved',
      deactivation_reason: null,
      reactivation_status: 'Accepted',
      warning_reason: null
    } : {
      status: 'Deactivated',
      reactivation_status: 'Declined'
    };

    try {
      await supabase.from(table).update(updateData).eq('id', userId);
    } catch (e) {
      console.warn(`Failed to update ${table} on decision:`, e);
    }

    // Log Activity
    activityLogger.logActivity({
      userId,
      userName: userId,
      userRole,
      action: isAccepted ? 'Admin ACCEPTED Reactivation Request' : 'Admin DECLINED Reactivation Request',
      details: isAccepted ? 'User status restored to Approved' : `Request declined. Admin Note: "${adminReason || 'Declined'}"`
    });

    // Send Notification to User
    try {
      await notificationApi.createNotification({
        recipientRole: userRole,
        vendorId: isVendor ? userId : null,
        title: isAccepted ? 'Account Reactivated!' : 'Reactivation Request Declined',
        message: isAccepted ? 'Admin approved your reactivation request. You can now use your account as normal.' : 'Admin rejected your request for further contact admin@procurehub.com.',
        type: 'governance',
        link: isAccepted ? '/' : '/deactivated'
      });
    } catch (nErr) {}

    return true;
  },

  /**
   * Admin Warns User
   */
  warnUser: async (userId, userRole, warningReason) => {
    const isVendor = userId.startsWith('vnd_');
    const isOrg = userId.startsWith('org_');
    const table = isVendor ? 'vendors' : (isOrg ? 'organizations' : 'users');

    try {
      await supabase.from(table).update({
        status: 'Warned',
        warning_reason: warningReason
      }).eq('id', userId);
    } catch (e) {}

    // Log Activity
    activityLogger.logActivity({
      userId,
      userName: userId,
      userRole,
      action: 'Warned by Admin',
      details: `Reason: "${warningReason}"`
    });

    // Notify User
    try {
      await notificationApi.createNotification({
        recipientRole: userRole,
        vendorId: isVendor ? userId : null,
        title: '⚠️ Warning Notice from Admin',
        message: `Suspicious activity detected: "${warningReason}". Continued suspicious activity may lead to account deactivation.`,
        type: 'governance',
        link: '/'
      });
    } catch (nErr) {}

    return true;
  },

  /**
   * Admin Deactivates User
   */
  deactivateUser: async (userId, userRole, deactivationReason) => {
    const isVendor = userId.startsWith('vnd_');
    const isOrg = userId.startsWith('org_');
    const table = isVendor ? 'vendors' : (isOrg ? 'organizations' : 'users');

    try {
      await supabase.from(table).update({
        status: 'Deactivated',
        deactivation_reason: deactivationReason,
        reactivation_status: 'None'
      }).eq('id', userId);
    } catch (e) {}

    // Log Activity
    activityLogger.logActivity({
      userId,
      userName: userId,
      userRole,
      action: 'Deactivated by Admin',
      details: `Reason: "${deactivationReason}"`
    });

    // Notify User
    try {
      await notificationApi.createNotification({
        recipientRole: userRole,
        vendorId: isVendor ? userId : null,
        title: '🛑 Account Deactivated',
        message: `Your account has been deactivated: "${deactivationReason}". Login to submit a reactivation request.`,
        type: 'governance',
        link: '/deactivated'
      });
    } catch (nErr) {}

    return true;
  },

  updateUserProfile: async (userId, profileData) => {
    const isVendor = userId.startsWith('vnd_');

    const updateData = {};
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.password !== undefined) updateData.password = profileData.password;

    if (isVendor) {
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
      status: 'Approved',
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
