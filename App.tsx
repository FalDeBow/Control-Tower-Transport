import React, { useState, useEffect, useRef } from 'react';
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
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(val).substring(0, 10);
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

// --- HELPER PARSE LATITUDE & LONGITUDE ---
const parseCoordinates = (locStr: any): [number, number] | null => {
  if (!locStr) return null;
  const str = String(locStr).trim();
  const parts = str.split(',');
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
  }
  return null;
};

// --- HELPER KAPASITAS ARMADA PRESISI (SATUAN: PCS/PAKET/RESI) ---
const getUnitCapacityBenchmark = (unitTypeStr: string, isBulky: boolean = false): number => {
  const type = String(unitTypeStr || '').toUpperCase().trim();
  
  if (isBulky) {
    if (type.includes('CDD-L') || type.includes('CDD LONG') || type.includes('CDDL')) return 4000;
    if (type.includes('CDD')) return 3500;
    if (type.includes('CDE-L') || type.includes('CDE LONG') || type.includes('CDEL')) return 2500;
    if (type.includes('CDE')) return 2100;
    if (type.includes('BLINDVAN') || type.includes('BLIND VAN') || type.includes('VAN')) return 1000;
    if (type.includes('MOTOR') || type.includes('R2')) return 300;
    return 1500;
  }

  if (type.includes('CDD-L') || type.includes('CDD LONG') || type.includes('CDDL')) return 2000;
  if (type.includes('CDD')) return 1800;
  if (type.includes('CDE-L') || type.includes('CDE LONG') || type.includes('CDEL')) return 1300;
  if (type.includes('CDE')) return 1200;
  if (type.includes('BLINDVAN') || type.includes('BLIND VAN') || type.includes('VAN') || type.includes('GRANMAX')) return 600;
  if (type.includes('MOTOR') || type.includes('R2')) return 150;
  return 600;
};

// --- ICON SVG ---
const Icons = {
  Menu: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'22px', height:'22px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
  Overview: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  Routes: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  Points: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  Crew: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Fleet: () => <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{width:'20px', height:'20px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
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
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Net Load: <strong style={{ color: rute.netLoadPeakPct > 100 ? '#f87171' : '#38bdf8' }}>{rute.netLoadPeakPct}%</strong></span>
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
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>PU vs DROP</span>
              <strong style={{ color: '#f8fafc' }}>{rute.pu} / {rute.drop} Pkt</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Peak Load</span>
              <strong style={{ color: '#fbbf24' }}>{rute.peakLoad} Pkt</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Target Capacity</span>
              <strong style={{ color: '#38bdf8' }}>{rute.routeTargetCapacity} Pkt</strong>
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
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Total Workload</span>
              <strong style={{ color: '#f8fafc' }}>{crew.totalWorkload} Pkt</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>SLA On-Time</span>
              <strong style={{ color: parseInt(crew.sla) >= 85 ? '#10b981' : '#f87171' }}>{crew.sla}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>PU / DROP</span>
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
          <span className={`badge ${badgeClass}`}>{point.kategori}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>ETA / ATA:</span>
              <strong style={{ color: '#f8fafc' }}>{point.eta} / {point.visit}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Jumlah Qty:</span>
              <strong style={{ color: '#38bdf8' }}>{point.qty} Pkt</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>MB / BP:</span>
              <strong style={{ color: '#fbbf24' }}>{point.mb} MB / {point.bp} BP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Status:</span>
              <strong style={{ color: point.status.includes('LATE') ? '#f87171' : '#34d399' }}>{point.status}</strong>
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
  
  const [dashboardData, setDashboardData] = useState<any>({
    kpi: { tripCount: 0, totalPurePU: 0, totalPureDrop: 0, totalWorkloadEffort: 0, overallSlaPct: 0, overallNetLoadRatePct: 0 },
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
  const [geoStatusFilter, setGeoStatusFilter] = useState('all');
  
  const [mode, setMode] = useState('monthly'); 
  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false); 
  const [selectedRouteCode, setSelectedRouteCode] = useState('');

  // --- REFS UNTUK LEAFLET MAP ---
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  // 0. LOAD LEAFLET CDN DYNAMICALLY
  useEffect(() => {
    if ((window as any).L) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // 1. FETCH RAW DATA WITH LOCALSTORAGE CACHING
  useEffect(() => {
    const fetchRawData = async () => {
      const CACHE_KEY = "transport_glass_raw_cache";
      
      const localData = localStorage.getItem(CACHE_KEY);
      if (localData) {
        try {
          const parsedCache = JSON.parse(localData);
          setRawGasData(parsedCache); 
          setIsLoading(false);
        } catch (e) {
          console.error("Cache parse error", e);
        }
      } else {
        setIsLoading(true);
      }

      try {
        const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwUC07JIZ7ASWJhy4VyeHqXPnDQd2IPhmCraXOz9xg2Lti4dz9TxvlrNRS-Je7_7fsW/exec";
        const response = await fetch(GAS_API_URL);
        const result = await response.json();
        
        if (result.status === "success" && result.data) {
          setRawGasData(result.data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(result.data));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRawData();
  }, []);

  // 2. KALKULASI UTAMA & PERHITUNGAN AKUMULASI RATA-RATA NET LOAD RATE %
  useEffect(() => {
    if (!rawGasData || rawGasData.length === 0) return;

    const currentYearStr = String(calendarViewDate.getFullYear());
    const currentMonthStr = String(calendarViewDate.getMonth() + 1).padStart(2, '0');

    const filtered = rawGasData.filter((d: any) => {
        const rawTgl = formatDateKey(d['Tanggal Ops'] || '');
        if (mode === 'monthly') {
          return rawTgl.startsWith(`${currentYearStr}-${currentMonthStr}`);
        }
        if (mode === 'daily') return rawTgl === selectedDate;
        if (mode === 'weekly') return isDateInSameWeek(rawTgl, selectedDate);
        return true;
    });

    let tripSet = new Set();
    let processedTripCapacities: Record<string, number> = {};

    let totalPurePU = 0;
    let totalPureDrop = 0;
    let totalMB = 0;
    let totalBP = 0;
    let onTimeCount = 0;

    let routeMap: any = {};
    let unitCapacityMap: any = {}; 
    let pointRows: any[] = [];
    
    let pickupMap: Record<string, number> = {}; 
    let crewMap: any = {}; 

    filtered.forEach((d: any) => {
      const rute = String(d['Kode Rute'] || 'UNASSIGNED').trim();
      const driver = String(d['Satmob/Driver'] || 'Driver Unassigned').trim();
      const helper = String(d['Asmob/Helper'] || 'Helper Unassigned').trim();
      const unitType = String(d['Tipe Unit'] || 'CDE-L').trim();
      
      const combinedInfo = (rute + ' ' + String(d['Keterangan'] || '') + ' ' + String(d['Pin Point'] || '')).toUpperCase();
      const isBulkyTask = combinedInfo.includes('BULKY') || combinedInfo.includes('KARUNG') || combinedInfo.includes('SUNTER') || rute.startsWith('STR-');

      const unitBenchmark = getUnitCapacityBenchmark(unitType, isBulkyTask);
      
      const pinPoint = String(d['Pin Point'] || 'Unknown').trim();
      const locationRaw = d['Location'] || d['Lokasi'] || '';
      const coords = parseCoordinates(locationRaw);

      const tgl = formatDateKey(d['Tanggal Ops'] || '');
      const dateRute = `${tgl}_${rute}_${driver}`;
      
      tripSet.add(dateRute);
      if (!processedTripCapacities[dateRute]) {
        processedTripCapacities[dateRute] = unitBenchmark;
      }

      const kategoriRaw = String(d['Kategori'] || '').toUpperCase().trim();
      const isDropKategori = kategoriRaw.includes('DROP') || kategoriRaw.includes('SS') || kategoriRaw.includes('HUB') || kategoriRaw.includes('DELIVERY');

      const qtyPerStop = Number(d['Jumlah PU']) || 0;
      const mbVal = Number(d['MB']) || 0;
      const bpVal = Number(d['BP']) || 0;

      let paketPU = 0;
      let paketDrop = 0;

      if (isDropKategori) {
        paketDrop = qtyPerStop;
      } else {
        paketPU = qtyPerStop;
      }

      const totalPointLoad = qtyPerStop + mbVal + bpVal;

      totalPurePU += paketPU;
      totalPureDrop += paketDrop;
      totalMB += mbVal;
      totalBP += bpVal;

      if (!isDropKategori && pinPoint !== 'Unknown') {
        pickupMap[pinPoint] = (pickupMap[pinPoint] || 0) + totalPointLoad;
      }

      if (!unitCapacityMap[unitType]) {
        unitCapacityMap[unitType] = { totalLoad: 0, tripCount: new Set(), routes: new Set(), benchmark: unitBenchmark };
      }
      unitCapacityMap[unitType].totalLoad += totalPointLoad;
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

      if (!routeMap[rute]) {
        routeMap[rute] = { 
          points: 0, pu: 0, drop: 0, mb: 0, bp: 0, 
          trips: new Map<string, number>(), onTime: 0, totalDelay: 0, delayCount: 0, drivers: new Set(),
          coordsList: []
        };
      }
      routeMap[rute].points++;
      routeMap[rute].trips.set(dateRute, unitBenchmark);
      routeMap[rute].drivers.add(`${driver} & ${helper}`);
      routeMap[rute].pu += paketPU;
      routeMap[rute].drop += paketDrop;
      routeMap[rute].mb += mbVal;
      routeMap[rute].bp += bpVal;
      
      if (coords) {
        routeMap[rute].coordsList.push({ name: pinPoint, coords, ata, status: delay > 0 ? 'LATE' : 'ON-TIME' });
      }

      if (delay <= 0) routeMap[rute].onTime++;
      if (delay > 0) { routeMap[rute].totalDelay += delay; routeMap[rute].delayCount++; }

      const crewKey = `${driver} | ${helper}`;
      if (!crewMap[crewKey]) {
          crewMap[crewKey] = {
              driver, helper, trips: new Set(), totalPoints: 0, totalPU: 0, totalDrop: 0, totalMB: 0, totalBP: 0, onTimePoints: 0
          };
      }
      crewMap[crewKey].trips.add(dateRute);
      crewMap[crewKey].totalPoints++;
      crewMap[crewKey].totalPU += paketPU;
      crewMap[crewKey].totalDrop += paketDrop;
      crewMap[crewKey].totalMB += mbVal;
      crewMap[crewKey].totalBP += bpVal;
      if (delay <= 0) crewMap[crewKey].onTimePoints++;

      pointRows.push({
         name: pinPoint,
         kategori: kategoriRaw || (isDropKategori ? 'DROP' : 'PU'),
         eta: eta,
         visit: ata,
         qty: qtyPerStop,
         mb: mbVal,
         bp: bpVal,
         totalLoad: totalPointLoad,
         status: delay > 0 ? `LATE ${delay}m` : 'ON-TIME',
         coords
      });
    });

    const tripCount = tripSet.size;
    const totalWorkloadEffort = filtered.length;
    const overallSlaPct = totalWorkloadEffort > 0 ? Math.round((onTimeCount / totalWorkloadEffort) * 100) : 0;
    
    const totalTargetCapacityAllTrips = Object.values(processedTripCapacities).reduce((a, b) => a + b, 0);

    let totalPeakVolumeAllRoutes = 0;
    Object.keys(routeMap).forEach(rKey => {
      const r = routeMap[rKey];
      totalPeakVolumeAllRoutes += Math.max(r.pu, r.drop) + r.mb + r.bp;
    });

    const overallNetLoadRatePct = totalTargetCapacityAllTrips > 0 
      ? Math.round((totalPeakVolumeAllRoutes / totalTargetCapacityAllTrips) * 100) 
      : 0;

    const routeRows = Object.keys(routeMap).map(rute => {
       const r = routeMap[rute];
       const sla = r.points > 0 ? Math.round((r.onTime / r.points) * 100) : 0;
       const avgDelay = r.delayCount > 0 ? Math.round(r.totalDelay / r.delayCount) : 0;
       
       const peakLoad = Math.max(r.pu, r.drop) + r.mb + r.bp;
       const totalWorkload = r.pu + r.drop + r.mb + r.bp;
       
       let routeTargetCapacity = 0;
       r.trips.forEach((capBenchmark: number) => {
         routeTargetCapacity += capBenchmark;
       });

       const netLoadPeakPct = routeTargetCapacity > 0 ? Math.round((peakLoad / routeTargetCapacity) * 100) : 0;
       const netLoadTotalPct = routeTargetCapacity > 0 ? Math.round((totalWorkload / routeTargetCapacity) * 100) : 0;

       let status = 'OPTIMAL';
       if (netLoadPeakPct > 100) status = 'OVERLOAD';
       else if (sla < 80) status = 'CRITICAL';
       else if (sla < 95) status = 'WARNING';

       return {
         code: rute, 
         points: r.points, 
         pu: r.pu,
         drop: r.drop,
         mb: r.mb,
         bp: r.bp,
         sla: `${sla}%`,
         avgDelay: avgDelay > 0 ? `+${avgDelay}m` : '0m', 
         peakLoad,
         totalWorkload,
         routeTargetCapacity,
         netLoadPeakPct, 
         netLoadTotalPct,
         status,
         assignedCrew: Array.from(r.drivers).join(', '),
         coordsList: r.coordsList
       };
    }).sort((a,b) => b.peakLoad - a.peakLoad);

    const crewRows = Object.keys(crewMap).map(key => {
        const c = crewMap[key];
        const totalWorkload = c.totalPU + c.totalDrop + c.totalMB + c.totalBP;
        const slaVal = c.totalPoints > 0 ? Math.round((c.onTimePoints / c.totalPoints) * 100) : 0;
        
        let grade = 'D (Underperform)';
        let badgeColor = 'badge-critical';
        
        if (slaVal >= 95 && totalWorkload > 200) { grade = 'A (Excellent)'; badgeColor = 'badge-optimal'; }
        else if (slaVal >= 85) { grade = 'B (Good)'; badgeColor = 'badge-warning'; }
        else if (slaVal >= 70) { grade = 'C (Average)'; badgeColor = 'badge-warning'; }

        return {
            driver: c.driver, helper: c.helper, tripCount: c.trips.size,
            points: c.totalPoints, loadPU: c.totalPU, loadDrop: c.totalDrop,
            totalWorkload, sla: `${slaVal}%`, grade, badgeColor
        };
    }).sort((a,b) => b.totalWorkload - a.totalWorkload);

    const topPickupPoints = Object.keys(pickupMap)
      .map(k => ({ name: k, load: pickupMap[k] }))
      .sort((a,b) => b.load - a.load)
      .slice(0, 10);

    const unitInsights = Object.keys(unitCapacityMap).map(uType => {
       const uData = unitCapacityMap[uType];
       const trips = uData.tripCount.size;
       const avgPerTrip = trips > 0 ? Math.round(uData.totalLoad / trips) : 0;
       const efficiency = Math.round((avgPerTrip / uData.benchmark) * 100);
       return { 
         type: uType, trips, totalLoad: uData.totalLoad, 
         avgPerTrip, efficiency, routesCount: uData.routes.size,
         benchmark: uData.benchmark
       };
    });

    const chartData = {
       labels: routeRows.map(r => r.code),
       workloads: routeRows.map(r => r.peakLoad),
       slas: routeRows.map(r => parseInt(r.sla.replace('%', '')))
    };

    setDashboardData({
       kpi: { 
         tripCount, 
         totalPurePU, 
         totalPureDrop, 
         totalWorkloadEffort, 
         overallSlaPct, 
         overallNetLoadRatePct
       },
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

  }, [rawGasData, mode, selectedDate, calendarViewDate]);

  // 3. EFFECT UNTUK INISIALISASI & RENDERING LEAFLET MAP
  useEffect(() => {
    if (activeMenu !== 'geotag' || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Inisialisasi Peta
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([-6.1751, 106.8272], 11);
      
      // Tile Layer CartoDB Dark Matter (Futuristik & Gratis)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // Ambil detail rute terpilih
    const selectedRoute = dashboardData.routeRows.find((r: any) => r.code === selectedRouteCode);
    const pointsList = selectedRoute?.coordsList || [];

    if (pointsList.length > 0) {
      const latLngs: [number, number][] = [];

      pointsList.forEach((pt: any, idx: number) => {
        latLngs.push(pt.coords);
        
        // Marker Checkpoint
        const marker = L.circleMarker(pt.coords, {
          radius: 8,
          fillColor: pt.status === 'LATE' ? '#f87171' : '#38bdf8',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; color: #0f172a;">
            <strong>Stop ${idx + 1}: ${pt.name}</strong><br/>
            <span>Status: ${pt.status}</span><br/>
            <span>Jam ATA: ${pt.ata || '-'}</span>
          </div>
        `);

        markersGroup.addLayer(marker);
      });

      // Garis Rute (Polyline)
      if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8'
        });
        markersGroup.addLayer(polyline);
      }

      // Auto-fit bounds ke seluruh titik rute
      map.fitBounds(markersGroup.getBounds(), { padding: [40, 40] });
    } else {
      // Default View Jakarta jika rute belum punya koordinat GPS
      map.setView([-6.1751, 106.8272], 11);
    }

    setTimeout(() => { map.invalidateSize(); }, 200);

  }, [activeMenu, selectedRouteCode, dashboardData]);

  const filteredRoutes = dashboardData.routeRows.filter((r: any) => r.code.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPoints = dashboardData.pointRows.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCrews = dashboardData.crewRows.filter((c: any) => 
      c.driver.toLowerCase().includes(crewSearchQuery.toLowerCase()) || 
      c.helper.toLowerCase().includes(crewSearchQuery.toLowerCase())
  );
  
  const filteredRouteCodes = dashboardData.routeRows.filter((r: any) => {
    const matchSearch = r.code.toLowerCase().includes(pinSearchQuery.toLowerCase());
    if (geoStatusFilter === 'all') return matchSearch;
    return matchSearch && r.status.toLowerCase() === geoStatusFilter.toLowerCase();
  }).map((r: any) => r.code);

  const getBadgeClass = (s: string) => {
    if (!s) return 'badge-optimal';
    if (s.includes('OVERLOAD')) return 'badge-critical';
    if (s.includes('CRITICAL')) return 'badge-critical';
    if (s.includes('WARNING')) return 'badge-warning';
    return 'badge-optimal';
  };

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

  const changeMonth = (offset: number) => {
    setCalendarViewDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setMonth(nextDate.getMonth() + offset);
      return nextDate;
    });
  };

  const renderCalendarKompleks = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const daysArr = [];
    for (let e = 0; e < firstDayIndex; e++) {
      daysArr.push(<div key={`emp-${e}`} className="cal-day-compact empty"></div>);
    }
    
    const mStr = String(month + 1).padStart(2, '0');
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      
      let isSelectedWeek = mode === 'weekly' && isDateInSameWeek(dateStr, selectedDate);
      let isSelectedDay = mode === 'daily' && dateStr === selectedDate;
      const classNames = `cal-day-compact ${isSelectedDay ? 'selected' : ''} ${isSelectedWeek ? 'selected-week' : ''}`;
      
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

  const getRankMedal = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return <span style={{ color: '#64748b', fontSize: '11px', display: 'inline-block', width: '16px', textAlign: 'center' }}>{idx + 1}</span>;
  };

  const selectedRouteDetails = dashboardData.routeRows.find((r: any) => r.code === selectedRouteCode);

  return (
    <>
      <style>{`
        html, body, #root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
        }

        .ambient-bg {
          position: fixed; inset: 0; z-index: -1;
          background: radial-gradient(circle at 15% 30%, rgba(14, 165, 233, 0.15) 0%, transparent 40%),
                      radial-gradient(circle at 85% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 40%), #070c1b;
        }
        .card-panel { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
        .kpi-card { background: rgba(17, 24, 39, 0.6) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.04); }
        .selected-week { background: rgba(14, 165, 233, 0.3) !important; color: #fff !important; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.5); }
        
        .dashboard-container {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        @media (min-width: 769px) {
          .sidebar-fixed {
            width: 64px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
            background: rgba(15, 23, 42, 0.95) !important; backdrop-filter: blur(8px);
            border-right: 1px solid rgba(255,255,255,0.05);
            display: flex; flex-direction: column; align-items: center; padding-top: 20px;
          }
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 16px 20px 16px 84px !important;
            transition: padding 0.3s;
          }
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
          .d-show-mobile { display: none !important; }
        }

        @media (max-width: 768px) {
          .sidebar-fixed { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 12px; width: 100%; box-sizing: border-box; }
          .d-none-mobile { display: none !important; }
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

        .calendar-grid-compact { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; text-align: center; margin-top: 4px; }
        .cal-head { font-size: 9px; color: #94a3b8; font-weight: bold; padding-bottom: 2px; }
        .cal-day-compact { font-size: 10px; padding: 4px 0; border-radius: 4px; cursor: pointer; color: #e2e8f0; background: rgba(0,0,0,0.2); transition: all 0.2s; }
        .cal-day-compact:hover { background: rgba(255,255,255,0.1); }
        .cal-day-compact.empty { background: transparent; pointer-events: none; }
        .cal-day-compact.selected { background: #0ea5e9 !important; color: #fff; font-weight: bold; }

        .row-1-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 16px;
          margin-bottom: 20px;
          align-items: stretch;
          width: 100% !important;
        }
        .kpi-grid-3x2 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, auto);
          gap: 12px;
        }

        .charts-grid-overview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
          width: 100% !important;
        }
        .top10-grid-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
          width: 100% !important;
        }

        @media (max-width: 1024px) {
          .row-1-grid { grid-template-columns: 1fr; }
          .charts-grid-overview { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .top10-grid-overview { grid-template-columns: 1fr !important; }
          .kpi-grid-3x2 { grid-template-columns: repeat(2, 1fr); }
        }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        .lb-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .lb-row:last-child { border-bottom: none; }
        .lb-rank { margin-right: 10px; font-size: 13px; }
        .lb-name { flex: 1; font-size: 11px; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lb-val { font-size: 11px; font-weight: bold; color: #38bdf8; margin-left: 8px; }
        .cal-nav-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 4px; cursor: pointer; padding: 2px 6px; font-size: 10px; }
        .cal-nav-btn:hover { background: rgba(14, 165, 233, 0.4); }
      `}</style>

      <div className="ambient-bg"></div>

      {isLoading && (
        <div id="loaderOverlay">
          <div className="spinner"></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '2px' }}>SINKRONISASI DATA</div>
        </div>
      )}

      {/* SLIDE MENU DINAMIS */}
      <div className={`slide-menu-overlay ${isSlideMenuOpen ? 'open' : ''}`} onClick={() => setIsSlideMenuOpen(false)}></div>
      <div className={`slide-menu ${isSlideMenuOpen ? 'open' : ''}`}>
        <h2 style={{ padding: '0 24px 20px', color: '#f8fafc', fontSize: '16px', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
          TRANSPORT GLASS
        </h2>
        <div className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`} onClick={() => handleMenuClick('overview')}><Icons.Overview /> <span>Overview</span></div>
        <div className={`nav-item ${activeMenu === 'routes' ? 'active' : ''}`} onClick={() => handleMenuClick('routes')}><Icons.Routes /> <span>Route Performance</span></div>
        <div className={`nav-item ${activeMenu === 'points' ? 'active' : ''}`} onClick={() => handleMenuClick('points')}><Icons.Points /> <span>Pickup Point</span></div>
        <div className={`nav-item ${activeMenu === 'crew' ? 'active' : ''}`} onClick={() => handleMenuClick('crew')}><Icons.Crew /> <span>Crew Matrix</span></div>
        <div className={`nav-item ${activeMenu === 'units' ? 'active' : ''}`} onClick={() => handleMenuClick('units')}><Icons.Fleet /> <span>Fleet Capacity</span></div>
        <div className={`nav-item ${activeMenu === 'geotag' ? 'active' : ''}`} onClick={() => handleMenuClick('geotag')}><Icons.GPS /> <span>GPS Live Maps</span></div>
      </div>

      {/* SIDEBAR FIXED PC */}
      <div className="sidebar-fixed">
        <button className="hamburger-btn-desktop" onClick={() => setIsSlideMenuOpen(true)}>
          <Icons.Menu />
        </button>
        <div className={`nav-item-icon ${activeMenu === 'overview' ? 'active' : ''}`} data-tooltip="Overview" onClick={() => handleMenuClick('overview')}><Icons.Overview /></div>
        <div className={`nav-item-icon ${activeMenu === 'routes' ? 'active' : ''}`} data-tooltip="Route Performance" onClick={() => handleMenuClick('routes')}><Icons.Routes /></div>
        <div className={`nav-item-icon ${activeMenu === 'points' ? 'active' : ''}`} data-tooltip="Pickup Point" onClick={() => handleMenuClick('points')}><Icons.Points /></div>
        <div className={`nav-item-icon ${activeMenu === 'crew' ? 'active' : ''}`} data-tooltip="Crew Matrix" onClick={() => handleMenuClick('crew')}><Icons.Crew /></div>
        <div className={`nav-item-icon ${activeMenu === 'units' ? 'active' : ''}`} data-tooltip="Fleet Capacity" onClick={() => handleMenuClick('units')}><Icons.Fleet /></div>
        <div className={`nav-item-icon ${activeMenu === 'geotag' ? 'active' : ''}`} data-tooltip="GPS Live Maps" onClick={() => handleMenuClick('geotag')}><Icons.GPS /></div>
      </div>

      <div className="main-content">
        
        <div className="top-bar">
          <div className="brand-container">
            <button className="mobile-menu-btn d-show-mobile" onClick={() => setIsSlideMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', marginRight: '10px', cursor: 'pointer' }}>☰</button>
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
          
          {/* BARIS 1: KALENDER DINAMIS DI KIRI & 6 KARTU KPI 3x2 DI KANAN */}
          <div className="row-1-grid">
             
             {/* Kalender Kompak Dinamis */}
             <div className="card-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--app-muted)' }}>PERIODE DATA & FILTER</span>
                   <div style={{ display: 'flex', gap: '6px' }}>
                     <button className={`mode-btn ${mode === 'monthly' ? 'active' : ''}`} onClick={() => setMode('monthly')} style={{ padding: '4px 8px', fontSize: '10px' }}>Bulan Ini</button>
                     <button className={`mode-btn ${mode === 'weekly' ? 'active' : ''}`} onClick={() => setMode('weekly')} style={{ padding: '4px 8px', fontSize: '10px' }}>Mingguan</button>
                     <button className={`mode-btn ${mode === 'daily' ? 'active' : ''}`} onClick={() => setMode('daily')} style={{ padding: '4px 8px', fontSize: '10px' }}>Harian</button>
                   </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>◀</button>
                       <span style={{ fontSize: '10px', color: '#e2e8f0', fontWeight: 'bold' }}>
                         🗓️ {calendarViewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                       </span>
                       <button className="cal-nav-btn" onClick={() => changeMonth(1)}>▶</button>
                     </div>
                     <span style={{ fontSize: '9px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', color: '#94a3b8' }} onClick={() => { setCalendarViewDate(new Date()); setSelectedDate(todayStr); setMode('monthly'); }}>Reset</span>
                   </div>
                   <div className="calendar-grid-compact">
                     <div className="cal-head">Min</div><div className="cal-head">Sen</div><div className="cal-head">Sel</div>
                     <div className="cal-head">Rab</div><div className="cal-head">Kam</div><div className="cal-head">Jum</div><div className="cal-head">Sab</div>
                     {renderCalendarKompleks()}
                   </div>
                </div>
             </div>

             {/* 6 Kartu KPI Grid 3x2 (Termasuk Net Load Rate %) */}
             <div className="kpi-grid-3x2">
                <div className="kpi-card"><div className="title">Total Trip</div><div className="value">{dashboardData.kpi.tripCount}</div><div className="subtext">Unit Aktif</div></div>
                <div className="kpi-card"><div className="title">PU</div><div className="value" style={{ color: '#0ea5e9' }}>{dashboardData.kpi.totalPurePU}</div><div className="subtext">Pengambilan (Pkt)</div></div>
                <div className="kpi-card"><div className="title">DROP</div><div className="value" style={{ color: '#10b981' }}>{dashboardData.kpi.totalPureDrop}</div><div className="subtext">Penurunan (Pkt)</div></div>
                <div className="kpi-card"><div className="title">Total Workload</div><div className="value">{dashboardData.kpi.totalWorkloadEffort}</div><div className="subtext">Points Visit</div></div>
                <div className="kpi-card"><div className="title">SLA On-Time</div><div className="value">{dashboardData.kpi.overallSlaPct}%</div><div className="subtext">Aman (No Delay)</div></div>
                <div className="kpi-card">
                  <div className="title">Net Load Rate %</div>
                  <div className="value" style={{ color: dashboardData.kpi.overallNetLoadRatePct > 100 ? '#f87171' : '#38bdf8' }}>
                    {dashboardData.kpi.overallNetLoadRatePct}%
                  </div>
                  <div className="subtext">Rata-rata Utilitas Armada</div>
                </div>
             </div>

          </div>

          {activeMenu === 'overview' && (
            <>
              {/* BARIS 2: DIAGRAM PIE & BALOK */}
              <div className="charts-grid-overview">
                <div className="card-panel" style={{ padding: '20px' }}>
                  <div className="panel-header" style={{ marginBottom: '12px' }}><h3>🍰 Distribusi Peak Load Rute</h3></div>
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

              {/* BARIS 3: TOP 10 OVERVIEW */}
              <div className="top10-grid-overview">
                
                <div className="card-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <Icons.Routes />
                    <h3 style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>Top 10 Peak Load Rute</h3>
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }} className="custom-scroll">
                    {dashboardData.routeRows.slice(0, 10).map((r: any, idx: number) => (
                      <div className="lb-row" key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="lb-rank">{getRankMedal(idx)}</span>
                          <span className="lb-name" style={{ fontFamily: 'monospace' }}>{r.code}</span>
                        </div>
                        <span className="lb-val" style={{ color: r.netLoadPeakPct > 100 ? '#f87171' : '#38bdf8' }}>{r.peakLoad} Pkt ({r.netLoadPeakPct}%)</span>
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
                    <h3 style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>Top 10 Crew Workload</h3>
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
                        <span className="lb-val" style={{ color: '#fbbf24' }}>{c.totalWorkload} Pkt</span>
                      </div>
                    ))}
                    {dashboardData.crewRows.length === 0 && <p style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Belum ada data kru.</p>}
                  </div>
                </div>

              </div>
            </>
          )}

          {activeMenu === 'routes' && (
            <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Route Performance Matrix</h3>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>{filteredRoutes.length} Rute Dipantau</span>
              </div>
              
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>RUTE</th>
                      <th>STOP</th>
                      <th>PU</th>
                      <th>DROP</th>
                      <th>MB</th>
                      <th>BP</th>
                      <th>PEAK LOAD</th>
                      <th>TARGET CAP</th>
                      <th>NET LOAD RATE %</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{r.code}</td>
                        <td>{r.points}</td>
                        <td style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{r.pu}</td>
                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>{r.drop}</td>
                        <td style={{ color: '#fbbf24' }}>{r.mb}</td>
                        <td style={{ color: '#e879f9' }}>{r.bp}</td>
                        <td style={{ color: r.netLoadPeakPct > 100 ? '#f87171' : '#f8fafc', fontWeight: 'bold' }}>{r.peakLoad} Pkt</td>
                        <td style={{ color: '#cbd5e1' }}>{r.routeTargetCapacity} Pkt</td>
                        <td style={{ color: r.netLoadPeakPct > 100 ? '#f87171' : '#38bdf8', fontWeight: 'bold' }}>{r.netLoadPeakPct}%</td>
                        <td><span className={`badge ${getBadgeClass(r.status)}`}>{r.status}</span></td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (<tr><td colSpan={10} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data rute tidak ditemukan</td></tr>)}
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
              <div className="panel-header" style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Pickup Point Hub</h3>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>Live Data</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                <table className="desktop-table-view" style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>NAMA POINT / SS</th>
                      <th>KATEGORI</th>
                      <th>ETA / ATA</th>
                      <th>JUMLAH QTY</th>
                      <th>MB</th>
                      <th>BP</th>
                      <th>TOTAL LOAD</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoints.map((p: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{p.name}</td>
                        <td><span className="badge badge-warning" style={{ fontSize: '9px' }}>{p.kategori}</span></td>
                        <td>{p.eta} / {p.visit}</td>
                        <td style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{p.qty} Pkt</td>
                        <td style={{ color: '#fbbf24' }}>{p.mb}</td>
                        <td style={{ color: '#e879f9' }}>{p.bp}</td>
                        <td style={{ color: '#f8fafc', fontWeight: 'bold' }}>{p.totalLoad} Pkt</td>
                        <td><span className={`badge ${p.status.includes('LATE') ? 'badge-critical' : 'badge-optimal'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (<tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: 'var(--app-muted)' }}>Data point tidak ditemukan</td></tr>)}
                  </tbody>
                </table>
                <div className="mobile-accordion-list">
                  {filteredPoints.map((p: any, i: number) => <PointAccordion key={i} point={p} badgeClass={p.status.includes('LATE') ? 'badge-critical' : 'badge-optimal'} />)}
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
                      <th>WORKLOAD (PU / DROP)</th>
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
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>Total: {c.totalWorkload} Pkt</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>PU: {c.loadPU} | DROP: {c.loadDrop}</span>
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
                      <span className={`badge ${u.efficiency > 100 ? 'badge-critical' : u.efficiency >= 80 ? 'badge-optimal' : 'badge-warning'}`}>
                        {u.efficiency}% Efficiency
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Trip Tugas:</span> <strong style={{ color: '#fff' }}>{u.trips} Trip</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Akumulasi Workload:</span> <strong style={{ color: '#38bdf8' }}>{u.totalLoad} Paket</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rata-rata per Trip:</span> <strong style={{ color: '#fbbf24' }}>{u.avgPerTrip} Pkt/Trip</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Standard Capacity:</span> <strong style={{ color: '#cbd5e1' }}>{u.benchmark} Pkt/Trip</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cakupan Rute:</span> <strong style={{ color: '#34d399' }}>{u.routesCount} Rute Unik</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'geotag' && (
            <div className="card-panel">
              <div className="panel-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ color: '#38bdf8', fontSize: '16px' }}>GPS Live & History Maps (Leaflet OpenStreetMap)</h3>
                  <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>Pemantauan rute interaktif, visualisasi lintasan checkpoint & status lokasi real-time</span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button className={`mode-btn ${geoStatusFilter === 'all' ? 'active' : ''}`} onClick={() => setGeoStatusFilter('all')} style={{ padding: '6px 10px', fontSize: '10px' }}>Semua</button>
                  <button className={`mode-btn ${geoStatusFilter === 'optimal' ? 'active' : ''}`} onClick={() => setGeoStatusFilter('optimal')} style={{ padding: '6px 10px', fontSize: '10px' }}>Optimal</button>
                  <button className={`mode-btn ${geoStatusFilter === 'warning' ? 'active' : ''}`} onClick={() => setGeoStatusFilter('warning')} style={{ padding: '6px 10px', fontSize: '10px' }}>Warning</button>
                  <button className={`mode-btn ${geoStatusFilter === 'critical' ? 'active' : ''}`} onClick={() => setGeoStatusFilter('critical')} style={{ padding: '6px 10px', fontSize: '10px' }}>Critical / Overload</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" placeholder="Cari Kode Rute..." value={pinSearchQuery} onChange={(e) => setPinSearchQuery(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none', width: '100%', fontFamily: 'monospace', marginBottom: '4px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '370px', overflowY: 'auto', paddingRight: '6px' }} className="custom-scroll">
                    {filteredRouteCodes.map((code: string) => {
                      const isSelected = selectedRouteCode === code;
                      const routeItem = dashboardData.routeRows.find((r: any) => r.code === code);
                      return (
                        <div key={code} onClick={() => setSelectedRouteCode(code)} style={{ padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid var(--app-accent)' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)' }}>
                          <div style={{ color: isSelected ? 'var(--app-accent)' : '#e2e8f0', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🚚 {code}</span>
                            <span className={`badge ${getBadgeClass(routeItem?.status)}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{routeItem?.status || 'OPTIMAL'}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--app-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Peak: {routeItem?.peakLoad || 0} Pkt ({routeItem?.netLoadPeakPct || 0}%)</span>
                            <span style={{ color: '#38bdf8' }}>{routeItem?.sla || '0%'} SLA</span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredRouteCodes.length === 0 && (<div style={{ padding: '20px', textAlign: 'center', color: 'var(--app-muted)', fontSize: '11px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>Rute tidak ditemukan.</div>)}
                  </div>
                </div>

                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', height: '420px', background: '#0b1329', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', zIndex: 10 }}>
                    <span style={{ color: 'var(--app-accent)', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>🎯 Rute: {selectedRouteCode || 'Pilih Rute'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Kru: <strong style={{ color: '#fbbf24' }}>{selectedRouteDetails?.assignedCrew || 'Unassigned'}</strong></span>
                      {selectedRouteCode && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedRouteCode} Jakarta Indonesia`)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '10px', background: '#0ea5e9', color: '#fff', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          Buka Google Maps ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* WIDGET PETA INTERAKTIF LEAFLET */}
                  <div 
                    ref={mapContainerRef} 
                    style={{ flex: 1, width: '100%', height: '100%', zIndex: 1 }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
