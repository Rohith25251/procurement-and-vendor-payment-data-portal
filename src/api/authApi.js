import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_USERS } from '../mock/users';

const USERS_KEY = 'procure_users_db';

export const authApi = {
  login: async (email, password) => {
    await delay(400);
    const users = getStorageData(USERS_KEY, INITIAL_USERS);
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
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
        companyName: user.companyName || null,
        vendorId: user.vendorId || null,
        avatar: user.avatar
      },
      token
    };

    localStorage.setItem('procure_session', JSON.stringify(session));
    return session;
  },

  getCurrentSession: async () => {
    await delay(150);
    const stored = localStorage.getItem('procure_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  updateUserProfile: async (userId, profileData) => {
    await delay(450);
    const users = getStorageData(USERS_KEY, INITIAL_USERS);

    let updatedUserObj = null;

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        updatedUserObj = {
          ...u,
          name: profileData.name || u.name,
          email: profileData.email || u.email,
          password: profileData.password ? profileData.password : u.password,
          department: profileData.department !== undefined ? profileData.department : u.department,
          companyName: profileData.companyName !== undefined ? profileData.companyName : u.companyName
        };
        return updatedUserObj;
      }
      return u;
    });

    setStorageData(USERS_KEY, updatedUsers);

    // Update active session in localStorage
    const currentSessionStr = localStorage.getItem('procure_session');
    if (currentSessionStr && updatedUserObj) {
      try {
        const session = JSON.parse(currentSessionStr);
        if (session.user.id === userId) {
          session.user = {
            ...session.user,
            name: updatedUserObj.name,
            email: updatedUserObj.email,
            department: updatedUserObj.department,
            companyName: updatedUserObj.companyName
          };
          localStorage.setItem('procure_session', JSON.stringify(session));
        }
      } catch (e) {
        console.error("Session update error", e);
      }
    }

    return updatedUserObj;
  },

  logout: async () => {
    await delay(200);
    localStorage.removeItem('procure_session');
    return true;
  }
};
