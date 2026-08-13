import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import { paymentApi } from '../../api/paymentApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  FileSpreadsheet, AlertTriangle, ShieldCheck, XCircle, FileText, Download, Eye, CheckCircle, Printer, CreditCard 
} from 'lucide-react';

export const ManagerInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ open: false, invoiceId: null });

  // Payment Processing Modal State
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountToPay: 0,
    paymentMethod: 'ACH Direct Deposit',
    referenceNumber: '',
    notes: ''
  });

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
      showToast('Invoice accepted & queued for payment processing', 'success');
      loadInvoices();
    } catch (_err) {
      showToast('Failed to accept invoice', 'error');
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

  const openProcessPaymentModal = (invoice) => {
    setSelectedInvoiceForPay(invoice);
    const defaultAmount = invoice.remainingBalance > 0 ? invoice.remainingBalance : invoice.totalAmount;
    setPaymentForm({
      amountToPay: defaultAmount,
      paymentMethod: 'ACH Direct Deposit',
      referenceNumber: `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: ''
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    if (Number(paymentForm.amountToPay) <= 0) {
      showToast('Please enter a valid payment amount', 'warning');
      return;
    }

    try {
      await paymentApi.processPayment({
        invoiceId: selectedInvoiceForPay.id,
        amountPaid: Number(paymentForm.amountToPay),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      });

      showToast(`Payment of ₹${Number(paymentForm.amountToPay).toLocaleString('en-IN')} processed successfully!`, 'success');
      setIsProcessModalOpen(false);
      setSelectedInvoiceForPay(null);
      loadInvoices();
    } catch (err) {
      showToast('Payment processing failed', 'error');
    }
  };

  const handleDownloadPDF = (invoice) => {
    // 1. Create a styled clone of the invoice mockup off-screen
    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.width = '750px';
    element.style.background = 'white';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#1e293b';
    element.style.lineHeight = '1.5';

    element.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0369a3; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h3 style="font-size: 24px; font-weight: bold; color: #0369a3; margin: 0;">ProcureHub Tax Invoice</h3>
          <p style="margin: 5px 0 0 0; font-size: 13px;">Invoice #: <strong>${invoice.invoiceNumber}</strong></p>
          <p style="margin: 3px 0 0 0; font-size: 13px;">PO Reference #: <strong>${invoice.poNumber}</strong></p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #94a3b8;">Status:</span>
          <span style="display: inline-block; font-weight: bold; color: #0369a3; margin-left: 5px; font-size: 13px;">${invoice.status}</span>
          <p style="margin: 8px 0 0 0; font-size: 13px;">Date: <strong>${invoice.issueDate || invoice.submittedAt || ''}</strong></p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <div>
          <strong style="color: #94a3b8; text-transform: uppercase; font-size: 10px;">Billed To:</strong>
          <p style="font-weight: bold; color: #334155; margin: 5px 0 0 0; font-size: 13px;">ProcureHub Enterprise Portal</p>
          <p style="color: #64748b; margin: 2px 0 0 0; font-size: 12px;">Strategic Operations Center</p>
          <p style="color: #64748b; margin: 2px 0 0 0; font-size: 12px;">Chicago, IL 60607</p>
        </div>
        <div>
          <strong style="color: #94a3b8; text-transform: uppercase; font-size: 10px;">Vendor Details:</strong>
          <p style="font-weight: bold; color: #334155; margin: 5px 0 0 0; font-size: 13px;">${invoice.vendorName}</p>
          <p style="color: #64748b; margin: 2px 0 0 0; font-size: 12px;">Submission Date: ${invoice.submittedAt || invoice.issueDate}</p>
          ${invoice.vendorGstin ? `<p style="color: #64748b; margin: 2px 0 0 0; font-size: 12px; font-family: monospace;">GSTIN: <strong>${invoice.vendorGstin}</strong></p>` : ''}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #0369a3; color: white; font-weight: bold; font-size: 12px;">
            <th style="padding: 10px; text-align: left;">Description</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Unit Price (₹)</th>
            <th style="padding: 10px; text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody style="font-size: 13px; color: #475569;">
          ${(invoice.items || []).map(i => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; color: #0f172a; font-weight: bold;">${i.description || i.name}</td>
              <td style="padding: 10px; text-align: center;">${i.quantity}</td>
              <td style="padding: 10px; text-align: right;">₹${Number(i.unitPrice).toLocaleString('en-IN')}</td>
              <td style="padding: 10px; text-align: right; color: #0f172a; font-weight: bold;">₹${Number(i.total || (i.quantity * i.unitPrice)).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 18px; font-weight: bold; color: #0369a3; margin-bottom: 30px;">
        Total Claim Amount: ₹${invoice.totalAmount.toLocaleString('en-IN')} INR
      </div>

      <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        Generated via ProcureHub B2B Data Portal • Document Authenticated
      </div>
    `;

    document.body.appendChild(element);

    const opt = {
      margin:       0.5,
      filename:     `Invoice_${invoice.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const loadAndPrint = () => {
      window.html2pdf().from(element).set(opt).save().then(() => {
        document.body.removeChild(element);
        showToast(`Invoice ${invoice.invoiceNumber}.pdf downloaded successfully.`, 'success');
      }).catch(err => {
        console.error("PDF generation failed", err);
        document.body.removeChild(element);
        showToast("PDF generation failed", "error");
      });
    };

    if (window.html2pdf) {
      loadAndPrint();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = loadAndPrint;
      document.body.appendChild(script);
    }
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
                    <td className="py-4 px-6 font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
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
                        {['Submitted', 'Verified', 'Partially Paid'].includes(inv.status) && (
                          <button
                            onClick={() => openProcessPaymentModal(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-xs"
                            title="Process payment for this invoice"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Process Payment</span>
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

      {/* Invoice Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={`Invoice Details: ${selectedInvoice?.invoiceNumber}`} maxWidth="max-w-3xl">
        {selectedInvoice && (
          <div className="space-y-6 text-xs">
            {selectedInvoice.isDuplicateRisk && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                ⚠️ Warning: {selectedInvoice.duplicateWarningReason}
              </div>
            )}

            {/* Real paper-styled Invoice Mockup */}
            <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-2xl shadow-sm max-w-2xl mx-auto space-y-6 font-sans">
              <div className="flex justify-between items-start pb-5 border-b-2 border-primary-600">
                <div>
                  <h3 className="text-xl font-extrabold text-primary-700">ProcureHub Tax Invoice</h3>
                  <p className="text-slate-500 mt-1">Invoice #: <strong className="text-slate-900">{selectedInvoice.invoiceNumber}</strong></p>
                  <p className="text-slate-500">PO Reference #: <strong className="text-slate-900">{selectedInvoice.poNumber}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <div className="mt-1"><StatusBadge status={selectedInvoice.status} /></div>
                  <p className="text-slate-500 mt-2">Date: <strong className="text-slate-900">{selectedInvoice.issueDate || selectedInvoice.submittedAt || ''}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl">
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider text-[10px]">Billed To:</strong>
                  <p className="font-bold text-slate-800 mt-1">ProcureHub Enterprise Portal</p>
                  <p className="text-slate-500">Strategic Operations Center</p>
                  <p className="text-slate-500">Chicago, IL 60607</p>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase tracking-wider text-[10px]">Vendor Details:</strong>
                  <p className="font-bold text-slate-800 mt-1">{selectedInvoice.vendorName}</p>
                  <p className="text-slate-500">Submission Date: {selectedInvoice.submittedAt || selectedInvoice.issueDate}</p>
                  {selectedInvoice.vendorGstin && (
                    <p className="text-slate-500 mt-1 font-mono">GSTIN: <strong className="text-slate-700">{selectedInvoice.vendorGstin}</strong></p>
                  )}
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary-600 text-white font-extrabold text-[11px]">
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price (₹)</th>
                      <th className="p-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-900">{item.description || item.name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-slate-900">₹{Number(item.total || (item.quantity * item.unitPrice)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right text-lg font-extrabold text-primary-700">
                Total Claim Amount: ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} INR
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                Generated via ProcureHub B2B Data Portal • Document Authenticated
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Download Printable Copy
                </button>
                {['Submitted', 'Verified', 'Partially Paid'].includes(selectedInvoice.status) && (
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openProcessPaymentModal(selectedInvoice);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" /> Process Payment
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Process Payment Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => { setIsProcessModalOpen(false); setSelectedInvoiceForPay(null); }}
        title={`Process Payment: ${selectedInvoiceForPay?.invoiceNumber || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedInvoiceForPay && (
          <form onSubmit={handleProcessSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span>Vendor: <strong className="text-slate-800">{selectedInvoiceForPay.vendorName}</strong></span>
                <span>PO Ref: <strong className="text-slate-800">{selectedInvoiceForPay.poNumber}</strong></span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span>Total Invoice: <strong>₹{selectedInvoiceForPay.totalAmount?.toLocaleString('en-IN')}</strong></span>
                <span>Remaining: <strong className="text-emerald-700">₹{(selectedInvoiceForPay.remainingBalance || selectedInvoiceForPay.totalAmount)?.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount to Pay (₹ INR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={paymentForm.amountToPay}
                onChange={e => setPaymentForm({ ...paymentForm, amountToPay: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-emerald-700 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value="ACH Direct Deposit">ACH Direct Deposit</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="UPI / NetBanking">UPI / NetBanking</option>
                <option value="Corporate Credit Card">Corporate Credit Card</option>
                <option value="Direct Transfer">Direct Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / Transaction # *</label>
              <input
                type="text"
                required
                value={paymentForm.referenceNumber}
                onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Notes / Remark</label>
              <textarea
                rows={2}
                value={paymentForm.notes}
                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => { setIsProcessModalOpen(false); setSelectedInvoiceForPay(null); }}
                className="px-4 py-2 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Submit Payment</span>
              </button>
            </div>
          </form>
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
