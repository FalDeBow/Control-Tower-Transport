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

// TINTED FROSTED GLASS - Elegan, transparan, dan teks tetap tajam
const glassStyle = {
  background: 'rgba(15, 23, 42, 0.88)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

// KOMPONEN ACCORDION RUTE (MOBILE)
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ ...glassStyle, borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)} style={{ borderBottom: 'none' }}>
        <span className="accordion-title" style={{ color: '#38bdf8', fontFamily: 'monospace' }}>🚚 {rute.code}</span>
        <span className="accordion-metrics">
          <span>Load: <strong style={{ color: '#38bdf8' }}>{rute.load}</strong></span>
          <span className={`badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total Stop Points:</span>
            <strong style={{ display: 'block', fontSize: '12px', color: '#f8fafc' }}>{rute.points} Point</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pure PU vs Drop:</span>
            <strong style={{ display: 'block', fontSize: '12px', color: '#f8fafc' }}>{rute.puDrop}</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>SLA On-Time:</span>
            <strong style={{ display: 'block', fontSize: '12px', color: '#34d399' }}>{rute.sla}</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rata-rata Delay:</span>
            <strong style={{ display: 'block', fontSize: '12px', color: '#fbbf24' }}>{rute.avgDelay}</strong>
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
    <div className="accordion-item" style={{ ...glassStyle, borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)} style={{ borderBottom: 'none' }}>
        <span className="accordion-title" style={{ color: '#38bdf8' }}>📍 {point.name}</span>
        <span className="accordion-metrics">
          <span className={`badge ${badgeClass}`}>{point.visit}</span>
          <span style={{ fontSize: '10px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="acc-detail-row">
            <span style={{ color: '#94a3b8' }}>Pure PU / Drop SS:</span>
            <strong>{point.puDrop}</strong>
          </div>
          <div className="acc-detail-row">
            <span style={{ color: '#94a3b8' }}>Bagging MB & BP:</span>
            <strong>{point.mbBp}</strong>
          </div>
          <div className="acc-detail-row">
            <span style={{ color: '#94a3b8' }}>Status Transaksi:</span>
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
      const cacheKey = `transport_glass_v4_${mode}_${selectedDate}`;
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

  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    return `https://maps.google.com/maps?q=-6.1754,106.8272&z=14&output=embed`;
  };

  return (
    <>
      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '2px' }}>
            LOADING TRANSPORT GLASS
          </div>
        </div>
      )}

      {/* Mobile Overlay (Dikelola murni oleh CSS index.css) */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={glassStyle}>
        <h2>
          <span>🛡️ TRANSPORT GLASS</span>
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
            🗺️ GPS Pinpoint History
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
          <div className="sidebar-calendar" style={{ ...glassStyle, borderRadius: '12px', padding: '10px' }}>
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
        <div className="top-bar" style={glassStyle}>
          <div className="brand-container">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="pulse-dot"></div>
            <div className="brand-text">
              <h1>
                TRANSPORT <span style={{ color: '#38bdf8' }}>GLASS</span>
              </h1>
              <span className="brand-sub">NODE: SECURE-JKT // TRANSPARENT-OPS</span>
            </div>
          </div>

          <div className="global-search-container">
            <span className="global-search-icon">🔍</span>
            <input
              type="text"
              className="global-search"
              placeholder="Cari rute, point, atau driver..."
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
                <span className="role">Operations Lead</span>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTAINER */}
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
                    <Doughnut
                      data={{
                        labels: dashboardData.chartData.labels,
                        datasets: [{
                          data: dashboardData.chartData.workloads,
                          backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'],
                          borderWidth: 0
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }}
                    />
                  </div>
                ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
              </div>

              <div className="card-panel" style={glassStyle}>
                <div className="panel-header"><h3>📈 SLA On-Time (%)</h3></div>
                {dashboardData?.chartData ? (
                  <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                    <Bar
                      data={{
                        labels: dashboardData.chartData.labels,
                        datasets: [{
                          label: 'SLA (%)',
                          data: dashboardData.chartData.slas,
                          backgroundColor: '#0ea5e9',
                          borderRadius: 4
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3>🚚 Load & SLA per Rute</h3>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>RUTE</th>
                      <th>POINT</th>
                      <th>PURE PU / DROP</th>
                      <th>SLA %</th>
                      <th>AVG DELAY</th>
                      <th>NET LOAD %</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{r.code}</td>
                        <td>{r.points}</td>
                        <td>{r.puDrop}</td>
                        <td style={{ color: '#34d399', fontWeight: 600 }}>{r.sla}</td>
                        <td style={{ color: '#fbbf24' }}>{r.avgDelay}</td>
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
            <div className="card-panel" style={{ ...glassStyle, padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3>📍 Info Point Task</h3>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>NAMA POINT</th>
                      <th>VISIT</th>
                      <th>PURE PU / DROP SS</th>
                      <th>MB & BP DETAIL</th>
                      <th>STATUS</th>
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
            <div className="card-panel" style={glassStyle}>
              <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3>🗺️ History Jalur Maps per Rute</h3>
                <input
                  type="text"
                  placeholder="Cari Kode Rute..."
                  value={pinSearchQuery}
                  onChange={(e) => setPinSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '11px',
                    outline: 'none',
                    width: '240px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {filteredRouteCodes.map((code: string) => {
                    const isSelected = selectedRouteCode === code;
                    const routeItem = filteredRoutes.find((r: any) => r.code === code);
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
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)'
                        }}
                      >
                        <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace', marginBottom: '4px' }}>
                          🚚 {code}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--app-muted)' }}>
                          Total Stop Points: {routeItem?.points || '0'} Point • Status: {routeItem?.status || 'Optimal'}
                        </div>
                      </div>
                    );
                  })}
                  {filteredRouteCodes.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--app-muted)', fontSize: '11px' }}>
                      Kode rute tidak ditemukan dalam sistem.
                    </div>
                  )}
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', height: '420px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      🎯 Rute Terpilih: {selectedRouteCode || 'Pilih Rute'}
                    </span>
                  </div>
                  <div style={{ flex: 1, width: '100%' }}>
                    {selectedRouteCode ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        src={renderMapsUrl()}
                      ></iframe>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                        Pilih rute untuk melihat Maps
                      </div>
                    )}
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
