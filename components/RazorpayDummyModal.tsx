'use client';

import React, { useState } from 'react';

interface RazorpayDummyModalProps {
  isOpen: boolean;
  amount: number;
  itemTitle: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (paymentId: string, methodDetail: string) => void;
  onCancel: () => void;
}

export default function RazorpayDummyModal({
  isOpen,
  amount,
  itemTitle,
  customerName,
  customerPhone,
  onSuccess,
  onCancel,
}: RazorpayDummyModalProps) {
  const [selectedTab, setSelectedTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'UPI ID'>('GPay');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayNow = () => {
    setProcessing(true);
    setTimeout(() => {
      const randomId = 'pay_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const methodLabel =
        selectedTab === 'upi'
          ? `UPI (${upiApp})`
          : selectedTab === 'card'
          ? 'Debit/Credit Card'
          : 'NetBanking';
      setProcessing(false);
      onSuccess(randomId, methodLabel);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Razorpay Style Top Header */}
        <div className="bg-[#072654] text-white p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow">
                <img
                  src="/logo-digital-gramam.jpg"
                  alt="Digital Gramam"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold tracking-wide">Digital Gramam CSC</h3>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                    TEST MODE
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 truncate max-w-[180px]">{itemTitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between">
            <span className="text-xs text-blue-200">അടയ്ക്കേണ്ട തുക (Total Payable):</span>
            <span className="text-2xl font-black text-white">₹{amount}</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-300 flex items-center justify-between">
            <span>👤 {customerName || 'Customer'}</span>
            <span>📞 +91 {customerPhone || 'XXXXXXXXXX'}</span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedTab('upi')}
            className={`flex-1 py-3 text-center transition cursor-pointer ${
              selectedTab === 'upi'
                ? 'bg-white text-[#072654] border-b-2 border-[#3395ff]'
                : 'text-slate-500'
            }`}
          >
            📱 UPI / GPay
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('card')}
            className={`flex-1 py-3 text-center transition cursor-pointer ${
              selectedTab === 'card'
                ? 'bg-white text-[#072654] border-b-2 border-[#3395ff]'
                : 'text-slate-500'
            }`}
          >
            💳 Card
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('netbanking')}
            className={`flex-1 py-3 text-center transition cursor-pointer ${
              selectedTab === 'netbanking'
                ? 'bg-white text-[#072654] border-b-2 border-[#3395ff]'
                : 'text-slate-500'
            }`}
          >
            🏦 NetBanking
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {selectedTab === 'upi' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600">
                നിങ്ങളുടെ UPI ആപ്പ് തിരഞ്ഞെടുക്കുക (Select UPI App):
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {(['GPay', 'PhonePe', 'Paytm', 'UPI ID'] as const).map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiApp(app)}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                      upiApp === app
                        ? 'border-[#3395ff] bg-blue-50/70 text-[#072654] shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{app === 'GPay' ? '🔵' : app === 'PhonePe' ? '🟣' : app === 'Paytm' ? '🔷' : '🆔'}</span>
                    <span>{app}</span>
                  </button>
                ))}
              </div>
              {upiApp === 'UPI ID' && (
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okaxis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              )}
            </div>
          )}

          {selectedTab === 'card' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="കാർഡ് നമ്പർ (4XXX XXXX XXXX XXXX)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  maxLength={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {selectedTab === 'netbanking' && (
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {['SBI', 'Federal Bank', 'HDFC Bank', 'Canara Bank'].map((bank) => (
                <div
                  key={bank}
                  className="p-2.5 rounded-xl border border-slate-200 text-center text-slate-700 bg-slate-50"
                >
                  🏦 {bank}
                </div>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
            🔒 <strong>Razorpay Sandbox (Dummy Mode):</strong> താഴെ കാണുന്ന ബട്ടൺ ക്ലിക്ക് ചെയ്താൽ ഉടൻ
            പേയ്‌മെന്റ് വിജയകരമായി പൂർത്തിയാകും. പിന്നീട് ഒറിജിനൽ Razorpay Key ചേർക്കാം.
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={handlePayNow}
            className="w-full py-3.5 rounded-xl bg-[#3395ff] hover:bg-[#2280e6] text-white font-black text-sm shadow-lg transition disabled:opacity-60 cursor-pointer"
          >
            {processing ? 'പേയ്‌മെന്റ് പ്രോസസ്സ് ചെയ്യുന്നു...' : `Pay ₹${amount} Now →`}
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Secured by Razorpay Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
