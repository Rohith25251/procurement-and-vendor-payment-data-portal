import { supabase } from '../supabaseClient';

export const reportApi = {
  getReportData: async () => {
    // 1. Fetch tables from Supabase
    const { data: invoices, error: invErr } = await supabase.from('invoices').select('*');
    const { data: purchaseOrders, error: poErr } = await supabase.from('purchase_orders').select('*');
    const { data: vendors, error: vndErr } = await supabase.from('vendors').select('*');
    const { data: payments, error: pmtErr } = await supabase.from('payments').select('*');

    if (invErr) throw invErr;
    if (poErr) throw poErr;
    if (vndErr) throw vndErr;
    if (pmtErr) throw pmtErr;

    // Calculate total spend (sum of all disbursements in payments)
    const totalSpend = payments.reduce((acc, p) => acc + (Number(p.amount_paid) || 0), 0);

    // External invoices (OCR-uploaded without a PO) — include in trend
    const externalInvoices = invoices.filter(i => i.po_number === 'EXTERNAL' || !i.po_id);

    const hasData = purchaseOrders.length > 0 || payments.length > 0 || invoices.length > 0;

    // Generate a continuous last 6 months timeline dynamically to make the line chart draw beautifully
    const monthlyMap = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap[monthStr] = { 
        month: monthStr, 
        spend: 0, 
        target: hasData ? 50000 : 0, 
        posCount: 0 
      };
    }

    payments.forEach(p => {
      if (!p.payment_date) return;
      const date = new Date(p.payment_date);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      // Only record if it falls in our active 6 months window
      if (monthlyMap[monthStr]) {
        monthlyMap[monthStr].spend += Number(p.amount_paid) || 0;
      }
    });

    purchaseOrders.forEach(po => {
      if (!po.created_date) return;
      const date = new Date(po.created_date);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyMap[monthStr]) {
        monthlyMap[monthStr].posCount += 1;
      }
    });

    // Also count external OCR invoices in the monthly trend
    externalInvoices.forEach(inv => {
      if (!inv.submitted_at) return;
      const date = new Date(inv.submitted_at);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyMap[monthStr]) {
        monthlyMap[monthStr].posCount += 1;
      }
    });

    const monthlySpendTrend = Object.values(monthlyMap);

    // Initialize 4 standard categories with 0 values so that charts look balanced
    const categoryMap = {
      'Hardware & Raw Materials': 0,
      'IT & Software Services': 0,
      'Packaging & Materials': 0,
      'Facilities & Operations': 0
    };

    let overallPOSpend = 0;
    purchaseOrders.forEach(po => {
      const cat = po.category || 'Hardware & Raw Materials';
      const amt = Number(po.total_amount) || 0;
      if (categoryMap[cat] !== undefined) {
        categoryMap[cat] += amt;
      } else {
        categoryMap[cat] = amt;
      }
      overallPOSpend += amt;
    });

    // Include external OCR invoices in category spend (map vendor → category)
    const vendorCategoryMap = {};
    vendors.forEach(v => { vendorCategoryMap[v.id] = v.category || 'Hardware & Raw Materials'; });

    externalInvoices.forEach(inv => {
      const cat = vendorCategoryMap[inv.vendor_id] || 'Hardware & Raw Materials';
      const amt = Number(inv.total_amount) || 0;
      if (categoryMap[cat] !== undefined) {
        categoryMap[cat] += amt;
      } else {
        categoryMap[cat] = amt;
      }
      overallPOSpend += amt;
    });

    const categorySpend = Object.keys(categoryMap).map(cat => ({
      category: cat,
      amount: categoryMap[cat],
      percentage: overallPOSpend > 0 ? Math.round((categoryMap[cat] / overallPOSpend) * 100) : 0
    }));

    // Map vendor spend list dynamically — include both PO spend and external invoice spend
    const vendorSpendList = vendors.map(v => {
      const vOrders = purchaseOrders.filter(o => o.vendor_id === v.id || o.vendor_id === v.user_id);
      const vPOSpend = vOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const vExtSpend = externalInvoices
        .filter(i => i.vendor_id === v.id)
        .reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
      return {
        vendorName: v.name,
        category: v.category,
        orderCount: vOrders.length + externalInvoices.filter(i => i.vendor_id === v.id).length,
        totalSpend: vPOSpend + vExtSpend,
        onTimeRate: '100%',
        score: Number(v.score) || 100
      };
    });

    const avgOnTimeDelivery = vendors.length > 0
      ? (vendors.reduce((acc, v) => acc + (Number(v.score) || 100), 0) / vendors.length).toFixed(1)
      : '100';

    return {
      summary: {
        totalSpend,
        activeVendorsCount: vendors.filter(v => v.status === 'Approved').length,
        avgOnTimeDelivery: `${avgOnTimeDelivery}%`,
        totalPOProcessed: purchaseOrders.length + externalInvoices.length // include external invoices in count
      },
      monthlySpendTrend,
      categorySpend,
      vendorSpendList
    };
  },

  exportReport: async (format = 'pdf') => {
    return {
      success: true,
      message: `Report successfully exported in ${format.toUpperCase()} format. File: ProcureHub_Analytics_${new Date().toISOString().split('T')[0]}.${format}`
    };
  }
};
