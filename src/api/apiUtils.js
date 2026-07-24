// Helper to simulate asynchronous network delay (400ms)
export const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to load seed data into localStorage if not already present
export const getStorageData = (key, initialSeed) => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
    }
  }
  localStorage.setItem(key, JSON.stringify(initialSeed));
  return initialSeed;
};

// Helper to update localStorage data
export const setStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  return data;
};
