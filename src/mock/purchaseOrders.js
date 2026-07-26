export const INITIAL_PURCHASE_ORDERS = [
  {
    id: "po_1001",
    poNumber: "PO-2026-001",
    vendorId: "vnd_apex_01",
    vendorName: "Apex Metal Components Pvt Ltd",
    category: "Hardware & Raw Materials",
    status: "Delivered", // PO Status
    createdDate: "2026-07-02",
    approvedDate: "2026-07-03",
    sentDate: "2026-07-03",
    acceptedDate: "2026-07-04",
    deliveredDate: "2026-07-12",
    invoiceSubmittedDate: "2026-07-14",
    invoiceVerifiedDate: "2026-07-16",
    expectedDeliveryDate: "2026-07-15",
    paymentTerms: "Net 30",
    deliveryAddress: "Warehouse B, Gate 4, 120 Logistics Hub, Chicago IL",
    totalAmount: 18500.00,
    currency: "INR",
    notes: "High priority precision machined alloy brackets batch.",
    queryComment: null,
    rejectionReason: null,
    items: [
      { id: "item_1", name: "High-Strength Alloy Brackets (Grade A)", quantity: 250, unitPrice: 50.00, total: 12500.00 },
      { id: "item_2", name: "Stainless Steel Fasteners Set (M8)", quantity: 120, unitPrice: 50.00, total: 6000.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-07-02 10:15 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Approved", timestamp: "2026-07-03 02:30 PM", actor: "Eleanor Vance (Manager)" },
      { status: "Sent to Vendor", timestamp: "2026-07-03 03:00 PM", actor: "System" },
      { status: "Accepted", timestamp: "2026-07-04 09:10 AM", actor: "David Miller (Vendor)" },
      { status: "Delivered", timestamp: "2026-07-12 11:45 AM", actor: "David Miller (Vendor)" },
      { status: "Invoice Submitted", timestamp: "2026-07-14 04:20 PM", actor: "David Miller (Vendor)" },
      { status: "Invoice Verified", timestamp: "2026-07-16 01:15 PM", actor: "Eleanor Vance (Manager)" }
    ]
  },
  {
    id: "po_1002",
    poNumber: "PO-2026-002",
    vendorId: "vnd_apex_01",
    vendorName: "Apex Metal Components Pvt Ltd",
    category: "Hardware & Raw Materials",
    status: "Invoice Generated",
    createdDate: "2026-07-15",
    approvedDate: "2026-07-16",
    sentDate: "2026-07-16",
    acceptedDate: "2026-07-17",
    expectedDeliveryDate: "2026-07-28",
    paymentTerms: "Net 15",
    deliveryAddress: "Plant 1 Assembly Floor, Chicago IL",
    totalAmount: 9400.00,
    currency: "INR",
    notes: "Custom CNC milled casing units for Q3 production line.",
    queryComment: null,
    rejectionReason: null,
    items: [
      { id: "item_3", name: "CNC Aluminum Housing Units", quantity: 40, unitPrice: 235.00, total: 9400.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-07-15 09:00 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Approved", timestamp: "2026-07-16 11:00 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Sent to Vendor", timestamp: "2026-07-16 11:05 AM", actor: "System" },
      { status: "Accepted", timestamp: "2026-07-17 08:45 AM", actor: "David Miller (Vendor)" }
    ]
  },
  {
    id: "po_1003",
    poNumber: "PO-2026-003",
    vendorId: "vnd_cyber_02",
    vendorName: "CyberDynamics IT Solutions",
    category: "IT & Software Services",
    status: "Paid",
    createdDate: "2026-06-10",
    approvedDate: "2026-06-11",
    sentDate: "2026-06-11",
    acceptedDate: "2026-06-12",
    deliveredDate: "2026-06-25",
    invoiceSubmittedDate: "2026-06-26",
    invoiceVerifiedDate: "2026-06-28",
    paidDate: "2026-07-05",
    expectedDeliveryDate: "2026-06-30",
    paymentTerms: "Immediate",
    deliveryAddress: "HQ Server Room & Remote Access",
    totalAmount: 32000.00,
    currency: "INR",
    notes: "Enterprise cloud migration consulting & security audit Q2.",
    queryComment: null,
    rejectionReason: null,
    items: [
      { id: "item_4", name: "AWS Cloud Infrastructure Optimization", quantity: 1, unitPrice: 20000.00, total: 20000.00 },
      { id: "item_5", name: "Penetration Testing & SOC2 Audit Support", quantity: 1, unitPrice: 12000.00, total: 12000.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-06-10 02:00 PM", actor: "Eleanor Vance (Manager)" },
      { status: "Approved", timestamp: "2026-06-11 10:00 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Sent to Vendor", timestamp: "2026-06-11 10:05 AM", actor: "System" },
      { status: "Accepted", timestamp: "2026-06-12 09:30 AM", actor: "Sarah Jenkins (Vendor)" },
      { status: "Delivered", timestamp: "2026-06-25 05:00 PM", actor: "Sarah Jenkins (Vendor)" },
      { status: "Invoice Submitted", timestamp: "2026-06-26 11:20 AM", actor: "Sarah Jenkins (Vendor)" },
      { status: "Invoice Verified", timestamp: "2026-06-28 03:40 PM", actor: "Eleanor Vance (Manager)" },
      { status: "Paid", timestamp: "2026-07-05 10:00 AM", actor: "Eleanor Vance (Manager)" }
    ]
  },
  {
    id: "po_1004",
    poNumber: "PO-2026-004",
    vendorId: "vnd_vanguard_05",
    vendorName: "Vanguard Sustainable Packaging",
    category: "Packaging & Materials",
    status: "Out for Delivery",
    createdDate: "2026-07-05",
    approvedDate: "2026-07-06",
    sentDate: "2026-07-06",
    acceptedDate: "2026-07-07",
    deliveredDate: "2026-07-20",
    expectedDeliveryDate: "2026-07-22",
    paymentTerms: "Net 30",
    deliveryAddress: "Fulfillment Center, Bldg 3, Austin TX",
    totalAmount: 14200.00,
    currency: "INR",
    notes: "100% Recyclable heavy-duty corrugated shipping cartons.",
    queryComment: null,
    rejectionReason: null,
    items: [
      { id: "item_6", name: "Custom Printed Biodegradable Cartons (Large)", quantity: 5000, unitPrice: 2.20, total: 11000.00 },
      { id: "item_7", name: "Recycled Thermal Filler Sheets (Packs)", quantity: 400, unitPrice: 8.00, total: 3200.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-07-05 11:30 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Approved", timestamp: "2026-07-06 09:00 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Sent to Vendor", timestamp: "2026-07-06 09:05 AM", actor: "System" },
      { status: "Accepted", timestamp: "2026-07-07 10:15 AM", actor: "Emily Watson (Vendor)" },
      { status: "Delivered", timestamp: "2026-07-20 02:30 PM", actor: "Emily Watson (Vendor)" }
    ]
  },
  {
    id: "po_1005",
    poNumber: "PO-2026-005",
    vendorId: "vnd_bioclean_03",
    vendorName: "BioClean Environmental Services",
    category: "Facilities & Operations",
    status: "Invoice Requested",
    createdDate: "2026-07-22",
    expectedDeliveryDate: "2026-08-05",
    paymentTerms: "Net 30",
    deliveryAddress: "HQ Facility & Annex B, Austin TX",
    totalAmount: 6800.00,
    currency: "INR",
    notes: "Bi-annual hazardous material disposal & deep sanitation.",
    queryComment: null,
    rejectionReason: null,
    items: [
      { id: "item_8", name: "Chemical Waste Neutralization & Transport", quantity: 1, unitPrice: 6800.00, total: 6800.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-07-22 04:00 PM", actor: "Eleanor Vance (Manager)" }
    ]
  },
  {
    id: "po_1006",
    poNumber: "PO-2026-006",
    vendorId: "vnd_cyber_02",
    vendorName: "CyberDynamics IT Solutions",
    category: "IT & Software Services",
    status: "Invoice Requested",
    createdDate: "2026-07-18",
    approvedDate: "2026-07-19",
    sentDate: "2026-07-19",
    expectedDeliveryDate: "2026-08-10",
    paymentTerms: "Net 15",
    deliveryAddress: "Remote License Provisioning",
    totalAmount: 16500.00,
    currency: "INR",
    notes: "Quarterly seat upgrades for DevOps toolchain licenses.",
    queryComment: "Please clarify if this order includes 24/7 dedicated enterprise SLA support response times?",
    rejectionReason: null,
    items: [
      { id: "item_9", name: "Enterprise DevOps Toolchain Seat Expansion", quantity: 50, unitPrice: 330.00, total: 16500.00 }
    ],
    history: [
      { status: "Requested", timestamp: "2026-07-18 10:00 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Approved", timestamp: "2026-07-19 11:30 AM", actor: "Eleanor Vance (Manager)" },
      { status: "Sent to Vendor", timestamp: "2026-07-19 11:35 AM", actor: "System" },
      { status: "Query Raised", timestamp: "2026-07-20 09:45 AM", actor: "Sarah Jenkins (Vendor)" }
    ]
  }
];
