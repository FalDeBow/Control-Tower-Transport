import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './index.css';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// --- KOMPONEN ACCORDION (MOBILE) ---
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="tr-glass tr-accordion-item">
      <div className="tr-accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="tr-font-mono" style={{ color: '#38bdf8', fontWeight: 'bold' }}>🚚 {rute.code}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Load: <strong style={{ color: '#38bdf8' }}>{rute.load}</strong></span>
          <span className={`tr-badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="tr-accordion-body">
          <div className="tr-acc-row"><span>Total Stop Points:</span><strong>{rute.points} Point</strong></div>
          <div className="tr-acc-row"><span>Pure PU vs Drop:</span><strong>{rute.puDrop}</strong></div>
          <div className="tr-acc-row"><span>SLA On-Time:</span><strong>{rute.sla}</strong></div>
          <div className="tr-acc-row"><span>Rata-rata Delay:</span><strong>{rute.avgDelay}</strong></div>
        </div>
      )}
    </div>
  );
};

const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="tr-glass tr-accordion-item">
      <div className="tr-accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="tr-font-mono" style={{ color: '#38bdf8', fontWeight: 'bold', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {point.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`tr-badge ${badgeClass}`}>{point.visit}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="tr-accordion-body">
          <div className="tr-acc-row"><span>Pure PU / Drop SS:</span><strong>{point.puDrop}</strong></div>
          <div className="tr-acc-row"><span>Bagging MB & BP:</span><strong>{point.mbBp}</strong></div>
          <div className="tr-acc-row"><span>Status Transaksi:</span><strong style={{ color: '#34d399' }}>{point.status}</strong></div>
        </div>
      )}
    </div>
  );
};

// --- APP COMPONENT ---
export default function App() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [mode, setMode] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState('2026-08-26');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedRouteCode, setSelectedRouteCode] = useState('');

  // Clock state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  // Data Fetching
  useEffect(() => {
    const fetchDashboardData = async () => {
      const cacheKey = `transport_glass_clean_${mode}_${selectedDate}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setDashboardData(parsed);
        if (parsed?.routeRows?.length > 0 && !selectedRouteCode) {
          setSelectedRouteCode(parsed.routeRows[0].code);
        }
      } else {
        setIsLoading(true);
      }

      try {
        const filterTanggal = mode === 'monthly' ? 'SEMUA TANGGAL' : selectedDate;
        const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwUC07JIZ7ASWJhy4VyeHqXPnDQd2IPhmCraXOz9xg2Lti4dz9TxvlrNRS-Je7_7fsW/exec";
        const response = await fetch(`${GAS_API_URL}?action=getInitialData&tanggal=${filterTanggal}&rute=SEMUA%20RUTE`);
        const data = await response.json();
        
        if (data && data.dashboard) {
          setDashboardData(data.dashboard);
          localStorage.setItem(cacheKey, JSON.stringify(data.dashboard));
          if (data.dashboard.routeRows?.length > 0 && !selectedRouteCode) {
            setSelectedRouteCode(data.dashboard.routeRows[0].code);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [mode, selectedDate]);

  // Filtering Data
  const filteredRoutes = dashboardData?.routeRows?.filter((r: any) => r.code.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredPoints = dashboardData?.pointRows?.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  
  // FIX Logika Rute GPS: Murni dari data base (tidak ada kode nyasar)
  const validRouteCodes = dashboardData?.routeRows?.map((r: any) => r.code) || [];
  const filteredRouteCodes = validRouteCodes.filter((code: string) => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  // Setup Styles Utility
  const getBadgeClass = (s: string) => {
    if (!s) return 'badge-optimal';
    if (s.includes('WARNING')) return 'badge-warning';
    if (s.includes('CRITICAL')) return 'badge-critical';
    return 'badge-optimal';
  };

  // MOCKUP AUTO-SEARCH MAPS ENGINE
  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    const searchQueryMaps = encodeURIComponent(`${selectedRouteCode} Area Jakarta Indonesia`);
    return `https://maps.google.com/maps?q=${searchQueryMaps}&z=13&output=embed`;
  };

  return (
    <>
      {/* 
        INJEKSI CSS BULLETPROOF: 
        CSS ini akan memaksa layout utama dan efek Liquid Glass berfungsi sempurna 
        walaupun index.css asli Anda sudah terhapus/rusak kelasnya.
      */}
      <style>{`
        /* Reset & Font Smoothing agar Teks Tajam di PC */
        .tr-app-wrapper {
          display: flex;
          width: 100vw;
          min-height: 100dvh;
          background: #020617; /* Dark slate */
          color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
          position: relative;
        }

        /* Background Animasi Gradient Opsional */
        .tr-app-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.08), transparent 25%),
                      radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.05), transparent 25%);
          z-index: 0;
          pointer-events: none;
        }

        /* LIQUID GLASS CORE - Resolusi PC Tembus Pandang Tajam */
        .tr-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }

        /* LAYOUT: Sidebar (PC Kiri, Mobile Drawer) */
        .tr-sidebar {
          width: 260px;
          height: 100dvh;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          z-index: 40;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: transform 0.3s ease;
        }

        /* LAYOUT: Main Content (PC Kanan) */
        .tr-main {
          flex: 1;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* Scroll diatur di dalam */
          z-index: 10;
        }
        
        .tr-scrollable-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* Nav & Cards */
        .tr-nav-item {
          padding: 12px 16px;
          margin: 4px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tr-nav-item:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
        .tr-nav-item.active {
          background: rgba(14, 165, 233, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(14, 165, 233, 0.3);
        }

        .tr-card {
          border-radius: 16px;
          padding: 20px;
          overflow: hidden;
        }

        /* KPI Grid responsif */
        .tr-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        /* TABEL: Agar tidak menyempit di HP dan proporsional di PC */
        .tr-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
        }
        .tr-table {
          width: 100%;
          min-width: 700px; /* Force scroll di layar kecil */
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .tr-table th {
          padding: 16px;
          background: rgba(255,255,255,0.02);
          color: #94a3b8;
          font-weight: 600;
          white-space: nowrap; /* Header tidak patah */
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .tr-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          white-space: nowrap;
        }

        /* Badges */
        .tr-badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-optimal { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-critical { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }

        /* Accordion Mobile */
        .tr-accordion-item { border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .tr-accordion-header { display: flex; justify-content: space-between; padding: 16px; cursor: pointer; }
        .tr-accordion-body { padding: 16px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #cbd5e1; }
        .tr-acc-row { display: flex; justify-content: space-between; margin-bottom: 8px; }

        .tr-font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

        /* --- RESPONSIVE MOBILE --- */
        .tr-mobile-menu-btn { display: none; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
        .tr-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 30; }
        
        .desktop-only { display: block; }
        .mobile-only { display: none; }

        @media (max-width: 768px) {
          .tr-sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); }
          .tr-sidebar.open { transform: translateX(0); }
          .tr-overlay.open { display: block; }
          .tr-mobile-menu-btn { display: block; }
          
          /* Sembunyikan tabel di HP, tampilkan accordion */
          .desktop-only { display: none; }
          .mobile-only { display: block; }
          
          .tr-scrollable-area { padding: 16px; }
        }
      `}</style>

      {/* LOADER */}
      {isLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: '16px', fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '2px' }}>SINKRONISASI DATA</div>
        </div>
      )}

      {/* WRAPPER UTAMA */}
      <div className="tr-app-wrapper">
        <div className="tr-app-bg"></div>

        {/* OVERLAY MOBILE */}
        <div className={`tr-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

        {/* SIDEBAR KIRI */}
        <div className={`tr-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <svg style={{ width: '28px', height: '28px', color: '#38bdf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
              TR-GLASS
            </h2>
          </div>

          <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            <div className={`tr-nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}>📊 Dashboard Overview</div>
            <div className={`tr-nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}>🚚 Load & SLA</div>
            <div className={`tr-nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}>📍 Info Point Task</div>
            <div className={`tr-nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}>🗺️ GPS History</div>
          </div>

          <div style={{ padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>MODE ANALISIS</div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setMode('monthly')} style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: mode === 'monthly' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)', color: mode === 'monthly' ? '#38bdf8' : '#cbd5e1', border: mode === 'monthly' ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent', cursor: 'pointer' }}>📈 Bulan</button>
                <button style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: mode === 'daily' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)', color: mode === 'daily' ? '#38bdf8' : '#cbd5e1', border: mode === 'daily' ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent', cursor: 'pointer' }}>📅 Hari</button>
             </div>
          </div>
        </div>

        {/* KONTEN UTAMA KANAN */}
        <div className="tr-main">
          
          {/* HEADER ATAS */}
          <div className="tr-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="tr-mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
              <div>
                <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>TRANSPORT <span style={{ color: '#38bdf8' }}>GLASS</span></h1>
                <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
                  SERVER: PROD-JKT
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', fontSize: '12px', color: '#94a3b8' }}>🔍</span>
                <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '8px 16px 8px 32px', color: '#fff', fontSize: '12px', outline: 'none', width: '150px' }} />
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span className="tr-font-mono" style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>{timeString}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{dateString}</span>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)' }}>GB</div>
            </div>
          </div>

          {/* AREA SCROLL DASHBOARD */}
          <div className="tr-scrollable-area">
            
            {/* KPI Cards (Glass Effect 100% Aktif) */}
            <div className="tr-kpi-grid">
              {[
                { title: 'Total Trip', val: dashboardData?.kpi?.tripCount, sub: 'Unit Aktif' },
                { title: 'Pure PU', val: dashboardData?.kpi?.totalPurePU, sub: 'Pengambilan' },
                { title: 'Pure Drop SS', val: dashboardData?.kpi?.totalPureDrop, sub: 'Penurunan' },
                { title: 'Workload', val: dashboardData?.kpi?.totalWorkloadEffort, sub: 'Points Visit' },
                { title: 'SLA On-Time', val: `${dashboardData?.kpi?.overallSlaPct || '0'}%`, sub: 'No Delay' },
                { title: 'Load Factor', val: `${dashboardData?.kpi?.overallLoadPct || '0'}%`, sub: 'Eq-PU Volume' },
              ].map((kpi, i) => (
                <div key={i} className="tr-glass tr-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>{kpi.title}</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0' }}>{kpi.val || '0'}</div>
                  <div style={{ fontSize: '10px', color: '#38bdf8' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* KONTEN MENU 1: OVERVIEW */}
            {activeMenu === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="tr-glass tr-card">
                  <h3 style={{ fontSize: '14px', margin: '0 0 16px 0' }}>🍰 Distribusi Workload</h3>
                  {dashboardData?.chartData ? (
                    <div style={{ height: '240px' }}>
                      <Doughnut data={{ labels: dashboardData.chartData.labels, datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                    </div>
                  ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading...</p>}
                </div>
                <div className="tr-glass tr-card">
                  <h3 style={{ fontSize: '14px', margin: '0 0 16px 0' }}>📈 SLA On-Time (%)</h3>
                  {dashboardData?.chartData ? (
                    <div style={{ height: '240px' }}>
                      <Bar data={{ labels: dashboardData.chartData.labels, datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } }, x: { grid: { display: false }, ticks: { color: '#cbd5e1' } } }, plugins: { legend: { display: false } } }} />
                    </div>
                  ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading...</p>}
                </div>
              </div>
            )}

            {/* KONTEN MENU 2: LOAD & SLA */}
            {activeMenu === 'routes' && (
              <div className="tr-glass tr-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><h3 style={{ margin: 0, fontSize: '14px' }}>🚚 Load & SLA per Rute</h3></div>
                
                <div style={{ padding: '20px' }}>
                  {/* Tampilan PC (Tabel) */}
                  <div className="desktop-only tr-table-container">
                    <table className="tr-table">
                      <thead>
                        <tr>
                          <th>RUTE</th><th>POINT</th><th>PURE PU/DROP</th><th>SLA %</th><th>AVG DELAY</th><th>NET LOAD %</th><th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoutes.map((r: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td className="tr-font-mono" style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.code}</td>
                            <td>{r.points}</td><td>{r.puDrop}</td><td>{r.sla}</td><td style={{ color: '#fb7185' }}>{r.avgDelay}</td>
                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.load}</td>
                            <td><span className={`tr-badge ${getBadgeClass(r.status)}`}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tampilan Mobile (Accordion) */}
                  <div className="mobile-only">
                    {filteredRoutes.map((r: any, i: number) => (
                      <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN MENU 3: POINT TASK */}
            {activeMenu === 'points' && (
              <div className="tr-glass tr-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><h3 style={{ margin: 0, fontSize: '14px' }}>📍 Info Point Task</h3></div>
                
                <div style={{ padding: '20px' }}>
                  {/* Tampilan PC (Tabel) */}
                  <div className="desktop-only tr-table-container">
                    <table className="tr-table">
                      <thead>
                        <tr>
                          <th>NAMA POINT</th><th>VISIT</th><th>PURE PU/DROP</th><th>MB & BP DETAIL</th><th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPoints.map((p: any, i: number) => (
                          <tr key={i}>
                            <td className="tr-font-mono" style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.name}</td>
                            <td>{p.visit}</td><td>{p.puDrop}</td><td style={{ color: '#fbbf24' }}>{p.mbBp}</td>
                            <td><span className={`tr-badge ${getBadgeClass(p.status)}`}>{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tampilan Mobile (Accordion) */}
                  <div className="mobile-only">
                    {filteredPoints.map((p: any, i: number) => (
                      <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN MENU 4: GPS MAPS (Murni Data Rute Anda) */}
            {activeMenu === 'geotag' && (
              <div className="tr-glass tr-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>🗺️ History Jalur Maps</h3>
                  <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', width: '100%', maxWidth: '240px', fontFamily: 'monospace' }} />
                </div>

                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
                  {/* List Rute di Kiri */}
                  <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '8px' }}>
                    {filteredRouteCodes.map((code: string) => {
                      const isSelected = selectedRouteCode === code;
                      const rItem = dashboardData?.routeRows?.find((r: any) => r.code === code);
                      return (
                        <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)' }}>
                          <div className="tr-font-mono" style={{ color: isSelected ? '#38bdf8' : '#e2e8f0', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>🚚 {code}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Pts: {rItem?.points || '0'}</span>
                            <span style={{ color: rItem?.status?.includes('WARNING') ? '#fbbf24' : '#34d399' }}>{rItem?.status || 'Opt'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Render Peta di Kanan */}
                  <div style={{ flex: '2 1 400px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="tr-font-mono" style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}>🎯 Rute: {selectedRouteCode || '-'}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>Auto-Search Maps</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      {selectedRouteCode ? (
                        <iframe width="100%" height="100%" style={{ border: 0, position: 'absolute', inset: 0 }} allowFullScreen loading="lazy" src={renderMapsUrl()}></iframe>
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>Pilih rute untuk melihat Maps</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
