import { supabase } from '../supabaseClient';
import { storageApi } from './storageApi';

const mapDBToProduct = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    vendorId: p.vendor_id,
    name: p.name,
    sku: p.sku,
    brand: p.brand || '',
    category: p.category,
    unit: p.unit || 'piece',
    unitPrice: Number(p.unit_price) || 0,
    currency: p.currency || 'INR',
    minOrderQty: Number(p.min_order_qty) || 1,
    stockStatus: p.stock_status || 'In Stock',
    stockQty: Number(p.stock_qty) || 0,
    leadTimeDays: p.lead_time_days || 3,
    weight: p.weight || '',
    dimensions: p.dimensions || '',
    warrantyMonths: Number(p.warranty_months) || 0,
    tags: p.tags || [],
    description: p.description || '',
    imageUrl: p.image_url || '',
    taxRate: Number(p.tax_rate) || 18,
    createdAt: p.created_at || null,
  };
};

const CATEGORIES = [
  'Hardware & Raw Materials',
  'IT & Software Services',
  'Facilities & Operations',
  'Packaging & Materials',
  'Logistics & Transport',
];

export { CATEGORIES };

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

  createProduct: async (productData, imageFile = null) => {
    const productId = productData.id || `prd_${Date.now()}`;
    const namePrefix = productData.name ? productData.name.split(" ").map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 4) : "PRD";
    const generatedSku = productData.sku && productData.sku.trim() !== "" ? productData.sku.trim().toUpperCase() : `SKU-${namePrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const dbData = {
      id: productId,
      vendor_id: productData.vendorId,
      name: productData.name,
      sku: generatedSku,
      brand: productData.brand || '',
      category: productData.category,
      unit: productData.unit || 'piece',
      unit_price: Number(productData.unitPrice),
      currency: productData.currency || 'INR',
      min_order_qty: Number(productData.minOrderQty || 1),
      stock_status: productData.stockStatus || 'In Stock',
      stock_qty: Number(productData.stockQty || 0),
      lead_time_days: Number(productData.leadTimeDays || 3),
      weight: productData.weight || '',
      dimensions: productData.dimensions || '',
      warranty_months: Number(productData.warrantyMonths || 0),
      tags: productData.tags || [],
      description: productData.description || '',
      image_url: productData.imageUrl || '',
      tax_rate: Number(productData.taxRate || 18),
    };

    // Upload image first if provided
    if (imageFile && productData.vendorId) {
      const url = await storageApi.uploadProductImage(imageFile, productData.vendorId, productId);
      dbData.image_url = url;
    }

    const { data, error } = await supabase
      .from('products')
      .insert(dbData)
      .select('*');
    if (error) throw error;
    return mapDBToProduct(data[0]);
  },

  updateProduct: async (id, productData, imageFile = null) => {
    const updateData = {};
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.sku !== undefined) updateData.sku = productData.sku;
    if (productData.brand !== undefined) updateData.brand = productData.brand;
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.unit !== undefined) updateData.unit = productData.unit;
    if (productData.unitPrice !== undefined) updateData.unit_price = Number(productData.unitPrice);
    if (productData.currency !== undefined) updateData.currency = productData.currency;
    if (productData.minOrderQty !== undefined) updateData.min_order_qty = Number(productData.minOrderQty);
    if (productData.stockStatus !== undefined) updateData.stock_status = productData.stockStatus;
    if (productData.stockQty !== undefined) updateData.stock_qty = Number(productData.stockQty);
    if (productData.leadTimeDays !== undefined) updateData.lead_time_days = Number(productData.leadTimeDays);
    if (productData.weight !== undefined) updateData.weight = productData.weight;
    if (productData.dimensions !== undefined) updateData.dimensions = productData.dimensions;
    if (productData.warrantyMonths !== undefined) updateData.warranty_months = Number(productData.warrantyMonths);
    if (productData.tags !== undefined) updateData.tags = productData.tags;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.imageUrl !== undefined) updateData.image_url = productData.imageUrl;
    if (productData.taxRate !== undefined) updateData.tax_rate = Number(productData.taxRate);

    // Upload new image if provided
    if (imageFile && productData.vendorId) {
      const url = await storageApi.uploadProductImage(imageFile, productData.vendorId, id);
      updateData.image_url = url;
    }

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
  },

  createProductsBulk: async (productsList) => {
    const dbData = productsList.map((p, idx) => {
      const namePrefix = p.name ? p.name.split(" ").map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 4) : "PRD";
      const generatedSku = p.sku && String(p.sku).trim() !== "" ? String(p.sku).trim().toUpperCase() : `SKU-${namePrefix}-${Math.floor(100 + Math.random() * 900 + idx)}`;
      
      return {
        id: p.id || `prd_${Date.now()}_${idx}`,
        vendor_id: p.vendorId,
        name: p.name,
        sku: generatedSku,
        brand: p.brand || '',
        category: p.category || 'Hardware & Raw Materials',
        unit: p.unit || 'piece',
        unit_price: Number(p.unitPrice || 0),
        currency: p.currency || 'INR',
        min_order_qty: 1, // Defaulted to 1
        stock_status: p.stockStatus || 'In Stock',
        stock_qty: Number(p.stockQty || 0),
        lead_time_days: Number(p.leadTimeDays || 3),
        weight: p.weight || '',
        dimensions: p.dimensions || '',
        warranty_months: Number(p.warrantyMonths || 0),
        tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim().toLowerCase()) : []),
        description: p.description || '',
        image_url: p.imageUrl || '',
        tax_rate: Number(p.taxRate || 18)
      };
    });

    const { data, error } = await supabase
      .from('products')
      .insert(dbData)
      .select('*');
    if (error) throw error;
    return data.map(mapDBToProduct);
  }
};
