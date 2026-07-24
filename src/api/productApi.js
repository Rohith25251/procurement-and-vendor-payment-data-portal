import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_PRODUCTS } from '../mock/products';

const PRODUCTS_KEY = 'procure_products_db';

export const productApi = {
  getAllProducts: async () => {
    await delay(300);
    return getStorageData(PRODUCTS_KEY, INITIAL_PRODUCTS);
  },

  getProductsByVendor: async (vendorId) => {
    await delay(300);
    const products = getStorageData(PRODUCTS_KEY, INITIAL_PRODUCTS);
    return products.filter(p => p.vendorId === vendorId || p.vendorId === 'vnd_apex_01');
  },

  createProduct: async (productData) => {
    await delay(400);
    const products = getStorageData(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const newProduct = {
      id: `prd_${Date.now()}`,
      sku: productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      currency: 'USD',
      stockStatus: productData.stockStatus || 'In Stock',
      leadTimeDays: Number(productData.leadTimeDays || 3),
      ...productData,
      unitPrice: Number(productData.unitPrice)
    };

    const updated = [newProduct, ...products];
    setStorageData(PRODUCTS_KEY, updated);
    return newProduct;
  },

  updateProduct: async (id, productData) => {
    await delay(400);
    const products = getStorageData(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...productData,
          unitPrice: Number(productData.unitPrice || p.unitPrice)
        };
      }
      return p;
    });

    setStorageData(PRODUCTS_KEY, updated);
    return updated.find(p => p.id === id);
  },

  deleteProduct: async (id) => {
    await delay(400);
    const products = getStorageData(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const updated = products.filter(p => p.id !== id);
    setStorageData(PRODUCTS_KEY, updated);
    return true;
  }
};
