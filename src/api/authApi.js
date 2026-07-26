import { supabase } from '../supabaseClient';

export const authApi = {
  login: async (email, password) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim());

    if (error || !users || users.length === 0) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

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
        role: user.role,
        department: user.department || null,
        companyName: user.company_name || null,
        vendorId: user.vendor_id || null,
        avatar: user.avatar
      },
      token
    };

    localStorage.setItem('procure_session', JSON.stringify(session));
    return session;
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
    const updateData = {};
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.password !== undefined) updateData.password = profileData.password;
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
      vendorId: updatedUserObj.vendor_id || null,
      avatar: updatedUserObj.avatar
    };
  },

  logout: async () => {
    localStorage.removeItem('procure_session');
    return true;
  }
};
