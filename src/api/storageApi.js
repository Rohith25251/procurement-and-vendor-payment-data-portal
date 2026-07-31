import { supabase } from '../supabaseClient';

/**
 * storageApi — centralised helper for Supabase Storage.
 *
 * Bucket layout:
 *   product-images/
 *     {vendorId}/{productId}/main.{ext}
 *
 *   profile-images/
 *     vendors/{vendorId}/avatar.{ext}
 *     managers/{managerId}/avatar.{ext}
 */

const PRODUCT_BUCKET = 'product-images';
const PROFILE_BUCKET = 'profile-images';

export const storageApi = {
  /** Upload a product main image. Returns public URL. */
  uploadProductImage: async (file, vendorId, productId) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${vendorId}/${productId}/main.${ext}`;
    const { error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Upload vendor avatar. Returns public URL. */
  uploadVendorAvatar: async (file, vendorId) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `vendors/${vendorId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Upload manager avatar. Returns public URL. */
  uploadManagerAvatar: async (file, managerId) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `managers/${managerId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};
