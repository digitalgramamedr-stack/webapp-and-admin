'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SERVICE_CATEGORIES, ServiceCategory, ServiceItem } from '@/data/services';
import { createClient } from '@/utils/supabase/client';
import {
  submitServiceApplication,
  uploadDocumentFile,
  fetchAllApplications,
  fetchAllDigiPrintOrders,
  ServiceApplicationRecord,
  DigiPrintOrderRecord,
} from '@/utils/supabase/db';
import RazorpayDummyModal from '@/components/RazorpayDummyModal';
import OrderStatusTracker from '@/components/OrderStatusTracker';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

function getServiceAmount(feeEstimate: string): number {
  const match = feeEstimate.match(/\d+/);
  return match ? Number(match[0]) : 60;
}

export default function DigitalGramamHomePage() {
  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Navigation & Category selection state
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(SERVICE_CATEGORIES[0]);
  const [activeServiceForBooking, setActiveServiceForBooking] = useState<ServiceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // My Applications & Orders Tracking drawer state
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [trackingTab, setTrackingTab] = useState<'services' | 'digiprint'>('services');
  const [myBookings, setMyBookings] = useState<ServiceApplicationRecord[]>([]);
  const [myPrintOrders, setMyPrintOrders] = useState<DigiPrintOrderRecord[]>([]);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Application Form State
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [rationCardNumber, setRationCardNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [rationCardFile, setRationCardFile] = useState<File | null>(null);
  const [extraDocFile, setExtraDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    message: string;
    paymentBadge: string;
  } | null>(null);

  // Splash Screen timer & User Session initialization
  useEffect(() => {
    const splashShown = sessionStorage.getItem('dg_splash_seen');
    if (splashShown === '1') {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('dg_splash_seen', '1');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    async function loadUserSession() {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('dg_csc_user_profile');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as UserProfile;
            setUserProfile(parsed);
            setApplicantName(parsed.full_name || '');
            setPhone(parsed.phone || '');
            setTrackingPhone(parsed.phone || '');
          } catch {
            // ignore
          }
        }
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const profile: UserProfile = {
            id: data.user.id,
            full_name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split('@')[0] ||
              'ഉപഭോക്താവ്',
            phone: data.user.user_metadata?.phone || '',
            email: data.user.email || '',
          };
          setUserProfile(profile);
          setApplicantName((prev) => prev || profile.full_name);
          setPhone((prev) => prev || profile.phone);
          setTrackingPhone((prev) => prev || profile.phone);
          if (typeof window !== 'undefined') {
            localStorage.setItem('dg_csc_user_profile', JSON.stringify(profile));
          }
        }
      } catch {
        // ignore
      }
    }
    loadUserSession();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dg_csc_user_profile');
    }
    setUserProfile(null);
  };

  const openDigiPrintWindow = () => {
    if (typeof window !== 'undefined') {
      const newWin = window.open('/digiprint', '_blank');
      if (!newWin) {
        window.location.href = '/digiprint';
      }
    }
  };

  const loadMyApplications = async (customPhone?: string) => {
    setShowMyBookings(true);
    setLoadingBookings(true);
    const phoneToSearch = customPhone !== undefined ? customPhone : trackingPhone || phone;
    const [appsRes, printRes] = await Promise.all([
      fetchAllApplications(userProfile?.id, phoneToSearch),
      fetchAllDigiPrintOrders(userProfile?.id, phoneToSearch),
    ]);
    setMyBookings(appsRes.records);
    setMyPrintOrders(printRes.records);
    setLoadingBookings(false);
  };

  const finalizeServiceSubmission = async (paymentSummary: string) => {
    if (!activeServiceForBooking) return;
    setSubmitting(true);

    try {
      const [aadhaarUrl, rationUrl, extraUrl] = await Promise.all([
        uploadDocumentFile(aadhaarFile, 'aadhaar'),
        uploadDocumentFile(rationCardFile, 'ration_card'),
        uploadDocumentFile(extraDocFile, 'extra_docs'),
      ]);

      const combinedNotes = [
        `[${paymentSummary}]`,
        notes.trim() ? `കുറിപ്പ്: ${notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await submitServiceApplication({
        user_id: userProfile?.id || null,
        user_email: userProfile?.email || null,
        category_id: selectedCategory.id,
        category_title: selectedCategory.titleMl,
        service_id: activeServiceForBooking.id,
        service_title: `${activeServiceForBooking.titleMl} (${activeServiceForBooking.titleEn})`,
        applicant_name: applicantName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        aadhaar_number: aadhaarNumber.trim(),
        ration_card_number: rationCardNumber.trim(),
        notes: combinedNotes,
        aadhaar_doc_url: aadhaarUrl,
        ration_card_doc_url: rationUrl,
        extra_doc_url: extraUrl,
      });

      setBookingSuccess({
        message: `നിങ്ങളുടെ "${activeServiceForBooking.titleMl}" അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു! 'എന്റെ അപേക്ഷകൾ' എന്ന വിഭാഗത്തിൽ സ്റ്റാറ്റസ് (Pending / Processing / Designing / Dispatched / Delivered) തത്സമയം പരിശോധിക്കാം.`,
        paymentBadge: paymentSummary,
      });

      setAadhaarFile(null);
      setRationCardFile(null);
      setExtraDocFile(null);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServiceForBooking) return;

    const amount = getServiceAmount(activeServiceForBooking.feeEstimate);
    if (paymentMethod === 'razorpay') {
      setShowRazorpayModal(true);
    } else {
      await finalizeServiceSubmission(`പേയ്‌മെന്റ്: Cash on Delivery / Pay at CSC (₹${amount})`);
    }
  };

  // SPLASH SCREEN VIEW
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="relative flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-3xl p-4 shadow-2xl shadow-emerald-500/20 flex items-center justify-center animate-pulse">
            <img
              src="/logo-digital-gramam.jpg"
              alt="Digital Gramam Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-black tracking-wider bg-gradient-to-r from-white via-emerald-200 to-sky-200 bg-clip-text text-transparent">
            DIGITAL GRAMAM
          </h1>
          <p className="mt-1 text-sm font-bold text-emerald-300 tracking-wide">
            ഡിജിറ്റൽ ഗ്രാമം സി.എസ്.സി ജനസേവന കേന്ദ്രം
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Printing • Design • CSC • Online Services
          </p>

          <div className="w-56 h-2 bg-white/15 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full w-full animate-[pulse_1.2s_ease-in-out_infinite]" />
          </div>

          <button
            onClick={() => {
              setShowSplash(false);
              sessionStorage.setItem('dg_splash_seen', '1');
            }}
            className="mt-6 text-xs text-slate-300 hover:text-white underline cursor-pointer"
          >
            പ്രവേശിക്കുക (Enter App) →
          </button>
        </div>
      </div>
    );
  }

  const activeServiceFee = activeServiceForBooking
    ? getServiceAmount(activeServiceForBooking.feeEstimate)
    : 60;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Top Navigation Header (Customer-Only — No Admin Dashboard Link Here) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowSplash(true)}
              title="View Splash Screen"
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-xs flex items-center justify-center cursor-pointer"
            >
              <img
                src="/logo-digital-gramam.jpg"
                alt="Digital Gramam"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                DIGITAL <span className="text-emerald-700">GRAMAM</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                സി.എസ്.സി & ഓൺലൈൻ സേവന കേന്ദ്രം
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* DigiPrint E-Commerce Store Button */}
            <button
              onClick={openDigiPrintWindow}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
            >
              <span>🛍️</span>
              <span>DigiPrint Store ↗</span>
            </button>

            <button
              onClick={() => loadMyApplications()}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
            >
              <span>📦</span>
              <span>എന്റെ അപേക്ഷകൾ / സ്റ്റാറ്റസ്</span>
            </button>

            {userProfile ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer"
              >
                സൈൻ ഔട്ട്
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                ലോഗിൻ / Sign Up
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-5 space-y-6">
        {/* Welcome Banner with User's Name */}
        <section className="bg-gradient-to-r from-sky-900 via-teal-800 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>WELCOME TO DIGITAL GRAMAM CSC</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                ഹലോ, സ്വാഗതം{' '}
                <span className="text-amber-300 underline decoration-amber-400/50">
                  {userProfile ? userProfile.full_name : 'പ്രിയ ഉപഭോക്താവേ'}
                </span>
                ! 👋
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                വില്ലേജ് ഓഫീസ് സേവനങ്ങൾ, പഞ്ചായത്ത് കെ-സ്മാർട്ട്, മുൻസിപ്പാലിറ്റി സേവനങ്ങൾ, യൂട്ടിലിറ്റി ബില്ലുകൾ,
                എഡ്യൂക്കേഷണൽ സേവനങ്ങൾ എന്നിവ വീട്ടിലിരുന്നുകൊണ്ട് ബുക്ക് ചെയ്യാം. ഓൺലൈൻ പേയ്‌മെന്റ് (Razorpay)
                അല്ലെങ്കിൽ ക്യാഷ് ഓൺ ഡെലിവറി സൗകര്യവും ലൈവ് സ്റ്റാറ്റസ് ട്രാക്കിംഗും ലഭ്യമാണ്!
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                {!userProfile && (
                  <Link
                    href="/login"
                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition"
                  >
                    🔑 ലോഗിൻ / പുതിയ അക്കൗണ്ട് തുടങ്ങുക →
                  </Link>
                )}
                <button
                  onClick={() => loadMyApplications()}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
                >
                  🚚 ആപ്ലിക്കേഷൻ & ഓർഡർ സ്റ്റാറ്റസ് അറിയാൻ →
                </button>
              </div>
            </div>

            {/* Search Input inside Hero */}
            <div className="w-full md:w-80 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <label className="block text-xs font-bold text-emerald-100 mb-2">
                🔍 സേവനങ്ങൾ തിരയുക (Search Services)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ഉദാ: വരുമാന സർട്ടിഫിക്കറ്റ്, KSEB, ജനന..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Special Featured E-Commerce Banner: DIGIPRINT (Opens in New Window) */}
        <section className="bg-gradient-to-r from-indigo-950 via-blue-900 to-rose-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-blue-800/40 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg flex-shrink-0">
              <img
                src="/logo-digiprint.png"
                alt="DigiPrint Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  E-COMMERCE GIFT STORE • DIGIPRINT
                </span>
                <span className="text-xs text-rose-200 font-bold">
                  TURN YOUR VISION INTO PRINT
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mt-1">
                ഡിജി പ്രിന്റ് — കസ്റ്റമൈസ്ഡ് ഗിഫ്റ്റ് & ഫോട്ടോ ഫ്രെയിം സ്റ്റോർ
              </h3>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                A4 സൈസ് ഫോട്ടോ ഫ്രെയിം • A3 ഫോട്ടോ ഫ്രെയിം • മിനി ഫോട്ടോ ഫ്രെയിമുകൾ • പോളറോയിഡ് ഫോട്ടോസ് •
                കസ്റ്റമൈസ്ഡ് കീചെയിൻ • ഗിഫ്റ്റ് ഹാംപറുകൾ • ബോക്സ് കേസ് (Razorpay & COD Available)
              </p>
            </div>
          </div>

          <button
            onClick={openDigiPrintWindow}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl whitespace-nowrap transition transform hover:scale-[1.02] cursor-pointer"
          >
            🛍️ DigiPrint Store തുറക്കുക ↗
          </button>
        </section>

        {/* Service Categories Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                സേവന വിഭാഗങ്ങൾ തിരഞ്ഞെടുക്കുക (Select Category)
              </h2>
              <p className="text-xs text-slate-500">
                ഏത് വിഭാഗത്തിലെ സേവനമാണോ വേണ്ടത് അതിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ ആവശ്യമായ രേഖകളും അപേക്ഷാ ഫോമും കാണാം
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory.id === cat.id && !searchTerm;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchTerm('');
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `bg-gradient-to-br ${cat.bgGradient} text-white border-transparent shadow-lg scale-[1.02]`
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-2 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat.badgeText}
                    </span>
                    <h3 className="text-sm font-extrabold leading-snug">{cat.titleMl}</h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold opacity-85">
                    <span>{cat.services.length} സേവനങ്ങൾ</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Category Services & Required Documents List (E-Commerce Style Cards) */}
        <section className="space-y-4">
          <div
            className={`rounded-2xl p-5 text-white bg-gradient-to-r ${selectedCategory.bgGradient} shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
          >
            <div>
              <span className="text-[11px] uppercase font-bold bg-black/20 px-2.5 py-0.5 rounded-full">
                {searchTerm ? 'തിരച്ചിൽ ഫലങ്ങൾ (Search Results)' : selectedCategory.badgeText}
              </span>
              <h2 className="text-xl font-black mt-1">
                {searchTerm
                  ? `"${searchTerm}" എന്നതിനായുള്ള സേവനങ്ങൾ`
                  : `${selectedCategory.titleMl} (${selectedCategory.titleEn})`}
              </h2>
              <p className="text-xs text-white/90 mt-0.5">{selectedCategory.subtitleMl}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(searchTerm
              ? SERVICE_CATEGORIES.flatMap((c) => c.services).filter(
                  (s) =>
                    s.titleMl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.descriptionMl.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : selectedCategory.services
            ).map((service) => {
              const servicePrice = getServiceAmount(service.feeEstimate);
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {service.titleMl}
                        </h3>
                        <p className="text-xs font-bold text-emerald-700">{service.titleEn}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        ⏱ {service.processingTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {service.descriptionMl}
                    </p>

                    {/* Required Documents Box */}
                    <div className="mt-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
                      <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 mb-2">
                        <span>📑</span>
                        <span>ആവശ്യമായ രേഖകൾ (Required Documents):</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {service.requiredDocuments.map((doc, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 font-medium flex items-start gap-2"
                          >
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block">സർവീസ് ഫീസ്:</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">₹{servicePrice}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ({service.feeEstimate})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveServiceForBooking(service);
                        setBookingSuccess(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                    >
                      🛒 ബുക്ക് ചെയ്യുക / അപ്ലൈ ചെയ്യുക →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* SERVICE BOOKING / E-COMMERCE CHECKOUT MODAL */}
      {activeServiceForBooking && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full">
                  {selectedCategory.titleMl}
                </span>
                <h3 className="text-lg font-black mt-1">{activeServiceForBooking.titleMl}</h3>
                <p className="text-xs text-emerald-100">
                  {activeServiceForBooking.titleEn} • ഫീസ്: ₹{activeServiceFee}
                </p>
              </div>
              <button
                onClick={() => setActiveServiceForBooking(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-black">
                  ✓
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-extrabold">
                  {bookingSuccess.paymentBadge}
                </span>
                <h4 className="text-xl font-black text-slate-900">
                  അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു!
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">{bookingSuccess.message}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setActiveServiceForBooking(null);
                      loadMyApplications();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    🚚 ലൈവ് സ്റ്റാറ്റസ് ട്രാക്ക് ചെയ്യുക
                  </button>
                  <button
                    onClick={() => setActiveServiceForBooking(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    ക്ലോസ് ചെയ്യുക
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBookingFormSubmit}
                className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              >
                {/* Required Documents Reminder */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                  <p className="font-extrabold mb-1">📌 ഈ സേവനത്തിന് ആവശ്യമായ രേഖകൾ:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                    {activeServiceForBooking.requiredDocuments.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      അപേക്ഷകന്റെ പേര് (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="നിങ്ങളുടെ പൂർണ്ണമായ പേര്"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ഫോൺ നമ്പർ (Phone Number) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    വിലാസം (Full Address with Ward/Panchayat/Pin) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="വീട്ടുപേര്, പോസ്റ്റ് ഓഫീസ്, പഞ്ചായത്ത്/വില്ലേജ്, പിൻകോഡ്"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ആധാർ നമ്പർ (Aadhaar Number) {activeServiceForBooking.requiresAadhaar ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      required={activeServiceForBooking.requiresAadhaar}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      റേഷൻ കാർഡ് നമ്പർ (Ration Card No){' '}
                      {activeServiceForBooking.requiresRationCard ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      required={activeServiceForBooking.requiresRationCard}
                      value={rationCardNumber}
                      onChange={(e) => setRationCardNumber(e.target.value)}
                      placeholder="10 അക്ക റേഷൻ കാർഡ് നമ്പർ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Document Upload Fields */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800">
                    📤 ഡോക്യുമെന്റുകൾ അപ്‌ലോഡ് ചെയ്യുക (Upload Documents - Image or PDF)
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. ആധാർ കാർഡിന്റെ കോപ്പി (Upload Aadhaar Card Copy)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 bg-white border border-slate-300 rounded-xl p-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. റേഷൻ കാർഡിന്റെ കോപ്പി (Upload Ration Card Copy)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setRationCardFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 bg-white border border-slate-300 rounded-xl p-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. {activeServiceForBooking.extraDocumentLabel || 'മറ്റ് ആവശ്യമായ രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക'}
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setExtraDocFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 bg-white border border-slate-300 rounded-xl p-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    കൂടുതൽ വിവരങ്ങൾ / കുറിപ്പുകൾ (Optional Details / Consumer No)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="മറ്റെന്തെങ്കിലും വിവരങ്ങൾ അറിയിക്കാനുണ്ടെങ്കിൽ ഇവിടെ രേഖപ്പെടുത്താം"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                {/* Payment Method Selection: Razorpay Online vs Cash on Delivery */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      💳 പേയ്‌മെന്റ് രീതി തിരഞ്ഞെടുക്കുക (Payment Method):
                    </span>
                    <span className="text-sm font-black text-emerald-700">₹{activeServiceFee}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                        paymentMethod === 'razorpay'
                          ? 'border-blue-600 bg-white shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                      />
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">
                          ⚡ ഓൺലൈൻ പേയ്‌മെന്റ് (Razorpay)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          UPI, GPay, PhonePe, Card
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                        paymentMethod === 'cod'
                          ? 'border-emerald-600 bg-white shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <div>
                        <span className="block text-xs font-extrabold text-slate-900">
                          💵 ക്യാഷ് ഓൺ ഡെലിവറി (COD)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          നേരിട്ട് / സേവനത്തിന് ശേഷം നൽകാം
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveServiceForBooking(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    റദ്ദാക്കുക (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-lg disabled:opacity-60 cursor-pointer"
                  >
                    {submitting
                      ? 'സമർപ്പിക്കുന്നു...'
                      : paymentMethod === 'razorpay'
                      ? `Razorpay വഴി ₹${activeServiceFee} അടച്ച് സമർപ്പിക്കുക →`
                      : 'അപേക്ഷ സമർപ്പിക്കുക (COD) →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dummy Razorpay Gateway Modal */}
      <RazorpayDummyModal
        isOpen={showRazorpayModal}
        amount={activeServiceFee}
        itemTitle={activeServiceForBooking?.titleMl || 'CSC Service'}
        customerName={applicantName}
        customerPhone={phone}
        onCancel={() => setShowRazorpayModal(false)}
        onSuccess={(paymentId, methodDetail) => {
          setShowRazorpayModal(false);
          finalizeServiceSubmission(
            `PAID ₹${activeServiceFee} via Razorpay ${methodDetail} (Ref: ${paymentId})`
          );
        }}
      />

      {/* MY APPLICATIONS & ORDERS LIVE TRACKING MODAL */}
      {showMyBookings && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  📦 എന്റെ അപേക്ഷകളും ഓർഡറുകളും (Live Order & Application Status)
                </h3>
                <p className="text-xs text-slate-400">
                  Pending • Processing • Designing • Dispatched • Delivered സ്റ്റാറ്റസ് പരിശോധിക്കാം
                </p>
              </div>
              <button
                onClick={() => setShowMyBookings(false)}
                className="w-8 h-8 rounded-full bg-white/15 text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Phone Filter & Tabs */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setTrackingTab('services')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                    trackingTab === 'services'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  📋 സേവന അപേക്ഷകൾ ({myBookings.length})
                </button>
                <button
                  onClick={() => setTrackingTab('digiprint')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                    trackingTab === 'digiprint'
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  🛍️ DigiPrint ഓർഡറുകൾ ({myPrintOrders.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  placeholder="ഫോൺ നമ്പർ നൽകി തിരയുക..."
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs w-48"
                />
                <button
                  onClick={() => loadMyApplications(trackingPhone)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  തിരയുക
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingBookings ? (
                <div className="text-center py-10 text-slate-500 text-xs font-bold">
                  സ്റ്റാറ്റസ് ലോഡ് ചെയ്യുന്നു...
                </div>
              ) : trackingTab === 'services' ? (
                myBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    സേവന അപേക്ഷകൾ ഒന്നും തന്നെ കാണുന്നില്ല.
                  </div>
                ) : (
                  myBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {b.category_title}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1">
                            {b.service_title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            👤 {b.applicant_name} ({b.phone}) •{' '}
                            {new Date(b.created_at).toLocaleDateString('en-IN')}
                          </p>
                          {b.notes && (
                            <p className="text-[11px] text-blue-700 font-semibold mt-1">
                              {b.notes}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start">
                          Current: {b.status}
                        </span>
                      </div>

                      {/* Visual Step-by-Step Progress Tracker */}
                      <OrderStatusTracker status={b.status} />
                    </div>
                  ))
                )
              ) : myPrintOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  DigiPrint ഓർഡറുകൾ ഒന്നും തന്നെ കാണുന്നില്ല.
                </div>
              ) : (
                myPrintOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          DigiPrint Order
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {ord.item_title} × {ord.quantity} എണ്ണം
                        </h4>
                        <p className="text-xs text-slate-500">
                          👤 {ord.customer_name} ({ord.phone}) •{' '}
                          {new Date(ord.created_at).toLocaleDateString('en-IN')}
                        </p>
                        {ord.custom_text && (
                          <p className="text-[11px] text-blue-700 font-semibold mt-1">
                            {ord.custom_text}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 self-start">
                        Current: {ord.status}
                      </span>
                    </div>

                    {/* Visual Step-by-Step Progress Tracker */}
                    <OrderStatusTracker status={ord.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar (Customer-Only — No Admin Link) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around sm:hidden shadow-lg">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center text-[11px] font-bold text-emerald-700 cursor-pointer"
        >
          <span className="text-base">🏠</span>
          <span>ഹോം</span>
        </button>
        <button
          onClick={openDigiPrintWindow}
          className="flex flex-col items-center text-[11px] font-bold text-blue-700 cursor-pointer"
        >
          <span className="text-base">🛍️</span>
          <span>DigiPrint</span>
        </button>
        <button
          onClick={() => loadMyApplications()}
          className="flex flex-col items-center text-[11px] font-bold text-slate-700 cursor-pointer"
        >
          <span className="text-base">🚚</span>
          <span>സ്റ്റാറ്റസ്</span>
        </button>
        <Link href="/login" className="flex flex-col items-center text-[11px] font-bold text-slate-600">
          <span className="text-base">👤</span>
          <span>അക്കൗണ്ട്</span>
        </Link>
      </nav>
    </div>
  );
}
