import React, { useState, useEffect, useRef, useCallback } from "react";
import { productApi, CATEGORIES } from "../../api/productApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { SearchFilterBar } from "../../components/common/SearchFilterBar";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Package, Plus, Edit, Trash2, Upload, X, Tag, IndianRupee,
  Clock, Layers, Box, Ruler, ShieldCheck, TrendingUp, Star,
  AlertCircle, CheckCircle2, RefreshCw, Image as ImageIcon,
  Sparkles, ChevronDown, Hash, FileSpreadsheet
} from "lucide-react";
import * as XLSX from 'xlsx';

// ── Stock status config ────────────────────────────────────────────────────
const STOCK_STATUS_CONFIG = {
  "In Stock":    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "Low Stock":   { color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500"   },
  "Out of Stock":{ color: "bg-rose-100 text-rose-700 border-rose-200",           dot: "bg-rose-500"    },
  "Discontinued":{ color: "bg-slate-100 text-slate-500 border-slate-200",        dot: "bg-slate-400"   },
};

const UNITS = ["piece","kg","gram","litre","metre","box","carton","set","lot","hour","month"];
const TAX_RATES = [0, 5, 12, 18, 28];

// ── Empty form factory ─────────────────────────────────────────────────────
const makeEmptyForm = () => ({
  name: "",
  sku: "",
  brand: "",
  category: CATEGORIES[0],
  unit: "piece",
  unitPrice: "",
  currency: "INR",
  taxRate: 18,
  stockStatus: "In Stock",
  stockQty: 0,
  leadTimeDays: 3,
  weight: "",
  dimensions: "",
  warrantyMonths: 0,
  tags: [],
  description: "",
});

// ── ImageUploadZone ────────────────────────────────────────────────────────
const ImageUploadZone = ({ preview, onFileSelect, uploading }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`relative w-full h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden
        ${dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"}`}
    >
      {preview ? (
        <>
          <img src={preview} alt="Product preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-xs font-bold flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Change Image</p>
          </div>
        </>
      ) : (
        <>
          <div className={`p-3 rounded-xl mb-2 ${dragging ? "bg-emerald-100" : "bg-slate-100"}`}>
            <ImageIcon className={`w-7 h-7 ${dragging ? "text-emerald-600" : "text-slate-400"}`} />
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {uploading ? "Uploading..." : "Drag & drop or click to upload"}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP — max 5 MB</p>
        </>
      )}
      {uploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
          <div className="h-1 bg-emerald-500 animate-pulse w-2/3 rounded-full" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files[0]; if (f) onFileSelect(f); }} />
    </div>
  );
};

// ── TagInput ───────────────────────────────────────────────────────────────
const TagInput = ({ tags, onChange }) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t) && tags.length < 10) {
      onChange([...tags, t]);
      setInput("");
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold">
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          placeholder="Type a tag and press Enter..."
          className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
        />
        <button type="button" onClick={addTag}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">
          Add
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Max 10 tags. Press Enter or comma to add.</p>
    </div>
  );
};

// ── Section Label ──────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <div className="p-1 rounded-lg bg-emerald-50"><Icon className="w-3.5 h-3.5 text-emerald-600" /></div>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{label}</p>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

// ── Field wrapper ──────────────────────────────────────────────────────────
const Field = ({ label, required, children, hint, className = "" }) => (
  <div className={className}>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const inputCls = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all";
const selectCls = inputCls + " appearance-none cursor-pointer";

// ── ProductForm (shared for Add & Edit) ────────────────────────────────────
const ProductForm = ({ form, setForm, imageFile, setImageFile, onSubmit, onCancel, submitLabel, vendorId }) => {
  const [imagePreview, setImagePreview] = useState(form.imageUrl || null);
  const [uploading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, imageUrl: "" }));
  };

  const autoSku = () => {
    const prefix = form.name.split(" ").map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 4);
    setForm((f) => ({ ...f, sku: `SKU-${prefix}-${Math.floor(100 + Math.random() * 900)}` }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 text-xs">

      {/* ── Product Image ── */}
      <div>
        <SectionLabel icon={ImageIcon} label="Product Image" />
        <div className="relative">
          <ImageUploadZone preview={imagePreview} onFileSelect={handleFileSelect} uploading={uploading} />
          {(imagePreview) && (
            <button type="button" onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-rose-500 rounded-lg shadow transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">Uploaded to <span className="font-mono">product-images/{vendorId || "vendor"}/…/main.jpg</span></p>
      </div>

      {/* ── Basic Information ── */}
      <div>
        <SectionLabel icon={Package} label="Basic Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Product / Service Name" required className="sm:col-span-2">
            <input type="text" required value={form.name} onChange={set("name")}
              placeholder="e.g. Precision Machine Bolts M10" className={inputCls} />
          </Field>
          <Field label="SKU / Item Code" hint="Leave blank for auto-generation">
            <div className="relative">
              <input type="text" value={form.sku} onChange={set("sku")}
                placeholder="SKU-APX-880" className={inputCls + " pr-24 font-mono uppercase"} />
              <button type="button" onClick={autoSku}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                <Sparkles className="w-3 h-3" /> Auto
              </button>
            </div>
          </Field>
          <Field label="Brand / Manufacturer">
            <input type="text" value={form.brand} onChange={set("brand")}
              placeholder="e.g. Bosch, 3M, Generic" className={inputCls} />
          </Field>
          <Field label="Category" required>
            <div className="relative">
              <select value={form.category} onChange={set("category")} className={selectCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Pricing & Tax ── */}
      <div>
        <SectionLabel icon={IndianRupee} label="Pricing & Tax" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Unit Price (₹)" required className="col-span-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" required min="0.01" step="0.01" value={form.unitPrice} onChange={set("unitPrice")}
                placeholder="0.00" className={inputCls + " pl-7 font-bold"} />
            </div>
          </Field>
          <Field label="GST / Tax Rate">
            <div className="relative">
              <select value={form.taxRate} onChange={set("taxRate")} className={selectCls}>
                {TAX_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Currency">
            <div className="relative">
              <select value={form.currency} onChange={set("currency")} className={selectCls}>
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Inventory & Stock ── */}
      <div>
        <SectionLabel icon={Layers} label="Inventory & Stock" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Unit of Measure">
            <div className="relative">
              <select value={form.unit} onChange={set("unit")} className={selectCls}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </Field>
          <Field label="Stock Quantity">
            <input type="number" min="0" value={form.stockQty} onChange={set("stockQty")}
              className={inputCls} />
          </Field>
          <Field label="Stock Status">
            <div className="relative">
              <select value={form.stockStatus} onChange={set("stockStatus")} className={selectCls}>
                {Object.keys(STOCK_STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Logistics & Shipping ── */}
      <div>
        <SectionLabel icon={Box} label="Logistics & Shipping" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Lead Time (Days)">
            <input type="number" min="0" value={form.leadTimeDays} onChange={set("leadTimeDays")}
              className={inputCls} />
          </Field>
          <Field label="Weight (kg)">
            <input type="text" value={form.weight} onChange={set("weight")}
              placeholder="e.g. 2.5" className={inputCls} />
          </Field>
          <Field label="Dimensions (cm)" className="col-span-2" hint="Format: L × W × H">
            <input type="text" value={form.dimensions} onChange={set("dimensions")}
              placeholder="e.g. 30 × 20 × 10" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* ── Quality & Compliance ── */}
      <div>
        <SectionLabel icon={ShieldCheck} label="Quality & Compliance" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Warranty (Months)" hint="0 = No warranty">
            <input type="number" min="0" value={form.warrantyMonths} onChange={set("warrantyMonths")}
              className={inputCls} />
          </Field>
        </div>
      </div>

      {/* ── Description & Tags ── */}
      <div>
        <SectionLabel icon={Tag} label="Description & Tags" />
        <div className="space-y-3">
          <Field label="Product Description">
            <textarea rows={3} value={form.description} onChange={set("description")}
              placeholder="Detailed specifications, materials, compliance certifications, use-cases..."
              className={inputCls + " resize-none"} />
          </Field>
          <Field label="Search Tags" hint="Help buyers find this product faster">
            <TagInput tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
          </Field>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 text-slate-600 font-semibold hover:text-slate-900 transition-colors text-xs">
          Cancel
        </button>
        <button type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

// ── Stock Status Badge ─────────────────────────────────────────────────────
const StockBadge = ({ status }) => {
  const cfg = STOCK_STATUS_CONFIG[status] || STOCK_STATUS_CONFIG["In Stock"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ── Product Card ───────────────────────────────────────────────────────────
const ProductCard = ({ prod, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
    {/* Image */}
    <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
      {prod.imageUrl ? (
        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
          <Package className="w-12 h-12 mb-1" />
          <p className="text-xs text-slate-400">No image</p>
        </div>
      )}
      {/* Category pill */}
      <div className="absolute top-2 left-2">
        <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-700 border border-slate-200 shadow-sm">
          {prod.category}
        </span>
      </div>
      {/* Stock badge */}
      <div className="absolute top-2 right-2">
        <StockBadge status={prod.stockStatus} />
      </div>
    </div>

    {/* Content */}
    <div className="p-4 flex flex-col flex-1 gap-3">
      {/* SKU + Name */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-mono font-bold text-slate-400">{prod.sku || "—"}</span>
          {prod.warrantyMonths > 0 && (
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
              {prod.warrantyMonths}mo warranty
            </span>
          )}
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">{prod.name}</h3>
        {prod.brand && <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{prod.brand}</p>}
      </div>

      {/* Description */}
      {prod.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{prod.description}</p>
      )}

      {/* Tags */}
      {prod.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {prod.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
          {prod.tags.length > 4 && (
            <span className="text-[9px] text-slate-400 px-1.5 py-0.5">+{prod.tags.length - 4} more</span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-1 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px]">
        <div>
          <p className="text-slate-400 font-semibold">Lead Time</p>
          <p className="font-bold text-slate-800">{prod.leadTimeDays} days</p>
        </div>
        <div className="border-l border-slate-200">
          <p className="text-slate-400 font-semibold">GST / Tax</p>
          <p className="font-bold text-slate-800">{prod.taxRate}%</p>
        </div>
      </div>

      {/* Price + actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Unit Price</p>
          <p className="text-lg font-extrabold text-emerald-600">
            ₹{prod.unitPrice.toLocaleString("en-IN")}
            <span className="text-xs font-medium text-slate-400 ml-1">/{prod.unit}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(prod)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors" title="Edit Product">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(prod.id)}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors" title="Delete Product">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────
export const VendorProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null });

  const [productForm, setProductForm] = useState(makeEmptyForm());
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const vendorId = user?.vendorId || user?.id || "vnd_default";

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await productApi.getProductsByVendor(vendorId);
      setProducts(data);
    } catch {
      showToast("Failed to load product catalog", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [user]);

  const resetForm = () => { setProductForm(makeEmptyForm()); setImageFile(null); };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productApi.createProduct({ ...productForm, vendorId }, imageFile);
      showToast("Product added to catalog!", "success");
      setIsAddModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err) {
      showToast(err.message || "Failed to add product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku || "",
      brand: product.brand || "",
      category: product.category,
      unit: product.unit || "piece",
      unitPrice: product.unitPrice,
      currency: product.currency || "INR",
      taxRate: product.taxRate || 18,
      stockStatus: product.stockStatus || "In Stock",
      stockQty: product.stockQty || 0,
      leadTimeDays: product.leadTimeDays || 3,
      weight: product.weight || "",
      dimensions: product.dimensions || "",
      warrantyMonths: product.warrantyMonths || 0,
      tags: product.tags || [],
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await productApi.updateProduct(selectedProduct.id, { ...productForm, vendorId }, imageFile);
      showToast("Product updated successfully!", "success");
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (err) {
      showToast(err.message || "Failed to update product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          showToast("Excel sheet is empty!", "warning");
          return;
        }

        // Helper to find column keys case-insensitively
        const findVal = (row, alternatives) => {
          const key = Object.keys(row).find(k => 
            alternatives.some(alt => k.toLowerCase().trim() === alt.toLowerCase())
          );
          return key ? row[key] : undefined;
        };

        const mapped = rows.map(r => {
          const name = findVal(r, ['Product Name', 'Name', 'Title', 'Product']);
          const sku = findVal(r, ['SKU', 'Item Code', 'Code']);
          const brand = findVal(r, ['Brand', 'Manufacturer', 'Make']) || '';
          const category = findVal(r, ['Category', 'Type']) || CATEGORIES[0];
          const unit = findVal(r, ['Unit', 'UOM']) || 'piece';
          const unitPrice = Number(findVal(r, ['Price', 'Unit Price', 'Rate']) || 0);
          const stockQty = Number(findVal(r, ['Stock', 'Quantity', 'Stock Qty']) || 0);
          const leadTimeDays = Number(findVal(r, ['Lead Time', 'Lead Time Days', 'Days']) || 3);
          const weight = String(findVal(r, ['Weight']) || '');
          const dimensions = String(findVal(r, ['Dimensions', 'Size']) || '');
          const warrantyMonths = Number(findVal(r, ['Warranty', 'Warranty Months']) || 0);
          const tagsStr = findVal(r, ['Tags', 'Keywords']) || '';
          const description = findVal(r, ['Description', 'Details']) || '';

          const tags = tagsStr 
            ? String(tagsStr).split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
            : [];

          const stockStatus = stockQty > 0 ? "In Stock" : "Out of Stock";

          return {
            vendorId,
            name,
            sku,
            brand,
            category,
            unit,
            unitPrice,
            stockStatus,
            stockQty,
            leadTimeDays,
            weight,
            dimensions,
            warrantyMonths,
            tags,
            description
          };
        });

        // Filter out invalid rows (must have a name and positive price)
        const validRows = mapped.filter(r => r.name && r.unitPrice > 0);

        if (validRows.length === 0) {
          showToast("No valid products found! Make sure columns have Name and Price", "warning");
          return;
        }

        setLoading(true);
        await productApi.createProductsBulk(validRows);
        showToast(`Successfully imported ${validRows.length} products!`, "success");
        loadProducts();
      } catch (err) {
        console.error(err);
        showToast("Failed to parse Excel file", "error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = "";
  };

  const handleDeleteConfirm = async () => {
    try {
      await productApi.deleteProduct(deleteDialog.productId);
      showToast("Product removed from catalog", "info");
      setDeleteDialog({ open: false, productId: null });
      loadProducts();
    } catch {
      showToast("Failed to remove product", "error");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || (p.tags || []).some((t) => t.includes(q));
    const matchCat = !categoryFilter || p.category === categoryFilter;
    const matchStock = !stockFilter || p.stockStatus === stockFilter;
    return matchSearch && matchCat && matchStock;
  });

  const totalValue = products.reduce((s, p) => s + (p.unitPrice * (p.stockQty || 0)), 0);
  const inStockCount = products.filter((p) => p.stockStatus === "In Stock").length;
  const lowStockCount = products.filter((p) => p.stockStatus === "Low Stock").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600" />
            Product Catalog & Pricing Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage offered products/services, unit prices, SKUs, images and stock availability</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="shrink-0 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-all">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: products.length, icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "In Stock", value: inStockCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Low Stock", value: lowStockCount, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Catalog Value", value: `₹${(totalValue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="text-lg font-extrabold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search product, SKU, brand, or tag..."
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryOptions={CATEGORIES}
          />
        </div>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">All Stock Status</option>
          {Object.keys(STOCK_STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No products found</p>
          <p className="text-xs mt-1">Try changing your filters or add a new product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              prod={prod}
              onEdit={openEditModal}
              onDelete={(id) => setDeleteDialog({ open: true, productId: id })}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title="Add Product to Catalog" maxWidth="max-w-3xl">
        <ProductForm
          form={productForm}
          setForm={setProductForm}
          imageFile={imageFile}
          setImageFile={setImageFile}
          onSubmit={handleAddSubmit}
          onCancel={() => { setIsAddModalOpen(false); resetForm(); }}
          submitLabel={submitting ? "Saving…" : "Add to Catalog"}
          vendorId={vendorId}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }}
        title="Edit Product" maxWidth="max-w-3xl">
        <ProductForm
          form={productForm}
          setForm={setProductForm}
          imageFile={imageFile}
          setImageFile={setImageFile}
          onSubmit={handleEditSubmit}
          onCancel={() => { setIsEditModalOpen(false); resetForm(); }}
          submitLabel={submitting ? "Saving…" : "Save Changes"}
          vendorId={vendorId}
        />
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, productId: null })}
        onConfirm={handleDeleteConfirm}
        title="Remove Product from Catalog"
        message="Are you sure you want to remove this product? Managers will no longer be able to select it for purchase orders."
        confirmText="Remove Product"
      />
    </div>
  );
};
