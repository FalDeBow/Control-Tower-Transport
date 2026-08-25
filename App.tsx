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

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

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
    pickupPointName: 'Substation Logistik Cipinang Indah',
    lat: '-6.2291',
    lng: '106.8974',
    timestamp: '24 Aug 2026, 09:15 WIB',
    status: 'Completed',
    volume: '520 Koli',
    driver: 'Budi Santoso',
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
];

// EFEK LIQUID GLASS (GLASSMORPHISM)
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  padding: '16px',
  color: '#fff',
};

// MENU LOAD & SLA (DIPERBARUI LEBIH RAPI)
const RouteAccordion = ({ rute, badgeClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ ...glassStyle, marginBottom: '12px', padding: '12px 16px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>🚚 {rute.code}</span>
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Load: {rute.load}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div style={{ 
          marginTop: '16px', 
          paddingTop: '16px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total Stop Points</span>
            <strong style={{ fontSize: '12px' }}>{rute.points} Point</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pure PU vs Drop</span>
            <strong style={{ fontSize: '12px' }}>{rute.puDrop}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>SLA On-Time</span>
            <strong style={{ fontSize: '12px', color: '#34d399' }}>{rute.sla}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rata-rata Delay</span>
            <strong style={{ fontSize: '12px', color: '#fbbf24' }}>{rute.avgDelay}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // LOGIC MAPS HISTORY KELOMPOK KODE RUTE
  const groupedRoutes = routePinPointHistoryData.reduce((acc, curr) => {
    if (!acc[curr.routeCode]) acc[curr.routeCode] = [];
    acc[curr.routeCode].push(curr);
    return acc;
  }, {});
  const routeCodesList = Object.keys(groupedRoutes);
  const [selectedRouteCode, setSelectedRouteCode] = useState(routeCodesList[0]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true); 
      try {
        const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwUC07JIZ7ASWJhy4VyeHqXPnDQd2IPhmCraXOz9xg2Lti4dz9TxvlrNRS-Je7_7fsW/exec";
        const response = await fetch(`${GAS_API_URL}?action=getInitialData&tanggal=SEMUA%20TANGGAL&rute=SEMUA%20RUTE`);
        const data = await response.json();
        if (data && data.dashboard) {
          setDashboardData(data.dashboard);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const filteredRoutes = dashboardData?.routeRows?.filter((r) => r.code.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredRouteCodes = routeCodesList.filter((code) => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  const getBadgeClass = (s) => !s ? 'badge-optimal' : s.includes('WARNING') ? 'badge-warning' : s.includes('CRITICAL') ? 'badge-critical' : 'badge-optimal';

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  // URL PEMBENTUK RUTE PERJALANAN MAPS
  const renderIframeUrl = () => {
    const points = groupedRoutes[selectedRouteCode];
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `https://maps.google.com/maps?q=${points[0].lat},${points[0].lng}&z=15&output=embed`;
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    if (points.length === 2) return `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
    const waypoints = points.slice(1, points.length - 1).map(p => `${p.lat},${p.lng}`).join('+to:');
    return `https://maps.google.com/maps?saddr=${origin}&daddr=${waypoints}+to:${destination}&output=embed`;
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

      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ ...glassStyle, borderRadius: '0 24px 24px 0', border: 'none', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <h2><span>🧭 CONTROL TOWER</span></h2>
        <div className="nav-menu">
          <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}>📊 Dashboard Overview</div>
          <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}>🚚 Load & SLA</div>
          <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}>🗺️ GPS Pinpoint History</div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar" style={{ ...glassStyle, marginBottom: '24px' }}>
          <div className="brand-container">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="brand-text">
              <h1>CTL <span>COMMAND</span></h1>
              <span className="brand-sub">SERVER: PROD-JKT // SYNC-OK</span>
            </div>
          </div>
          <div className="global-search-container">
            <span className="global-search-icon">🔍</span>
            <input type="text" className="global-search" placeholder="Cari data..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="top-bar-right">
            <div className="ops-clock">
              <span className="time">{timeString} WIB</span>
              <span className="date">{dateString}</span>
            </div>
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
          {/* 1. OVERVIEW */}
          {activeMenu === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '16px' }}>
              <div style={glassStyle}>
                <h3>🍰 Distribusi Workload</h3>
                <div style={{ position: 'relative', width: '100%', height: '240px', marginTop: '16px' }}>
                  {dashboardData?.chartData ? (
                     <Doughnut data={{ labels: dashboardData.chartData.labels, datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                  ) : <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading grafik...</p>}
                </div>
              </div>
            </div>
          )}

          {/* 2. LOAD & SLA */}
          {activeMenu === 'routes' && (
            <div style={{ ...glassStyle, padding: '20px' }}>
              <h3>🚚 Load & SLA per Rute</h3>
              <div style={{ marginTop: '16px' }}>
                <div className="mobile-accordion-list">
                  {filteredRoutes.map((r, i) => (
                    <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. GPS PINPOINT HISTORY */}
          {activeMenu === 'geotag' && (
            <div style={glassStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                <h3>🗺️ History Jalur Maps per Rute</h3>
                <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', minWidth: '200px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                  {filteredRouteCodes.map((code) => {
                    const pointsCount = groupedRoutes[code].length;
                    const isSelected = selectedRouteCode === code;
                    return (
                      <div
                        key={code}
                        onClick={() => setSelectedRouteCode(code)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)',
                        }}
                      >
                        <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>🚚 {code}</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Merekam {pointsCount} Titik Point</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', overflow: 'hidden', height: '500px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>📍 Visualisasi Rute: {selectedRouteCode}</span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Driver: {groupedRoutes[selectedRouteCode]?.[0]?.driver}
                    </div>
                  </div>
                  <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                    {selectedRouteCode ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                        allowFullScreen
                        loading="lazy"
                        src={renderIframeUrl()}
                      ></iframe>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Pilih rute untuk melihat Maps</div>
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
