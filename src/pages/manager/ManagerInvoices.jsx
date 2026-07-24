import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../../api/invoiceApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  FileSpreadsheet, AlertTriangle, ShieldCheck, XCircle, FileText, Download, Eye, CheckCircle, Printer 
} from 'lucide-react';

export const ManagerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ open: false, invoiceId: null });

  const { showToast } = useToast();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
    } catch (err) {
      showToast('Failed to load invoice queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleVerify = async (id) => {
    try {
      await invoiceApi.verifyInvoice(id);
      showToast('Invoice verified & pushed to payment processing queue', 'success');
      loadInvoices();
    } catch (err) {
      showToast('Failed to verify invoice', 'error');
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await invoiceApi.rejectInvoice(rejectDialog.invoiceId, reason);
      showToast('Invoice rejected', 'warning');
      setRejectDialog({ open: false, invoiceId: null });
      loadInvoices();
    } catch (err) {
      showToast('Failed to reject invoice', 'error');
    }
  };

  const handleDownloadPDF = (invoice) => {
    // Generate synthetic printable PDF document
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
            .header { display: flex; justify-content: space-between; border-b: 2px solid #0369a3; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0369a3; }
            .meta { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #0369a3; color: white; text-align: left; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #0369a3; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 50px; border-t: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ProcureHub Tax Invoice</div>
              <p>Invoice #: <strong>${invoice.invoiceNumber}</strong></p>
              <p>PO Reference #: <strong>${invoice.poNumber}</strong></p>
            </div>
            <div style="text-align: right;">
              <h3>${invoice.vendorName}</h3>
              <p>Date: ${invoice.issueDate}</p>
              <p>Status: ${invoice.status}</p>
            </div>
          </div>

          <div class="meta">
            <div>
              <strong>Billed To:</strong><br/>
              ProcureHub Enterprise Portal<br/>
              Strategic Operations Center<br/>
              Chicago, IL 60607
            </div>
            <div>
              <strong>Vendor Details:</strong><br/>
              ${invoice.vendorName}<br/>
              Status: ${invoice.status}<br/>
              Submission Date: ${invoice.submittedAt || invoice.issueDate}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price ($)</th>
                <th style="text-align: right;">Total ($)</th>
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
            Total Claim Amount: $${Number(invoice.totalAmount).toLocaleString()} USD
          </div>

          <div class="footer">
            Generated via ProcureHub B2B Data Portal • Document Authenticated
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`Generating printable invoice PDF for ${invoice.invoiceNumber}`, 'info');
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const duplicateFlaggedCount = invoices.filter(i => i.isDuplicateRisk && i.status === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-primary-600" />
          Invoice Audit & Verification Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review vendor submitted claims, verify attachments, and download invoice documents</p>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateFlaggedCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Duplicate Submission Risk Detected ({duplicateFlaggedCount})</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              {duplicateFlaggedCount} invoice(s) share identical vendor numbers or invoice amounts. Exercise caution during verification.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by invoice #, PO #, vendor..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Submitted', 'Verified', 'Rejected', 'Partially Paid', 'Paid']}
      />

      {/* Invoice Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">Invoice # & PO</th>
                  <th className="py-3.5 px-6">Vendor Name</th>
                  <th className="py-3.5 px-6">Submitted Date</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Duplicate Risk?</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Ref: {inv.poNumber}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold">{inv.vendorName}</td>
                    <td className="py-4 px-6 text-slate-500">{inv.issueDate}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">${inv.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      {inv.isDuplicateRisk ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Flagged Risk
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">Clear</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
                          title="Download Printable PDF Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedInvoice(inv); setIsPreviewOpen(true); }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Preview Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status === 'Submitted' && (
                          <>
                            <button
                              onClick={() => handleVerify(inv.id)}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                            <button
                              onClick={() => setRejectDialog({ open: true, invoiceId: inv.id })}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
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

      {/* Invoice Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={`Invoice Details: ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            {selectedInvoice.isDuplicateRisk && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                ⚠️ Warning: {selectedInvoice.duplicateWarningReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-slate-400 font-semibold">Vendor:</p>
                <p className="font-bold text-slate-900">{selectedInvoice.vendorName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Associated PO:</p>
                <p className="font-bold text-slate-900">{selectedInvoice.poNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Invoice Total:</p>
                <p className="font-bold text-primary-600 text-sm">${selectedInvoice.totalAmount.toLocaleString()} USD</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Submission Date:</p>
                <p className="font-bold text-slate-900">{selectedInvoice.submittedAt}</p>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Claimed Line Items</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right font-bold">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Download Printable PDF
              </button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, invoiceId: null })}
        onConfirm={handleRejectConfirm}
        title="Reject Vendor Invoice"
        message="State the reason why this invoice claim is being rejected."
        requireReason={true}
        reasonPlaceholder="e.g. Line item pricing does not match original PO terms"
      />
    </div>
  );
};
