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
    <div className="mb-3 rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-mono text-sm text-sky-400 font-bold tracking-wider">🚚 {rute.code}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300">Load: <strong className="text-sky-400">{rute.load}</strong></span>
          <span className={`px-2 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold ${badgeClass}`}>{rute.status}</span>
          <span className="text-[10px] text-slate-400">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-slate-300 space-y-2">
          <div className="flex justify-between"><span>Total Stop Points:</span><strong className="text-white">{rute.points} Point</strong></div>
          <div className="flex justify-between"><span>Pure PU vs Drop:</span><strong className="text-white">{rute.puDrop}</strong></div>
          <div className="flex justify-between"><span>SLA On-Time:</span><strong className="text-white">{rute.sla}</strong></div>
          <div className="flex justify-between"><span>Rata-rata Delay:</span><strong className="text-white">{rute.avgDelay}</strong></div>
        </div>
      )}
    </div>
  );
};

const PointAccordion = ({ point, badgeClass }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-mono text-sm text-sky-400 font-bold tracking-wider truncate w-32">📍 {point.name}</span>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold ${badgeClass}`}>{point.visit}</span>
          <span className="text-[10px] text-slate-400">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-slate-300 space-y-2">
          <div className="flex justify-between"><span>Pure PU / Drop SS:</span><strong className="text-white">{point.puDrop}</strong></div>
          <div className="flex justify-between"><span>Bagging MB & BP:</span><strong className="text-white">{point.mbBp}</strong></div>
          <div className="flex justify-between"><span>Status Transaksi:</span><strong className="text-emerald-400">{point.status}</strong></div>
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
  const [selectedDate, setSelectedDate] = useState('2026-08-23');
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
  
  const validRouteCodes = dashboardData?.routeRows?.map((r: any) => r.code) || [];
  const filteredRouteCodes = validRouteCodes.filter((code: string) => code.toLowerCase().includes(pinSearchQuery.toLowerCase()));

  // Utility Style Helper
  const getBadgeClass = (s: string) => {
    if (!s) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (s.includes('WARNING')) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (s.includes('CRITICAL')) return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  };

  // 🌍 MOCKUP PETA PINTAR (Tanpa API Key Berbayar)
  const renderMapsUrl = () => {
    if (!selectedRouteCode) return '';
    // Logika: Mengambil kode rute dan memaksanya mencari area di Indonesia. 
    // Anda bisa menyesuaikan kata "Area Jakarta" menjadi provinsi/kota lain jika rutenya spesifik.
    const searchQueryMaps = encodeURIComponent(`${selectedRouteCode} Area Jakarta Indonesia`);
    return `https://maps.google.com/maps?q=${searchQueryMaps}&z=13&output=embed`;
  };

  return (
    <div className="relative flex flex-col md:flex-row w-full min-h-[100dvh] bg-slate-950 font-sans antialiased text-slate-200 overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 pointer-events-none z-0"></div>

      {/* --- SIDEBAR --- */}
      <div className={`fixed md:relative z-40 flex flex-col w-64 h-[100dvh] transition-transform duration-300 backdrop-blur-xl bg-slate-900/60 border-r border-white/10 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Sidebar Header dengan ICON BARU */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400 flex items-center gap-2">
            {/* SVG Logo: Kotak Logistik Kaca/Transparan */}
            <svg className="w-7 h-7 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
            </svg>
            TR-GLASS
          </h2>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col gap-2 p-4 flex-grow overflow-y-auto">
          {[
            { id: 'overview', icon: '📊', label: 'Dashboard Overview' },
            { id: 'routes', icon: '🚚', label: 'Load & SLA' },
            { id: 'points', icon: '📍', label: 'Info Point Task' },
            { id: 'geotag', icon: '🗺️', label: 'GPS History' },
          ].map((menu) => (
            <button
              key={menu.id}
              onClick={() => { setActiveMenu(menu.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeMenu === menu.id ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <span>{menu.icon}</span>
              {menu.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex flex-col flex-1 h-[100dvh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 md:px-8 border-b border-white/10 backdrop-blur-xl bg-slate-900/40">
          
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-sky-400 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SERVER: PROD-JKT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 py-2 pl-10 pr-4 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
            </div>
            
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-mono text-sky-400">{timeString}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{dateString}</span>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-sky-500/20">
                GB
              </div>
            </div>
          </div>
        </div>

        {/* --- DASHBOARD VIEW AREA --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Trip', val: dashboardData?.kpi?.tripCount, sub: 'Unit Aktif' },
                { label: 'Pure PU', val: dashboardData?.kpi?.totalPurePU, sub: 'Pengambilan' },
                { label: 'Pure Drop', val: dashboardData?.kpi?.totalPureDrop, sub: 'Penurunan' },
                { label: 'Workload', val: dashboardData?.kpi?.totalWorkloadEffort, sub: 'Point Visit' },
                { label: 'SLA Time', val: `${dashboardData?.kpi?.overallSlaPct || 0}%`, sub: 'No Delay' },
                { label: 'Load Factor', val: `${dashboardData?.kpi?.overallLoadPct || 0}%`, sub: 'Volume Eq' },
              ].map((kpi, idx) => (
                <div key={idx} className="relative p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden group hover:bg-white/10 transition-colors">
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-black text-white mt-1 mb-1 tracking-tight">{kpi.val || '0'}</p>
                    <p className="text-[10px] text-sky-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Menu: OVERVIEW */}
            {activeMenu === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2"><span>🍰</span> Distribusi Workload</h3>
                  {dashboardData?.chartData ? (
                    <div className="h-64 relative">
                      <Doughnut
                        data={{
                          labels: dashboardData.chartData.labels,
                          datasets: [{ data: dashboardData.chartData.workloads, backgroundColor: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'], borderWidth: 0 }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }}
                      />
                    </div>
                  ) : <p className="text-xs text-slate-500">Loading grafik...</p>}
                </div>
                <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2"><span>📈</span> SLA On-Time (%)</h3>
                  {dashboardData?.chartData ? (
                    <div className="h-64 relative">
                      <Bar
                        data={{
                          labels: dashboardData.chartData.labels,
                          datasets: [{ label: 'SLA (%)', data: dashboardData.chartData.slas, backgroundColor: '#0ea5e9', borderRadius: 4 }]
                        }}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          scales: {
                            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                          },
                          plugins: { legend: { display: false } }
                        }}
                      />
                    </div>
                  ) : <p className="text-xs text-slate-500">Loading grafik...</p>}
                </div>
              </div>
            )}

            {/* Menu: LOAD & SLA */}
            {activeMenu === 'routes' && (
              <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-bold text-slate-200">🚚 Load & SLA per Rute</h3>
                </div>
                <div className="flex-1 p-6">
                  <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                    <table className="w-full min-w-max text-left text-sm whitespace-nowrap">
                      <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Rute</th>
                          <th className="px-6 py-4 font-semibold">Point</th>
                          <th className="px-6 py-4 font-semibold">Pure PU/Drop</th>
                          <th className="px-6 py-4 font-semibold">SLA %</th>
                          <th className="px-6 py-4 font-semibold">Avg Delay</th>
                          <th className="px-6 py-4 font-semibold">Net Load %</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRoutes.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-sky-400">{r.code}</td>
                            <td className="px-6 py-4">{r.points}</td>
                            <td className="px-6 py-4">{r.puDrop}</td>
                            <td className="px-6 py-4">{r.sla}</td>
                            <td className="px-6 py-4 text-rose-400">{r.avgDelay}</td>
                            <td className="px-6 py-4 font-bold text-sky-400">{r.load}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold ${getBadgeClass(r.status)}`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden">
                    {filteredRoutes.map((r: any, i: number) => (
                      <RouteAccordion key={i} rute={r} badgeClass={getBadgeClass(r.status)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Menu: INFO POINT TASK */}
            {activeMenu === 'points' && (
              <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-bold text-slate-200">📍 Info Point Task</h3>
                </div>
                <div className="flex-1 p-6">
                  <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                    <table className="w-full min-w-max text-left text-sm whitespace-nowrap">
                      <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Nama Point</th>
                          <th className="px-6 py-4 font-semibold">Visit</th>
                          <th className="px-6 py-4 font-semibold">Pure PU/Drop</th>
                          <th className="px-6 py-4 font-semibold">MB & BP Detail</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPoints.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-sky-400 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                            <td className="px-6 py-4">{p.visit}</td>
                            <td className="px-6 py-4">{p.puDrop}</td>
                            <td className="px-6 py-4 text-amber-400">{p.mbBp}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold ${getBadgeClass(p.status)}`}>{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden">
                    {filteredPoints.map((p: any, i: number) => (
                      <PointAccordion key={i} point={p} badgeClass={getBadgeClass(p.status)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Menu: GPS PINPOINT HISTORY */}
            {activeMenu === 'geotag' && (
              <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 flex flex-col h-[70vh]">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h3 className="text-sm font-bold text-slate-200">🗺️ History Jalur Maps per Rute</h3>
                  <input
                    type="text"
                    placeholder="Cari Kode Rute..."
                    value={pinSearchQuery}
                    onChange={(e) => setPinSearchQuery(e.target.value)}
                    className="w-full md:w-64 py-2 px-4 rounded-lg bg-black/30 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                  
                  {/* List Rute */}
                  <div className="w-full md:w-1/3 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredRouteCodes.map((code: string) => {
                      const isSelected = selectedRouteCode === code;
                      const routeItem = dashboardData?.routeRows?.find((r: any) => r.code === code);
                      
                      return (
                        <div
                          key={code}
                          onClick={() => setSelectedRouteCode(code)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                        >
                          <div className={`font-mono text-sm font-bold mb-1 ${isSelected ? 'text-sky-400' : 'text-slate-300'}`}>
                            🚚 {code}
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between">
                            <span>Points: {routeItem?.points || '0'}</span>
                            <span className={routeItem?.status?.includes('WARNING') ? 'text-amber-400' : 'text-emerald-400'}>
                              {routeItem?.status || 'Optimal'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredRouteCodes.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                        Rute tidak ditemukan.
                      </div>
                    )}
                  </div>

                  {/* Maps Container (Pencarian Otomatis Iframe) */}
                  <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/30 flex flex-col">
                    <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-sky-400">
                        🎯 Aktif: {selectedRouteCode || 'Pilih Rute'}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-black/40 px-2 py-1 rounded">Auto Search Engine</span>
                    </div>
                    <div className="flex-1 w-full h-full relative bg-slate-900/50">
                      {selectedRouteCode ? (
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          src={renderMapsUrl()}
                          className="absolute inset-0"
                        ></iframe>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                          Pilih rute di samping untuk merender Peta
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
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin mb-4"></div>
          <span className="text-xs font-bold tracking-widest text-sky-400">SINKRONISASI DATA</span>
        </div>
      )}
      
    </div>
  );
}
