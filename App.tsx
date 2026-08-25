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

// KOMPONEN ACCORDION RUTE (MOBILE)
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="accordion-title">🚚 {rute.code}</span>
        <span className="accordion-metrics">
          <span>Load: <strong style={{ color: '#38bdf8' }}>{rute.load}</strong></span>
          <span className={`badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body">
          <div className="acc-detail-row">
            <span>Total Stop Points:</span>
            <strong>{rute.points} Point</strong>
          </div>
          <div className="acc-detail-row">
            <span>Pure PU vs Drop:</span>
            <strong>{rute.puDrop}</strong>
          </div>
          <div className="acc-detail-row">
            <span>SLA On-Time:</span>
            <strong>{rute.sla}</strong>
          </div>
          <div className="acc-detail-row">
            <span>Rata-rata Delay:</span>
            <strong>{rute.avgDelay}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

// KOMPONEN ACCORDION POINT (MOBILE)
const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="accordion-title">📍 {point.name}</span>
        <span className="accordion-metrics">
          <span className={`badge ${badgeClass}`}>{point.visit}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body">
          <div className="acc-detail-row">
            <span>Pure PU / Drop SS:</span>
            <strong>{point.puDrop}</strong>
          </div>
          <div className="acc-detail-row">
            <span>Bagging MB & BP:</span>
            <strong>{point.mbBp}</strong>
          </div>
          <div className="acc-detail-row">
            <span>Status Transaksi:</span>
            <strong style={{ color: '#34d399' }}>{point.status}</strong>
          </div>
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
  
  // State GPS
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

  const filteredRoutes = dashboardData?.routeRows?.filter((r: any) => r.code.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredPoints = dashboardData?.pointRows?.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  
  // FIX Logika Rute GPS
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

  // MOCKUP AUTO-SEARCH MAPS
  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    const searchQueryMaps = encodeURIComponent(`${selectedRouteCode} Area Jakarta Indonesia`);
    return `https://maps.google.com/maps?q=${searchQueryMaps}&z=13&output=embed`;
  };

  return (
    // FIX PWA & KETAJAMAN TEXT: Menggunakan antialiased (WebkitFontSmoothing) dan 100dvh
    <div style={{ minHeight: '100dvh', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', overflowX: 'hidden' }}>
      
      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>
            SINKRONISASI DATA
          </div>
        </div>
      )}

      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <h2>
          {/* FIX SVG LOGO: Ukuran dikunci dengan inline style */}
          <svg style={{ width: '24px', height: '24px', color: '#38bdf8', marginRight: '8px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
          </svg>
          <span>TR-GLASS</span>
        </h2>

        <div className="nav-menu">
          <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}>
            📊 Dashboard Overview
          </div>
          <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}>
            🚚 Load & SLA
          </div>
          <div className={`nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}>
            📍 Info Point Task
          </div>
          <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}>
            🗺️ GPS History
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <label style={{ fontSize: '10px', color: 'var(--app-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
            📅 PERIODE ANALISIS
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button className={`mode-btn ${mode === 'monthly' ? 'active' : ''}`} onClick={() => setMode('monthly')}>📈 Bulanan</button>
            <button className={`mode-btn ${mode === 'daily' ? 'active' : ''}`}>📅 Harian</button>
          </div>
          <div className="sidebar-calendar">
            <div className="cal-header-mini">
              <span>Agustus 2026</span>
              <span style={{ fontSize: '9px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }} onClick={() => setMode('monthly')}>
                Reset
              </span>
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

      {/* MAIN CONTENT */}
      <div className="main-content">
        
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="brand-container">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="pulse-dot"></div>
            <div className="brand-text">
              <h1>TRANSPORT <span>GLASS</span></h1>
              <span className="brand-sub">SERVER: PROD-JKT // SYNC-OK</span>
            </div>
          </div>

          <div className="global-search-container">
            <span className="global-search-icon">🔍</span>
            <input
              type="text"
              className="global-search"
              placeholder="Cari rute, point..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                <span className="role">Control Tower Ops</span>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTAINER */}
        <div className="dashboard-container">
          
          {/* KPI GRID */}
          <div className="kpi-grid">
            <div className="kpi-card"><div className="title">Total Trip</div><div className="value">{dashboardData?.kpi?.tripCount || '0'}</div><div className="subtext">Unit Aktif</div></div>
            <div className="kpi-card"><div className="title">Pure Pick-Up</div><div className="value">{dashboardData?.kpi?.totalPurePU || '0'}</div><div className="subtext">Pengambilan</div></div>
            <div className="kpi-card"><div className="title">Pure Drop SS</div><div className="value">{dashboardData?.kpi?.totalPureDrop || '0'}</div><div className="subtext">Penurunan</div></div>
            <div className="kpi-card"><div className="title">Total Workload</div><div className="value">{dashboardData?.kpi?.totalWorkloadEffort || '0'}</div><div className="subtext">Points Visit</div></div>
            <div className="kpi-card"><div className="title">SLA On-Time</div><div className="value">{dashboardData?.kpi?.overallSlaPct || '0'}%</div><div className="subtext">Aman (No Delay)</div></div>
            <div className="kpi-card"><div className="title">Real Load Factor</div><div className="value">{dashboardData?.kpi?.overallLoadPct || '0'}%</div><div className="subtext">Eq-PU Volume</div></div>
          </div>

          {/* 1. OVERVIEW */}
          {activeMenu === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '16px' }}>
              <div className="card-panel">
                <div className="panel-header"><h3>🍰 Distribusi Workload</h3></div>
                {dashboardData?.chartData ? (
                  <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                    <Doughnut
                      data={{
                        labels: dashboardData.chartData.labels,
                        datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'], borderWidth: 0 }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }}
                    />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>

              <div className="card-panel">
                <div className="panel-header"><h3>📈 SLA On-Time (%)</h3></div>
                {dashboardData?.chartData ? (
                  <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                    <Bar
                      data={{
                        labels: dashboardData.chartData.labels,
                        datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }]
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                          y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } },
                          x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
                        },
                        plugins: { legend: { display: false } }
                      }}
                    />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>
            </div>
          )}

          {/* 2. LOAD & SLA */}
          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3>🚚 Load & SLA per Rute</h3>
              </div>
              
              {/* FIX TABEL: overflowX auto & minWidth agar rapi di HP & tidak melebar aneh di PC */}
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px', width: '100%' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>RUTE</th>
                      <th style={{ whiteSpace: 'nowrap' }}>POINT</th>
                      <th style={{ whiteSpace: 'nowrap' }}>PURE PU / DROP</th>
                      <th style={{ whiteSpace: 'nowrap' }}>SLA %</th>
                      <th style={{ whiteSpace: 'nowrap' }}>AVG DELAY</th>
                      <th style={{ whiteSpace: 'nowrap' }}>NET LOAD %</th>
                      <th style={{ whiteSpace: 'nowrap' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.code}</td>
                        <td>{r.points}</td>
                        <td>{r.puDrop}</td>
                        <td>{r.sla}</td>
                        <td>{r.avgDelay}</td>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.load}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(r.status)}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data rute tidak ditemukan</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredRoutes.map((r: any, i: number) => (
                    <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. INFO POINT TASK */}
          {activeMenu === 'points' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3>📍 Info Point Task</h3>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px', width: '100%' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>NAMA POINT</th>
                      <th style={{ whiteSpace: 'nowrap' }}>VISIT</th>
                      <th style={{ whiteSpace: 'nowrap' }}>PURE PU / DROP SS</th>
                      <th style={{ whiteSpace: 'nowrap' }}>MB & BP DETAIL</th>
                      <th style={{ whiteSpace: 'nowrap' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoints.map((p: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.name}</td>
                        <td>{p.visit}</td>
                        <td>{p.puDrop}</td>
                        <td>{p.mbBp}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data point tidak ditemukan</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredPoints.map((p: any, i: number) => (
                    <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. GPS PINPOINT HISTORY */}
          {activeMenu === 'geotag' && (
            <div className="card-panel">
              <div className="panel-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3>🗺️ History Jalur Maps per Rute</h3>
                <input
                  type="text"
                  placeholder="Cari Kode Rute..."
                  value={pinSearchQuery}
                  onChange={(e) => setPinSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    width: '100%',
                    maxWidth: '240px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto', paddingRight: '8px' }}>
                  {filteredRouteCodes.map((code: string) => {
                    const isSelected = selectedRouteCode === code;
                    const routeItem = dashboardData?.routeRows?.find((r: any) => r.code === code);
                    return (
                      <div
                        key={code}
                        onClick={() => setSelectedRouteCode(code)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`,
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)'
                        }}
                      >
                        <div style={{ color: isSelected ? '#38bdf8' : '#e2e8f0', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace', marginBottom: '4px' }}>
                          🚚 {code}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--app-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Points: {routeItem?.points || '0'}</span>
                          <span style={{ color: routeItem?.status?.includes('WARNING') ? '#fbbf24' : '#34d399' }}>{routeItem?.status || 'Optimal'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRouteCodes.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--app-muted)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                      Kode rute tidak ditemukan.
                    </div>
                  )}
                </div>

                {/* AREA RENDER MAPS */}
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', height: '450px', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      🎯 Aktif: {selectedRouteCode || 'Pilih Rute'}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>Auto-Search Engine</span>
                  </div>
                  <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                    {selectedRouteCode ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
                        allowFullScreen
                        loading="lazy"
                        src={renderMapsUrl()}
                      ></iframe>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                        Pilih rute di daftar samping untuk merender Peta
                      </div>
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
