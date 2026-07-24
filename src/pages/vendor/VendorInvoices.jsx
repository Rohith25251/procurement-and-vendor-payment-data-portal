import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../../api/invoiceApi';
import { orderApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, Upload, Plus, AlertCircle, FileCheck, RefreshCw, CheckCircle2, Printer 
} from 'lucide-react';

export const VendorInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Submit Invoice Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    poId: '',
    invoiceNumber: '',
    subtotal: 0,
    taxAmount: 0,
    fileName: 'Apex_Official_Invoice.pdf'
  });

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [allInvoices, allOrders] = await Promise.all([
        invoiceApi.getInvoices(),
        orderApi.getOrders()
      ]);

      const myInvoices = allInvoices.filter(
        i => i.vendorId === user?.vendorId || i.vendorName.includes(user?.name) || i.vendorId === 'vnd_apex_01'
      );
      const myDeliveredOrders = allOrders.filter(
        o => (o.status === 'Delivered' || o.status === 'Accepted') && 
             (o.vendorId === user?.vendorId || o.vendorName.includes(user?.name) || o.vendorId === 'vnd_apex_01')
      );

      setInvoices(myInvoices);
      setDeliveredOrders(myDeliveredOrders);

      if (myDeliveredOrders.length > 0 && !invoiceForm.poId) {
        const po = myDeliveredOrders[0];
        setInvoiceForm(prev => ({
          ...prev,
          poId: po.id,
          invoiceNumber: `INV-${po.poNumber.replace('PO-', '')}-${Math.floor(100 + Math.random() * 900)}`,
          subtotal: po.totalAmount,
          taxAmount: Number((po.totalAmount * 0.10).toFixed(2))
        }));
      }
    } catch (err) {
      showToast('Failed to load invoice records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePOSelect = (poId) => {
    const po = deliveredOrders.find(o => o.id === poId);
    if (!po) return;
    setInvoiceForm({
      ...invoiceForm,
      poId: po.id,
      invoiceNumber: `INV-${po.poNumber.replace('PO-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      subtotal: po.totalAmount,
      taxAmount: Number((po.totalAmount * 0.10).toFixed(2))
    });
  };

  const handleDownloadPDF = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download invoice PDF', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice PDF - ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18a303; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #18a303; }
            .meta { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #18a303; color: white; text-align: left; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #18a303; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${invoice.vendorName}</div>
              <p>Official Tax Invoice #: <strong>${invoice.invoiceNumber}</strong></p>
              <p>Purchase Order Ref: <strong>${invoice.poNumber}</strong></p>
            </div>
            <div style="text-align: right;">
              <p>Date: ${invoice.issueDate}</p>
              <p>Status: ${invoice.status}</p>
            </div>
          </div>

          <div class="meta">
            <div>
              <strong>Issued By Vendor:</strong><br/>
              ${invoice.vendorName}<br/>
              Status: ${invoice.status}
            </div>
            <div>
              <strong>Billed To Customer:</strong><br/>
              ProcureHub Enterprise Portal<br/>
              Strategic Procurement Dept<br/>
              Chicago, IL 60607
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Claim Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price ($)</th>
                <th style="text-align: right;">Total Claim ($)</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map(i => `
                <tr>
                  <td>${i.description}</td>
                  <td style="text-align: center;">${i.quantity}</td>
                  <td style="text-align: right;">$${Number(i.unitPrice).toLocaleString()}</td>
                  <td style="text-align: right;">$${Number(i.total).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Total Invoiced Amount: $${Number(invoice.totalAmount).toLocaleString()} USD
          </div>

          <div class="footer">
            Vendor Invoice Document • Transmitted via ProcureHub B2B Network
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`Downloading invoice PDF for ${invoice.invoiceNumber}`, 'info');
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    const po = deliveredOrders.find(o => o.id === invoiceForm.poId);
    if (!po) {
      showToast('Select a valid delivered order', 'warning');
      return;
    }

    const totalAmount = Number(invoiceForm.subtotal) + Number(invoiceForm.taxAmount);

    try {
      await invoiceApi.submitInvoice({
        invoiceNumber: invoiceForm.invoiceNumber,
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        subtotal: Number(invoiceForm.subtotal),
        taxAmount: Number(invoiceForm.taxAmount),
        totalAmount,
        currency: 'USD',
        attachment: {
          fileName: invoiceForm.fileName || 'Invoice_Document.pdf',
          fileSize: '1.2 MB',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        },
        items: po.items ? po.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })) : []
      }, user?.name);

      showToast('Invoice submitted for manager verification!', 'success');
      setIsSubmitModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Invoice submission failed', 'error');
    }
  };

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Vendor Invoice Claims
          </h1>
          <p className="text-xs text-slate-500 mt-1">Submit invoice claims for delivered purchase orders and download invoice documents</p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-smooth flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Invoice</span>
        </button>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search invoice #, PO #..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Submitted', 'Verified', 'Rejected', 'Paid']}
      />

      {/* Invoices Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">PO Reference</th>
                  <th className="py-3.5 px-6">Submission Date</th>
                  <th className="py-3.5 px-6">Claim Total</th>
                  <th className="py-3.5 px-6">Status & Notes</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono">{inv.poNumber}</td>
                    <td className="py-4 px-6">{inv.issueDate}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">${inv.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <StatusBadge status={inv.status} />
                        {inv.status === 'Rejected' && inv.rejectionReason && (
                          <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg">
                            Reason: {inv.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="Download Printable PDF Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.status === 'Rejected' && (
                          <button
                            onClick={() => {
                              setInvoiceForm(prev => ({ ...prev, invoiceNumber: `${inv.invoiceNumber}-RESUB` }));
                              setIsSubmitModalOpen(true);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resubmit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Invoice Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Submit Invoice for Delivered Order">
        <form onSubmit={handleSubmitInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Delivered Order *</label>
            <select
              value={invoiceForm.poId}
              onChange={(e) => handlePOSelect(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
            >
              {deliveredOrders.map(po => (
                <option key={po.id} value={po.id}>{po.poNumber} — ${po.totalAmount.toLocaleString()} USD ({po.status})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                required
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Claim Subtotal ($) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={invoiceForm.subtotal}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>

          {/* File Attachment Dropzone Mock */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attach Tax Invoice PDF *</label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">Drag & drop your official invoice PDF here</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Attached file: {invoiceForm.fileName}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-right font-bold text-sm text-slate-900">
            Total Claim Amount: ${(Number(invoiceForm.subtotal) + Number(invoiceForm.taxAmount)).toLocaleString()} USD
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
              Submit Invoice Claim
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
