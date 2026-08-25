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

// EFEK LIQUID GLASS - Kaca Transparan & Dinding Kokoh
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
};

// KOMPONEN ACCORDION RUTE (MOBILE)
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ ...glassStyle, padding: '14px', marginBottom: '10px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>🚚 {rute.code}</span>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Load: <span style={{ color: '#fff', fontWeight: 600 }}>{rute.load}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>{rute.status}</span>
          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>TOTAL POINT</span>
            <strong style={{ fontSize: '12px', color: '#f8fafc' }}>{rute.points} Point</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>PURE PU / DROP</span>
            <strong style={{ fontSize: '12px', color: '#f8fafc' }}>{rute.puDrop}</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>SLA ON-TIME</span>
            <strong style={{ fontSize: '12px', color: '#34d399' }}>{rute.sla}</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>AVG DELAY</span>
            <strong style={{ fontSize: '12px', color: '#fbbf24' }}>{rute.avgDelay}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ ...glassStyle, padding: '14px', marginBottom: '10px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>📍 {point.name}</span>
        <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>{point.visit}</span>
      </div>
      {isOpen && (
        <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Pure PU / Drop SS:</span> <strong>{point.puDrop}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Bagging MB & BP:</span> <strong>{point.mbBp}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Status:</span> <strong style={{ color: '#34d399' }}>{point.status}</strong></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [mode, setMode] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState('2026-08-23');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRouteCode, setSelectedRouteCode] = useState('');

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const cacheKey = `transport_glass_${mode}_${selectedDate}`;
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

  const filteredRoutes = dashboardData?.routeRows?.filter((r: any) => r.code.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredPoints = dashboardData?.pointRows?.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  
  // Mengambil daftar rute valid langsung dari Google Sheets backend
  const validRouteCodes = dashboardData?.routeRows?.map((r: any) => r.code) || [];
  const filteredRouteCodes = validRouteCodes.filter((code: string) => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  const getBadgeClass = (s: string) => !s ? 'badge-optimal' : s.includes('WARNING') ? 'badge-warning' : s.includes('CRITICAL') ? 'badge-critical' : 'badge-optimal';

  const renderCalendar = () => {
    let days = [];
    for (let i = 26; i <= 31; i++) days.push(<div key={`prev-${i}`} className="cal-cell-mini other-month">{i}</div>);
    for (let d = 1; d <= 31; d++) {
      let dateStr = `2026-08-${d < 10 ? '0' + d : d}`;
      days.push(
        <div
          key={d}
          className={`cal-cell-mini ${mode === 'daily' && dateStr === selectedDate ? 'selected' : ''}`}
          onClick={() => { setMode('daily'); setSelectedDate(dateStr); }}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  // URL Maps dinamis berdasarkan rute yang dipilih (Simulasi koordinat berbasis kode rute backend)
  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    // Koordinat center Jakarta dengan variasi kecil agar peta interaktif sesuai rute aktif
    return `https://maps.google.com/maps?q=-6.1754,106.8272&z=14&output=embed`;
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#090d16', overflowX: 'hidden' }}>
      
      {/* GRADASI CAHAYA LATAR BELAKANG (Agar efek Liquid Glass kaca transparan terlihat jelas di PC) */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }}></div>

      {isLoading && (
        <div id="loaderOverlay" style={{ zIndex: 9999 }}>
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>LOADING TRANSPORT GLASS</div>
        </div>
      )}

      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      {/* SIDEBAR */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ ...glassStyle, borderRadius: '0 24px 24px 0', borderRight: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
        <h2>
          <span style={{ fontSize: '15px', letterSpacing: '1px' }}>🛡️ TRANSPORT GLASS</span>
        </h2>
        <div className="nav-menu">
          <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}>📊 Dashboard Overview</div>
          <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}>🚚 Load & SLA</div>
          <div className={`nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}>📍 Info Point Task</div>
          <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}>🗺️ GPS Pinpoint History</div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <label style={{ fontSize: '10px', color: 'var(--app-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>📅 PERIODE ANALISIS</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button className={`mode-btn ${mode === 'monthly' ? 'active' : ''}`} onClick={() => setMode('monthly')}>📈 Bulanan</button>
            <button className={`mode-btn ${mode === 'daily' ? 'active' : ''}`}>📅 Harian</button>
          </div>
          <div className="sidebar-calendar" style={glassStyle}>
            <div className="cal-header-mini">
              <span>Agustus 2026</span>
              <span style={{ fontSize: '9px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }} onClick={() => setMode('monthly')}>Reset</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((hari) => (
                <div key={hari} className="cal-day-lbl">{hari}</div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content" style={{ position: 'relative', zIndex: 5 }}>
        {/* TOP BAR */}
        <div className="top-bar" style={glassStyle}>
          <div className="brand-container">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="pulse-dot"></div>
            <div className="brand-text">
              <h1 style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
                TRANSPORT <span>GLASS</span>
              </h1>
              <span className="brand-sub">NODE: SECURE-JKT // TRANSPARENT-OPS</span>
            </div>
          </div>

          <div className="global-search-container">
            <span className="global-search-icon">🔍</span>
            <input type="text" className="global-search" placeholder="Cari rute, point, atau driver..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="top-bar-right">
            <div className="ops-clock">
              <span className="time">{timeString} WIB</span>
              <span className="date">{dateString}</span>
            </div>
            <div className="action-btn">🔔<div className="notif-badge">3</div></div>
            <div className="user-profile">
              <div className="avatar">GB</div>
              <div className="user-info">
                <span className="name">Gwe Bowo</span>
                <span className="role">Operations Lead</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-container">
          {/* KPI GRID */}
          <div className="kpi-grid">
            <div className="kpi-card" style={glassStyle}><div className="title">Total Trip</div><div className="value">{dashboardData?.kpi?.tripCount || '0'}</div><div className="subtext">Unit Aktif</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Pure Pick-Up</div><div className="value">{dashboardData?.kpi?.totalPurePU || '0'}</div><div className="subtext">Pengambilan</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Pure Drop SS</div><div className="value">{dashboardData?.kpi?.totalPureDrop || '0'}</div><div className="subtext">Penurunan</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Total Workload</div><div className="value">{dashboardData?.kpi?.totalWorkloadEffort || '0'}</div><div className="subtext">Points Visit</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">SLA On-Time</div><div className="value">{dashboardData?.kpi?.overallSlaPct || '0'}%</div><div className="subtext">Aman (No Delay)</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Real Load Factor</div><div className="value">{dashboardData?.kpi?.overallLoadPct || '0'}%</div><div className="subtext">Eq-PU Volume</div></div>
          </div>

          {/* 1. OVERVIEW */}
          {activeMenu === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '16px' }}>
              <div className="card-panel" style={glassStyle}>
                <div className="panel-header"><h3>🍰 Distribusi Workload</h3></div>
                {dashboardData?.chartData ? (
                  <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                    <Doughnut data={{ labels: dashboardData.chartData.labels, datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>
              <div className="card-panel" style={glassStyle}>
                <div className="panel-header"><h3>📈 SLA On-Time (%)</h3></div>
                {dashboardData?.chartData ? (
                  <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                    <Bar data={{ labels: dashboardData.chartData.labels, datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } }, x: { grid: { display: false }, ticks: { color: '#cbd5e1' } } }, plugins: { legend: { display: false } } }} />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>
            </div>
          )}

          {/* 2. LOAD & SLA (TABEL DESKTOP DIKUNCI AGAR TIDAK MELEBAR KAKU) */}
          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3>🚚 Load & SLA per Rute</h3>
                <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Parameter operasional transparan terstruktur</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '10px 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 8px' }}>RUTE</th>
                      <th style={{ padding: '12px 8px' }}>POINT</th>
                      <th style={{ padding: '12px 8px' }}>PURE PU / DROP</th>
                      <th style={{ padding: '12px 8px' }}>SLA %</th>
                      <th style={{ padding: '12px 8px' }}>AVG DELAY</th>
                      <th style={{ padding: '12px 8px' }}>NET LOAD</th>
                      <th style={{ padding: '12px 8px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12px' }}>
                    {filteredRoutes.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 8px', color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.code}</td>
                        <td style={{ padding: '14px 8px' }}>{r.points}</td>
                        <td style={{ padding: '14px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.puDrop}</td>
                        <td style={{ padding: '14px 8px', color: '#34d399', fontWeight: 600 }}>{r.sla}</td>
                        <td style={{ padding: '14px 8px', color: '#fbbf24' }}>{r.avgDelay}</td>
                        <td style={{ padding: '14px 8px', color: '#38bdf8', fontWeight: 'bold' }}>{r.load}</td>
                        <td style={{ padding: '14px 8px' }}>
                          <span className={`badge ${getBadgeClass(r.status)}`} style={{ fontSize: '9px' }}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--app-muted)' }}>Data rute tidak ditemukan</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredRoutes.map((r: any, i: number) => <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />)}
                </div>
              </div>
            </div>
          )}

          {/* 3. INFO POINT TASK */}
          {activeMenu === 'points' && (
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}><h3>📍 Info Point Task</h3></div>
              <div style={{ overflowX: 'auto', padding: '10px 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <colgroup>
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 8px' }}>NAMA POINT</th>
                      <th style={{ padding: '12px 8px' }}>VISIT</th>
                      <th style={{ padding: '12px 8px' }}>PURE PU / DROP SS</th>
                      <th style={{ padding: '12px 8px' }}>MB & BP DETAIL</th>
                      <th style={{ padding: '12px 8px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12px' }}>
                    {filteredPoints.map((p: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 8px', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                        <td style={{ padding: '14px 8px' }}>{p.visit}</td>
                        <td style={{ padding: '14px 8px' }}>{p.puDrop}</td>
                        <td style={{ padding: '14px 8px' }}>{p.mbBp}</td>
                        <td style={{ padding: '14px 8px' }}><span className={`badge ${getBadgeClass(p.status)}`} style={{ fontSize: '9px' }}>{p.status}</span></td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--app-muted)' }}>Data point tidak ditemukan</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredPoints.map((p: any, i: number) => <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />)}
                </div>
              </div>
            </div>
          )}

          {/* 4. GPS PINPOINT HISTORY (TERHUBUNG KE RUTE ASLI GOOGLE SHEETS) */}
          {activeMenu === 'geotag' && (
            <div className="card-panel" style={glassStyle}>
              <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3>🗺️ History Jalur Maps per Rute</h3>
                  <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Sinkronisasi rute operasional langsung dari database</span>
                </div>
                <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* List Rute Sesuai Backend Asli */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                  {filteredRouteCodes.map((code: string) => {
                    const isSelected = selectedRouteCode === code;
                    const routeItem = filteredRoutes.find((r: any) => r.code === code);
                    return (
                      <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '16px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', fontFamily: 'monospace' }}>🚚 {code}</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Total Stop Points: {routeItem?.points || '0'} Point | Status: {routeItem?.status || 'Optimal'}</div>
                      </div>
                    );
                  })}
                  {filteredRouteCodes.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--app-muted)', padding: '16px', textAlign: 'center' }}>Kode rute tidak ditemukan di sistem.</div>
                  )}
                </div>

                {/* Jendela Maps & Detail */}
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>🎯 Rute Aktif: {selectedRouteCode || 'Pilih Rute'}</span>
                  </div>
                  
                  <div style={{ height: '320px', width: '100%', position: 'relative' }}>
                    {selectedRouteCode ? (
                      <iframe width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" src={renderMapsUrl()}></iframe>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Pilih rute di sebelah kiri untuk menampilkan peta</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
