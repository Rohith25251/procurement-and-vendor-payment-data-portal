import fs from 'fs';

function updateMasterFile(filePath, isOrg) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const entitySingular = isOrg ? 'org' : 'vendor';
  const entitySingularCap = isOrg ? 'Org' : 'Vendor';
  const entityPlural = isOrg ? 'organizations' : 'vendors';
  const setPlural = isOrg ? 'setOrganizations' : 'setVendors';
  const updateApiMethod = isOrg ? 'updateOrgStatus' : 'updateVendorStatus';

  // 1. Add handlers
  if (!content.includes('handleWarn')) {
    const targetHandlerRegex = new RegExp(`const handleCreate${entitySingularCap} = [\\s\\S]*?\\n  \\}`);
    content = content.replace(
      targetHandlerRegex,
      (match) => `${match}
  const handleApprove = async (id) => {
    const updated = await apiService.${updateApiMethod}(id, 'Approved')
    ${setPlural}(updated)
  }
  const handleWarn = async (id, reason) => {
    const updated = await apiService.${updateApiMethod}(id, 'Warned', reason)
    ${setPlural}(updated)
  }
  const handleRemove = async (id) => {
    const updated = await apiService.${updateApiMethod}(id, 'Deactivated')
    ${setPlural}(updated)
  }`
    );
  }

  // 2. DetailsViewModal call update
  const oldModalRegex = new RegExp(`<DetailsViewModal\\s+isOpen=\\{detailsModalOpen\\}\\s+onClose=\\(\\) => setDetailsModalOpen\\(false\\)\\s+data=\\{inspect${entitySingularCap}\\}\\s+type="${entitySingular}"\\s*\\/>`);
  const newModalCall = `<DetailsViewModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        data={inspect${entitySingularCap}}
        type="${entitySingular}"
        onApprove={handleApprove}
        onWarn={handleWarn}
        onRemove={handleRemove}
      />`;

  if (oldModalRegex.test(content)) {
    content = content.replace(oldModalRegex, newModalCall);
    console.log(`DetailsViewModal updated in ${filePath}`);
  } else {
    // try fallback for other spacing
    const oldModalRegex2 = new RegExp(`<DetailsViewModal\\s+isOpen=\\{detailsModalOpen\\}\\s+onClose=\\{.*?\\}\\s+data=\\{inspect${entitySingularCap}\\}\\s+type="${entitySingular}"\\s*\\/>`);
    if (oldModalRegex2.test(content)) {
      content = content.replace(oldModalRegex2, newModalCall);
      console.log(`DetailsViewModal (fallback) updated in ${filePath}`);
    } else {
      console.warn(`DetailsViewModal call match not found in ${filePath}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Updating OrganizationsMaster.jsx...");
updateMasterFile("D:\\procurement and vendor super admin\\src\\pages\\OrganizationsMaster.jsx", true);

console.log("Updating VendorsMaster.jsx...");
updateMasterFile("D:\\procurement and vendor super admin\\src\\pages\\VendorsMaster.jsx", false);
