export const INITIAL_VENDORS = [
  {
    id: "vnd_apex_01",
    userId: "usr_vnd_1",
    name: "Apex Metal Components Pvt Ltd",
    code: "VND-APX-882",
    contactPerson: "David Miller",
    email: "vendor@techparts.com",
    phone: "+1 (555) 234-5678",
    category: "Hardware & Raw Materials",
    status: "Approved", // Approved, Pending, Rejected, Deactivated
    score: 94.5,
    onTimeDeliveryRate: 98.2,
    qualityRating: 4.8,
    gstin: "27AAACA12341Z5",
    pan: "AAACA1234A",
    address: "742 Industrial Parkway, Suite 400, Chicago, IL 60607",
    bankDetails: {
      accountName: "Apex Metal Components Pvt Ltd",
      accountNumber: "998877665544",
      bankName: "First Commercial Bank",
      ifscCode: "FCBK0001092",
      branch: "Downtown Chicago"
    },
    joinedDate: "2025-02-14",
    documents: [
      { id: "doc_1", name: "GST_Registration_Certificate.pdf", type: "Tax Document", uploadDate: "2025-02-14", status: "Verified" },
      { id: "doc_2", name: "ISO9001_Quality_Cert.pdf", type: "Compliance", uploadDate: "2025-02-15", status: "Verified" },
      { id: "doc_3", name: "Bank_Cancelled_Cheque.pdf", type: "Financial", uploadDate: "2025-02-14", status: "Verified" }
    ]
  },
  {
    id: "vnd_cyber_02",
    userId: "usr_vnd_2",
    name: "CyberDynamics IT Solutions",
    code: "VND-CYB-319",
    contactPerson: "Sarah Jenkins",
    email: "contact@cyberdynamics.io",
    phone: "+1 (555) 876-5432",
    category: "IT & Software Services",
    status: "Approved",
    score: 89.0,
    onTimeDeliveryRate: 92.5,
    qualityRating: 4.5,
    gstin: "29BBBCB56782Z9",
    pan: "BBBCB5678B",
    address: "100 Technology Plaza, 12th Floor, San Jose, CA 95110",
    bankDetails: {
      accountName: "CyberDynamics IT Solutions Inc",
      accountNumber: "112233445566",
      bankName: "Silicon Valley Tech Bank",
      ifscCode: "SVTB0008812",
      branch: "San Jose Main"
    },
    joinedDate: "2025-04-10",
    documents: [
      { id: "doc_4", name: "MSA_Agreement_Signed.pdf", type: "Contract", uploadDate: "2025-04-10", status: "Verified" },
      { id: "doc_5", name: "SOC2_Type_II_Report.pdf", type: "Security", uploadDate: "2025-04-11", status: "Verified" }
    ]
  },
  {
    id: "vnd_bioclean_03",
    userId: "usr_vnd_3",
    name: "BioClean Environmental Services",
    code: "VND-BIO-104",
    contactPerson: "Michael Zhang",
    email: "sales@biocleanlogistics.com",
    phone: "+1 (555) 345-6789",
    category: "Facilities & Operations",
    status: "Approved",
    score: 91.2,
    onTimeDeliveryRate: 95.0,
    qualityRating: 4.6,
    gstin: "07CCCCA90123Z1",
    pan: "CCCCA9012C",
    address: "45 Eco Way, Industrial Park West, Austin, TX 78701",
    bankDetails: {
      accountName: "BioClean Services LLC",
      accountNumber: "554433221100",
      bankName: "Austin National Trust",
      ifscCode: "ANTB0004432",
      branch: "Austin Central"
    },
    joinedDate: "2025-06-01",
    documents: [
      { id: "doc_6", name: "EPA_Hazardous_Waste_License.pdf", type: "License", uploadDate: "2025-06-01", status: "Verified" }
    ]
  },
  {
    id: "vnd_global_04",
    userId: "usr_vnd_4",
    name: "Global Freight & Logistics Inc",
    code: "VND-GFL-670",
    contactPerson: "Robert Thorne",
    email: "dispatch@globalfreight.com",
    phone: "+1 (555) 456-7890",
    category: "Logistics & Transport",
    status: "Pending", // Onboarding pending manager approval
    score: 82.0,
    onTimeDeliveryRate: 88.0,
    qualityRating: 4.1,
    gstin: "33DDDD998811Z2",
    pan: "DDDD9988D",
    address: "88 Logistics Boulevard, Port Area, Newark, NJ 07102",
    bankDetails: {
      accountName: "Global Freight & Logistics Inc",
      accountNumber: "776655443322",
      bankName: "Merchants & Freight Bank",
      ifscCode: "MFBK0005511",
      branch: "Newark Port"
    },
    joinedDate: "2026-07-15",
    documents: [
      { id: "doc_7", name: "DOT_Carrier_Permit.pdf", type: "Permit", uploadDate: "2026-07-15", status: "Pending Review" },
      { id: "doc_8", name: "Insurance_Certificate_2026.pdf", type: "Insurance", uploadDate: "2026-07-15", status: "Pending Review" }
    ]
  },
  {
    id: "vnd_vanguard_05",
    userId: "usr_vnd_5",
    name: "Vanguard Sustainable Packaging",
    code: "VND-VNG-441",
    contactPerson: "Emily Watson",
    email: "info@vanguardpack.com",
    phone: "+1 (555) 678-9012",
    category: "Packaging & Materials",
    status: "Approved",
    score: 96.8,
    onTimeDeliveryRate: 99.1,
    qualityRating: 4.9,
    gstin: "19EEEE554433Z4",
    pan: "EEEE5544E",
    address: "210 Eco Park Drive, Seattle, WA 98101",
    bankDetails: {
      accountName: "Vanguard Packaging Corp",
      accountNumber: "443322119988",
      bankName: "Pacific Heritage Bank",
      ifscCode: "PHBK0003322",
      branch: "Seattle Downtown"
    },
    joinedDate: "2025-01-20",
    documents: [
      { id: "doc_9", name: "FSC_Recycled_Material_Cert.pdf", type: "Compliance", uploadDate: "2025-01-20", status: "Verified" }
    ]
  }
];
