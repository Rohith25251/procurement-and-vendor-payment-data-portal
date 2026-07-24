export const INITIAL_INVOICES = [
  {
    id: "inv_2001",
    invoiceNumber: "INV-APX-9901",
    poId: "po_1001",
    poNumber: "PO-2026-001",
    vendorId: "vnd_apex_01",
    vendorName: "Apex Metal Components Pvt Ltd",
    issueDate: "2026-07-14",
    dueDate: "2026-08-13",
    subtotal: 18500.00,
    taxAmount: 1850.00,
    totalAmount: 20350.00,
    currency: "USD",
    status: "Verified", // Submitted, Verified, Rejected, Partially Paid, Paid
    isDuplicateRisk: false,
    duplicateWarningReason: null,
    attachment: {
      fileName: "INV_APX_9901_ApexMetal.pdf",
      fileSize: "1.4 MB",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    items: [
      { description: "High-Strength Alloy Brackets (Grade A)", quantity: 250, unitPrice: 50.00, total: 12500.00 },
      { description: "Stainless Steel Fasteners Set (M8)", quantity: 120, unitPrice: 50.00, total: 6000.00 }
    ],
    rejectionReason: null,
    paidAmount: 10000.00,
    remainingBalance: 10350.00,
    submittedAt: "2026-07-14 04:20 PM",
    verifiedAt: "2026-07-16 01:15 PM",
    verifiedBy: "Marcus Brody"
  },
  {
    id: "inv_2002",
    invoiceNumber: "INV-CYB-5541",
    poId: "po_1003",
    poNumber: "PO-2026-003",
    vendorId: "vnd_cyber_02",
    vendorName: "CyberDynamics IT Solutions",
    issueDate: "2026-06-26",
    dueDate: "2026-06-26",
    subtotal: 32000.00,
    taxAmount: 0.00,
    totalAmount: 32000.00,
    currency: "USD",
    status: "Paid",
    isDuplicateRisk: false,
    duplicateWarningReason: null,
    attachment: {
      fileName: "CyberDynamics_Inv_5541.pdf",
      fileSize: "840 KB",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    items: [
      { description: "AWS Cloud Infrastructure Optimization", quantity: 1, unitPrice: 20000.00, total: 20000.00 },
      { description: "Penetration Testing & SOC2 Audit Support", quantity: 1, unitPrice: 12000.00, total: 12000.00 }
    ],
    rejectionReason: null,
    paidAmount: 32000.00,
    remainingBalance: 0.00,
    submittedAt: "2026-06-26 11:20 AM",
    verifiedAt: "2026-06-28 03:40 PM",
    verifiedBy: "Marcus Brody"
  },
  {
    id: "inv_2003",
    invoiceNumber: "INV-VNG-1102",
    poId: "po_1004",
    poNumber: "PO-2026-004",
    vendorId: "vnd_vanguard_05",
    vendorName: "Vanguard Sustainable Packaging",
    issueDate: "2026-07-21",
    dueDate: "2026-08-20",
    subtotal: 14200.00,
    taxAmount: 1420.00,
    totalAmount: 15620.00,
    currency: "USD",
    status: "Submitted", // Needs manager verification
    isDuplicateRisk: true,
    duplicateWarningReason: "Similar amount ($15,620.00) & vendor combo submitted within 7 days",
    attachment: {
      fileName: "Vanguard_Packaging_INV1102.pdf",
      fileSize: "2.1 MB",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    items: [
      { description: "Custom Printed Biodegradable Cartons (Large)", quantity: 5000, unitPrice: 2.20, total: 11000.00 },
      { description: "Recycled Thermal Filler Sheets (Packs)", quantity: 400, unitPrice: 8.00, total: 3200.00 }
    ],
    rejectionReason: null,
    paidAmount: 0.00,
    remainingBalance: 15620.00,
    submittedAt: "2026-07-21 02:15 PM",
    verifiedAt: null,
    verifiedBy: null
  },
  {
    id: "inv_2004",
    invoiceNumber: "INV-APX-9901-DUP",
    poId: "po_1001",
    poNumber: "PO-2026-001",
    vendorId: "vnd_apex_01",
    vendorName: "Apex Metal Components Pvt Ltd",
    issueDate: "2026-07-15",
    dueDate: "2026-08-14",
    subtotal: 18500.00,
    taxAmount: 1850.00,
    totalAmount: 20350.00,
    currency: "USD",
    status: "Rejected",
    isDuplicateRisk: true,
    duplicateWarningReason: "Exact match found with active Invoice #INV-APX-9901",
    attachment: {
      fileName: "INV_APX_9901_DuplicateCopy.pdf",
      fileSize: "1.4 MB",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    items: [
      { description: "High-Strength Alloy Brackets (Grade A)", quantity: 250, unitPrice: 50.00, total: 12500.00 }
    ],
    rejectionReason: "Duplicate invoice submission detected. Invoice #INV-APX-9901 is already verified.",
    paidAmount: 0.00,
    remainingBalance: 20350.00,
    submittedAt: "2026-07-15 09:10 AM",
    verifiedAt: null,
    verifiedBy: null
  }
];
