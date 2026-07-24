import { delay, getStorageData } from './apiUtils';

export const reportApi = {
  getReportData: async () => {
    await delay(400);
    const orders = getStorageData('procure_orders_db', []);
    const vendors = getStorageData('procure_vendors_db', []);
    const invoices = getStorageData('procure_invoices_db', []);

    // Calculated spend summary
    const totalSpend = invoices
      .filter(i => i.status === 'Paid' || i.status === 'Verified' || i.status === 'Partially Paid')
      .reduce((acc, i) => acc + (i.paidAmount || 0), 32000); // 32k base from settled historical

    const monthlySpendTrend = [
      { month: 'Feb 2026', spend: 42000, target: 45000, posCount: 8 },
      { month: 'Mar 2026', spend: 58000, target: 50000, posCount: 11 },
      { month: 'Apr 2026', spend: 39000, target: 45000, posCount: 7 },
      { month: 'May 2026', spend: 64000, target: 60000, posCount: 14 },
      { month: 'Jun 2026', spend: 51000, target: 55000, posCount: 10 },
      { month: 'Jul 2026', spend: totalSpend, target: 55000, posCount: orders.length }
    ];

    const categorySpend = [
      { category: 'Hardware & Raw Materials', amount: 27900, percentage: 38 },
      { category: 'IT & Software Services', amount: 48500, percentage: 42 },
      { category: 'Packaging & Materials', amount: 14200, percentage: 12 },
      { category: 'Facilities & Operations', amount: 6800, percentage: 8 }
    ];

    const vendorSpendList = vendors.map(v => {
      const vOrders = orders.filter(o => o.vendorId === v.id || o.vendorId === v.vendorId);
      const vSpend = vOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      return {
        vendorName: v.name,
        category: v.category,
        orderCount: vOrders.length,
        totalSpend: vSpend || (v.name.includes('CyberDynamics') ? 48500 : v.name.includes('Apex') ? 27900 : 14200),
        onTimeRate: `${v.onTimeDeliveryRate || 95}%`,
        score: v.score
      };
    });

    const avgOnTimeDelivery = 94.8;

    return {
      summary: {
        totalSpend,
        activeVendorsCount: vendors.filter(v => v.status === 'Approved').length,
        avgOnTimeDelivery: `${avgOnTimeDelivery}%`,
        totalPOProcessed: orders.length + 42
      },
      monthlySpendTrend,
      categorySpend,
      vendorSpendList
    };
  },

  exportReport: async (format = 'pdf') => {
    await delay(600);
    return {
      success: true,
      message: `Report successfully exported in ${format.toUpperCase()} format. File: ProcureHub_Analytics_${new Date().toISOString().split('T')[0]}.${format}`
    };
  }
};
