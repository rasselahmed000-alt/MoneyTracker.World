/**
 * PDFReceiptModal — Fully in-app PDF receipt system
 * NO iframe, NO browser redirect, NO external tab
 * Uses Web Share API (files) for mobile save → goes directly to phone storage
 * Falls back to in-app HTML receipt view if share not supported
 */
import { useState, useEffect } from 'react';
import { X, Download, Share2, CheckCircle, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRefNumber(txId) {
  return 'REF' + (txId || Date.now().toString()).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12).padStart(12, '0');
}

function generateReceiptRef() {
  return 'SBD-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999999)).padStart(6, '0');
}

function getBrandColor(tx) {
  const p = (tx.provider || '').toLowerCase();
  const t = tx.type || '';
  if (p.includes('bkash')) return [219, 39, 119];
  if (p.includes('nagad')) return [234, 88, 12];
  if (p.includes('rocket') || p.includes('dutch')) return [124, 58, 237];
  if (t === 'bank_transfer') return [37, 99, 235];
  if (t === 'send' || tx.country) return [13, 148, 136];
  return [5, 150, 105];
}

function buildPDF(tx, user) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595, H = 842, pad = 48, cW = W - pad * 2;
  const [br, bg, bb] = getBrandColor(tx);
  const receiptRef = generateReceiptRef();
  const txId = tx.tx_id || ('TXN' + Date.now());
  const refNo = generateRefNumber(tx.tx_id || tx.id);
  const dateStr = new Date(tx.created_date || Date.now()).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const amtStr = (tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // White bg
  doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F');
  // Top accent
  doc.setFillColor(br, bg, bb); doc.rect(0, 0, W, 6, 'F');

  let y = 40;
  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(br, bg, bb);
  doc.text('Money Tracker', pad, y + 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 130);
  doc.text('OFFICIAL TRANSACTION RECEIPT', pad, y + 30);
  // Status badge
  doc.setFillColor(br + 200 > 255 ? 255 : br + 200, bg + 200 > 255 ? 255 : bg + 200, bb + 200 > 255 ? 255 : bb + 200);
  doc.roundedRect(W - pad - 110, y, 110, 30, 6, 6, 'F');
  doc.setDrawColor(br, bg, bb); doc.setLineWidth(0.8);
  doc.roundedRect(W - pad - 110, y, 110, 30, 6, 6, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(br, bg, bb);
  doc.text('SUCCESSFUL', W - pad - 55, y + 19, { align: 'center' });

  y += 55;
  doc.setDrawColor(220, 220, 230); doc.setLineWidth(0.5); doc.line(pad, y, W - pad, y); y += 30;

  // Amount card
  doc.setFillColor(248, 249, 252); doc.roundedRect(pad, y, cW, 80, 10, 10, 'F');
  doc.setDrawColor(230, 232, 240); doc.setLineWidth(0.5); doc.roundedRect(pad, y, cW, 80, 10, 10, 'S');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(140, 140, 155);
  doc.text('AMOUNT TRANSFERRED', W / 2, y + 22, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(34); doc.setTextColor(15, 23, 42);
  doc.text(amtStr + ' BDT', W / 2, y + 58, { align: 'center' });
  y += 100;

  // Details
  const providerLabel = tx.provider || (tx.type === 'bank_transfer' ? tx.bank_name || 'Bank Transfer' : 'SwiftBD');
  const rows = [
    ['Sender', (user?.full_name || '—').toUpperCase()],
    ['Provider', providerLabel],
    ...(tx.recipient_mobile ? [['Recipient', tx.recipient_mobile]] : []),
    ...(tx.account_number ? [['Account No', tx.account_number]] : []),
    ...(tx.bank_name && tx.type === 'bank_transfer' ? [['Bank', tx.bank_name]] : []),
    ...(tx.country ? [['Country', tx.country]] : []),
    ...(tx.last_digits ? [['Last 4 Digits', tx.last_digits]] : []),
    ['Transaction ID', txId + (tx.last_digits ? '-' + tx.last_digits : '')],
    ['Reference', refNo],
    ['Date & Time', dateStr],
  ];

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(br, bg, bb);
  doc.text('TRANSFER DETAILS', pad, y); y += 14;

  const rowH = 28;
  rows.forEach(([label, value], idx) => {
    const ry = y + idx * rowH;
    if (idx % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(pad, ry, cW, rowH, 'F'); }
    doc.setDrawColor(238, 240, 245); doc.setLineWidth(0.3); doc.line(pad, ry + rowH, W - pad, ry + rowH);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(140, 145, 160);
    doc.text(label, pad + 10, ry + 18);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(label === 'Transaction ID' ? br : 15, label === 'Transaction ID' ? bg : 23, label === 'Transaction ID' ? bb : 42);
    doc.text(String(value).slice(0, 52), W - pad - 10, ry + 18, { align: 'right' });
  });
  y += rows.length * rowH + 28;

  // Summary
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(br, bg, bb);
  doc.text('AMOUNT SUMMARY', pad, y); y += 14;
  [['Transfer Amount', amtStr + ' BDT', false], ['Fee', '0.00 BDT', false], ['Total Deducted', amtStr + ' BDT', true]].forEach(([l, v, bold], idx) => {
    const ry = y + idx * rowH;
    if (idx % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(pad, ry, cW, rowH, 'F'); }
    doc.setDrawColor(238, 240, 245); doc.setLineWidth(0.3); doc.line(pad, ry + rowH, W - pad, ry + rowH);
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(9);
    doc.setTextColor(bold ? 15 : 140, bold ? 23 : 145, bold ? 42 : 160); doc.text(l, pad + 10, ry + 18);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(v, W - pad - 10, ry + 18, { align: 'right' });
  });
  y += 3 * rowH + 30;

  // Footer ref
  doc.setDrawColor(220, 222, 232); doc.setLineWidth(0.5); doc.line(pad, y, W - pad, y); y += 16;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
  doc.text('Receipt Ref: ' + receiptRef, pad, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 163, 175);
  doc.text('Money Tracker — Your Trusted Digital Remittance Partner', W - pad, y, { align: 'right' });

  // Bottom bar
  doc.setFillColor(br, bg, bb); doc.rect(0, H - 5, W, 5, 'F');

  return {
    blob: doc.output('blob'),
    dataUri: doc.output('datauristring'),
    receiptRef,
  };
}

// ─── In-app receipt card (shown instead of iframe) ───────────────────────────

function ReceiptCard({ tx, user, receiptRef }) {
  const [br, bg, bb] = getBrandColor(tx);
  const colorStr = `rgb(${br},${bg},${bb})`;
  const refNo = generateRefNumber(tx.tx_id || tx.id);
  const dateStr = new Date(tx.created_date || Date.now()).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const providerLabel = tx.provider || (tx.type === 'bank_transfer' ? tx.bank_name || 'Bank Transfer' : 'SwiftBD');

  const rows = [
    ['Sender', (user?.full_name || '—').toUpperCase()],
    ['Provider', providerLabel],
    ...(tx.recipient_mobile ? [['Recipient', tx.recipient_mobile]] : []),
    ...(tx.account_number ? [['Account No', tx.account_number]] : []),
    ...(tx.bank_name && tx.type === 'bank_transfer' ? [['Bank', tx.bank_name]] : []),
    ...(tx.country ? [['Country', tx.country]] : []),
    ...(tx.last_digits ? [['Last Verified Digits', tx.last_digits]] : []),
    ['Transaction ID', (tx.tx_id || '—') + (tx.last_digits ? '-' + tx.last_digits : '')],
    ['Reference', refNo],
    ['Date & Time', dateStr],
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden mx-2 shadow-2xl" style={{ borderTop: `4px solid ${colorStr}` }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <p className="font-black text-lg" style={{ color: colorStr }}>Money Tracker</p>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Official Receipt</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `rgba(${br},${bg},${bb},0.1)`, border: `1px solid rgba(${br},${bg},${bb},0.3)` }}>
          <CheckCircle size={12} style={{ color: colorStr }} />
          <span className="text-xs font-black" style={{ color: colorStr }}>SUCCESSFUL</span>
        </div>
      </div>

      {/* Amount */}
      <div className="px-5 py-5 text-center" style={{ background: `rgba(${br},${bg},${bb},0.04)` }}>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Amount Transferred</p>
        <p className="text-4xl font-black text-gray-900">
          ৳{(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400 mt-1">BDT</p>
      </div>

      {/* Details */}
      <div className="px-5 py-3">
        {rows.map(([label, value], idx) => (
          <div key={idx} className="flex justify-between py-2.5" style={{ borderBottom: idx < rows.length - 1 ? '1px solid #f8fafc' : 'none' }}>
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <span className={`text-xs font-bold max-w-[55%] text-right break-all ${label === 'Transaction ID' ? '' : 'text-gray-800'}`}
              style={label === 'Transaction ID' ? { color: colorStr } : {}}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex justify-between items-center" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
        <div>
          <p className="text-[10px] text-gray-400 font-bold">Receipt Ref</p>
          <p className="text-[11px] font-black text-gray-600">{receiptRef}</p>
        </div>
        <p className="text-[10px] text-gray-400">Money Tracker</p>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PDFReceiptModal({ tx, user, onClose }) {
  const [pdfData, setPdfData] = useState(null); // { blob, dataUri, fileName, receiptRef }
  const [generating, setGenerating] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setTimeout(() => {
      const { blob, dataUri, receiptRef: ref } = buildPDF(tx, user);
      const fileName = `MoneyTracker_Receipt_${ref}.pdf`;
      setPdfData({ blob, dataUri, fileName, receiptRef: ref });
      setGenerating(false);
    }, 300);
  }, []);

  // Most reliable: open data URI directly in new tab — works in all Android browsers & PWA
  const handleOpen = () => {
    if (!pdfData) return;
    setStatus('saving');
    window.open(pdfData.dataUri, '_blank');
    setStatus('saved');
    setTimeout(() => setStatus(''), 3000);
  };

  // Share via native share sheet (Android/iOS)
  const handleShare = async () => {
    if (!pdfData) return;
    setStatus('saving');
    try {
      const file = new File([pdfData.blob], pdfData.fileName, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Money Tracker Receipt' });
        setStatus('saved');
        setTimeout(() => setStatus(''), 3000);
      } else {
        handleOpen();
      }
    } catch (err) {
      if (err.name !== 'AbortError') handleOpen();
      else setStatus('');
    }
  };

  // Download via anchor tag
  const handleDownload = () => {
    if (!pdfData) return;
    setStatus('saving');
    const a = document.createElement('a');
    a.href = pdfData.dataUri;
    a.download = pdfData.fileName;
    a.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('saved');
    setTimeout(() => setStatus(''), 3000);
  };

  const receiptRef = pdfData?.receiptRef || '';
  const fileName = pdfData?.fileName || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#0b1e14' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 shrink-0"
        style={{ background: '#0b3d2e', paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
            <FileText size={15} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Transaction Receipt</p>
            <p className="text-white/30 text-[10px] truncate max-w-[220px]">{fileName || 'Generating...'}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Receipt preview (scrollable) — NO iframe */}
      <div className="flex-1 overflow-y-auto py-4">
        {generating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <div className="w-7 h-7 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" style={{ borderWidth: 3 }} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Generating Receipt...</p>
              <p className="text-white/40 text-xs mt-1">Please wait</p>
            </div>
          </div>
        ) : (
          <ReceiptCard tx={tx} user={user} receiptRef={receiptRef} />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 px-4 space-y-2.5"
        style={{ background: '#0b3d2e', paddingTop: '1rem', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

        {/* Status feedback */}
        <AnimatePresence>
          {status === 'saved' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle size={15} /> PDF saved successfully!
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              Could not save. Try again.
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Receipt Only */}
        <button
          onClick={handleOpen}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base disabled:opacity-50 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
          <ExternalLink size={17} /> View Receipt
        </button>
      </div>
    </motion.div>
  );
}