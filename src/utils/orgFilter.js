/**
 * Utility to strictly filter Purchase Orders, Invoices, Payments, and Reports per Organization
 */

export const isPOForOrganization = (po, user) => {
  if (!po) return false;
  if (!user || user.role !== 'manager') return true;

  const currentOrgId = (user.id || '').toLowerCase().trim();
  const currentCompName = (user.companyName || user.name || '').toLowerCase().trim();
  const currentUserName = (user.name || '').toLowerCase().trim();

  // 1. Check explicit organization fields if present
  const poOrgId = (po.organizationId || po.orgId || po.organization_id || '').toLowerCase().trim();
  const poOrgName = (po.organizationName || po.orgName || po.organization_name || '').toLowerCase().trim();

  if (poOrgId && currentOrgId) {
    return poOrgId === currentOrgId;
  }
  if (poOrgName && currentCompName) {
    return poOrgName === currentCompName;
  }

  // 2. Check history log array for matching org / manager / actor
  if (po.history && Array.isArray(po.history)) {
    const matchedHistory = po.history.some(h => {
      if (!h) return false;
      const hOrgId = (h.orgId || h.organizationId || '').toLowerCase();
      const hOrgName = (h.orgName || h.organizationName || '').toLowerCase();
      const actor = (h.actor || '').toLowerCase();

      if (hOrgId && currentOrgId && hOrgId === currentOrgId) return true;
      if (hOrgName && currentCompName && hOrgName === currentCompName) return true;

      // Check if actor contains company name or user name or org id
      if (currentCompName && actor.includes(currentCompName)) return true;
      if (currentUserName && actor.includes(currentUserName)) return true;
      if (currentOrgId && actor.includes(currentOrgId)) return true;

      return false;
    });

    if (matchedHistory) return true;
  }

  // 3. Check notes for tagged org string
  const notes = (po.notes || '').toLowerCase();
  if (currentOrgId && notes.includes(`org_id:${currentOrgId}`)) return true;
  if (currentCompName && notes.includes(`[org:${currentCompName}]`)) return true;

  // 4. Default Org fallback for seed POs:
  // If the logged-in user is the initial default manager (KEC International / Eleanor Vance / user_1),
  // show seed POs that do not explicitly belong to other newly registered organizations.
  const isInitialDefaultOrg = currentCompName.includes('kec') || currentUserName.includes('eleanor') || currentOrgId === 'user_1' || currentOrgId.startsWith('org_17865');
  if (isInitialDefaultOrg) {
    const belongsToOtherOrg = po.history && po.history.some(h => {
      const act = (h.actor || '').toLowerCase();
      return act.includes('tcs') || act.includes('abc');
    });
    return !belongsToOtherOrg;
  }

  return false;
};

export const filterInvoicesForOrganization = (invoices, pos, user) => {
  if (!invoices) return [];
  if (!user || user.role !== 'manager') return invoices;

  const poMap = new Map();
  if (pos) {
    pos.forEach(po => {
      poMap.set(po.id, po);
      if (po.poNumber || po.po_number) {
        poMap.set(po.poNumber || po.po_number, po);
      }
    });
  }

  return invoices.filter(inv => {
    const invOrgId = (inv.organizationId || inv.orgId || inv.organization_id || '').toLowerCase();
    const currentOrgId = (user.id || '').toLowerCase();
    if (invOrgId && currentOrgId && invOrgId === currentOrgId) return true;

    const matchedPO = poMap.get(inv.poId) || poMap.get(inv.poNumber) || poMap.get(inv.po_id) || poMap.get(inv.po_number);
    if (matchedPO) {
      return isPOForOrganization(matchedPO, user);
    }

    const isInitialDefaultOrg = (user.companyName || user.name || '').toLowerCase().includes('kec') || (user.name || '').toLowerCase().includes('eleanor');
    return isInitialDefaultOrg;
  });
};

export const filterPaymentsForOrganization = (payments, invoices, pos, user) => {
  if (!payments) return [];
  if (!user || user.role !== 'manager') return payments;

  const poMap = new Map();
  if (pos) {
    pos.forEach(po => {
      poMap.set(po.id, po);
      if (po.poNumber || po.po_number) {
        poMap.set(po.poNumber || po.po_number, po);
      }
    });
  }

  const invMap = new Map();
  if (invoices) {
    invoices.forEach(inv => {
      invMap.set(inv.id, inv);
      if (inv.invoiceNumber || inv.invoice_number) {
        invMap.set(inv.invoiceNumber || inv.invoice_number, inv);
      }
    });
  }

  return payments.filter(pmt => {
    const pmtOrgId = (pmt.organizationId || pmt.orgId || pmt.organization_id || '').toLowerCase();
    const currentOrgId = (user.id || '').toLowerCase();
    if (pmtOrgId && currentOrgId && pmtOrgId === currentOrgId) return true;

    const matchedPO = poMap.get(pmt.poId) || poMap.get(pmt.poNumber) || poMap.get(pmt.po_id) || pmt.po_number;
    if (matchedPO) {
      return isPOForOrganization(matchedPO, user);
    }

    const matchedInv = invMap.get(pmt.invoiceId) || invMap.get(pmt.invoiceNumber) || invMap.get(pmt.invoice_id) || pmt.invoice_number;
    if (matchedInv) {
      const invPO = poMap.get(matchedInv.poId) || poMap.get(matchedInv.poNumber);
      if (invPO) return isPOForOrganization(invPO, user);
    }

    const isInitialDefaultOrg = (user.companyName || user.name || '').toLowerCase().includes('kec') || (user.name || '').toLowerCase().includes('eleanor');
    return isInitialDefaultOrg;
  });
};
