export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif_1",
    recipientRole: "manager",
    title: "New Vendor Registration",
    message: "Global Freight & Logistics Inc submitted a registration request.",
    timestamp: "2026-07-24 10:30 AM",
    read: false,
    type: "vendor_onboarding",
    link: "/manager/vendors"
  },
  {
    id: "notif_2",
    recipientRole: "manager",
    title: "Duplicate Invoice Alert",
    message: "Invoice INV-VNG-1102 flagged for potential duplicate risk.",
    timestamp: "2026-07-24 09:15 AM",
    read: false,
    type: "invoice_status",
    link: "/manager/invoices"
  },
  {
    id: "notif_3",
    recipientRole: "vendor",
    vendorId: "vnd_apex_01",
    title: "Partial Payment Received",
    message: "Manager processed payment of $10,000.00 for INV-APX-9901.",
    timestamp: "2026-07-18 04:00 PM",
    read: false,
    type: "payment_status",
    link: "/vendor/payments"
  },
  {
    id: "notif_4",
    recipientRole: "vendor",
    vendorId: "vnd_apex_01",
    title: "Invoice Verified",
    message: "Your invoice INV-APX-9901 for PO-2026-001 has been verified.",
    timestamp: "2026-07-16 01:15 PM",
    read: true,
    type: "invoice_status",
    link: "/vendor/invoices"
  },
  {
    id: "notif_5",
    recipientRole: "manager",
    title: "Vendor Query Raised",
    message: "CyberDynamics IT Solutions raised a query on PO-2026-006.",
    timestamp: "2026-07-20 09:45 AM",
    read: true,
    type: "po_status",
    link: "/manager/procurement"
  }
];
