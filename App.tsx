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

// DATA MOCK (Saya tambahkan 1 data di rute STR agar Maps bisa mendemokan 2 titik sekaligus)
const routePinPointHistoryData = [
  {
    routeCode: 'STR-BTS59-STR',
    pickupPointName: 'Point Sembako Sunter Jaya',
    lat: '-6.1385',
    lng: '106.8631',
    timestamp: '24 Aug 2026, 08:30 WIB',
    status: 'Completed',
    volume: '350 Koli',
    driver: 'Budi Santoso',
  },
  {
    routeCode: 'STR-BTS59-STR',
    pickupPointName: 'Gudang Sunter Muara',
    lat: '-6.1450',
    lng: '106.8700',
    timestamp: '24 Aug 2026, 09:00 WIB',
    status: 'Completed',
    volume: '150 Koli',
    driver: 'Budi Santoso',
  },
  {
    routeCode: 'CIP-BTS12-CIP',
    pickupPointName: 'Substation Logistik Cipinang Indah',
    lat: '-6.2291',
    lng: '106.8974',
    timestamp: '24 Aug 2026, 09:15 WIB',
    status: 'Completed',
    volume: '520 Koli',
    driver: 'Ahmad Dani',
  },
  {
    routeCode: 'BKS-SUB04-BKS',
    pickupPointName: 'Gudang Transit Kalimalang',
    lat: '-6.2410',
    lng: '106.9812',
    timestamp: '24 Aug 2026, 10:05 WIB',
    status: 'Pending Check',
    volume: '210 Koli',
    driver: 'Joko Widodo',
  },
  {
    routeCode: 'DPK-MRG08-DPK',
    pickupPointName: 'Margonda Drop & Pickup Center',
    lat: '-6.3790',
    lng: '106.8285',
    timestamp: '24 Aug 2026, 11:20 WIB',
    status: 'Completed',
    volume: '440 Koli',
    driver: 'Rian Pratama',
  },
];

// STYLE GLASSMORPHISM 
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
};

// KOMPONEN ACCORDION RUTE 
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ ...glassStyle, padding: '12px', marginBottom: '8px' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)} style={{ borderBottom: 'none' }}>
        <span className="accordion-title">🚚 {rute.code}</span>
        <span className="accordion-metrics">
          <span>Load: <strong style={{ color: '#38bdf8' }}>{rute.load}</strong></span>
          <span className={`badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="acc-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px' }}>Total Stop Points:</span>
            <strong>{rute.points} Point</strong>
          </div>
          <div className="acc-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px' }}>Pure PU vs Drop:</span>
            <strong>{rute.puDrop}</strong>
          </div>
          <div className="acc-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px' }}>SLA On-Time:</span>
            <strong style={{ color: '#34d399' }}>{rute.sla}</strong>
          </div>
          <div className="acc-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px' }}>Rata-rata Delay:</span>
            <strong style={{ color: '#fbbf24' }}>{rute.avgDelay}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

// KOMPONEN ACCORDION POINT (DIKEMBALIKAN)
const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ ...glassStyle, padding: '12px', marginBottom: '8px' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)} style={{ borderBottom: 'none' }}>
        <span className="accordion-title">📍 {point.name}</span>
        <span className="accordion-metrics">
          <span className={`badge ${badgeClass}`}>{point.visit}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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

  // LOGIKA GPS GROUPING
  const groupedPins = routePinPointHistoryData.reduce((acc: any, curr) => {
    if (!acc[curr.routeCode]) acc[curr.routeCode] = [];
    acc[curr.routeCode].push(curr);
    return acc;
  }, {});
  const routeCodesList = Object.keys(groupedPins);

  const [selectedRouteCode, setSelectedRouteCode] = useState(routeCodesList[0]);
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState('2026-08-23');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const cacheKey = `ctl_data_${mode}_${selectedDate}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setDashboardData(JSON.parse(cachedData));
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
  const filteredRouteCodes = routeCodesList.filter(code => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  const getBadgeClass = (s: string) => !s ? 'badge-optimal' : s.includes('WARNING') ? 'badge-warning' : s.includes('CRITICAL') ? 'badge-critical' : 'badge-optimal';

  // KALENDER DIKEMBALIKAN
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

  // FUNGSI MEMBENTUK IFRAME GOOGLE MAPS UNTUK BANYAK TITIK
  const renderMapsUrl = () => {
    const points = groupedPins[selectedRouteCode];
    if (!points || points.length === 0) return '';
    
    if (points.length === 1) {
      return `https://maps.google.com/maps?q=${points[0].lat},${points[0].lng}&z=15&output=embed`;
    }
    
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    
    if (points.length === 2) {
      return `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
    } else {
      const waypoints = points.slice(1, points.length - 1).map((p: any) => `${p.lat},${p.lng}`).join('+to:');
      return `https://maps.google.com/maps?saddr=${origin}&daddr=${waypoints}+to:${destination}&output=embed`;
    }
  };

  return (
    <>
      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>SINKRONISASI DATA</div>
        </div>
      )}

      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ ...glassStyle, borderRadius: '0 24px 24px 0' }}>
        <h2><span>🧭 CONTROL TOWER</span></h2>
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

      <div className="main-content">
        <div className="top-bar" style={glassStyle}>
          <div className="brand-container">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="pulse-dot"></div>
            <div className="brand-text">
              <h1>CTL <span>COMMAND</span></h1>
              <span className="brand-sub">SERVER: PROD-JKT // SYNC-OK</span>
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
                <span className="role">Control Tower Ops</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-container">
          {/* KPI GRID DIKEMBALIKAN */}
          <div className="kpi-grid">
            <div className="kpi-card" style={glassStyle}><div className="title">Total Trip</div><div className="value">{dashboardData?.kpi?.tripCount || '0'}</div><div className="subtext">Unit Aktif</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Pure Pick-Up</div><div className="value">{dashboardData?.kpi?.totalPurePU || '0'}</div><div className="subtext">Pengambilan</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Pure Drop SS</div><div className="value">{dashboardData?.kpi?.totalPureDrop || '0'}</div><div className="subtext">Penurunan</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Total Workload</div><div className="value">{dashboardData?.kpi?.totalWorkloadEffort || '0'}</div><div className="subtext">Points Visit</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">SLA On-Time</div><div className="value">{dashboardData?.kpi?.overallSlaPct || '0'}%</div><div className="subtext">Aman (No Delay)</div></div>
            <div className="kpi-card" style={glassStyle}><div className="title">Real Load Factor</div><div className="value">{dashboardData?.kpi?.overallLoadPct || '0'}%</div><div className="subtext">Eq-PU Volume</div></div>
          </div>

          {/* 1. OVERVIEW (CHART LENGKAP) */}
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
                    <Bar data={{ labels: dashboardData.chartData.labels, datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: '#1f2937' }, ticks: { color: '#cbd5e1' } }, x: { grid: { display: false }, ticks: { color: '#cbd5e1' } } }, plugins: { legend: { display: false } } }} />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>
            </div>
          )}

          {/* 2. LOAD & SLA (DENGAN TABEL DESKTOP DIKEMBALIKAN) */}
          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}><h3>🚚 Load & SLA per Rute</h3></div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>RUTE</th><th>POINT</th><th>PURE PU / DROP</th><th>SLA %</th><th>AVG DELAY</th><th>NET LOAD %</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r: any, i) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.code}</td><td>{r.points}</td><td>{r.puDrop}</td><td>{r.sla}</td><td>{r.avgDelay}</td><td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.load}</td>
                        <td><span className={`badge ${getBadgeClass(r.status)}`}>{r.status}</span></td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (<tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data rute tidak ditemukan</td></tr>)}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredRoutes.map((r: any, i) => <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />)}
                </div>
              </div>
            </div>
          )}

          {/* 3. INFO POINT TASK (MENU INI SAYA KEMBALIKAN UTUH) */}
          {activeMenu === 'points' && (
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}><h3>📍 Info Point Task</h3></div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>NAMA POINT</th><th>VISIT</th><th>PURE PU / DROP SS</th><th>MB & BP DETAIL</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {filteredPoints.map((p: any, i) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.name}</td><td>{p.visit}</td><td>{p.puDrop}</td><td>{p.mbBp}</td>
                        <td><span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span></td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (<tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data point tidak ditemukan</td></tr>)}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredPoints.map((p: any, i) => <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />)}
                </div>
              </div>
            </div>
          )}

          {/* 4. GPS PINPOINT HISTORY (LOGIKA BARU GROUPING MAPS & LIST NAMA POINT) */}
          {activeMenu === 'geotag' && (
            <div className="card-panel" style={glassStyle}>
              <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                <h3>🗺️ History Titik Maps per Kode Rute</h3>
                <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* KOLOM KIRI: LIST RUTE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                  {filteredRouteCodes.map((code) => {
                    const isSelected = selectedRouteCode === code;
                    return (
                      <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '16px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>🚚 {code}</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Merekam {groupedPins[code].length} Titik Point</div>
                      </div>
                    );
                  })}
                </div>

                {/* KOLOM KANAN: JENDELA MAPS + DAFTAR TITIKNYA */}
                <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>📍 Visualisasi Peta: {selectedRouteCode}</span>
                  </div>
                  
                  {/* JENDELA MAPS */}
                  <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                    {selectedRouteCode ? (
                      <iframe width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" src={renderMapsUrl()}></iframe>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Pilih rute untuk melihat Maps</div>
                    )}
                  </div>

                  {/* KETERANGAN TITIK DI BAWAH MAPS AGAR NAMA POINT TETAP BISA DIBACA */}
                  <div style={{ padding: '12px 16px', maxHeight: '160px', overflowY: 'auto' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--app-muted)', marginBottom: '8px', display: 'block' }}>URUTAN TITIK TEREKAM:</span>
                    {groupedPins[selectedRouteCode]?.map((point: any, idx: number) => (
                      <div key={idx} style={{ fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <strong style={{ color: '#fff' }}>{idx + 1}. {point.pickupPointName}</strong>
                        <div style={{ color: '#94a3b8', marginTop: '2px' }}>Driver: {point.driver} | Waktu: {point.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
