'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DIGIPRINT_ITEMS, DigiPrintItem } from '@/data/digiprint';
import { createClient } from '@/utils/supabase/client';
import {
  submitDigiPrintOrder,
  uploadDocumentFile,
  fetchAllDigiPrintOrders,
  DigiPrintOrderRecord,
} from '@/utils/supabase/db';
import RazorpayDummyModal from '@/components/RazorpayDummyModal';
import OrderStatusTracker from '@/components/OrderStatusTracker';

export default function DigiPrintPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<DigiPrintItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Order form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    message: string;
    paymentBadge: string;
  } | null>(null);

  // Order Tracking Drawer
  const [showOrdersDrawer, setShowOrdersDrawer] = useState(false);
  const [myOrders, setMyOrders] = useState<DigiPrintOrderRecord[]>([]);
  const [trackPhone, setTrackPhone] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dg_csc_user_profile');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCustomerName(parsed.full_name || '');
            setPhone(parsed.phone || '');
            setTrackPhone(parsed.phone || '');
            setUserId(parsed.id || null);
            setUserEmail(parsed.email || null);
          } catch {
            // ignore
          }
        }
      }
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
          setUserEmail(data.user.email || null);
          if (data.user.user_metadata?.full_name) {
            setCustomerName(data.user.user_metadata.full_name);
          }
          if (data.user.user_metadata?.phone) {
            setPhone(data.user.user_metadata.phone);
            setTrackPhone(data.user.user_metadata.phone);
          }
        }
      } catch {
        // ignore
      }
    }
    loadUser();
  }, []);

  const filteredItems =
    selectedCategory === 'all'
      ? DIGIPRINT_ITEMS
      : DIGIPRINT_ITEMS.filter((i) => i.category === selectedCategory);

  const totalAmount = activeItem ? activeItem.price * (Number(quantity) || 1) : 0;

  const loadCustomerOrders = async (phoneOverride?: string) => {
    setShowOrdersDrawer(true);
    setLoadingOrders(true);
    const searchPhone = phoneOverride !== undefined ? phoneOverride : trackPhone || phone;
    const res = await fetchAllDigiPrintOrders(userId || undefined, searchPhone);
    setMyOrders(res.records);
    setLoadingOrders(false);
  };

  const finalizeDigiPrintOrder = async (paymentSummary: string) => {
    if (!activeItem) return;
    setSubmitting(true);

    try {
      const uploadedPhotoUrl = await uploadDocumentFile(photoFile, 'digiprint');
      const fullCustomDetails = [
        `[${paymentSummary}]`,
        customText.trim() ? `കസ്റ്റമൈസേഷൻ: ${customText.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await submitDigiPrintOrder({
        user_id: userId,
        user_email: userEmail,
        item_id: activeItem.id,
        item_title: `${activeItem.titleMl} (₹${activeItem.price})`,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        delivery_address: deliveryAddress.trim(),
        quantity: Number(quantity) || 1,
        custom_text: fullCustomDetails,
        photo_url: uploadedPhotoUrl,
      });

      setOrderSuccess({
        message: `നിങ്ങളുടെ "${activeItem.titleMl}" ഓർഡർ വിജയകരമായി ലഭിച്ചു! 'എന്റെ ഓർഡറുകൾ' ബട്ടൺ വഴി Pending / Processing / Designing / Dispatched / Delivered സ്റ്റാറ്റസ് തത്സമയം പരിശോധിക്കാം.`,
        paymentBadge: paymentSummary,
      });
      setCustomText('');
      setPhotoFile(null);
      setQuantity(1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (paymentMethod === 'razorpay') {
      setShowRazorpayModal(true);
    } else {
      await finalizeDigiPrintOrder(`Cash on Delivery - COD (₹${totalAmount})`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-blue-950 via-indigo-900 to-rose-900 text-white shadow-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
              <img
                src="/logo-digiprint.png"
                alt="DigiPrint Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-wide">
                  DIGI <span className="text-amber-300">PRINT</span>
                </h1>
                <span className="text-[10px] uppercase font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  E-Commerce Store
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Digital Gramam Initiative • Turn Your Vision Into Print
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCustomerOrders()}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>🚚</span>
              <span>എന്റെ ഓർഡറുകൾ (Track Order)</span>
            </button>

            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>←</span>
              <span className="hidden sm:inline">ഡിജിറ്റൽ ഗ്രാമം ഹോം</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-gradient-to-br from-white via-blue-50 to-rose-50 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-lg flex flex-col md:flex-row items-center gap-6">
          <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white rounded-3xl shadow-md p-3 flex-shrink-0 border border-slate-100">
            <img
              src="/logo-digiprint.png"
              alt="DigiPrint Turn Your Vision Into Print"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold mb-2">
              CUSTOMIZED GIFTS & PHOTO FRAMING E-STORE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              പ്രിയപ്പെട്ടവർക്ക് നൽകാം മനോഹരമായ കസ്റ്റമൈസ്ഡ് സമ്മാനങ്ങൾ!
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              A4 & A3 ഫോട്ടോ ഫ്രെയിമുകൾ, മിനി ഫ്രെയിമുകൾ, പോളറോയിഡ് ഫോട്ടോസ്, കസ്റ്റമൈസ്ഡ് കീചെയിനുകൾ,
              ഗിഫ്റ്റ് ഹാംപറുകൾ, ബോക്സ് കേസുകൾ എന്നിവ ഓൺലൈൻ പേയ്‌മെന്റ് (Razorpay) അല്ലെങ്കിൽ ക്യാഷ് ഓൺ
              ഡെലിവറി (COD) ആയി ഓർഡർ ചെയ്യാം!
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              {[
                { id: 'all', label: 'എല്ലാം (All Products)' },
                { id: 'frames', label: 'A4 / A3 / Mini ഫോട്ടോ ഫ്രെയിമുകൾ' },
                { id: 'polaroid', label: 'പോളറോയിഡ് ഫോട്ടോസ്' },
                { id: 'gifts', label: 'കീചെയിൻ & ഗിഫ്റ്റുകൾ' },
                { id: 'hampers', label: 'ഗിഫ്റ്റ് ഹാംപറുകൾ' },
                { id: 'cases', label: 'ബോക്സ് കേസ് & കവറുകൾ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E-Commerce Product Grid */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const discountPercent = Math.round(
              ((item.originalPrice - item.price) / item.originalPrice) * 100
            );
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                <div className={`bg-gradient-to-br ${item.colorClass} p-5 text-white relative`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/25 text-[10px] font-bold">
                      {item.badge}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                      {discountPercent}% OFF
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold leading-snug">{item.titleMl}</h3>
                  <p className="text-[11px] text-white/85 font-medium mt-0.5">{item.titleEn}</p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">₹{item.price}</span>
                    <span className="text-xs text-white/70 line-through">
                      ₹{item.originalPrice}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {item.descriptionMl}
                    </p>
                    <div className="space-y-1 mb-4">
                      {item.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveItem(item);
                      setQuantity(1);
                      setOrderSuccess(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🛒</span>
                    <span>വാങ്ങുക / Buy Now (₹{item.price})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* E-Commerce Checkout Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
            <div
              className={`bg-gradient-to-r ${activeItem.colorClass} p-5 text-white flex items-center justify-between`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                  DigiPrint E-Commerce Checkout
                </span>
                <h3 className="text-lg font-extrabold mt-1">{activeItem.titleMl}</h3>
                <p className="text-xs text-white/90">
                  വില: ₹{activeItem.price} × {quantity} ={' '}
                  <strong className="text-amber-300">₹{totalAmount}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-extrabold">
                  {orderSuccess.paymentBadge}
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">ഓർഡർ വിജയകരമായി പൂർത്തിയായി!</h4>
                <p className="text-sm text-slate-600">{orderSuccess.message}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setActiveItem(null);
                      loadCustomerOrders();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    🚚 ഓർഡർ ട്രാക്ക് ചെയ്യുക
                  </button>
                  <button
                    onClick={() => setActiveItem(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    ശരി (Done)
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCheckoutSubmit}
                className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      നിങ്ങളുടെ പേര് (Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="പേര് നൽകുക"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ഫോൺ / വാട്സ്ആപ്പ് നമ്പർ *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 അക്ക നമ്പർ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ഡെലിവറി വിലാസം (Delivery Address) *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="വീട്ടുപേര്, സ്ഥലം, പിൻകോഡ്"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      എണ്ണം (Qty) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ഫ്രെയിമിൽ / ഗിഫ്റ്റിൽ ചേർക്കേണ്ട പേര് അല്ലെങ്കിൽ വിവരങ്ങൾ
                  </label>
                  <textarea
                    rows={2}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="ഉദാ: Happy Birthday Sneha / ഫോൺ മോഡൽ / സൈസ് വിവരങ്ങൾ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    പ്രിന്റ് ചെയ്യേണ്ട ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക (Upload Photo)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-dashed border-slate-300 rounded-xl p-2"
                  />
                </div>

                {/* Payment Options: Online Razorpay vs Cash on Delivery */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      💳 പേയ്‌മെന്റ് രീതി (Payment Option):
                    </span>
                    <span className="text-base font-black text-blue-700">ആകെ: ₹{totalAmount}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                        paymentMethod === 'razorpay'
                          ? 'border-blue-600 bg-white shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printPay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                      />
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">
                          ⚡ ഓൺലൈൻ പേയ്‌മെന്റ് (Razorpay)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          GPay, PhonePe, UPI, Card
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                        paymentMethod === 'cod'
                          ? 'border-emerald-600 bg-white shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printPay"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">
                          💵 ക്യാഷ് ഓൺ ഡെലിവറി (COD)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          കൈയിൽ കിട്ടുമ്പോൾ പണം നൽകാം
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    റദ്ദാക്കുക
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-extrabold shadow-lg disabled:opacity-60 cursor-pointer"
                  >
                    {submitting
                      ? 'സേവ് ചെയ്യുന്നു...'
                      : paymentMethod === 'razorpay'
                      ? `Pay ₹${totalAmount} Online (Razorpay) →`
                      : `ഓർഡർ പ്ലേസ് ചെയ്യുക (COD ₹${totalAmount}) →`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dummy Razorpay Checkout Modal */}
      <RazorpayDummyModal
        isOpen={showRazorpayModal}
        amount={totalAmount}
        itemTitle={activeItem?.titleMl || 'DigiPrint Custom Item'}
        customerName={customerName}
        customerPhone={phone}
        onCancel={() => setShowRazorpayModal(false)}
        onSuccess={(paymentId, methodDetail) => {
          setShowRazorpayModal(false);
          finalizeDigiPrintOrder(
            `PAID ₹${totalAmount} via Razorpay ${methodDetail} (Ref: ${paymentId})`
          );
        }}
      />

      {/* Order Tracking Modal */}
      {showOrdersDrawer && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  🚚 എന്റെ ഡിജി പ്രിന്റ് ഓർഡറുകൾ (Track Orders)
                </h3>
                <p className="text-xs text-slate-400">
                  Pending • Processing • Designing • Dispatched • Delivered
                </p>
              </div>
              <button
                onClick={() => setShowOrdersDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/15 text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <input
                type="tel"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="ഫോൺ നമ്പർ നൽകി ഓർഡർ തിരയുക..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              />
              <button
                onClick={() => loadCustomerOrders(trackPhone)}
                className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                തിരയുക
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingOrders ? (
                <div className="text-center py-10 text-slate-500 text-xs font-bold">
                  ഓർഡറുകൾ ലോഡ് ചെയ്യുന്നു...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  ഓർഡറുകൾ ഒന്നും തന്നെ കാണുന്നില്ല.
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {ord.item_title} × {ord.quantity} എണ്ണം
                        </h4>
                        <p className="text-xs text-slate-500">
                          👤 {ord.customer_name} ({ord.phone}) • 📍 {ord.delivery_address}
                        </p>
                        {ord.custom_text && (
                          <p className="text-[11px] text-blue-700 font-semibold mt-1">
                            {ord.custom_text}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 self-start">
                        {ord.status}
                      </span>
                    </div>
                    <OrderStatusTracker status={ord.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
