import { supabase } from '../supabaseClient';

const mapDBToProduct = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    vendorId: p.vendor_id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitPrice: Number(p.unit_price) || 0,
    currency: p.currency || 'INR',
    stockStatus: p.stock_status || 'In Stock',
    leadTimeDays: p.lead_time_days || 3,
    description: p.description || '',
    imageUrl: p.image_url || ''
  };
};

export const productApi = {
  getAllProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(mapDBToProduct);
  },

  getProductsByVendor: async (vendorId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId);
    if (error) throw error;
    return data.map(mapDBToProduct);
  },

  createProduct: async (productData) => {
    const dbData = {
      id: productData.id || `prd_${Date.now()}`,
      vendor_id: productData.vendorId,
      name: productData.name,
      sku: productData.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      category: productData.category,
      unit_price: Number(productData.unitPrice),
      currency: productData.currency || 'INR',
      stock_status: productData.stockStatus || 'In Stock',
      lead_time_days: Number(productData.leadTimeDays || 3),
      description: productData.description || '',
      image_url: productData.imageUrl || ''
    };

    const { data, error } = await supabase
      .from('products')
      .insert(dbData)
      .select('*');
    if (error) throw error;
    return mapDBToProduct(data[0]);
  },

  updateProduct: async (id, productData) => {
    const updateData = {};
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.sku !== undefined) updateData.sku = productData.sku;
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.unitPrice !== undefined) updateData.unit_price = Number(productData.unitPrice);
    if (productData.currency !== undefined) updateData.currency = productData.currency;
    if (productData.stockStatus !== undefined) updateData.stock_status = productData.stockStatus;
    if (productData.leadTimeDays !== undefined) updateData.lead_time_days = Number(productData.leadTimeDays);
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.imageUrl !== undefined) updateData.image_url = productData.imageUrl;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return mapDBToProduct(data[0]);
  },

  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
