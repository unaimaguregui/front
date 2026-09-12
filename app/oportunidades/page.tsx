'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, ArrowRight, Activity, BarChart2, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import PlotFigure from "@/components/PlotFigure"; // 🚀 IMPORTAMOS TU GRÁFICO PLOTLY
import { API_URL } from "@/lib/api";

// Mapeo básico de posiciones para los selectores
const POSICIONES_ESTILOS: Record<string, string[]> = {
  "Portero": ["Defensivo", "Distribuidor", "Hibrido", "Personalizado"],
  "Central": ["Defensivo", "Organizador", "Hibrido", "Personalizado"],
  "Lateral Izquierdo": ["Defensivo", "Ofensivo", "Organizador", "Hibrido", "Personalizado"],
  "Lateral Derecho": ["Defensivo", "Ofensivo", "Organizador", "Hibrido", "Personalizado"],
  "Pivote": ["Defensivo", "Organizador", "Conductor", "Hibrido - B2B", "Personalizado"],
  "Medio": ["Organizador Global", "Todocampista (B2B)", "Destructor", "Pivote Posicional", "Personalizado"],
  "Interior": ["Creativo", "B2B", "Organizador", "Personalizado"],
  "Mediapunta": ["Creativo", "Llegador", "Organizador", "Personalizado"],
  "Extremo Izquierdo": ["Finalizador", "Creativo", "Regateador", "Personalizado"],
  "Extremo Derecho": ["Finalizador", "Creativo", "Regateador", "Personalizado"],
  "Delantero": ["Rematador", "Falso 9", "Movil", "Referencia", "Personalizado"]
};

// ==========================================
// 🚀 NUEVO COMPONENTE: RADAR COMPARATIVO (4 GRÁFICAS)
// ==========================================
function RadarComparativo({ wyscoutId, posicion, tempPasada, tempActual, tipo }: { wyscoutId: string, posicion: string, tempPasada: string, tempActual: string, tipo: 'mejora' | 'caida' }) {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/evolucion/${wyscoutId}?posicion=${encodeURIComponent(posicion)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const rowPasada = data.find(d => String(d.Temporada) === String(tempPasada));
          const rowActual = data.find(d => String(d.Temporada) === String(tempActual));

          if (rowPasada && rowActual) {
            const colorPasadoLinea = '#94a3b8'; // Slate 400
            const colorPasadoFondo = 'rgba(148, 163, 184, 0.15)'; 
            const colorActualLinea = tipo === 'mejora' ? '#10b981' : '#f43f5e'; // Emerald o Rose
            const colorActualFondo = tipo === 'mejora' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';

            // Función Helper para crear cada radar individual
            const createRadar = (titulo: string, dataPasada: Record<string, number>, dataActual: Record<string, number>) => {
              // Limpiamos nombres muy largos para que el radar se vea bonito
              let keys = Object.keys(dataActual)
                .filter(k => k !== 'Rating' && k !== 'Personalizado')
                .map(k => k.replace(' per 90', ' p90').replace('True PAdj ', '')); 

              const rP = Object.keys(dataActual).filter(k => k !== 'Rating' && k !== 'Personalizado').map(k => dataPasada[k] || 50);
              const rA = Object.keys(dataActual).filter(k => k !== 'Rating' && k !== 'Personalizado').map(k => dataActual[k] || 50);

              // Cerramos el polígono
              keys.push(keys[0]); rP.push(rP[0]); rA.push(rA[0]);

              return {
                titulo,
                data: [
                  { type: 'scatterpolar', r: rP, theta: keys, fill: 'toself', name: tempPasada, line: { color: colorPasadoLinea, width: 2, dash: 'dot' }, fillcolor: colorPasadoFondo },
                  { type: 'scatterpolar', r: rA, theta: keys, fill: 'toself', name: tempActual, line: { color: colorActualLinea, width: 2.5 }, fillcolor: colorActualFondo }
                ],
                layout: {
                  title: { text: titulo, font: { color: 'white', size: 13 }, y: 0.95 },
                  polar: {
                    radialaxis: { visible: true, range: [0, 100], tickfont: { size: 8, color: '#475569' }, gridcolor: 'rgba(255,255,255,0.05)' },
                    angularaxis: { tickfont: { color: '#94a3b8', size: 9 }, gridcolor: 'rgba(255,255,255,0.1)' }
                  },
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  margin: { l: 30, r: 30, t: 30, b: 20 }, showlegend: false
                }
              };
            };

            const nuevosCharts = [];
            // 1. Roles
            if (rowActual.Ratings) nuevosCharts.push(createRadar("Evolución de Roles", rowPasada.Ratings || {}, rowActual.Ratings));
            // 2. Ofensivo
            if (rowActual.Fases?.Ofensivo) nuevosCharts.push(createRadar("Fase Ofensiva", rowPasada.Fases?.Ofensivo || {}, rowActual.Fases.Ofensivo));
            // 3. Organizacion
            if (rowActual.Fases?.Organizacion) nuevosCharts.push(createRadar("Organización", rowPasada.Fases?.Organizacion || {}, rowActual.Fases.Organizacion));
            // 4. Defensivo
            if (rowActual.Fases?.Defensivo) nuevosCharts.push(createRadar("Fase Defensiva", rowPasada.Fases?.Defensivo || {}, rowActual.Fases.Defensivo));

            setCharts(nuevosCharts);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wyscoutId, posicion, tempPasada, tempActual]);

  if (loading) return <div className="h-[250px] flex items-center justify-center"><Loader2 className="animate-spin text-slate-500" size={30} /></div>;
  if (charts.length === 0) return <div className="h-[250px] flex items-center justify-center text-sm text-slate-500 italic">No hay datos históricos suficientes.</div>;

  return (
    <div>
      <div className="flex justify-center items-center gap-4 text-xs font-bold uppercase mb-4 text-slate-400">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400/20 border border-slate-400 border-dashed rounded-full"></div> {tempPasada}</span>
        <span className="flex items-center gap-1"><div className={`w-3 h-3 ${tipo === 'mejora' ? 'bg-emerald-500/40 border-emerald-500' : 'bg-rose-500/40 border-rose-500'} border rounded-full`}></div> {tempActual}</span>
      </div>
      
      {/* 🚀 EL GRID DE 2x2 PARA LOS 4 RADARES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {charts.map((chart, idx) => (
          <div key={idx} className="h-[220px] w-full bg-slate-900/50 rounded-lg border border-slate-700/30">
            <PlotFigure data={chart.data} layout={chart.layout} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OportunidadesMercado() {
  const [ligasDisponibles, setLigasDisponibles] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  
  // Estado para controlar qué tarjetas están expandidas (guardamos los IDs)
  const [radaresAbiertos, setRadaresAbiertos] = useState<string[]>([]);

  // 🚀 AHORA 'ligas' ES UN ARRAY
  const [filtros, setFiltros] = useState({
    ligas: ['Premier League'], 
    temp_pasada: '24-25',
    temp_actual: '25-26',
    posicion: 'Delantero',
    estilo: 'Rematador',
    mins: 500
  });

  const [explosiones, setExplosiones] = useState<any[]>([]);
  const [gangas, setGangas] = useState<any[]>([]);
  const [montado, setMontado] = useState(false);

  // 1. RECUPERAR DATOS AL ENTRAR (Cuando vuelves de la ficha del jugador)
  useEffect(() => {
    setMontado(true);
    if (typeof window !== "undefined") {
      // Recuperar Filtros
      const savedFiltros = sessionStorage.getItem("fscouting_oportunidades_filtros");
      if (savedFiltros) {
        try { setFiltros(JSON.parse(savedFiltros)); } catch (e) {}
      }
      
      // Recuperar Explosiones
      const savedExplosiones = sessionStorage.getItem("fscouting_oportunidades_explosiones");
      if (savedExplosiones) {
        try { setExplosiones(JSON.parse(savedExplosiones)); } catch (e) {}
      }
      
      // Recuperar Gangas
      const savedGangas = sessionStorage.getItem("fscouting_oportunidades_gangas");
      if (savedGangas) {
        try { setGangas(JSON.parse(savedGangas)); } catch (e) {}
      }
    }
  }, []);

  // 2. GUARDAR DATOS EN MEMORIA CADA VEZ QUE BUSCAS O CAMBIAS UN FILTRO
  useEffect(() => {
    if (montado) {
      sessionStorage.setItem("fscouting_oportunidades_filtros", JSON.stringify(filtros));
      sessionStorage.setItem("fscouting_oportunidades_explosiones", JSON.stringify(explosiones));
      sessionStorage.setItem("fscouting_oportunidades_gangas", JSON.stringify(gangas));
    }
  }, [filtros, explosiones, gangas, montado]);

  useEffect(() => {
    async function fetchCatalogo() {
      try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const ligasUnicas = Array.from(new Set(data.map((d: any) => d.liga))) as string[];
          setLigasDisponibles(ligasUnicas.sort());
        }
      } catch (e) {}
    }
    fetchCatalogo();
  }, []);

  const toggleLiga = (ligaName: string) => {
    const actuales = filtros.ligas || [];
    if (actuales.includes(ligaName)) {
      setFiltros({ ...filtros, ligas: actuales.filter(l => l !== ligaName) });
    } else {
      setFiltros({ ...filtros, ligas: [...actuales, ligaName] });
    }
  };

  const aplicarAtajo = (tipo: string) => {
    if (tipo === 'top5') setFiltros({ ...filtros, ligas: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'].filter(l => ligasDisponibles.includes(l)) });
    if (tipo === 'limpiar') setFiltros({ ...filtros, ligas: [] });
  };

  const buscarOportunidades = async () => {
    setCargando(true);
    setExplosiones([]);
    setGangas([]);
    setRadaresAbiertos([]); // Cerramos todos los radares al buscar

    const payload = {
      ligas: filtros.ligas, 
      temp_pasada: filtros.temp_pasada,
      temp_actual: filtros.temp_actual,
      posicion: filtros.posicion,
      estilo: filtros.estilo,
      mins: Number(filtros.mins)
    };

    try {
      const [resExp, resGan] = await Promise.all([
        fetch(`${API_URL}/api/explosiones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        fetch(`${API_URL}/api/gangas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      ]);

      const dataExp = await resExp.json();
      const dataGan = await resGan.json();

      if (Array.isArray(dataExp)) setExplosiones(dataExp);
      if (Array.isArray(dataGan)) setGangas(dataGan);

    } catch (error) {
      console.error("Error buscando oportunidades:", error);
    } finally {
      setCargando(false);
    }
  };

  const toggleRadar = (id: string) => {
    setRadaresAbiertos(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
      
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <Activity className="text-blue-500" size={36} /> Radar de Oportunidades
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Detecta explosiones de rendimiento y posibles gangas cruzando datos de múltiples ligas a la vez.
        </p>
      </div>

      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl mb-10 space-y-6">
        
        {/* FILA 1: ATAJOS Y LIGAS SELECCIONADAS */}
        <div className="flex flex-col gap-3 border-b border-slate-700/50 pb-5">
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-slate-400 uppercase">Añadir Ligas:</label>
            <select 
              onChange={e => { if(e.target.value) toggleLiga(e.target.value); e.target.value = ""; }} 
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
              defaultValue=""
            >
              <option value="" disabled>+ Seleccionar una liga del catálogo...</option>
              {ligasDisponibles.filter(l => !filtros.ligas.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            
            <button onClick={() => aplicarAtajo('top5')} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600/40 transition">
              ⭐ Top 5 Ligas
            </button>
            <button onClick={() => aplicarAtajo('limpiar')} className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-600 transition ml-auto">
              Limpiar Todas
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 min-h-[32px]">
            {filtros.ligas.map(liga => (
              <button key={liga} onClick={() => toggleLiga(liga)} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-red-500 transition-colors">
                {liga} <X size={14} className="group-hover:scale-125 transition-transform" />
              </button>
            ))}
            {filtros.ligas.length === 0 && <span className="text-sm text-slate-500 italic">No hay ligas seleccionadas...</span>}
          </div>
        </div>

        {/* FILA 2: RESTO DE FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
          <div className="xl:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Posición</label>
            <select value={filtros.posicion} onChange={e => setFiltros({...filtros, posicion: e.target.value, estilo: POSICIONES_ESTILOS[e.target.value][0] }) } className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
              {Object.keys(POSICIONES_ESTILOS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="xl:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rol (Estilo)</label>
            <select value={filtros.estilo} onChange={e => setFiltros({...filtros, estilo: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
              {POSICIONES_ESTILOS[filtros.posicion]?.filter(e => e !== "Personalizado").map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="xl:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Temp. Anterior</label>
            <input type="text" value={filtros.temp_pasada} onChange={e => setFiltros({...filtros, temp_pasada: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
          </div>

          <div className="xl:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Temp. Actual</label>
            <input type="text" value={filtros.temp_actual} onChange={e => setFiltros({...filtros, temp_actual: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
          </div>

          <div className="xl:col-span-1">
            <button onClick={buscarOportunidades} disabled={cargando || filtros.ligas.length === 0} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {cargando ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Search size={18} />} Escanear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* COLUMNA EXPLOSIONES */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={28} /> Explosiones (Breakouts)
          </h2>
          <div className="space-y-4">
            {explosiones.length === 0 && !cargando && <p className="text-slate-500 italic bg-slate-800/50 p-6 rounded-lg text-center border border-slate-700/50">No hay explosiones detectadas.</p>}
            {explosiones.map((jug, i) => {
              const idUnico = jug['Wyscout id'] || jug.Wyscout_id || jug.Player;
              const isRadarOpen = radaresAbiertos.includes(String(idUnico));

              return (
                <div key={i} className="bg-slate-800/80 p-5 rounded-xl border border-emerald-500/20 shadow-lg group">
                  <div className="flex justify-between items-center">
                    <div>
                      <Link href={`/jugador/${encodeURIComponent(jug.Player)}?id=${idUnico}&posicion=${encodeURIComponent(filtros.posicion)}`} className="text-lg font-bold text-white hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {jug.Player} <ArrowRight size={14} />
                      </Link>
                      <p className="text-sm text-slate-400 mt-1">{jug.Team_actual} <span className="mx-1 text-slate-600">|</span> {jug.League_actual || jug.Competition_actual} <span className="mx-1 text-slate-600">|</span> {jug['Minutes played_actual']} mins</p>
                      <button onClick={() => toggleRadar(String(idUnico))} className={`mt-3 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${isRadarOpen ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}`}>
                        <BarChart2 size={14} /> {isRadarOpen ? "Ocultar Radar" : "Ver Radar vs Año Pasado"}
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{filtros.temp_pasada}</p>
                        <p className="text-lg font-bold text-slate-300">{jug.Rating_pasado}</p>
                      </div>
                      <TrendingUp className="text-emerald-500/50" size={20} />
                      <div className="text-left hidden sm:block">
                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest">{filtros.temp_actual}</p>
                        <p className="text-xl font-black text-white">{jug.Rating_actual}</p>
                      </div>
                      <div className="ml-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-lg px-4 py-2 rounded-lg">
                        +{Math.round(jug.Mejora)}
                      </div>
                    </div>
                  </div>
                  {isRadarOpen && <div className="mt-4 pt-4 border-t border-slate-700/50"><RadarComparativo wyscoutId={String(idUnico)} posicion={filtros.posicion} tempPasada={filtros.temp_pasada} tempActual={filtros.temp_actual} tipo="mejora" /></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA GANGAS */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <TrendingDown className="text-rose-500" size={28} /> Posibles Gangas (Drops)
          </h2>
          <div className="space-y-4">
            {gangas.length === 0 && !cargando && <p className="text-slate-500 italic bg-slate-800/50 p-6 rounded-lg text-center border border-slate-700/50">No hay bajones críticos detectados.</p>}
            {gangas.map((jug, i) => {
              const idUnico = jug['Wyscout id'] || jug.Wyscout_id || jug.Player;
              const isRadarOpen = radaresAbiertos.includes(String(idUnico));

              return (
                <div key={i} className="bg-slate-800/80 p-5 rounded-xl border border-rose-500/20 shadow-lg group">
                  <div className="flex justify-between items-center">
                    <div>
                      <Link href={`/jugador/${encodeURIComponent(jug.Player)}?id=${idUnico}&posicion=${encodeURIComponent(filtros.posicion)}`} className="text-lg font-bold text-white hover:text-rose-400 transition-colors flex items-center gap-2">
                        {jug.Player} <ArrowRight size={14} />
                      </Link>
                      <p className="text-sm text-slate-400 mt-1">{jug.Team_actual} <span className="mx-1 text-slate-600">|</span> {jug.League_actual || jug.Competition_actual} <span className="mx-1 text-slate-600">|</span> {jug['Minutes played_actual']} mins</p>
                      <button onClick={() => toggleRadar(String(idUnico))} className={`mt-3 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${isRadarOpen ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}`}>
                        <BarChart2 size={14} /> {isRadarOpen ? "Ocultar Radar" : "Ver Radar vs Año Pasado"}
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{filtros.temp_pasada}</p>
                        <p className="text-lg font-bold text-slate-300">{jug.Rating_pasado}</p>
                      </div>
                      <TrendingDown className="text-rose-500/50" size={20} />
                      <div className="text-left hidden sm:block">
                        <p className="text-[10px] text-rose-500 uppercase tracking-widest">{filtros.temp_actual}</p>
                        <p className="text-xl font-black text-white">{jug.Rating_actual}</p>
                      </div>
                      <div className="ml-2 bg-rose-500/20 border border-rose-500/50 text-rose-400 font-black text-lg px-4 py-2 rounded-lg">
                        -{Math.round(jug.Caida)}
                      </div>
                    </div>
                  </div>
                  {isRadarOpen && <div className="mt-4 pt-4 border-t border-slate-700/50"><RadarComparativo wyscoutId={String(idUnico)} posicion={filtros.posicion} tempPasada={filtros.temp_pasada} tempActual={filtros.temp_actual} tipo="caida" /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
