"use client";

import { useState, useEffect } from "react";
import { Sliders, Loader2, Shield, BrainCircuit, ArrowRight, Activity, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import PlotFigure from "@/components/PlotFigure";
import { API_URL } from "@/lib/api";

const POSICIONES = [
  "Portero", "Central", "Lateral Izquierdo", "Lateral Derecho", 
  "Pivote", "Medio", "Interior", "Mediapunta", 
  "Extremo Izquierdo", "Extremo Derecho", "Delantero"
];

export default function TeamFitPage() {
  const router = useRouter();
  const [montado, setMontado] = useState(false);
  
  // Listas de datos
  const [equipos, setEquipos] = useState<string[]>([]);
  const [ligasDisponibles, setLigasDisponibles] = useState<string[]>([]);
  const [temporadasDisponibles, setTemporadasDisponibles] = useState<string[]>([]);

  // 🚀 ESTADOS PARA EL BUSCADOR EN CASCADA (PAÍS -> LIGA -> EQUIPO)
  const [equiposDetallados, setEquiposDetallados] = useState<any[]>([]);
  const [paisesTacticos, setPaisesTacticos] = useState<string[]>([]);
  const [ligasTacticas, setLigasTacticas] = useState<string[]>([]);
  
  // Estado que controla qué se ha seleccionado en la cascada
  const [filtroTactico, setFiltroTactico] = useState({ pais: "", liga: "" });
  
  // Estados para el input del equipo final
  const [busquedaEquipo, setBusquedaEquipo] = useState("Manchester City");
  const [mostrarEquipos, setMostrarEquipos] = useState(false);

  // 1. Estados iniciales de la Búsqueda
  const [filtros, setFiltros] = useState({
    equipo_tactico: "Manchester City",
    posicion: "Delantero",
    temporada: "25-26",
    mins: 500,
    edad_min: 16,
    edad_max: 38,
    calidad_min: 0 
  });

  const [ligasTeamFit, setLigasTeamFit] = useState<string[]>(["Premier League"]);
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  
  // Estados para el Radar y XAI Breakdown
  const [radarData, setRadarData] = useState<any>(null);
  const [jugadorSeleccionadoRadar, setJugadorSeleccionadoRadar] = useState('');
  const [breakdownSeleccionado, setBreakdownSeleccionado] = useState<any>(null);

  // Controla por qué columna o métrica estamos ordenando la tabla
  const [ordenarPor, setOrdenarPor] = useState("Fit Score");

  // 2. Hydration Segura
  useEffect(() => {
    setMontado(true);
    if (typeof window !== "undefined") {
      const savedFiltros = sessionStorage.getItem("fscouting_teamfit_filtros");
      if (savedFiltros) {
        try { 
          const parsed = JSON.parse(savedFiltros);
          setFiltros({
            equipo_tactico: parsed.equipo_tactico || "Manchester City",
            posicion: parsed.posicion || "Delantero",
            temporada: parsed.temporada || "25-26",
            mins: parsed.mins ?? 500,
            edad_min: parsed.edad_min ?? 16,
            edad_max: parsed.edad_max ?? 38,
            calidad_min: parsed.calidad_min ?? 0
          });
          if (parsed.ligas) setLigasTeamFit(parsed.ligas);
          if (parsed.equipo_tactico) setBusquedaEquipo(parsed.equipo_tactico);
        } catch (e) {}
      }
      
      const savedResultado = sessionStorage.getItem("fscouting_teamfit_resultado");
      if (savedResultado) {
        try { 
          const parsed = JSON.parse(savedResultado);
          setResultado(parsed); 
          if (parsed?.jugadores?.length > 0) {
            cargarRadarYBreakdown(parsed.jugadores[0], parsed.pesos_usados);
          }
        } catch (e) {}
      }
    }
  }, []);

  // 3. Guardar en memoria cada vez que cambian
  useEffect(() => {
    if (montado) {
      sessionStorage.setItem("fscouting_teamfit_filtros", JSON.stringify({...filtros, ligas: ligasTeamFit}));
      if (resultado) {
        sessionStorage.setItem("fscouting_teamfit_resultado", JSON.stringify(resultado));
      }
    }
  }, [filtros, ligasTeamFit, resultado, montado]);

  // 4. Cargar catálogos iniciales y construir CASCADA
  useEffect(() => {
    async function cargarDatos() {
      try {
        const resEq = await fetch(`${API_URL}/api/equipos_tacticos`);
        const dataEq = await resEq.json();
        
        // Carga de Equipos Detallados para la Cascada
        if (dataEq.equipos_detallados && dataEq.equipos_detallados.length > 0) {
          setEquiposDetallados(dataEq.equipos_detallados);
          setEquipos(dataEq.equipos);
          
          const paisesUnicos = Array.from(new Set(dataEq.equipos_detallados.map((e: any) => e.Pais))).sort() as string[];
          setPaisesTacticos(paisesUnicos);

          // Lógica de sincronización inicial
          const savedFiltros = sessionStorage.getItem("fscouting_teamfit_filtros");
          let eqInicial = "Manchester City";
          if (savedFiltros) {
            try { eqInicial = JSON.parse(savedFiltros).equipo_tactico || "Manchester City"; } catch(e){}
          }
          
          // Buscamos a qué País y Liga pertenece el equipo que teníamos seleccionado
          const eqObj = dataEq.equipos_detallados.find((e: any) => e.Team === eqInicial);
          
          if (eqObj) {
            setFiltroTactico({ pais: eqObj.Pais, liga: eqObj.Liga });
            setBusquedaEquipo(eqObj.Team);
          } else if (paisesUnicos.length > 0) {
            setFiltroTactico(prev => ({ ...prev, pais: paisesUnicos[0] }));
          }
        } else if (dataEq.equipos) {
          setEquipos(dataEq.equipos);
        }

        // Carga del Catálogo Global
        const resCat = await fetch(`${API_URL}/api/catalogo`);
        const dataCat = await resCat.json();
        if (Array.isArray(dataCat)) {
          setLigasDisponibles(Array.from(new Set(dataCat.map((d: any) => d.liga))).sort() as string[]);
          setTemporadasDisponibles(Array.from(new Set(dataCat.map((d: any) => d.temporada))).sort().reverse() as string[]);
        }
      } catch (e) {
        console.error("Error cargando datos para Team Fit", e);
      }
    }
    cargarDatos();
  }, []);

  // 🚀 LÓGICA DE CASCADA: Actualizar Ligas cuando cambia el País
  useEffect(() => {
    if (equiposDetallados.length > 0 && filtroTactico.pais) {
      const ligasDelPais = Array.from(
        new Set(equiposDetallados.filter(e => e.Pais === filtroTactico.pais).map(e => e.Liga))
      ).sort() as string[];
      
      setLigasTacticas(ligasDelPais);
      
      // Si la liga actual ya no pertenece al país seleccionado, forzamos la primera del nuevo país
      if (!ligasDelPais.includes(filtroTactico.liga) && ligasDelPais.length > 0) {
        setFiltroTactico(prev => ({ ...prev, liga: ligasDelPais[0] }));
      }
    }
  }, [filtroTactico.pais, equiposDetallados]);

  // 🚀 LÓGICA DE EMBUDO: Lista de equipos final que alimenta el buscador visual
  // Filtramos por País y Liga para que el input solo te sugiera equipos de ahí
  const equiposFiltradosEnCascada = equiposDetallados.length > 0 
    ? equiposDetallados
        .filter(e => e.Pais === filtroTactico.pais && e.Liga === filtroTactico.liga)
        .map(e => e.Team)
    : equipos;

  const aplicarAtajoTeamFit = (tipo: string) => {
    let seleccionadas: string[] = [];
    if (tipo === 'top5') {
      seleccionadas = [
        'Primera División Inglaterra', 
        'Primera División España', 
        'Primera División Italia', 
        'Primera División Alemania', 
        'Primera División Francia'
      ];
    } else if (tipo === 'puente') {
      seleccionadas = [
        'Primera División Portugal', 
        'Primera División Países Bajos', 
        'Primera División Bélgica', 
        'Primera División Brasil', 
        'Primera División Austria', 
        'Primera División Croacia'
      ];
    } else if (tipo === '2asdivisiones') {
      seleccionadas = [
        'Segunda División Inglaterra', 
        'Segunda División España', 
        'Segunda División Italia', 
        'Segunda División Alemania', 
        'Segunda División Francia'
      ];
    } else if (tipo === 'limpiar') {
      seleccionadas = [];
    }
    const validas = seleccionadas.filter(l => ligasDisponibles.includes(l));
    setLigasTeamFit(validas.length > 0 ? validas : seleccionadas);
  };

  const cargarRadarYBreakdown = (jugadorObj: any, pesosUsados: any = resultado?.pesos_usados) => {
    setJugadorSeleccionadoRadar(jugadorObj.Player);
    
    const breakdown = jugadorObj.Breakdown || {};
    setBreakdownSeleccionado(breakdown);

    const axes = Object.keys(breakdown);
    const playerScores = Object.values(breakdown) as number[];
    const teamScores = axes.map(axis => pesosUsados ? Math.round(pesosUsados[axis] || 50) : 50);

    if (axes.length > 0) {
      axes.push(axes[0]);
      playerScores.push(playerScores[0]);
      teamScores.push(teamScores[0]);
    }

    setRadarData({
      data: [
        {
          type: 'scatterpolar',
          r: teamScores,
          theta: axes,
          fill: 'toself',
          name: 'Exigencia Táctica',
          line: { color: '#ef4444', width: 2, dash: 'dot' }, 
          fillcolor: 'rgba(239, 68, 68, 0.1)',
          hoverinfo: 'text'
        },
        {
          type: 'scatterpolar',
          r: playerScores,
          theta: axes,
          fill: 'toself',
          name: jugadorObj.Player,
          line: { color: '#3b82f6', width: 2 },
          fillcolor: 'rgba(59, 130, 246, 0.4)',
          hoverinfo: 'text'
        }
      ],
      layout: {
        polar: {
          radialaxis: { visible: true, range: [0, 100], color: '#64748b', gridcolor: '#334155', tickfont: { size: 9 } },
          angularaxis: { color: '#cbd5e1', gridcolor: '#334155', tickfont: { size: 10 } },
          bgcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 20, b: 30, l: 30, r: 30 },
        showlegend: true, 
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.15, font: { color: '#94a3b8', size: 10 } }
      }
    });
  };

  const calcularTeamFit = async () => {
    setCargando(true);
    setResultado(null);
    setRadarData(null);
    setJugadorSeleccionadoRadar('');
    setBreakdownSeleccionado(null);
    setOrdenarPor("Fit Score");

    const payload = {
      equipo_tactico: filtros.equipo_tactico, // El backend recibe el nombre del equipo limpio
      posicion: filtros.posicion,
      ligas: ligasTeamFit,
      temporadas: [filtros.temporada],
      mins: filtros.mins,
      edad_min: filtros.edad_min,
      edad_max: filtros.edad_max,
      calidad_min: filtros.calidad_min 
    };

    try {
      const res = await fetch(`${API_URL}/api/team_fit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResultado(data);
      
      if (data.jugadores && data.jugadores.length > 0) {
        cargarRadarYBreakdown(data.jugadores[0], data.pesos_usados);
      }
    } catch (e) {
      console.error("Error en Team Fit:", e);
    } finally {
      setCargando(false);
    }
  };

  const jugadoresRender = (!resultado || !resultado.jugadores) ? [] : [...resultado.jugadores].sort((a: any, b: any) => {
    if (ordenarPor === "Fit Score") return (b.Rating_Fit || 0) - (a.Rating_Fit || 0);
    if (ordenarPor === "Calidad") return (b.Quality_Score || 0) - (a.Quality_Score || 0);
    
    const valA = a.Breakdown?.[ordenarPor] || 0;
    const valB = b.Breakdown?.[ordenarPor] || 0;
    return valB - valA;
  });

  if (!montado) return null;

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <Activity className="text-blue-500" size={36} /> Análisis de Encaje Táctico (Team Fit)
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Descubre qué jugadores encajan matemáticamente en el estilo de juego de un equipo específico.
        </p>
      </div>

      {/* 🚀 PANEL DE CONFIGURACIÓN CASCADA - 10 COLUMNAS */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg grid grid-cols-1 md:grid-cols-5 lg:grid-cols-10 gap-4">
        
        {/* 1. PAÍS TÁCTICO */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">1. País Molde</label>
          <select className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" 
            value={filtroTactico.pais} onChange={(e) => setFiltroTactico({...filtroTactico, pais: e.target.value})}>
            {paisesTacticos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* 2. LIGA TÁCTICA */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">2. Liga Molde</label>
          <select className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" 
            value={filtroTactico.liga} onChange={(e) => setFiltroTactico({...filtroTactico, liga: e.target.value})}>
            {ligasTacticas.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* 3. EQUIPO TÁCTICO (INPUT BUSCADOR FINAL) */}
        <div className="relative flex flex-col gap-1 z-50">
          <label className="text-xs font-semibold text-slate-400 uppercase">3. Equipo Molde</label>
          <input
            type="text"
            className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
            placeholder="Selecciona o escribe..."
            value={busquedaEquipo}
            onChange={(e) => {
              setBusquedaEquipo(e.target.value);
              setMostrarEquipos(true);
            }}
            onFocus={() => {
              // Si el usuario hace click pero está vacío, autocompletamos con el primer equipo de la lista
              if (busquedaEquipo === '' && equiposFiltradosEnCascada.length > 0) {
                 setBusquedaEquipo(equiposFiltradosEnCascada[0]);
              }
              setMostrarEquipos(true);
            }}
            onBlur={() => setTimeout(() => setMostrarEquipos(false), 200)}
          />
          {mostrarEquipos && (
            <div className="absolute top-[100%] left-0 w-full max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-2xl mt-1 custom-scrollbar">
              {equiposFiltradosEnCascada.filter(eq => eq.toLowerCase().includes(busquedaEquipo.toLowerCase())).length === 0 ? (
                <div className="p-3 text-slate-500 text-xs italic text-center">No hay resultados</div>
              ) : (
                equiposFiltradosEnCascada
                  .filter(eq => eq.toLowerCase().includes(busquedaEquipo.toLowerCase()))
                  .map(eq => (
                    <div 
                      key={eq} 
                      className="p-2 hover:bg-blue-600 cursor-pointer text-sm text-slate-200 transition-colors"
                      onClick={() => {
                        setBusquedaEquipo(eq); // Actualiza lo que ve el usuario en el cajetín
                        setFiltros({...filtros, equipo_tactico: eq}); // Actualiza el filtro que se enviará a FastAPI
                        setMostrarEquipos(false); // Cierra el menú
                      }}
                    >
                      {eq}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Posición</label>
          <select className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" value={filtros.posicion} onChange={(e) => setFiltros({...filtros, posicion: e.target.value})}>
            {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Temporada</label>
          <select className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" value={filtros.temporada} onChange={(e) => setFiltros({...filtros, temporada: e.target.value})}>
            {temporadasDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Mins Mínimos</label>
          <input type="number" className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" value={filtros.mins} onChange={(e) => setFiltros({...filtros, mins: parseInt(e.target.value) || 0})} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Calidad Mín</label>
          <input type="number" min="0" max="99" className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500" value={filtros.calidad_min} onChange={(e) => setFiltros({...filtros, calidad_min: parseInt(e.target.value) || 0})} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Edad (Min-Max)</label>
          <div className="flex gap-2">
            <input type="number" min="15" max="45" className="w-1/2 bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500 text-center" value={filtros.edad_min} onChange={(e) => setFiltros({...filtros, edad_min: parseInt(e.target.value) || 0})} />
            <input type="number" min="15" max="45" className="w-1/2 bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500 text-center" value={filtros.edad_max} onChange={(e) => setFiltros({...filtros, edad_max: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        <div className="flex flex-col gap-1 lg:col-span-2">
          <div className="relative z-40 flex flex-col gap-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">
              Ligas Mercado <span className="text-[10px] text-slate-500 normal-case font-normal">- Usa Ctrl para varias</span>
            </label>
            <select 
              multiple 
              value={ligasTeamFit} 
              onChange={(e) => setLigasTeamFit(Array.from(e.target.selectedOptions, option => option.value))} 
              className="w-full bg-slate-900 border border-slate-600 text-slate-300 px-3 py-2 rounded-lg outline-none text-xs h-[104px] custom-scrollbar"
            >
              {ligasDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            
            <div className="flex flex-wrap gap-2 mt-1">
              <button onClick={() => aplicarAtajoTeamFit('top5')} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">Top 5</button>
              <button onClick={() => aplicarAtajoTeamFit('puente')} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">Puente</button>
              <button onClick={() => aplicarAtajoTeamFit('2asdivisiones')} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">2ª Div</button>
              <button onClick={() => aplicarAtajoTeamFit('limpiar')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-[10px] font-semibold transition-colors ml-auto">Limpiar</button>
            </div>
          </div>
        </div>

        <div className="flex items-end lg:col-span-10 mt-2">
          <button onClick={calcularTeamFit} disabled={cargando} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-lg">
            {cargando ? <Loader2 className="animate-spin" size={24} /> : <Sliders size={24} />}
            {cargando ? "Calculando distancia vectorial de estilo..." : "Analizar Fit de Jugadores"}
          </button>
        </div>
      </div>

      {/* RESULTADOS EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: RESUMEN IA Y RADAR */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {resultado?.perfil_tactico ? (
            <div className="bg-[#1e293b] p-6 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <BrainCircuit size={48} />
              </div>
              <h3 className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2 mb-3">
                 ADN de {filtros.equipo_tactico}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-blue-500 pl-3 relative z-10">
                "{resultado.perfil_tactico}"
              </p>
            </div>
          ) : (
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-center h-[120px] text-slate-500 text-sm italic">
              ADN Táctico pendiente de análisis.
            </div>
          )}

          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-700 pb-3 mb-2 flex items-center justify-center gap-2">
               <Target size={18} className="text-emerald-500" />
               {jugadorSeleccionadoRadar ? `Análisis de Encaje: ${jugadorSeleccionadoRadar}` : "Jugador vs Exigencia"}
            </h3>
            
            {!radarData ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic min-h-[300px]">
                {cargando ? <Loader2 className="animate-spin" size={24} /> : "Selecciona un jugador de la tabla."}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="w-full h-[340px] -mt-2">
                  <PlotFigure data={radarData.data} layout={radarData.layout} />
                </div>
                
                {/* 🚀 XAI BREAKDOWN */}
                {breakdownSeleccionado && Object.keys(breakdownSeleccionado).length > 0 && (
                  <div className="mt-2 pt-4 border-t border-slate-700/50 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      <BrainCircuit size={14} /> Desglose Táctico de Encaje (0-100)
                    </h4>
                    {Object.entries(breakdownSeleccionado)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .map(([metric, score]: any) => (
                        <div key={metric} className="group">
                          <div className="flex justify-between text-[11px] mb-1.5 uppercase tracking-wide">
                            <span className="text-slate-400 font-medium">{metric}</span>
                            <span className={`font-black ${
                              score >= 80 ? 'text-purple-400' : 
                              score >= 60 ? 'text-blue-400' : 
                              score >= 40 ? 'text-emerald-400' : 
                              'text-yellow-400'
                            }`}>{score}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                                score >= 80 ? 'bg-purple-500' : 
                                score >= 60 ? 'bg-blue-500' : 
                                score >= 40 ? 'bg-emerald-500' : 
                                'bg-yellow-500'
                              }`} 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA INTERACTIVA */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg xl:col-span-2 flex flex-col h-[750px]">
          
          <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-emerald-500" size={20} /> Ranking de Encaje
            </h2>
            
            {resultado?.pesos_usados && Object.keys(resultado.pesos_usados).length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-400 font-bold uppercase ml-1">Ordenar por:</span>
                <select 
                  className="bg-slate-800 text-white text-xs p-1.5 rounded border border-slate-600 outline-none focus:border-blue-500 cursor-pointer"
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                >
                  <option value="Fit Score">Fit Score (Global)</option>
                  <option value="Calidad">Calidad Absoluta</option>
                  <optgroup label="Desglose Táctico (Métricas)">
                    {Object.keys(resultado.pesos_usados).map(metric => (
                      <option key={metric} value={metric}>{metric}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300 relative">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/90 backdrop-blur-sm sticky top-0 z-20 shadow-md">
                <tr>
                  <th className="px-5 py-4 font-bold">Jugador</th>
                  <th className="px-5 py-4 font-bold">Equipo Actual</th>
                  <th className="px-5 py-4 font-bold text-center">Edad</th>
                  <th className="px-5 py-4 font-bold text-center">Fit Score</th>
                  <th className="px-5 py-4 font-bold text-center text-slate-500">Calidad</th>
                  <th className="px-5 py-4 font-bold text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {jugadoresRender.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 italic">
                      {cargando ? "Calculando distancia vectorial de estilo..." : "Configura los filtros y pulsa 'Analizar Fit' para ver resultados."}
                    </td>
                  </tr>
                ) : (
                  jugadoresRender.map((j: any, idx: number) => {
                    const isSelected = jugadorSeleccionadoRadar === j.Player;
                    
                    const isMetricSort = ordenarPor !== "Fit Score" && ordenarPor !== "Calidad";
                    const metricValue = isMetricSort ? (j.Breakdown?.[ordenarPor] || 0) : null;

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => cargarRadarYBreakdown(j, resultado?.pesos_usados)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/40 border-l-4 border-l-transparent'}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className={`font-bold text-base ${isSelected ? 'text-blue-400' : 'text-white'}`}>{j.Player}</p>
                          <p className="text-[10px] text-slate-400 uppercase mt-0.5">{j.Perfil_Scouting || "N/D"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{j.Team}</td>
                        <td className="px-5 py-3.5 text-center text-slate-400">{j.Age}</td>
                        
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`px-3 py-1 rounded font-black text-sm ${
                              j.Rating_Fit >= 85 ? 'text-purple-400 bg-purple-500/20 border border-purple-500/30' : 
                              j.Rating_Fit >= 75 ? 'text-blue-400 bg-blue-500/20 border border-blue-500/30' : 
                              j.Rating_Fit >= 65 ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' : 
                              'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                            }`}>
                              {j.Rating_Fit}%
                            </span>
                            {isMetricSort && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                                {metricValue} <span className="font-normal text-slate-500">en métrica</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="font-bold text-slate-500 text-sm">
                            {j.Quality_Score || 50}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              router.push(`/jugador/${encodeURIComponent(j.Player)}?id=${j['Wyscout id'] || ''}&posicion=${encodeURIComponent(filtros.posicion)}`);
                            }}
                            className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white p-2 rounded-lg transition-colors inline-flex"
                            title="Ver Perfil Completo"
                          >
                            <ArrowRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
