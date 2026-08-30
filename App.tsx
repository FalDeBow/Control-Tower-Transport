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

// --- HELPER FORMAT TANGGAL ---
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

const getWeekRange = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDay() || 7; 
  date.setHours(-24 * (day - 1)); 
  const start = new Date(date);
  date.setHours(24 * 6); 
  const end = new Date(date);
  return { start, end };
};

const isDateInSameWeek = (targetDateStr: string, selectedDateStr: string) => {
  if (!targetDateStr) return false;
  const targetDate = new Date(targetDateStr);
  const { start, end } = getWeekRange(selectedDateStr);
  return targetDate >= start && targetDate <= end;
};

// --- ICON SVG (RANGKA/OUTLINE) ---
const Icons = {
  Menu: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'22px', height:'22px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
  Overview: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  Fleet: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
  Routes: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  Crew: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Points: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  GPS: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>,
  Search: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'18px', height:'18px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
};

// --- KOMPONEN ACCORDION ---
const RouteAccordion = ({ rute, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="accordion-title" style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{rute.code}</span>
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

const CrewAccordion = ({ crew }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion-item" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span className="accordion-title" style={{ color: '#f8fafc', fontSize: '13px' }}>{crew.driver}</span>
           <span style={{ fontSize: '10px', color: '#94a3b8' }}>+ {crew.helper}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge ${crew.badgeColor}`}>{crew.grade}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Total Trip</span>
              <strong style={{ color: '#38bdf8' }}>{crew.tripCount}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Total Load</span>
              <strong style={{ color: '#f8fafc' }}>{crew.totalLoad} Pkt</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>SLA On-Time</span>
              <strong style={{ color: parseInt(crew.sla) >= 85 ? '#10b981' : '#f87171' }}>{crew.sla}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>PU / Drop</span>
              <strong style={{ color: '#cbd5e1' }}>{crew.loadPU} / {crew.loadDrop}</strong>
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
        <span className="accordion-title" style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.name}</span>
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
  
  // Inisialisasi safe state agar tidak pernah null
  const [dashboardData, setDashboardData] = useState<any>({
    kpi: { tripCount: 0, totalPurePU: 0, totalPureDrop: 0, totalWorkloadEffort: 0, overallSlaPct: 0, overallLoadPct: 0 },
    routeRows: [],
    crewRows: [],
    pointRows: [],
    topPickupPoints: [],
    chartData: { labels: [], workloads: [], slas: [] },
    unitInsights: []
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [crewSearchQuery, setCrewSearchQuery] = useState('');
  
  const [mode, setMode] = useState('monthly'); 
  const [selectedDate, setSelectedDate] = useState('2026-08-27');
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false); 
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

  // 2. OLAH DATA
  useEffect(() => {
    if (!rawGasData || rawGasData.length === 0) return;

    const filtered = rawGasData.filter((d: any) => {
        const rawTgl = formatDateKey(d['Tanggal Ops'] || '');
        if (mode === 'monthly') return true; 
        if (mode === 'daily') return rawTgl === selectedDate;
        if (mode === 'weekly') return isDateInSameWeek(rawTgl, selectedDate);
        return true;
    });

    let tripSet = new Set();
    let totalPurePU = 0;
    let totalPureDrop = 0;
    let onTimeCount = 0;
    let totalDelayMins = 0;
    let delayCount = 0;

    let routeMap: any = {};
    let unitCapacityMap: any = {}; 
    let pointRows: any[] = [];
    
    let pickupMap: Record<string, number> = {}; 
    let crewMap: any = {}; 

    filtered.forEach((d: any) => {
      const rute = String(d['Kode Rute'] || 'UNASSIGNED').trim();
      const driver = String(d['Satmob/Driver'] || 'Driver Unassigned').trim();
      const helper = String(d['Asmob/Helper'] || 'Helper Unassigned').trim();
      const unitType = String(d['Tipe Unit'] || 'Standard').trim();
      const pinPoint = String(d['Pin Point'] || 'Unknown').trim();
      const tgl = formatDateKey(d['Tanggal Ops'] || '');
      const dateRute = `${tgl}_${rute}_${driver}`;
      
      tripSet.add(dateRute);

      const kategori = String(d['Kategori'] || '').toLowerCase();
      const isPickUp = kategori.includes('pickup') || kategori.includes('pick');
      const isDrop = kategori.includes('ss') || kategori.includes('drop');
      const paket = Number(d['Jumlah PU']) || 0;
      
      if (isPickUp) totalPurePU += paket;
      if (isDrop) totalPureDrop += paket;

      if (isPickUp && pinPoint !== 'Unknown') {
          pickupMap[pinPoint] = (pickupMap[pinPoint] || 0) + paket;
      }

      if (!unitCapacityMap[unitType]) {
        unitCapacityMap[unitType] = { totalLoad: 0, tripCount: new Set(), routes: new Set() };
      }
      unitCapacityMap[unitType].totalLoad += paket;
      unitCapacityMap[unitType].tripCount.add(dateRute);
      unitCapacityMap[unitType].routes.add(rute);

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

      const crewKey = `${driver} | ${helper}`;
      if (!crewMap[crewKey]) {
          crewMap[crewKey] = {
              driver, helper, trips: new Set(), totalPoints: 0, totalPU: 0, totalDrop: 0, onTimePoints: 0
          };
      }
      crewMap[crewKey].trips.add(dateRute);
      crewMap[crewKey].totalPoints++;
      if (isPickUp) crewMap[crewKey].totalPU += paket;
      if (isDrop) crewMap[crewKey].totalDrop += paket;
      if (delay <= 0) crewMap[crewKey].onTimePoints++;

      pointRows.push({
         name: pinPoint,
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
          code: rute, points: r.points, puDrop: `${r.pu} / ${r.drop}`, sla: `${sla}%`,
          avgDelay: avgDelay > 0 ? `+${avgDelay}m` : '0m', load: load, status: status
       };
    }).sort((a,b) => b.load - a.load);

    const crewRows = Object.keys(crewMap).map(key => {
        const c = crewMap[key];
        const totalLoad = c.totalPU + c.totalDrop;
        const slaVal = c.totalPoints > 0 ? Math.round((c.onTimePoints / c.totalPoints) * 100) : 0;
        
        let grade = 'D (Underperform)';
        let badgeColor = 'badge-critical';
        
        if (slaVal >= 95 && totalLoad > 50) { grade = 'A (Excellent)'; badgeColor = 'badge-optimal'; }
        else if (slaVal >= 85) { grade = 'B (Good)'; badgeColor = 'badge-warning'; }
        else if (slaVal >= 70) { grade = 'C (Average)'; badgeColor = 'badge-warning'; }

        return {
            driver: c.driver, helper: c.helper, tripCount: c.trips.size,
            points: c.totalPoints, loadPU: c.totalPU, loadDrop: c.totalDrop,
            totalLoad: totalLoad, sla: `${slaVal}%`, grade: grade, badgeColor: badgeColor
        };
    }).sort((a,b) => b.totalLoad - a.totalLoad);

    const topPickupPoints = Object.keys(pickupMap)
      .map(k => ({ name: k, load: pickupMap[k] }))
      .sort((a,b) => b.load - a.load)
      .slice(0, 10);

    const unitInsights = Object.keys(unitCapacityMap).map(uType => {
       const uData = unitCapacityMap[uType];
       const trips = uData.tripCount.size;
       const avgPerTrip = trips > 0 ? Math.round(uData.totalLoad / trips) : 0;
       const efficiency = Math.min(100, Math.round((avgPerTrip / 150) * 100));
       return { 
         type: uType, trips, totalLoad: uData.totalLoad, 
         avgPerTrip, efficiency, routesCount: uData.routes.size 
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
       crewRows,
       pointRows,
       topPickupPoints,
       chartData,
       unitInsights,
    });

    if (routeRows.length > 0 && !selectedRouteCode) {
       setSelectedRouteCode(routeRows[0].code);
    }

  }, [rawGasData, mode, selectedDate]);

  const filteredRoutes = dashboardData.routeRows.filter((r: any) => r.code.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPoints = dashboardData.pointRows.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCrews = dashboardData.crewRows.filter((c: any) => 
      c.driver.toLowerCase().includes(crewSearchQuery.toLowerCase()) || 
      c.helper.toLowerCase().includes(crewSearchQuery.toLowerCase())
  );
  const validRouteCodes = dashboardData.routeRows.map((r: any) => r.code);
  const filteredRouteCodes = validRouteCodes.filter((code: string) => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  const getBadgeClass = (s: string) => !s ? 'badge-optimal' : s.includes('WARNING') ? 'badge-warning' : s.includes('CRITICAL') ? 'badge-critical' : 'badge-optimal';

  const glassDoughnutData = {
    labels: dashboardData.chartData.labels,
    datasets: [{
      data: dashboardData.chartData.workloads,
      backgroundColor: ['rgba(14, 165, 233, 0.75)', 'rgba(56, 189, 248, 0.75)', 'rgba(16, 185, 129, 0.75)', 'rgba(245, 158, 11, 0.75)', 'rgba(99, 102, 241, 0.75)', 'rgba(236, 72, 153, 0.75)'],
      borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 2, hoverOffset: 6
    }]
  };

  const glassDoughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '78%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 }, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#38bdf8', bodyColor: '#f8fafc', borderColor: 'rgba(56, 189, 248, 0.3)', borderWidth: 1, padding: 12, cornerRadius: 8 }
    }
  };

  const glassBarData = {
    labels: dashboardData.chartData.labels,
    datasets: [{
      label: 'SLA (%)', data: dashboardData.chartData.slas,
      backgroundColor: 'rgba(14, 165, 233, 0.65)', borderColor: 'rgba(56, 189, 248, 0.9)',
      borderWidth: { top: 2, right: 0, bottom: 0, left: 0 }, borderRadius: 6,
    }]
  };

  const glassBarOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#38bdf8', bodyColor: '#f8fafc', borderColor: 'rgba(56, 189, 248, 0.3)', borderWidth: 1, padding: 12, cornerRadius: 8 } }
  };

  const renderCalendarUtuh = () => {
    const daysArr = [];
    const emptyStart = 6; 
    
    for(let e = 0; e < emptyStart; e++) {
      daysArr.push(<div key={`emp-${e}`} className="cal-day empty"></div>);
    }
    for (let d = 1; d <= 31; d++) {
      let dateStr = `2026-08-${d < 10 ? '0' + d : d}`;
      let isSelectedWeek = mode === 'weekly' && isDateInSameWeek(dateStr, selectedDate);
      let isSelectedDay = mode === 'daily' && dateStr === selectedDate;
      const classNames = `cal-day ${isSelectedDay ? 'selected' : ''} ${isSelectedWeek ? 'selected-week' : ''}`;
      daysArr.push(
        <div key={d} className={classNames} onClick={() => { if(mode === 'monthly') setMode('daily'); setSelectedDate(dateStr); }}>
          {d}
        </div>
      );
    }
    return daysArr;
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    setIsSlideMenuOpen(false);
  };

  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    const searchQueryMaps = encodeURIComponent(`${selectedRouteCode} Area Jakarta Indonesia`);
    return `https://maps.google.com/maps?q=${searchQueryMaps}&z=13&output=embed`;
  };

  const getRankMedal = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return <span style={{ color: '#64748b', fontSize: '11px', display: 'inline-block', width: '16px', textAlign: 'center' }}>{idx + 1}</span>;
  };

  return (
    <>
      <style>{`
        .ambient-bg {
          position: fixed; inset: 0; z-index: -1;
          background: radial-gradient(circle at 15% 30%, rgba(14, 165, 233, 0.15) 0%, transparent 40%),
                      radial-gradient(circle at 85% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 40%), #070c1b;
        }
        .card-panel { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
        .kpi-card { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.04); }
        .selected-week { background: rgba(14, 165, 233, 0.3) !important; color: #fff !important; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.5); }
        
        @media (max-width: 768px) {
          .d-none-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .d-show-mobile { display: none !important; }
        }

        @media (min-width: 769px) {
          .sidebar-fixed {
            width: 64px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;
            background: rgba(15, 23, 42, 0.95) !important; border-right: 1px solid rgba(255,255,255,0.05);
            display: flex; flex-direction: column; align-items: center; padding-top: 20px;
          }
          .main-content { margin-left: 64px; transition: margin-left 0.3s; padding: 20px; }
          .nav-item-icon { 
            display: flex; justify-content: center; align-items: center; width: 40px; height: 40px; 
            border-radius: 10px; margin: 8px 0; color: #cbd5e1; cursor: pointer; transition: all 0.2s; position: relative;
          }
          .nav-item-icon:hover { background: rgba(255,255,255,0.1); color: #f8fafc; }
          .nav-item-icon.active { background: rgba(14, 165, 233, 0.15); color: #38bdf8; }
          
          .nav-item-icon::after {
            content: attr(data-tooltip); position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
            margin-left: 10px; background: rgba(15, 23, 42, 0.95); padding: 6px 12px; border-radius: 6px;
            color: #f8fafc; font-size: 11px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s, margin-left 0.2s;
            border: 1px solid rgba(255,255,255,0.1); z-index: 100;
          }
          .nav-item-icon:hover::after { opacity: 1; margin-left: 16px; }
          .hamburger-btn-desktop { 
            background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 10px; border-radius: 8px; margin-bottom: 20px;
          }
          .hamburger-btn-desktop:hover { background: rgba(255,255,255,0.1); }
        }

        .slide-menu-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1001; 
          opacity: 0; visibility: hidden; transition: all 0.3s;
        }
        .slide-menu-overlay.open { opacity: 1; visibility: visible; }
        .slide-menu {
          position: fixed; left: -280px; top: 0; bottom: 0; width: 260px; background: rgba(15, 23, 42, 0.98); 
          z-index: 1002; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-right: 1px solid rgba(255,255,255,0.1);
          padding: 20px 0;
        }
        .slide-menu.open { left: 0; }
        .slide-menu .nav-item { 
          display: flex; align-items: center; padding: 14px 24px; gap: 16px; color: #cbd5e1; cursor: pointer; transition: background 0.2s; 
        }
        .slide-menu .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .slide-menu .nav-item.active { background: rgba(14, 165, 233, 0.15); color: #38bdf8; border-right: 3px solid #38bdf8; }

        .top-filter-bar {
           display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; 
           background: rgba(17, 24, 39, 0.5); border: 1px solid rgba(255,255,255,0.06); 
           backdrop-filter: blur(10px); padding: 16px 24px; border-radius: 14px; margin-bottom: 20px; gap: 24px;
        }

        .calendar-grid-wrapper { flex: 1; min-width: 250px; max-width: 320px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; margin-top: 8px; }
        .cal-head { font-size: 10px; color: #94a3b8; font-weight: bold; padding-bottom: 4px; }
        .cal-day { font-size: 11px; padding: 6px 0; border-radius: 6px; cursor: pointer; color: #e2e8f0; background: rgba(0,0,0,0.2); transition: all 0.2s; }
        .cal-day:hover { background: rgba(255,255,255,0.1); }
        .cal-day.empty { background: transparent; pointer-events: none; }
        .cal-day.selected { background: #0ea5e9 !important; color: #fff; font-weight: bold; }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        .lb-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .lb-row:last-child { border-bottom: none; }
        .lb-rank { margin-right: 10px; font-size: 13px; }
        .lb-name { flex: 1; font-size: 11px; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lb-val { font-size: 11px; font-weight: bold; color: #38bdf8; margin-left: 8px; }

        @media (max-width: 1024px) {
           .responsive-grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; }
        }
      `}</style>

      <div className="ambient-bg"></div>

      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>SINKRONISASI DATA</div>
        </div>
      )}

      <div className={`slide-menu-overlay ${isSlideMenuOpen ? 'open' : ''}`} onClick={() => setIsSlideMenuOpen(false)}></div>
      <div className={`slide-menu ${isSlideMenuOpen ? 'open' : ''}`}>
        <h2 style={{ padding: '0 24px 20px', color: '#f8fafc', fontSize: '16px', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
          TRANSPORT GLASS
        </h2>
        <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}><Icons.Overview /> <span>Overview</span></div>
        <div className={`nav-item ${activeMenu === 'units' ? 'active' : ''}`} onClick={() => handleMenuClick('units')}><Icons.Fleet /> <span>Fleet Capacity</span></div>
        <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}><Icons.Routes /> <span>Routes Performance</span></div>
        <div className={`nav-item ${activeMenu === 'crew' ? 'active' : ''}`} onClick={() => handleMenuClick('crew')}><Icons.Crew /> <span>Crew Matrix</span></div>
        <div className={`nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}><Icons.Points /> <span>Point Hub</span></div>
        <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}><Icons.GPS /> <span>GPS Live Maps</span></div>
      </div>

      <div className="sidebar-fixed d-none-mobile">
        <button className="hamburger-btn-desktop" onClick={() => setIsSlideMenuOpen(true)}>
          <Icons.Menu />
        </button>
        <div className={`nav-item-icon ${activeMenu === 'overview' ? 'active' : ''}`} data-tooltip="Overview" onClick={() => handleMenuClick('overview')}><Icons.Overview /></div>
        <div className={`nav-item-icon ${activeMenu === 'units' ? 'active' : ''}`} data-tooltip="Fleet Capacity" onClick={() => handleMenuClick('units')}><Icons.Fleet /></div>
        <div className={`nav-item-icon ${activeMenu === 'routes' ? 'active' : ''}`} data-tooltip="Routes Performance" onClick={() => handleMenuClick('routes')}><Icons.Routes /></div>
        <div className={`nav-item-icon ${activeMenu === 'crew' ? 'active' : ''}`} data-tooltip="Crew Matrix" onClick={() => handleMenuClick('crew')}><Icons.Crew /></div>
        <div className={`nav-item-icon ${activeMenu === 'points' ? 'active' : ''}`} data-tooltip="Point Hub" onClick={() => handleMenuClick('points')}><Icons.Points /></div>
        <div className={`nav-item-icon ${activeMenu === 'geotag' ? 'active' : ''}`} data-tooltip="GPS Live Maps" onClick={() => handleMenuClick('geotag')}><Icons.GPS /></div>
      </div>

      <div className="main-content">
        
        <div className="top-bar">
          <div className="brand-container">
            <button className="mobile-menu-btn d-show-mobile" onClick={() => setIsSlideMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', marginRight: '10px' }}>☰</button>
            <div className="pulse-dot"></div>
            <div className="brand-text">
              <h1>TRANSPORT <span>GLASS</span></h1>
              <span className="brand-sub">SERVER: PROD-JKT // SYNC-OK</span>
            </div>
          </div>

          <div className="global-search-container">
            <span className="global-search-icon"><Icons.Search /></span>
            <input type="text" className="global-search" placeholder="Pencarian cepat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                <span className="role">Control Tower</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-container">
          
          <div className="top-filter-bar">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--app-muted)' }}>PERIODE DATA & FILTER</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`mode-btn ${mode === 'monthly' ? 'active' : ''}`} onClick={() => setMode('monthly')}>Bulan Ini</button>
                  <button className={`mode-btn ${mode === 'weekly' ? 'active' : ''}`} onClick={() => setMode('weekly')}>Mingguan</button>
                  <button className={`mode-btn ${mode === 'daily' ? 'active' : ''}`} onClick={() => setMode('daily')}>Harian</button>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  Status: Menampilkan data {mode === 'monthly' ? 'keseluruhan' : mode === 'weekly' ? 'minggu terpilih' : 'hari terpilih'}
                </div>
             </div>
             
             <div className="calendar-grid-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 'bold' }}>🗓️ Agustus 2026</span>
                  <span style={{ fontSize: '9px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }} onClick={() => setMode('monthly')}>Reset</span>
                </div>
                <div className="calendar-grid">
                  <div className="cal-head">Min</div><div className="cal-head">Sen</div><div className="cal-head">Sel</div>
                  <div className="cal-head">Rab</div><div className="cal-head">Kam</div><div className="cal-head">Jum</div><div className="cal-head">Sab</div>
                  {renderCalendarUtuh()}
                </div>
             </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card"><div className="title">Total Trip</div><div className="value">{dashboardData.kpi.tripCount}</div><div className="subtext">Unit Aktif</div></div>
            <div className="kpi-card"><div className="title">Pure Pick-Up</div><div className="value" style={{ color: '#0ea5e9' }}>{dashboardData.kpi.totalPurePU}</div><div className="subtext">Pengambilan (Pkt)</div></div>
            <div className="kpi-card"><div className="title">Pure Drop SS</div><div className="value" style={{ color: '#10b981' }}>{dashboardData.kpi.totalPureDrop}</div><div className="subtext">Penurunan (Pkt)</div></div>
            <div className="kpi-card"><div className="title">Total Workload</div><div className="value">{dashboardData.kpi.totalWorkloadEffort}</div><div className="subtext">Points Visit</div></div>
            <div className="kpi-card"><div className="title">SLA On-Time</div><div className="value">{dashboardData.kpi.overallSlaPct}%</div><div className="subtext">Aman (No Delay)</div></div>
            <div className="kpi-card"><div className="title">Real Load Factor</div><div className="value">{dashboardData.kpi.overallLoadPct}%</div><div className="subtext">Eq-PU Volume</div></div>
          </div>

          {activeMenu === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }} className="responsive-grid-3">
                
                <div className="card-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Icons.Routes />
                    <h3 style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>Top 10 Rute</h3>
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }} className="custom-scroll">
                    {dashboardData.routeRows.slice(0, 10).map((r: any, idx: number) => (
                      <div className="lb-row" key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="lb-rank">{getRankMedal(idx)}</span>
                          <span className="lb-name" style={{ fontFamily: 'monospace' }}>{r.code}</span>
                        </div>
                        <span className="lb-val">{r.load} Pkt</span>
                      </div>
                    ))}
                    {dashboardData.routeRows.length === 0 && <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data rute.</p>}
                  </div>
                </div>

                <div className="card-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Icons.Points />
                    <h3 style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>Top 10 Pick-Up Point</h3>
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }} className="custom-scroll">
                    {dashboardData.topPickupPoints.map((p: any, idx: number) => (
                      <div className="lb-row" key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="lb-rank">{getRankMedal(idx)}</span>
                          <span className="lb-name" title={p.name}>{p.name}</span>
                        </div>
                        <span className="lb-val" style={{ color: '#10b981' }}>{p.load} Pkt</span>
                      </div>
                    ))}
                    {dashboardData.topPickupPoints.length === 0 && <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data pick-up.</p>}
                  </div>
                </div>

                <div className="card-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Icons.Crew />
                    <h3 style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>Top 10 Crew</h3>
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }} className="custom-scroll">
                    {dashboardData.crewRows.slice(0, 10).map((c: any, idx: number) => (
                      <div className="lb-row" key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                          <span className="lb-rank">{getRankMedal(idx)}</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="lb-name" style={{ lineHeight: '1.2' }} title={c.driver}>{c.driver}</span>
                            <span style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.2' }}>{c.helper}</span>
                          </div>
                        </div>
                        <span className="lb-val" style={{ color: '#fbbf24' }}>{c.totalLoad} Pkt</span>
                      </div>
                    ))}
                    {dashboardData.crewRows.length === 0 && <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data kru.</p>}
                  </div>
                </div>

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div className="card-panel" style={{ padding: '20px' }}>
                  <div className="panel-header" style={{ marginBottom: '12px' }}><h3>🍰 Distribusi Workload Rute</h3></div>
                  {dashboardData.chartData.labels.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                      <Doughnut data={glassDoughnutData} options={glassDoughnutOptions} />
                    </div>
                  ) : <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data grafik untuk ditampilkan</p>}
                </div>

                <div className="card-panel" style={{ padding: '20px' }}>
                  <div className="panel-header" style={{ marginBottom: '12px' }}><h3>📈 SLA On-Time per Rute (%)</h3></div>
                  {dashboardData.chartData.labels.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '240px' }}>
                      <Bar data={glassBarData} options={glassBarOptions} />
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
                  Fleet Capacity Analysis
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Evaluasi utilitas beban, kapasitas muatan, dan sebaran rute per jenis armada</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {dashboardData.unitInsights.map((u: any, idx: number) => (
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Route SLA Performance</h3>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>{filteredRoutes.length} Rute Dipantau</span>
              </div>
              
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

          {activeMenu === 'crew' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ color: '#38bdf8', fontSize: '16px' }}>Crew Performance Matrix</h3>
                  <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Skoring kinerja kombinasi Satmob & Asmob berdasar kapasitas angkut dan ketepatan SLA</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Cari Driver / Helper..." 
                  value={crewSearchQuery} 
                  onChange={(e) => setCrewSearchQuery(e.target.value)} 
                  style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none', width: '100%', maxWidth: '240px' }} 
                />
              </div>

              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>SATMOB (DRIVER)</th>
                      <th>ASMOB (HELPER)</th>
                      <th>TRIP / POINT</th>
                      <th>LOAD (PU / DROP)</th>
                      <th>SLA %</th>
                      <th>GRADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrews.map((c: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#f8fafc', fontWeight: 'bold' }}>{c.driver}</td>
                        <td style={{ color: '#cbd5e1' }}>{c.helper}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{c.tripCount} Trip</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{c.points} Titik Stop</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>Total: {c.totalLoad} Pkt</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>PU: {c.loadPU} | Drop: {c.loadDrop}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: parseInt(c.sla) >= 85 ? '#10b981' : '#f87171' }}>{c.sla}</strong>
                            <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: c.sla, height: '100%', background: parseInt(c.sla) >= 85 ? '#10b981' : '#f87171' }}></div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${c.badgeColor}`}>{c.grade}</span></td>
                      </tr>
                    ))}
                    {filteredCrews.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--app-muted)' }}>Data kru tidak ditemukan</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredCrews.map((c: any, i: number) => <CrewAccordion key={i} crew={c} />)}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'points' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Point Hub (Pickup & Drop)</h3>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>Live Data</span>
              </div>
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
                <h3>GPS Live & History Maps</h3>
                <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none', width: '100%', maxWidth: '240px', fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                  {filteredRouteCodes.map((code: string) => {
                    const isSelected = selectedRouteCode === code;
                    const routeItem = dashboardData.routeRows.find((r: any) => r.code === code);
                    return (
                      <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid var(--app-accent)' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: isSelected ? 'var(--app-accent)' : '#e2e8f0', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace', marginBottom: '4px' }}>🚚 {code}</div>
                        <div style={{ fontSize: '10px', color: 'var(--app-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Stop Points: {routeItem?.points || '0'} Point</span>
                          <span style={{ color: routeItem?.status?.includes('WARNING') ? '#fbbf24' : '#10b981', fontWeight: 'bold' }}>{routeItem?.status || 'Optimal'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRouteCodes.length === 0 && (<div style={{ padding: '20px', textAlign: 'center', color: 'var(--app-muted)', fontSize: '11px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>Kode rute tidak ditemukan dalam sistem.</div>)}
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', height: '420px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--app-accent)', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>🎯 Rute Terpilih: {selectedRouteCode || 'Pilih Rute'}</span>
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
