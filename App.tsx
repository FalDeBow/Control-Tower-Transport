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

// --- HELPER FORMAT TANGGAL ROBUST ---
const formatDateKey = (val: any) => {
  if (!val) return '';
  const str = String(val);
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return str.substring(0, 10);
};

// --- KOMPONEN ACCORDION (MOBILE) ---
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="accordion-title" style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>🚚 {rute.code}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Load: <strong style={{ color: '#38bdf8' }}>{rute.load}</strong></span>
          <span className={`badge ${badgeClass}`}>{rute.status}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Total Stop</span>
              <strong style={{ color: '#f8fafc' }}>{rute.points} Pts</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>PU vs Drop</span>
              <strong style={{ color: '#f8fafc' }}>{rute.puDrop}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>SLA On-Time</span>
              <strong style={{ color: '#34d399' }}>{rute.sla}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Avg Delay</span>
              <strong style={{ color: '#f87171' }}>{rute.avgDelay}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="accordion-title" style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {point.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge ${badgeClass}`}>{point.visit}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>PU / Drop SS:</span>
              <strong style={{ color: '#f8fafc' }}>{point.puDrop}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>MB & BP:</span>
              <strong style={{ color: '#fbbf24' }}>{point.mbBp}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Status:</span>
              <strong style={{ color: '#34d399' }}>{point.status}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [rawGasData, setRawGasData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [mode, setMode] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState('2026-08-27');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRouteCode, setSelectedRouteCode] = useState('');

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  // 1. FETCH RAW DATA
  useEffect(() => {
    const fetchRawData = async () => {
      setIsLoading(true);
      try {
        const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwUC07JIZ7ASWJhy4VyeHqXPnDQd2IPhmCraXOz9xg2Lti4dz9TxvlrNRS-Je7_7fsW/exec";
        const response = await fetch(GAS_API_URL);
        const result = await response.json();
        
        if (result.status === "success" && result.data) {
          setRawGasData(result.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRawData();
  }, []);

  // 2. OLAH & ANALISIS DATA LEVEL LANJUTAN (AI TREND & UNIT CAPACITY)
  useEffect(() => {
    if (!rawGasData || rawGasData.length === 0) return;

    const filtered = mode === 'monthly'
      ? rawGasData
      : rawGasData.filter((d: any) => {
          const rawTgl = d['Tanggal Ops'] || '';
          return formatDateKey(rawTgl) === selectedDate;
        });

    let tripSet = new Set();
    let totalPurePU = 0;
    let totalPureDrop = 0;
    let onTimeCount = 0;
    let totalDelayMins = 0;
    let delayCount = 0;

    let routeMap: any = {};
    let unitCapacityMap: any = {}; 
    let pointTrendMap: any = {}; // Untuk analisis tren naik/turun per Pickup Point
    let pointRows: any[] = [];

    rawGasData.forEach((d: any) => {
      const pinPoint = String(d['Pin Point'] || 'Unknown').trim();
      const tgl = formatDateKey(d['Tanggal Ops'] || '');
      const paket = Number(d['Jumlah PU']) || 0;

      if (!pointTrendMap[pinPoint]) {
        pointTrendMap[pinPoint] = { dates: {}, total: 0 };
      }
      if (!pointTrendMap[pinPoint].dates[tgl]) {
        pointTrendMap[pinPoint].dates[tgl] = 0;
      }
      pointTrendMap[pinPoint].dates[tgl] += paket;
      pointTrendMap[pinPoint].total += paket;
    });

    filtered.forEach((d: any) => {
      const rute = String(d['Kode Rute'] || 'UNASSIGNED').trim();
      const driver = String(d['Satmob/Driver'] || '-').trim();
      const unitType = String(d['Tipe Unit'] || 'Standard').trim();
      const tgl = d['Tanggal Ops'] || '';
      const dateRute = `${tgl}_${rute}_${driver}`;
      tripSet.add(dateRute);

      const kategori = String(d['Kategori'] || '').toLowerCase();
      const isPickUp = kategori.includes('pickup') || kategori.includes('pick');
      const isDrop = kategori.includes('ss') || kategori.includes('drop');
      
      const paket = Number(d['Jumlah PU']) || 0;
      
      if (isPickUp) totalPurePU += paket;
      if (isDrop) totalPureDrop += paket;

      // Unit Capacity Tracking
      if (!unitCapacityMap[unitType]) {
        unitCapacityMap[unitType] = { totalLoad: 0, tripCount: new Set(), routes: new Set() };
      }
      unitCapacityMap[unitType].totalLoad += paket;
      unitCapacityMap[unitType].tripCount.add(dateRute);
      unitCapacityMap[unitType].routes.add(rute);

      // SLA
      const eta = d['ETA'] ? String(d['ETA']) : '-';
      const ata = d['ATA'] ? String(d['ATA']) : '-';
      let delay = 0;
      
      if (eta !== '-' && ata !== '-' && eta.includes(':') && ata.includes(':')) {
         const [eh, em] = eta.split(':').map(Number);
         const [th, tm] = ata.split(':').map(Number);
         if (!isNaN(eh) && !isNaN(th)) {
           delay = (th * 60 + tm) - (eh * 60 + em);
         }
      }
      
      if (delay <= 0) onTimeCount++;
      if (delay > 0) {
          totalDelayMins += delay;
          delayCount++;
      }

      if (!routeMap[rute]) routeMap[rute] = { points: 0, pu: 0, drop: 0, onTime: 0, totalDelay: 0, delayCount: 0 };
      routeMap[rute].points++;
      if (isPickUp) routeMap[rute].pu += paket;
      if (isDrop) routeMap[rute].drop += paket;
      if (delay <= 0) routeMap[rute].onTime++;
      if (delay > 0) { routeMap[rute].totalDelay += delay; routeMap[rute].delayCount++; }

      pointRows.push({
         name: d['Pin Point'] || 'Unknown',
         visit: ata,
         puDrop: `${isPickUp ? paket : 0} / ${isDrop ? paket : 0}`,
         mbBp: `${d['MB'] || 0} / ${d['BP'] || 0}`,
         status: delay > 0 ? `LATE ${delay}m` : 'ON-TIME'
      });
    });

    const tripCount = tripSet.size;
    const totalWorkloadEffort = filtered.length;
    const overallSlaPct = totalWorkloadEffort > 0 ? Math.round((onTimeCount / totalWorkloadEffort) * 100) : 0;
    const overallLoadPct = tripCount > 0 ? Math.min(100, Math.round(((totalPurePU + totalPureDrop) / (tripCount * 150)) * 100)) : 0;

    const routeRows = Object.keys(routeMap).map(rute => {
       const r = routeMap[rute];
       const sla = r.points > 0 ? Math.round((r.onTime / r.points) * 100) : 0;
       const avgDelay = r.delayCount > 0 ? Math.round(r.totalDelay / r.delayCount) : 0;
       const load = r.pu + r.drop;
       let status = 'OPTIMAL';
       if (sla < 80) status = 'CRITICAL';
       else if (sla < 95) status = 'WARNING';

       return {
          code: rute,
          points: r.points,
          puDrop: `${r.pu} / ${r.drop}`,
          sla: `${sla}%`,
          avgDelay: avgDelay > 0 ? `+${avgDelay}m` : '0m',
          load: load,
          status: status
       };
    }).sort((a,b) => b.load - a.load);

    // AI Point Trend Analysis (Naik / Turun)
    const pointTrendHighlights = Object.keys(pointTrendMap).map(pointName => {
      const pData = pointTrendMap[pointName];
      const dates = Object.keys(pData.dates).sort();
      let trend = 'STABLE';
      let diff = 0;
      if (dates.length >= 2) {
        const latestVal = pData.dates[dates[dates.length - 1]];
        const prevVal = pData.dates[dates[dates.length - 2]];
        diff = latestVal - prevVal;
        if (diff > 0) trend = 'UP';
        else if (diff < 0) trend = 'DOWN';
      }
      return {
        name: pointName,
        total: pData.total,
        recentChange: diff,
        trend
      };
    }).sort((a, b) => Math.abs(b.recentChange) - Math.abs(a.recentChange)).slice(0, 5);

    // AI Unit Insights
    const unitInsights = Object.keys(unitCapacityMap).map(uType => {
       const uData = unitCapacityMap[uType];
       const trips = uData.tripCount.size;
       const avgPerTrip = trips > 0 ? Math.round(uData.totalLoad / trips) : 0;
       const efficiency = Math.min(100, Math.round((avgPerTrip / 150) * 100));
       return { 
         type: uType, 
         trips, 
         totalLoad: uData.totalLoad, 
         avgPerTrip, 
         efficiency,
         routesCount: uData.routes.size 
       };
    });

    const chartData = {
       labels: routeRows.map(r => r.code),
       workloads: routeRows.map(r => r.load),
       slas: routeRows.map(r => parseInt(r.sla.replace('%', '')))
    };

    setDashboardData({
       kpi: { tripCount, totalPurePU, totalPureDrop, totalWorkloadEffort, overallSlaPct, overallLoadPct },
       routeRows,
       pointRows,
       chartData,
       unitInsights,
       pointTrendHighlights
    });

    if (routeRows.length > 0 && !selectedRouteCode) {
       setSelectedRouteCode(routeRows[0].code);
    }

  }, [rawGasData, mode, selectedDate]);

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
        <div key={d} className={`cal-cell-mini ${mode === 'daily' && dateStr === selectedDate ? 'selected' : ''}`} onClick={() => { setMode('daily'); setSelectedDate(dateStr); }}>
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
    const searchQueryMaps = encodeURIComponent(`${selectedRouteCode} Area Jakarta Indonesia`);
    return `https://maps.google.com/maps?q=${searchQueryMaps}&z=13&output=embed`;
  };

  return (
    <>
      <style>{`
        .ambient-bg {
          position: fixed; inset: 0; z-index: -1;
          background: radial-gradient(circle at 15% 30%, rgba(14, 165, 233, 0.15) 0%, transparent 40%),
                      radial-gradient(circle at 85% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
                      #070c1b;
        }
        .card-panel { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }
        .sidebar { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; }
        .kpi-card { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; }
      `}</style>

      <div className="ambient-bg"></div>

      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>
            SINKRONISASI DATA
          </div>
        </div>
      )}

      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <h2>
          <svg style={{ width: '24px', height: '24px', color: 'var(--app-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.08V12" />
          </svg>
          <span style={{ marginLeft: '8px', flex: 1, letterSpacing: '1.5px' }}>TR-GLASS</span>
        </h2>

        <div className="nav-menu">
          <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}>📊 Dashboard Overview</div>
          <div className={`nav-item ${activeMenu === 'units' ? 'active' : ''}`} onClick={() => handleMenuClick('units')}>🚐 AI Unit Analytics</div>
          <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}>🚚 Load & SLA</div>
          <div className={`nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}>📍 Info Point Task</div>
          <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}>🗺️ GPS History</div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <label style={{ fontSize: '10px', color: 'var(--app-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>📅 PERIODE ANALISIS</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button className={`mode-btn ${mode === 'monthly' ? 'active' : ''}`} onClick={() => setMode('monthly')}>📈 Bulanan</button>
            <button className={`mode-btn ${mode === 'daily' ? 'active' : ''}`} onClick={() => setMode('daily')}>📅 Harian</button>
          </div>
          <div className="sidebar-calendar">
            <div className="cal-header-mini">
              <span>Agustus 2026</span>
              <span style={{ fontSize: '9px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }} onClick={() => setMode('monthly')}>Reset</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((hari) => <div key={hari} className="cal-day-lbl">{hari}</div>)}
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content" style={{ WebkitFontSmoothing: 'antialiased' }}>
        
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
            <input type="text" className="global-search" placeholder="Cari rute, point..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          
          <div className="kpi-grid">
            <div className="kpi-card"><div className="title">Total Trip</div><div className="value">{dashboardData?.kpi?.tripCount || '0'}</div><div className="subtext">Unit Aktif</div></div>
            <div className="kpi-card"><div className="title">Pure Pick-Up</div><div className="value" style={{ color: '#0ea5e9' }}>{dashboardData?.kpi?.totalPurePU || '0'}</div><div className="subtext">Pengambilan (Pkt)</div></div>
            <div className="kpi-card"><div className="title">Pure Drop SS</div><div className="value" style={{ color: '#10b981' }}>{dashboardData?.kpi?.totalPureDrop || '0'}</div><div className="subtext">Penurunan (Pkt)</div></div>
            <div className="kpi-card"><div className="title">Total Workload</div><div className="value">{dashboardData?.kpi?.totalWorkloadEffort || '0'}</div><div className="subtext">Points Visit</div></div>
            <div className="kpi-card"><div className="title">SLA On-Time</div><div className="value">{dashboardData?.kpi?.overallSlaPct || '0'}%</div><div className="subtext">Aman (No Delay)</div></div>
            <div className="kpi-card"><div className="title">Real Load Factor</div><div className="value">{dashboardData?.kpi?.overallLoadPct || '0'}%</div><div className="subtext">Eq-PU Volume</div></div>
          </div>

          {activeMenu === 'overview' && (
            <>
              {/* HIGHLIGHT AI: TREN PARCEL NAIK / TURUN DI PICKUP POINT */}
              <div className="card-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                <div className="panel-header" style={{ marginBottom: '14px' }}>
                  <h3 style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔥 AI Trend Spotlight: Fluktuasi Parcel di Pickup Point
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Analisis perbandingan volume parsel terbaru terhadap periode sebelumnya</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {dashboardData?.pointTrendHighlights?.map((pt: any, idx: number) => {
                    const isUp = pt.trend === 'UP';
                    const isDown = pt.trend === 'DOWN';
                    return (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {pt.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Total Akumulasi: <strong style={{ color: '#fff' }}>{pt.total} Pkt</strong></div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: isUp ? 'rgba(16, 185, 129, 0.1)' : isDown ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isUp ? '#34d399' : isDown ? '#f87171' : '#cbd5e1' }}>
                            {isUp ? `📈 Naik +${pt.recentChange}` : isDown ? `📉 Turun ${pt.recentChange}` : '⚖️ Stabil'}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--app-muted)' }}>Tren Realtime</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!dashboardData?.pointTrendHighlights || dashboardData.pointTrendHighlights.length === 0) && (
                    <div style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum cukup data historis untuk mendeteksi tren.</div>
                  )}
                </div>
              </div>

              {/* GRAFIK OVERVIEW (FULL KONTEN) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div className="card-panel">
                  <div className="panel-header"><h3>🍰 Distribusi Workload Seluruh Rute</h3></div>
                  {dashboardData?.chartData?.labels?.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                      <Doughnut data={{ labels: dashboardData.chartData.labels, datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6', '#14b8a6'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 10 } } } } }} />
                    </div>
                  ) : <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data rute untuk ditampilkan</p>}
                </div>

                <div className="card-panel">
                  <div className="panel-header"><h3>📈 SLA On-Time per Rute (%)</h3></div>
                  {dashboardData?.chartData?.labels?.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                      <Bar data={{ labels: dashboardData.chartData.labels, datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } }, x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10 } } } }, plugins: { legend: { display: false } } }} />
                    </div>
                  ) : <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data SLA untuk ditampilkan</p>}
                </div>
              </div>
            </>
          )}

          {activeMenu === 'units' && (
            <div className="card-panel" style={{ padding: '24px' }}>
              <div className="panel-header" style={{ marginBottom: '16px' }}>
                <h3 style={{ color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚐 Analisis Mendalam Tipe Unit Kendaraan (AI Fleet Capacity)
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Evaluasi utilitas beban, kapasitas muatan, dan sebaran rute per jenis unit armada</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {dashboardData?.unitInsights?.map((u: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '14px' }}>🚐 {u.type}</span>
                      <span className={`badge ${u.efficiency >= 80 ? 'badge-optimal' : 'badge-warning'}`}>{u.efficiency}% Efisiensi</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Trip Tugas:</span> <strong style={{ color: '#fff' }}>{u.trips} Trip</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Akumulasi Muatan:</span> <strong style={{ color: '#38bdf8' }}>{u.totalLoad} Paket</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rata-rata per Trip:</span> <strong style={{ color: '#fbbf24' }}>{u.avgPerTrip} Pkt/Trip</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cakupan Rute:</span> <strong style={{ color: '#34d399' }}>{u.routesCount} Rute Unik</strong></div>
                    </div>

                    <div style={{ fontSize: '11px', padding: '8px 10px', borderRadius: '6px', background: u.efficiency >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: u.efficiency >= 80 ? '#34d399' : '#fbbf24' }}>
                      {u.efficiency >= 80 ? '✨ Utilitas armada sangat efektif dan seimbang.' : '⚠️ Unit beroperasi di bawah kapasitas maksimal, jadwalkan restrukturisasi rute.'}
                    </div>
                  </div>
                ))}
                {(!dashboardData?.unitInsights || dashboardData.unitInsights.length === 0) && (
                  <div style={{ color: 'var(--app-muted)', fontSize: '12px' }}>Memuat data analisis unit kendaraan...</div>
                )}
              </div>
            </div>
          )}

          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}><h3>🚚 Load & SLA per Rute</h3></div>
              
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>RUTE</th><th>POINT</th><th>PU / DROP</th><th>SLA %</th><th>AVG DELAY</th><th>NET LOAD (PKT)</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{r.code}</td>
                        <td>{r.points}</td><td>{r.puDrop}</td><td>{r.sla}</td><td style={{ color: '#f87171' }}>{r.avgDelay}</td>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.load}</td>
                        <td><span className={`badge ${getBadgeClass(r.status)}`}>{r.status}</span></td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (<tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data rute tidak ditemukan</td></tr>)}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredRoutes.map((r: any, i: number) => <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />)}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'points' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}><h3>📍 Info Point Task</h3></div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>NAMA POINT / SS</th><th>VISIT</th><th>PU / DROP</th><th>MB & BP DETAIL</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {filteredPoints.map((p: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.name}</td>
                        <td>{p.visit}</td><td>{p.puDrop}</td><td style={{ color: '#fbbf24' }}>{p.mbBp}</td>
                        <td><span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span></td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (<tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data point tidak ditemukan</td></tr>)}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredPoints.map((p: any, i: number) => <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />)}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'geotag' && (
            <div className="card-panel">
              <div className="panel-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3>🗺️ History Jalur Maps per Rute</h3>
                <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none', width: '100%', maxWidth: '240px', fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                  {filteredRouteCodes.map((code: string) => {
                    const isSelected = selectedRouteCode === code;
                    const routeItem = dashboardData?.routeRows?.find((r: any) => r.code === code);
                    return (
                      <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid var(--app-accent)' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: isSelected ? 'var(--app-accent)' : '#e2e8f0', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace', marginBottom: '4px' }}>🚚 {code}</div>
                        <div style={{ fontSize: '10px', color: 'var(--app-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Stop Points: {routeItem?.points || '0'} Point</span>
                          <span style={{ color: routeItem?.status?.includes('WARNING') ? '#fbbf24' : '#34d399', fontWeight: 'bold' }}>{routeItem?.status || 'Optimal'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRouteCodes.length === 0 && (<div style={{ padding: '20px', textAlign: 'center', color: 'var(--app-muted)', fontSize: '11px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>Kode rute tidak ditemukan dalam sistem.</div>)}
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', height: '420px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--app-accent)', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>🎯 Rute Terpilih: {selectedRouteCode || 'Pilih Rute'}</span>
                    <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', color: 'var(--app-muted)', letterSpacing: '0.5px' }}>Auto-Search Engine</span>
                  </div>
                  <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                    {selectedRouteCode ? (
                      <iframe width="100%" height="100%" style={{ border: 0, position: 'absolute', top: 0, left: 0 }} allowFullScreen loading="lazy" src={renderMapsUrl()}></iframe>
                    ) : (<div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>Pilih rute untuk melihat Maps</div>)}
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
