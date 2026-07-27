import React, { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Modal } from '../common/Modal';
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  ScanLine, Building2, IndianRupee, Calendar,
  Hash, Package, X, RotateCcw, ChevronDown, Phone,
  Mail, MapPin, Tag, User, Info, ShieldCheck, Plus
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE-BASED PDF PARSER
// Works for ANY invoice: Amazon, Flipkart, GST, Tally, QuickBooks, etc.
// ─────────────────────────────────────────────────────────────────────────────

function parseNum(s) {
  if (!s) return NaN;
  return parseFloat(String(s).replace(/[^\d.]/g, ''));
}

function isPrice(s) {
  const clean = s.trim().replace(/^(?:₹|Rs\.?|INR)\s*/i, '').replace(/,/g, '');
  return /^\d+(?:\.\d{1,2})?$/.test(clean);
}

/**
 * Extract all text items from ALL pages with their page-normalized coordinates.
 * Returns: Array of { x, y, w, h, str, page }
 */
async function extractAllItems(pdf) {
  const allItems = [];
  for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const vp = page.getViewport({ scale: 1 });
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      // pdf.js: transform[4]=x, transform[5]=y (from bottom-left)
      // Convert to top-left coords (y = pageHeight - pdfY)
      allItems.push({
        x: it.transform[4],
        y: vp.height - it.transform[5],
        w: it.width,
        h: it.height || 10,
        str: it.str.trim(),
        page: p
      });
    }
  }
  return allItems;
}

/**
 * Group items into logical rows (items within 4pt vertical tolerance = same row).
 * Returns: Array of Row where Row = sorted array of items by x
 */
function groupIntoRows(items) {
  const rows = [];
  // Sort by page then y (top-to-bottom)
  const sorted = [...items].sort((a, b) => a.page - b.page || a.y - b.y);
  for (const item of sorted) {
    let placed = false;
    for (const row of rows) {
      // Increased tolerance to 12px to handle multi-column invoice layouts
      if (row[0].page === item.page && Math.abs(row[0].y - item.y) <= 12) {
        row.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([item]);
  }
  // Sort each row left to right
  for (const row of rows) row.sort((a, b) => a.x - b.x);
  return rows;
}

/**
 * Reconstruct plain text. Items in same row separated by '  ' (2 spaces) so
 * regex patterns using \s{2,} match correctly. Rows separated by newline.
 */
function rowsToText(rows) {
  return rows.map(row => row.map(it => it.str).join('  ')).join('\n');
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractInvoiceNumber(rows, rawText) {
  // Try raw text patterns first
  const patterns = [
    /invoice\s*(?:no|number|#|num|id)\s*[:\s#.]*([A-Z0-9\-\/]{3,25})/i,
    /(?:^|\n|\t)\s*(?:IN|INV|BILL|TAX)[:\s#\-\.]*([A-Z0-9\-\/]{3,25})/im,
    /order\s*(?:id|number|no)\s*[:\s.#]*([A-Z0-9\-]{4,25})/i,
    /bill\s*(?:no|number|#)\s*[:\s.#]*([A-Z0-9\-\/]{3,25})/i,
    /(?:^|\n|\t)\s*([A-Z]{2,4}-?[0-9]{4,})/m,
  ];
  for (const p of patterns) {
    const m = rawText.match(p);
    if (m && m[1] && m[1].length >= 3 && !/^\d{4}$/.test(m[1])) {
      return m[1].trim().toUpperCase();
    }
  }
  return `INV-OCR-${Date.now().toString().slice(-6)}`;
}

function extractDate(rawText) {
  const patterns = [
    /(?:invoice\s*date|date\s*of\s*issue|bill\s*date|order\s*date|dated?)\s*[:\s,]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:invoice\s*date|date\s*of\s*issue|bill\s*date)\s*[:\s,]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = rawText.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return new Date().toLocaleDateString('en-IN');
}

function extractTotalAmount(rawText) {
  const named = [
    /(?:grand\s*total|total\s*payable|amount\s*payable|net\s*payable|total\s*amount\s*due|amount\s*due|order\s*total|net\s*amount)\s*[:\s₹Rs.INR,]*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:total\s*\(incl[^)]*\)|total\s*incl)\s*[:\s₹Rs.INR,]*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];
  for (const p of named) {
    const m = rawText.match(p);
    if (m && m[1]) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0) return n;
    }
  }
  // Collect all amounts, return largest
  const all = [];
  const re = /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi;
  let m;
  while ((m = re.exec(rawText)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) all.push(n);
  }
  return all.length ? Math.max(...all) : 0;
}

/**
 * Vendor name extractor — item-level coordinate search.
 * Finds the exact "Sold By" text item, then grabs the next meaningful item
 * on the SAME row or the FIRST item on the NEXT ROW at a similar X position.
 * This handles Amazon's two-column layout (Sold By | Ship To on same row).
 */
function extractVendorName(rows, rawText) {
  const LABELS = /^(?:sold\s*by|seller(?:\s*name)?|supplier(?:\s*name)?|vendor(?:\s*name)?|issued\s*by|billed\s*by)\s*:?\s*$/i;
  const NOISE  = /(?:address|phone|email|gst|tax|invoice|pincode|www\.|@|floor|road|street|nagar|city|district|\d{6}|business\s*eligible|offer|amazon\.in|flipkart)/i;
  const cleanCandidate = s => s.split(/[,\t]/)[0].replace(/[*|]/g, '').trim();

  // ── Strategy A: item-level search ──────────────────────────────────
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      const item = row[ci];
      // Check if THIS item is a "Sold By" label
      if (!LABELS.test(item.str.trim())) continue;

      // Found label — try next item on SAME ROW first (inline format)
      for (let ni = ci + 1; ni < row.length; ni++) {
        const candidate = cleanCandidate(row[ni].str);
        if (candidate.length >= 2 && !NOISE.test(candidate) && !/^\d/.test(candidate)) {
          return candidate.slice(0, 70);
        }
      }

      // Then try next rows: find item at similar X position
      const labelX = item.x;
      for (let nri = ri + 1; nri <= ri + 4 && nri < rows.length; nri++) {
        const nextRow = rows[nri];
        // Find item closest in X to the label
        const near = nextRow
          .filter(it => Math.abs(it.x - labelX) < 120)
          .sort((a, b) => Math.abs(a.x - labelX) - Math.abs(b.x - labelX))[0];
        if (near) {
          const candidate = cleanCandidate(near.str);
          if (candidate.length >= 2 && !NOISE.test(candidate) && !/^\d/.test(candidate)) {
            return candidate.slice(0, 70);
          }
        }
      }
    }
  }

  // ── Strategy B: regex on reconstructed text ──────────────────────────
  const textPatterns = [
    /(?:sold\s*by|seller(?:\s*name)?|supplier(?:\s*name)?)\s*[:\s]*[\n\t]\s*([^\n\t,]{3,60})/i,
    /(?:sold\s*by|seller(?:\s*name)?|supplier(?:\s*name)?)\s*:\s*([^\n\t,]{3,60})/i,
    /^([A-Z][A-Za-z0-9\s&.,'-]{4,60}?)\s*(?:Pvt\.?\s*Ltd\.?|Limited|Inc\.?|LLP|Co\.|Solutions|Enterprises|Traders|Technologies|Industries)/m,
  ];
  for (const p of textPatterns) {
    const m = rawText.match(p);
    if (m && m[1]) {
      const candidate = cleanCandidate(m[1]);
      if (!NOISE.test(candidate) && candidate.length >= 3) return candidate;
    }
  }

  // ── Strategy C: top lines scan ──────────────────────────────────
  const topLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length >= 4).slice(0, 20);
  for (const line of topLines) {
    const first = line.split(/[\t,]/)[0].trim();
    if (/^[A-Z]/.test(first) && first.length >= 4 && first.length < 70
        && !NOISE.test(first)
        && !/invoice|order|bill|tax|date|page|number|address|gst|\d{4}|amazon|flipkart|eligible|offer|business|total|qty|description|particulars/i.test(first)) {
      return first;
    }
  }
  return '';
}

function extractGSTIN(rawText) {
  const m = rawText.match(/(?:GSTIN|GST\s*(?:No|Number|Reg)[.:#]?)[\s:]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3})/i);
  if (m) return m[1];
  const all = rawText.match(/([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3})/g);
  return all ? all[0] : '';
}

function extractPONumber(rawText) {
  const m = rawText.match(/(?:PO|purchase\s*order|order)\s*(?:no|number|#|ref)\s*[:\s#]*([A-Z0-9\-\/]{4,20})/i);
  return m ? m[1].trim().toUpperCase() : '';
}

// ─── LINE ITEM EXTRACTOR (coordinate-based, format-agnostic) ─────────────────

/**
 * Find invoice line items using coordinate-based table detection.
 * Works for ANY invoice format by:
 * 1. Finding the table header row (Description/Particulars/Item + Qty + Price + Amount)
 * 2. Finding the table end (Total/Grand Total)
 * 3. Parsing rows between header and end
 */
function extractLineItems(rows, rawText) {
  // Strip trailing punctuation before matching labels
  const normalizeDesc = s => s.trim().replace(/[:\s]+$/, '').replace(/^[\d.):]+\s*/, '').trim();

  const SKIP_LABELS = /^(?:s\.?l\.?\s*no\.?|sl\s*no|description|particulars|hsn|sac|qty|quantity|unit\s*price|rate|amount|net\s*amount|total|sub\s*total|sub-total|grand\s*total|tax\s*amount|tax|gst|cgst|sgst|igst|discount|round\s*off|subtotal|grand|shipping|delivery|freight|item|sr\.?\s*no|no\.|terms|notes|bank|authorized|signatory|thank|page|invoice|bill|date|address|gstin|pan|cin|mobile|email|website|rupee|inr|balance|payable|vat|cess|surcharge|adjustment)$/i;

  const SKIP_DESC = str => SKIP_LABELS.test(normalizeDesc(str));

  // Detect junk descriptions: UPI IDs, transaction hashes, random alphanumeric
  const isJunk = str => {
    const s = str.trim();
    if (s.length > 30 && !/ /.test(s)) return true; // long string with no spaces = hash/ID
    if (/^[a-z0-9]{20,}$/i.test(s)) return true; // pure alphanumeric > 20 chars = transaction ID
    if (/upi|transaction|txn|ref|neft|imps|rtgs|payment\s*id|vpa|@/i.test(s) && s.length > 15) return true;
    if (/^[0-9a-f]{8,}$/i.test(s)) return true; // hex hash
    return false;
  };

  const items = [];
  // ── Helpers ────────────────────────────────────────────────────────────────

  // Parse Amazon's embedded price string: "₹846.61  1  ₹846.61  18% IGST"
  // Returns { unitPrice, qty, total, taxRate, taxType } or null
  const parseAmazonMixedString = str => {
    // Pattern: ₹amount  qty  ₹amount  percentage% TYPE
    const m = str.match(/(?:₹|Rs\.?)\s*([\d,]+\.\d+)\s+(\d+)\s+(?:₹|Rs\.?)\s*([\d,]+\.\d+)\s+(\d+(?:\.\d+)?)\s*%\s*(IGST|CGST|SGST|GST|VAT)?/i);
    if (m) {
      return {
        unitPrice: parseFloat(m[1].replace(/,/g, '')),
        qty:       parseInt(m[2]),
        total:     parseFloat(m[3].replace(/,/g, '')),
        taxRate:   parseFloat(m[4]),
        taxType:   m[5] || 'GST',
      };
    }
    // Simpler pattern: ₹amount  ₹amount  percentage%
    const m2 = str.match(/(?:₹|Rs\.?)\s*([\d,]+\.\d+)\s+(?:₹|Rs\.?)\s*([\d,]+\.\d+)\s+(\d+(?:\.\d+)?)\s*%/i);
    if (m2) {
      return {
        unitPrice: parseFloat(m2[1].replace(/,/g, '')),
        qty:       1,
        total:     parseFloat(m2[2].replace(/,/g, '')),
        taxRate:   parseFloat(m2[3]),
        taxType:   'GST',
      };
    }
    return null;
  };

  // Extract tax rate from text — returns numeric rate (default 18 if GST/IGST mentioned)
  const extractTaxRate = str => {
    const m = str.match(/(\d+(?:\.\d+)?)\s*%\s*(?:IGST|CGST|SGST|GST|VAT|CESS)?/i);
    if (m) return parseFloat(m[1]);
    if (/\b(?:IGST|CGST|SGST|GST)\b/i.test(str)) return 18; // default GST rate
    return 0;
  };

  // Compute GST-inclusive tax amount: tax = total × rate / (100 + rate)
  const computeTaxAmount = (total, rate) =>
    rate > 0 ? Math.round(total * rate / (100 + rate) * 100) / 100 : 0;

  // Extract all ₹XX.XX amounts embedded in any string
  // (handles Amazon's multi-value strings like "₹846.61  1  ₹846.61  18% IGST")
  const extractEmbeddedPrices = str => {
    const prices = [];
    const re = /(?:₹|Rs\.?)\s*([\d,]+\.\d{1,2})/gi;
    let m;
    while ((m = re.exec(str)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0 && n < 100_000_000) prices.push(n);
    }
    // Also grab bare numbers ≥ 10 with 2 decimal places (e.g. "846.61")
    const re2 = /\b(\d{2,7}\.\d{2})\b/g;
    while ((m = re2.exec(str)) !== null) {
      const n = parseFloat(m[1]);
      if (!isNaN(n) && n > 0 && n < 100_000_000 && !prices.includes(n)) prices.push(n);
    }
    return prices;
  };

  // Get all prices from a set of row items — uses direct isPrice() first,
  // falls back to extractEmbeddedPrices for long mixed strings
  const getNumsFromRowItems = rowItems => {
    const all = [];
    for (const it of rowItems) {
      const clean = it.str.replace(/,/g, '');
      if (isPrice(clean)) {
        const v = parseFloat(clean.replace(/[^\d.]/g, ''));
        if (!isNaN(v) && v > 0) all.push({ x: it.x, val: v });
      } else {
        // Item is too long for isPrice — scan it for embedded amounts
        const embedded = extractEmbeddedPrices(it.str);
        for (const v of embedded) all.push({ x: it.x, val: v });
      }
    }
    return all.filter(n => !isNaN(n.val) && n.val > 0);
  };

  // Build description from row items, cleaning embedded price strings
  const getDescFromRowItems = rowItems => {
    const parts = [];
    for (const it of rowItems) {
      const clean = it.str.replace(/,/g, '');
      if (isPrice(clean)) continue; // skip pure price items
      if (/^\d+$/.test(it.str)) continue; // skip pure integers (S.No, qty)
      // If item contains embedded prices (mixed Amazon string), clean it
      const hasPriceEmbed = /(?:₹|Rs\.?)\s*[\d,]+\.\d{2}/i.test(it.str);
      const text = hasPriceEmbed ? cleanDesc(it.str) : it.str;
      if (text.length > 1 && !SKIP_DESC(text) && !isJunk(text)) parts.push(text);
    }
    return parts.join(' ').trim();
  };

  // Clean price-like tokens and tax labels from a description string
  const cleanDesc = str => str
    .replace(/(?:₹|Rs\.?|INR)\s*[\d,]+\.?\d*/gi, '') // remove ₹846.61 etc
    .replace(/\b\d+(?:\.\d+)?\s*%\s*(?:IGST|CGST|SGST|GST|VAT|CESS)?\b/gi, '') // remove 18% IGST
    .replace(/\b(?:IGST|CGST|SGST|CESS|VAT)\b/gi, '') // leftover tax labels
    .replace(/\s{2,}/g, ' ').trim();

  // Find the header row (contains "description" or "particulars" + price headers)
  let headerRowIdx = -1;
  let totalRowIdx = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const rowText = rows[i].map(it => it.str).join(' ').toLowerCase();
    if (/(?:description|particulars|item|product)\s/.test(rowText) &&
        /(?:qty|quantity|nos?|units?|pcs?|amount|price|rate|total)/.test(rowText)) {
      headerRowIdx = i;
    }
    if (headerRowIdx >= 0 && i > headerRowIdx && /(?:grand\s*total|total\s*amount|total\s*payable|net\s*total|amount\s*due|sub\s*total|total\s*:|^total\b)/.test(rowText)) {
      totalRowIdx = i;
      break;
    }
  }

  let pendingDesc = '';

  // If we found table bounds, parse between header and total
  if (headerRowIdx >= 0 && totalRowIdx > headerRowIdx) {
    // Determine column positions from header row
    const headerRow = rows[headerRowIdx];
    const headerItems = headerRow.map(it => ({ x: it.x, label: it.str.toLowerCase() }));

    // Find approximate x positions for key columns
    const descCol = headerItems.find(h => /desc|particulars|item|product/.test(h.label));
    const qtyCol = headerItems.find(h => /qty|quantity|nos?|units?|pcs?/.test(h.label));
    const priceCol = headerItems.find(h => /rate|unit.?price|mrp|price/.test(h.label));
    const totalCol = headerItems.find(h => /amount|total|net/.test(h.label));

    for (let i = headerRowIdx + 1; i < totalRowIdx; i++) {
      const row = rows[i];
      if (row.length === 0) continue;

      const rowText = row.map(it => it.str).join(' ');
      if (SKIP_DESC(rowText.trim())) continue;

      // Skip rows that are just tax/discount lines
      if (/(?:cgst|sgst|igst|gst\s+@|tax|cess|discount|round\s*off|packaging|shipping|delivery\s*charge)/i.test(rowText) &&
          !/[a-zA-Z]{5,}/.test(rowText.replace(/(?:cgst|sgst|igst|gst|tax|cess|discount|round|packaging|shipping|delivery\s*charge)/gi, ''))) {
        continue;
      }

      // Extract numbers from the row — handles embedded price strings
      const nums = getNumsFromRowItems(row);

      // Description = text items that aren't pure numbers/prices
      const descItems = getDescFromRowItems(row);
      let desc = normalizeDesc(descItems);

      // If this row has a description but no prices, buffer it for consecutive line wrapping
      if (nums.length === 0) {
        if (desc.length >= 2 && !SKIP_DESC(desc) && !isJunk(desc)) {
          pendingDesc = pendingDesc ? pendingDesc + " " + desc : desc;
        }
        continue;
      }

      // This row HAS prices! Combine it with any buffered description
      if (pendingDesc) {
        desc = pendingDesc + " " + desc;
        desc = normalizeDesc(desc);
        pendingDesc = ''; // reset buffer
      }

      if (desc.length < 2 || SKIP_DESC(desc) || isJunk(desc)) continue;

      // Try to identify qty, unitPrice, total from nums
      let qty = 1, unitPrice = 0, total = 0;

      if (nums.length === 1) {
        total = nums[0].val;
        unitPrice = total;
      } else if (nums.length === 2) {
        unitPrice = nums[0].val;
        total = nums[nums.length - 1].val;
        qty = unitPrice > 0 ? Math.round(total / unitPrice) || 1 : 1;
      } else {
        // 3+ numbers: first could be qty, then unit price, then total
        total = nums[nums.length - 1].val;

        // Check if first number is a small integer (likely qty)
        if (nums[0].val <= 100 && Number.isInteger(nums[0].val)) {
          qty = nums[0].val;
          unitPrice = nums.length > 2 ? nums[1].val : (qty > 0 ? total / qty : total);
        } else {
          unitPrice = nums[0].val;
          qty = unitPrice > 0 ? Math.round(total / unitPrice) || 1 : 1;
        }
      }

      if (total > 0 && desc.length >= 2) {
        // Check if desc contains Amazon's embedded price string
        const parsed = parseAmazonMixedString(desc);
        const cleanedDesc = cleanDesc(desc);
        const taxRate = parsed ? parsed.taxRate : (extractTaxRate(desc) || 18); // Default to 18% if not found
        const finalTotal = parsed ? parsed.total : total;
        const finalUnitPrice = parsed ? parsed.unitPrice : (unitPrice || total);
        const finalQty = parsed ? parsed.qty : (qty || 1);
        const taxAmount = computeTaxAmount(finalTotal, taxRate);
        items.push({
          description: (cleanedDesc.length >= 2 ? cleanedDesc : desc).slice(0, 100),
          quantity:    finalQty,
          unitPrice:   finalUnitPrice,
          taxRate,
          taxAmount,
          total:       finalTotal,
        });
      }
    }
  }

  // ── APPROACH 2: Numbered-row scan (no header needed) ─────────────────────
  // Find rows starting with a number (1., 2., etc.) that have prices
  if (items.length === 0) {
    for (const row of rows) {
      if (row.length < 2) continue;
      const firstStr = row[0].str.replace(/[.)]/g, '').trim();
      if (!/^\d{1,3}$/.test(firstStr)) continue;

      const rowNums = row
        .slice(1)
        .filter(it => isPrice(it.str.replace(/,/g, '')))
        .map(it => parseFloat(it.str.replace(/,/g, '').replace(/[^\d.]/g, '')))
        .filter(n => !isNaN(n) && n > 0);

      const rowDescs = row
        .slice(1)
        .filter(it => !isPrice(it.str.replace(/,/g, '')) && it.str.length > 2 && !/^\d+$/.test(it.str))
        .map(it => it.str);

      const desc = normalizeDesc(rowDescs.join(' ').trim());
      if (desc.length < 2 || rowNums.length === 0) continue;
      if (SKIP_DESC(desc) || isJunk(desc)) continue;

      const total = rowNums[rowNums.length - 1];
      const unitPrice = rowNums.length > 1 ? rowNums[0] : total;
      const qty = unitPrice > 0 ? Math.round(total / unitPrice) || 1 : 1;

      const taxRate    = extractTaxRate(desc) || 18;
      const taxAmount  = computeTaxAmount(total, taxRate);
      items.push({
        description: cleanDesc(desc) || desc,
        quantity:    qty,
        unitPrice,
        taxRate,
        taxAmount,
        total
      });
    }
  }

  // ── APPROACH 3: Regex on raw text (final fallback) ────────────────────────
  if (items.length === 0) {
    const lines = rawText.split('\n').filter(Boolean);
    for (const line of lines) {
      if (SKIP_DESC(line.trim())) continue;
      // Match: optional-number + description + one or more prices
      const m = line.match(/^(?:\d{1,3}[.)\s]+)?(.{5,80}?)\s{2,}(?:₹|Rs\.?)?\s*([\d,]+\.\d{2})\s*(?:(?:₹|Rs\.?)?\s*([\d,]+\.\d{2}))?$/);
      if (m) {
        const desc = normalizeDesc(m[1]);
        const v1 = parseNum(m[2]);
        const v2 = m[3] ? parseNum(m[3]) : null;
        if (desc.length >= 2 && !SKIP_DESC(desc) && !isJunk(desc) && v1 > 0) {
          const total = v2 || v1;
          const unitPrice = v1;
          const qty = v2 && v1 > 0 ? Math.round(v2 / v1) || 1 : 1;
          const taxRate   = extractTaxRate(desc) || 18;
          const taxAmount = computeTaxAmount(total, taxRate);
          items.push({
            description: cleanDesc(desc) || desc,
            quantity:    qty,
            unitPrice,
            taxRate,
            taxAmount,
            total
          });
        }
      }
    }
  }

  // Deduplicate and cap
  const seen = new Set();
  return items
    .filter(it => {
      const key = `${it.description}|${it.total}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return it.total > 0 && it.description.length >= 2;
    })
    .slice(0, 30);
}

/** Word-overlap fuzzy vendor match */
function fuzzyMatchVendor(name, vendors) {
  if (!name || !vendors.length) return null;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const exWords = norm(name).split(' ').filter(w => w.length > 1);
  let best = null, bestScore = 0;
  for (const v of vendors) {
    const vWords = norm(v.name).split(' ').filter(w => w.length > 1);
    const vSet = new Set(vWords);
    const overlap = exWords.filter(w => vSet.has(w)).length;
    const sub = (norm(v.name).includes(norm(name)) || norm(name).includes(norm(v.name))) ? 0.5 : 0;
    const score = overlap / Math.max(exWords.length, vWords.length, 1) + sub;
    if (score > bestScore) { bestScore = score; best = v; }
  }
  return bestScore >= 0.15 ? best : null;
}

// ─── Stage Indicator ─────────────────────────────────────────────────────────
const StageIndicator = ({ stage }) => {
  const stages = [
    { key: 'idle', label: 'Upload' },
    { key: 'rendering', label: 'Rendering' },
    { key: 'ocr', label: 'Extracting' },
    { key: 'extracting', label: 'Parsing' },
    { key: 'preview', label: 'Review' },
  ];
  const activeIdx = stages.findIndex(s => s.key === stage);
  return (
    <div className="flex items-center gap-1 mb-5">
      {stages.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${
            i < activeIdx ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
            i === activeIdx ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' :
            'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {i < activeIdx && <CheckCircle2 className="w-3 h-3" />}
            {i === activeIdx && stage !== 'preview' && <Loader2 className="w-3 h-3 animate-spin" />}
            {s.label}
          </div>
          {i < stages.length - 1 && <div className={`flex-1 h-px ${i < activeIdx ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Vendor Detail Card ───────────────────────────────────────────────────────
const VendorCard = ({ vendor }) => {
  if (!vendor) return null;
  return (
    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 bg-emerald-100 rounded-lg"><Building2 className="w-3.5 h-3.5 text-emerald-600" /></div>
        <span className="text-xs font-extrabold text-emerald-800">{vendor.name}</span>
        <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border ${
          vendor.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
          vendor.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
          'bg-slate-100 text-slate-600 border-slate-200'
        }`}>{vendor.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {vendor.contactPerson && <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><User className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="truncate">{vendor.contactPerson}</span></div>}
        {vendor.email && <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><Mail className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="truncate">{vendor.email}</span></div>}
        {vendor.phone && <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><Phone className="w-3 h-3 text-slate-400 flex-shrink-0" /><span>{vendor.phone}</span></div>}
        {vendor.category && <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><Tag className="w-3 h-3 text-slate-400 flex-shrink-0" /><span>{vendor.category}</span></div>}
        {vendor.address && <div className="flex items-start gap-1.5 text-[10px] text-slate-600 col-span-2"><MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-1">{vendor.address}</span></div>}
        {vendor.code && <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Hash className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="font-mono">{vendor.code}</span></div>}
        {vendor.score !== undefined && <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><ShieldCheck className="w-3 h-3 text-slate-400 flex-shrink-0" /><span>Score: <span className="font-bold text-emerald-700">{vendor.score}</span></span></div>}
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const InvoiceOCRModal = ({ isOpen, onClose, vendors = [], onRegister }) => {
  const [stage, setStage] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [rawText, setRawText] = useState('');
  const [registering, setRegistering] = useState(false);
  const [extractedVendorHint, setExtractedVendorHint] = useState('');
  const [isDigitalPDF, setIsDigitalPDF] = useState(true);

  const [fields, setFields] = useState({
    invoiceNumber: '', invoiceDate: '', totalAmount: '',
    vendorId: '', vendorName: '', gstin: '', poReference: '', notes: '', items: [],
  });

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const selectedVendor = vendors.find(v => v.id === fields.vendorId) || null;

  const reset = () => {
    setStage('idle'); setOcrProgress(0); setOcrStatus(''); setErrorMessage('');
    setPreviewImageUrl(null); setRawText(''); setExtractedVendorHint('');
    setIsDigitalPDF(true);
    setFields({ invoiceNumber: '', invoiceDate: '', totalAmount: '', vendorId: '', vendorName: '', gstin: '', poReference: '', notes: '', items: [] });
    setRegistering(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a PDF file.');
      setStage('error');
      return;
    }

    try {
      // ── Step 1: Load PDF ──────────────────────────────────────────────────
      setStage('rendering');
      setOcrStatus('Loading PDF…');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Render page 1 for preview
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 2.5 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page1.render({ canvasContext: ctx, viewport }).promise;
      const imageDataUrl = canvas.toDataURL('image/png');
      setPreviewImageUrl(imageDataUrl);

      // ── Step 2: Extract text ──────────────────────────────────────────────
      setStage('ocr');
      setOcrStatus('Reading PDF text content…');
      setOcrProgress(15);

      // Get all text items with coordinates (all pages up to 3)
      const allItems = await extractAllItems(pdf);
      const isDigital = allItems.length > 10; // digital PDF has many text items
      setIsDigitalPDF(isDigital);

      let rawExtracted = '';
      let rows = [];

      if (isDigital) {
        // ✅ Digital PDF: use coordinate-based extraction
        setOcrStatus('Parsing PDF layout…');
        setOcrProgress(50);
        rows = groupIntoRows(allItems);
        rawExtracted = rowsToText(rows);
        setOcrProgress(80);
      } else {
        // 🔍 Scanned image: Tesseract OCR
        setOcrStatus('Scanned PDF — running OCR engine…');
        setOcrProgress(20);
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(20 + m.progress * 60));
              setOcrStatus(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        const { data: { text } } = await worker.recognize(imageDataUrl);
        await worker.terminate();
        rawExtracted = text;
        // Build fake rows from OCR text for coordinate-based extractors
        rows = rawExtracted.split('\n').filter(Boolean).map((line, i) => [{ x: 0, y: i * 12, str: line, page: 1 }]);
        setOcrProgress(80);
      }

      setRawText(rawExtracted);

      // ── Step 3: Parse fields ──────────────────────────────────────────────
      setStage('extracting');
      setOcrStatus('Extracting invoice fields…');
      await new Promise(r => setTimeout(r, 200));

      const invNum     = extractInvoiceNumber(rows, rawExtracted);
      const invDate    = extractDate(rawExtracted);
      const totalAmt   = extractTotalAmount(rawExtracted);
      const gstin      = extractGSTIN(rawExtracted);
      const poRef      = extractPONumber(rawExtracted);
      const vendorHint = extractVendorName(rows, rawExtracted);
      const lineItems  = extractLineItems(rows, rawExtracted);
      const matched    = fuzzyMatchVendor(vendorHint, vendors);

      // Auto-sync total
      const itemsSum = lineItems.reduce((s, i) => s + (i.total || 0), 0);
      let finalTotal = totalAmt;
      if (itemsSum > 0) {
        const diff = Math.abs(itemsSum - totalAmt);
        finalTotal = (totalAmt > 0 && diff / totalAmt <= 0.08) ? totalAmt : itemsSum;
      }

      setExtractedVendorHint(vendorHint);
      setFields({
        invoiceNumber: invNum,
        invoiceDate:   invDate,
        totalAmount:   finalTotal > 0 ? String(finalTotal) : (totalAmt > 0 ? String(totalAmt) : ''),
        vendorId:      matched ? matched.id : '',
        vendorName:    vendorHint || (matched ? matched.name : ''), // pre-fill with extracted name
        gstin,
        poReference:   poRef,
        notes:         isDigital ? '' : '(Scanned PDF — please verify extracted data)',
        items:         lineItems,
      });

      setOcrProgress(100);
      setStage('preview');
    } catch (err) {
      console.error('PDF extraction error:', err);
      setErrorMessage(err.message || 'PDF processing failed. Please try again.');
      setStage('error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [vendors]);

  const handleRegister = async () => {
    const effectiveVendorName = selectedVendor?.name || fields.vendorName.trim();
    if (!fields.invoiceNumber || !fields.totalAmount || !effectiveVendorName) return;
    setRegistering(true);
    try {
      await onRegister({
        invoiceNumber: fields.invoiceNumber,
        poId:          null,
        poNumber:      fields.poReference || 'EXTERNAL',
        vendorId:      fields.vendorId || null, // optional — null if not linked to registered vendor
        vendorName:    effectiveVendorName,
        totalAmount:   parseFloat(fields.totalAmount),
        items:         fields.items,
        pdfUrl:        null,
        notes:         `${fields.notes}${fields.gstin ? ` | GSTIN: ${fields.gstin}` : ''}`.trim(),
      });
      reset(); onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register invoice.');
      setStage('error');
    } finally { setRegistering(false); }
  };

  const updateItem = (idx, key, val) => {
    setFields(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [key]: val };
      
      const q = parseFloat(items[idx].quantity) || 0;
      const u = parseFloat(items[idx].unitPrice) || 0;
      const r = parseFloat(items[idx].taxRate) || 0;
      
      const baseTotal = q * u;
      const taxAmount = baseTotal * (r / 100);
      
      items[idx].taxAmount = Math.round(taxAmount * 100) / 100;
      items[idx].total = Math.round((baseTotal + taxAmount) * 100) / 100;
      
      return { ...f, items };
    });
  };
  const removeItem = idx => setFields(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const addItem = () => setFields(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 18, taxAmount: 0, total: 0 }] }));
  const computedTotal = fields.items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Upload & Scan Invoice PDF" maxWidth="max-w-4xl">
      <canvas ref={canvasRef} className="hidden" />
      <StageIndicator stage={stage} />

      {/* IDLE */}
      {stage === 'idle' && (
        <div
          className="border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-slate-50 rounded-2xl p-14 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileChange({ target: { files: [f] } }); }}
        >
          <div className="inline-flex p-5 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 mb-4 transition-colors">
            <Upload className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Upload Invoice PDF</h3>
          <p className="text-sm text-slate-500 mb-1">Drag &amp; drop or click to browse</p>
          <p className="text-xs text-slate-400">Works with any invoice: Amazon, GST, Tally, QuickBooks, custom — digital &amp; scanned</p>
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
            <ScanLine className="w-3.5 h-3.5" />
            Coordinate-based parser · 100% Private &amp; Free
          </div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* PROGRESS */}
      {(stage === 'rendering' || stage === 'ocr' || stage === 'extracting') && (
        <div className="py-10 flex flex-col items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="46" stroke="#e2e8f0" strokeWidth="9" fill="none" />
              <circle cx="56" cy="56" r="46" stroke="#10b981" strokeWidth="9" fill="none"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - ocrProgress / 100)}`}
                strokeLinecap="round" className="transition-all duration-300" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-slate-900">{ocrProgress}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">{ocrStatus}</p>
            <p className="text-xs text-slate-500 mt-1">Processing locally — no data sent externally</p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {stage === 'error' && (
        <div className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex p-4 rounded-full bg-rose-100"><AlertCircle className="w-8 h-8 text-rose-500" /></div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Processing Failed</h3>
            <p className="text-xs text-slate-500 max-w-sm">{errorMessage}</p>
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">
            <RotateCcw className="w-4 h-4" />Try Again
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {stage === 'preview' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex gap-4">
            {previewImageUrl && (
              <div className="w-28 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={previewImageUrl} alt="Invoice preview" className="w-full object-contain" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Extraction Complete
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isDigitalPDF ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {isDigitalPDF ? '⚡ Digital PDF (native)' : '🔍 Scanned PDF (OCR)'}
                </div>
              </div>
              <p className="text-xs text-slate-500">Review and correct any fields below before registering.</p>
              {rawText && (
                <details open>
                  <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600 font-semibold select-none">▾ Raw extracted text (scroll to verify)</summary>
                  <pre className="mt-1 text-[9px] text-slate-500 bg-slate-50 border rounded-lg p-2 max-h-32 overflow-auto leading-relaxed whitespace-pre-wrap">{rawText.slice(0, 2000)}{rawText.length > 2000 ? '…' : ''}</pre>
                </details>
              )}
            </div>
          </div>

          {/* Row 1: Invoice # + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><Hash className="w-3 h-3 text-slate-400" />Invoice Number *</label>
              <input type="text" value={fields.invoiceNumber} onChange={e => setFields(f => ({ ...f, invoiceNumber: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" placeholder="INV-XXXX" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><Calendar className="w-3 h-3 text-slate-400" />Invoice Date</label>
              <input type="text" value={fields.invoiceDate} onChange={e => setFields(f => ({ ...f, invoiceDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" placeholder="DD/MM/YYYY" />
            </div>
          </div>

          {/* Row 2: Total + PO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><IndianRupee className="w-3 h-3 text-slate-400" />Total Amount (₹) *</label>
              <input type="number" min="0" step="0.01" value={fields.totalAmount} onChange={e => setFields(f => ({ ...f, totalAmount: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" placeholder="0.00" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><FileText className="w-3 h-3 text-slate-400" />PO / Order Reference</label>
              <input type="text" value={fields.poReference} onChange={e => setFields(f => ({ ...f, poReference: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" placeholder="PO-XXXX (optional)" />
            </div>
          </div>

          {/* GSTIN */}
          {fields.gstin && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><Info className="w-3 h-3 text-slate-400" />GSTIN</label>
              <input type="text" value={fields.gstin} onChange={e => setFields(f => ({ ...f, gstin: e.target.value }))}
                className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/40" />
            </div>
          )}

          {/* Vendor */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              <Building2 className="w-3 h-3 text-slate-400" />Vendor Name *
            </label>
            {/* Primary: free-text vendor name — pre-filled from PDF, user can edit */}
            <input
              type="text"
              value={fields.vendorName}
              onChange={e => setFields(f => ({ ...f, vendorName: e.target.value, vendorId: f.vendorId }))}
              placeholder="Enter vendor / supplier name"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              This saves the order only. The vendor is <strong>not registered</strong> automatically.
            </p>

            {/* Optional: link to an already-registered vendor */}
            <details className="mt-2">
              <summary className="text-[10px] text-slate-500 font-semibold cursor-pointer hover:text-slate-700 select-none">
                ▸ Link to a registered vendor (optional)
              </summary>
              <div className="mt-2 relative">
                <select
                  value={fields.vendorId}
                  onChange={e => {
                    const v = vendors.find(v => v.id === e.target.value);
                    setFields(f => ({ ...f, vendorId: e.target.value, vendorName: v ? v.name : f.vendorName }));
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 pr-8"
                >
                  <option value="">-- None (unregistered vendor) --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.code ? ` (${v.code})` : ''}{v.status !== 'Approved' ? ` [${v.status}]` : ''}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <VendorCard vendor={selectedVendor} />
            </details>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider"><FileText className="w-3 h-3 text-slate-400" />Notes</label>
            <textarea value={fields.notes} onChange={e => setFields(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" placeholder="Optional notes…" />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <Package className="w-3 h-3 text-slate-400" />Order Products / Line Items
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-semibold">{fields.items.length}</span>
              </label>
              <button onClick={addItem} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                <Plus className="w-3 h-3" />Add Row
              </button>
            </div>

            {fields.items.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wide text-[10px] min-w-0">Product / Description</th>
                      <th className="text-center px-2 py-2.5 font-bold text-slate-600 uppercase tracking-wide text-[10px] w-12">Qty</th>
                      <th className="text-right px-2 py-2.5 font-bold text-slate-600 uppercase tracking-wide text-[10px] w-24">Unit Price</th>
                      <th className="text-center px-2 py-2.5 font-bold text-slate-600 uppercase tracking-wide text-[10px] w-20">Taxes</th>
                      <th className="text-right px-2 py-2.5 font-bold text-slate-600 uppercase tracking-wide text-[10px] w-24">Total (₹)</th>
                      <th className="w-7" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 group transition-colors">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-emerald-500 outline-none py-0.5 text-slate-800 text-xs"
                            placeholder="Product name…"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            className="w-10 text-center bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-emerald-500 outline-none font-semibold text-slate-800"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <span className="text-slate-400 text-[10px]">₹</span>
                            <input
                              type="number" min="0" step="0.01"
                              value={item.unitPrice}
                              onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                              className="w-20 text-right bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-emerald-500 outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number" min="0" max="100" step="0.5"
                                value={item.taxRate || 0}
                                onChange={e => updateItem(idx, 'taxRate', e.target.value)}
                                className="w-12 text-center bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-emerald-500 outline-none text-slate-700 text-xs font-semibold"
                              />
                              <span className="text-[10px] text-slate-400">%</span>
                            </div>
                            {item.taxAmount > 0 && (
                              <span className="text-[9px] text-emerald-600 font-semibold">
                                ₹{(item.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span className="font-bold text-slate-900">
                            ₹{(parseFloat(item.total) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-1 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-slate-600 text-xs">Items Total:</td>
                      <td className="px-2 py-2 text-right font-extrabold text-emerald-700 text-sm">₹{computedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                    {fields.totalAmount && Math.abs(computedTotal - parseFloat(fields.totalAmount)) > 1 && (
                      <tr className="bg-amber-50 border-t border-amber-200">
                        <td colSpan={6} className="px-3 py-1.5 text-center text-[10px] font-semibold text-amber-700">
                          ⚠ Items total differs from invoice total — may include extra taxes/shipping. Verify before registering.
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center">
                <Package className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No line items detected from this invoice format.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click <strong>+ Add Row</strong> to add products manually.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors">
              <RotateCcw className="w-4 h-4" />Scan Another
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => { reset(); onClose(); }} className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm">Cancel</button>
              <button onClick={handleRegister}
                disabled={registering || !fields.invoiceNumber || !fields.totalAmount || !(fields.vendorId || fields.vendorName.trim())}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {registering ? <><Loader2 className="w-4 h-4 animate-spin" />Registering…</> : <><CheckCircle2 className="w-4 h-4" />Register Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
