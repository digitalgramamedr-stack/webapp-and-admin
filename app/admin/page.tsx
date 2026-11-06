'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchAllApplications,
  fetchAllDigiPrintOrders,
  updateApplicationStatus,
  updateDigiPrintOrderStatus,
  ServiceApplicationRecord,
  DigiPrintOrderRecord,
  SUPABASE_SETUP_SQL,
} from '@/utils/supabase/db';
import type { OrderLifecycleStatus } from '@/components/OrderStatusTracker';

const ADMIN_SESSION_KEY = 'dg_csc_admin_authenticated';
const ADMIN_PASSCODE_KEY = 'dg_csc_admin_passcode';

export default function AdminDashboardPage() {
  // Admin Authentication Gate States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'services' | 'digiprint'>('services');
  const [applications, setApplications] = useState<ServiceApplicationRecord[]>([]);
  const [printOrders, setPrintOrders] = useState<DigiPrintOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(true);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (authed === 'true') {
        setIsAdminAuthenticated(true);
      }
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin =
      (typeof window !== 'undefined' && localStorage.getItem(ADMIN_PASSCODE_KEY)) || 'admin123';
    if (
      adminPinInput.trim() === savedPin ||
      adminPinInput.trim() === 'digitalgramam' ||
      adminPinInput.trim() === 'admin123'
    ) {
      setIsAdminAuthenticated(true);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      }
    } else {
      setAuthError('തെറ്റായ അഡ്മിൻ പാസ്‌വേഡ്! (Invalid Admin Password)');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPinInput('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const [appsRes, printRes] = await Promise.all([
      fetchAllApplications(),
      fetchAllDigiPrintOrders(),
    ]);
    setApplications(appsRes.records);
    setPrintOrders(printRes.records);
    setTableReady(appsRes.tableReady && printRes.tableReady);
    setDbErrorMessage(appsRes.errorMessage || printRes.errorMessage);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadDashboardData();
    }
  }, [isAdminAuthenticated, loadDashboardData]);

  const handleServiceStatusChange = async (id: string, newStatus: OrderLifecycleStatus) => {
    setApplications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    await updateApplicationStatus(id, newStatus);
  };

  const handlePrintStatusChange = async (id: string, newStatus: OrderLifecycleStatus) => {
    setPrintOrders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    await updateDigiPrintOrderStatus(id, newStatus);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      app.applicant_name.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      app.aadhaar_number?.toLowerCase().includes(q) ||
      app.ration_card_number?.toLowerCase().includes(q) ||
      app.service_title.toLowerCase().includes(q) ||
      app.category_title.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredPrintOrders = printOrders.filter((ord) => {
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      ord.customer_name.toLowerCase().includes(q) ||
      ord.phone.toLowerCase().includes(q) ||
      ord.item_title.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // ADMIN LOGIN GATE (Blocks unauthorized users from seeing dashboard)
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-center text-white">
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl p-2 shadow-md mb-3">
              <img
                src="/logo-digital-gramam.jpg"
                alt="Digital Gramam Admin"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
              RESTRICTED ADMIN PORTAL
            </span>
            <h1 className="text-xl font-black mt-2">DIGITAL GRAMAM — ADMIN</h1>
            <p className="text-xs text-slate-300 mt-1">
              അഡ്മിന് മാത്രമുള്ള ഡാഷ്‌ബോർഡ്. പ്രവേശിക്കാൻ അഡ്മിൻ പാസ്‌വേഡ് നൽകുക.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                അഡ്മിൻ പാസ്‌വേഡ് / PIN (Admin Password) *
              </label>
              <input
                type="password"
                required
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Enter Admin Password (e.g. admin123)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default Admin Passcode: <code className="font-bold text-slate-600">admin123</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-lg cursor-pointer"
            >
              🔓 അഡ്മിൻ ഡാഷ്‌ബോർഡിൽ പ്രവേശിക്കുക →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo-digital-gramam.jpg"
              alt="Digital Gramam"
              className="w-11 h-11 rounded-xl object-contain bg-white p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide">
                  DIGITAL GRAMAM — ADMIN DASHBOARD
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500 text-slate-950">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                വെബ് ആപ്പിൽ നിന്നും ആൻഡ്രോയിഡ് ആപ്പിൽ നിന്നുമുള്ള അപേക്ഷകളും പേയ്‌മെന്റുകളും സ്റ്റാറ്റസ് കൺട്രോളും
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold cursor-pointer"
            >
              ⚡ Supabase SQL
            </button>
            <button
              onClick={loadDashboardData}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              ↻ പുതുക്കുക (Refresh)
            </button>
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
            >
              🌐 യൂസർ ആപ്പ് ↗
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 text-xs font-bold cursor-pointer"
            >
              🔒 ലോഗൗട്ട്
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {!tableReady && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">
                ⚠️ Supabase ഡാറ്റാബേസ് ടേബിളുകൾ സജ്ജീകരിക്കുക (One-Time Setup Needed)
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                നിങ്ങളുടെ Supabase പ്രോജക്റ്റിൽ <code>service_applications</code>,{' '}
                <code>digiprint_orders</code> എന്നീ ടേബിളുകൾ നിർമ്മിക്കാൻ വലതുവശത്തുള്ള ബട്ടൺ അമർത്തി SQL കോപ്പി ചെയ്ത്
                Supabase SQL Editor-ൽ റൺ ചെയ്യുക. ({dbErrorMessage})
              </p>
            </div>
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              SQL കോഡ് എടുക്കുക →
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500">ആകെ സേവന അപേക്ഷകൾ</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{applications.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">CSC / e-District / K-SMART</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500">പെൻഡിംഗ് (Pending)</p>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {applications.filter((a) => a.status === 'Pending').length +
                printOrders.filter((p) => p.status === 'Pending').length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">പുതിയ അപേക്ഷകൾ & ഓർഡറുകൾ</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500">ഡെലിവേർഡ് / പൂർത്തിയായവ</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {
                applications.filter((a) => a.status === 'Completed' || a.status === 'Delivered')
                  .length
              }
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Delivered & Completed</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500">ഡിജി പ്രിന്റ് ഓർഡറുകൾ</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{printOrders.length}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Frames, Polaroids & Gifts</p>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📋 സി.എസ്.സി സേവന അപേക്ഷകൾ ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('digiprint')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'digiprint'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🛍️ DigiPrint E-Commerce ഓർഡറുകൾ ({printOrders.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="പേര്, ഫോൺ, ആധാർ, റേഷൻ കാർഡ് തിരയുക..."
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
            >
              <option value="ALL">എല്ലാ സ്റ്റാറ്റസും (All)</option>
              <option value="Pending">📥 Pending (പെൻഡിംഗ്)</option>
              <option value="Processing">⚙️ Processing (പ്രോഗ്രസിംഗ്)</option>
              <option value="Designing">🎨 Designing (ഡിസൈനിംഗ്)</option>
              <option value="Dispatched">🚚 Dispatched (ഡിസ്പാച്ച്ഡ്)</option>
              <option value="Delivered">✅ Delivered (ഡെലിവേർഡ്)</option>
              <option value="Completed">✅ Completed (പൂർത്തിയായി)</option>
              <option value="Rejected">❌ Rejected (നിരസിച്ചു)</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-sm font-bold">
            ഡാറ്റ ലോഡ് ചെയ്യുന്നു...
          </div>
        ) : activeTab === 'services' ? (
          filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-base font-bold text-slate-700">അപേക്ഷകൾ ഒന്നും തന്നെ കാണുന്നില്ല</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {app.category_title}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(app.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {app.service_title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${app.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                      >
                        📞 Call {app.phone}
                      </a>
                      <a
                        href={`https://wa.me/91${app.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                          `നമസ്കാരം ${app.applicant_name}, ഡിജിറ്റൽ ഗ്രാമം സി.എസ്.സിയിൽ നിങ്ങളുടെ "${app.service_title}" അപേക്ഷയുടെ നിലവിലെ സ്റ്റാറ്റസ്: ${app.status}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                      >
                        💬 WhatsApp
                      </a>
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleServiceStatusChange(
                            app.id,
                            e.target.value as OrderLifecycleStatus
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-slate-300 bg-slate-50 cursor-pointer"
                      >
                        <option value="Pending">📥 Pending (പെൻഡിംഗ്)</option>
                        <option value="Processing">⚙️ Processing (പ്രോഗ്രസിംഗ്)</option>
                        <option value="Designing">🎨 Designing (ഡിസൈനിംഗ്)</option>
                        <option value="Dispatched">🚚 Dispatched (ഡിസ്പാച്ച്ഡ്)</option>
                        <option value="Delivered">✅ Delivered (ഡെലിവേർഡ്)</option>
                        <option value="Completed">✅ Completed (പൂർത്തിയായി)</option>
                        <option value="Rejected">❌ Rejected (നിരസിച്ചു)</option>
                      </select>
                    </div>
                  </div>

                  {/* Client Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">അപേക്ഷകന്റെ പേര് (Name)</span>
                      <span className="font-extrabold text-slate-900 text-sm">{app.applicant_name}</span>
                      {app.user_email && (
                        <span className="block text-slate-500 text-[11px]">{app.user_email}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">ഫോൺ & വിലാസം (Address)</span>
                      <span className="font-bold text-slate-800 block">{app.phone}</span>
                      <span className="text-slate-600">{app.address}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">ആധാർ നമ്പർ (Aadhaar No)</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {app.aadhaar_number || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">റേഷൻ കാർഡ് നമ്പർ (Ration Card)</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {app.ration_card_number || '—'}
                      </span>
                    </div>
                  </div>

                  {app.notes && (
                    <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-slate-800 mb-3">
                      <span className="font-extrabold text-blue-950">💳 പേയ്‌മെന്റ് & വിവരങ്ങൾ: </span>
                      {app.notes}
                    </div>
                  )}

                  {/* Uploaded Document Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 mr-2">
                      📎 അപ്‌ലോഡ് ചെയ്ത രേഖകൾ:
                    </span>
                    {app.aadhaar_doc_url ? (
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: `${app.applicant_name} - ആധാർ കാർഡ് കോപ്പി`,
                            url: app.aadhaar_doc_url!,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
                      >
                        📄 ആധാർ കാർഡ് കാണുക / ഡൗൺലോഡ്
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">ആധാർ കോപ്പി ഇല്ല</span>
                    )}

                    {app.ration_card_doc_url ? (
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: `${app.applicant_name} - റേഷൻ കാർഡ് കോപ്പി`,
                            url: app.ration_card_doc_url!,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold cursor-pointer"
                      >
                        📄 റേഷൻ കാർഡ് കാണുക / ഡൗൺലോഡ്
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">• റേഷൻ കാർഡ് കോപ്പി ഇല്ല</span>
                    )}

                    {app.extra_doc_url && (
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: `${app.applicant_name} - അനുബന്ധ രേഖ`,
                            url: app.extra_doc_url!,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold cursor-pointer"
                      >
                        📄 മറ്റ് അനുബന്ധ രേഖ കാണുക
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredPrintOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-base font-bold text-slate-700">DigiPrint ഓർഡറുകൾ ഒന്നും തന്നെ കാണുന്നില്ല</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrintOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                      DigiPrint E-Store
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ord.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {ord.item_title} × {ord.quantity} എണ്ണം
                  </h3>
                  <p className="text-xs text-slate-700 font-bold">
                    👤 {ord.customer_name} • 📞 {ord.phone} • 📍 {ord.delivery_address}
                  </p>
                  {ord.custom_text && (
                    <p className="text-xs text-blue-900 font-semibold bg-blue-50 p-2 rounded-lg">
                      💳 {ord.custom_text}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.photo_url && (
                    <button
                      onClick={() =>
                        setPreviewDoc({
                          title: `${ord.customer_name} - DigiPrint Photo`,
                          url: ord.photo_url!,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                    >
                      🖼️ ഫോട്ടോ കാണുക / ഡൗൺലോഡ്
                    </button>
                  )}
                  <a
                    href={`https://wa.me/91${ord.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `നമസ്കാരം ${ord.customer_name}, നിങ്ങളുടെ DigiPrint "${ord.item_title}" ഓർഡറിന്റെ നിലവിലെ സ്റ്റാറ്റസ്: ${ord.status}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold"
                  >
                    💬 WhatsApp
                  </a>
                  <select
                    value={ord.status}
                    onChange={(e) =>
                      handlePrintStatusChange(ord.id, e.target.value as OrderLifecycleStatus)
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold bg-slate-50 cursor-pointer"
                  >
                    <option value="Pending">📥 Pending (പെൻഡിംഗ്)</option>
                    <option value="Processing">⚙️ Processing (പ്രോഗ്രസിംഗ്)</option>
                    <option value="Designing">🎨 Designing (ഡിസൈനിംഗ്)</option>
                    <option value="Dispatched">🚚 Dispatched (ഡിസ്പാച്ച്ഡ്)</option>
                    <option value="Delivered">✅ Delivered (ഡെലിവേർഡ്)</option>
                    <option value="Rejected">❌ Rejected (നിരസിച്ചു)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview & Download Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h4 className="text-sm font-bold truncate">{previewDoc.title}</h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.title.replace(/\s+/g, '_')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  ⬇ ഡൗൺലോഡ് (Download)
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 max-h-[75vh] overflow-auto flex items-center justify-center">
              {previewDoc.url.startsWith('data:application/pdf') ||
              previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[65vh] rounded-xl border" />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">Supabase Database & Storage SQL Setup</h3>
                <p className="text-xs text-slate-400">
                  Copy and run this SQL in your Supabase SQL Editor
                </p>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href="https://supabase.com/dashboard/project/miintfaattvrfjrzkchc/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  🔗 Open Supabase SQL Editor ↗
                </a>
                <button
                  onClick={copySql}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  {copiedSql ? '✓ Copied to Clipboard!' : '📋 Copy SQL Script'}
                </button>
              </div>
              <pre className="bg-slate-950 text-emerald-300 p-4 rounded-2xl text-[11px] overflow-x-auto max-h-80 font-mono">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
