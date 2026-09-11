"use client";
import { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck, MapPin, Star } from "lucide-react";
import PlotFigure from "@/components/PlotFigure";

// ---------- Tipos y Helpers para Posiciones ----------
interface PosicionItem { posicion: string; pct: number; }

function sanearNumero(val: unknown): number {
  // Ya no forzamos a que el límite sea 100. Cogemos el número crudo y punto.
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace("%", "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizarPosiciones(info: any, posicionEvaluada: string): PosicionItem[] {
  const raw = info?.posiciones;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((p: any) => ({ posicion: String(p?.posicion ?? "N/D"), pct: sanearNumero(p?.pct) }))
      .filter((p) => p.posicion !== "N/D");
  }
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return Object.entries(raw).map(([posicion, val]) => ({ posicion, pct: sanearNumero(val) }));
  }
  return [{ posicion: posicionEvaluada || "Principal", pct: 100 }];
}

function PosicionesOcupadas({ info }: { info: any }) {
  const posiciones = normalizarPosiciones(info, info?.posicion_evaluada);

  if (posiciones.length === 0 || posiciones.every((p) => p.pct === 0)) {
    return (
      <div className="flex items-center justify-center h-[150px] text-slate-500 text-sm">
        Sin datos de distribución posicional para este jugador.
      </div>
    );
  }

  const barData = [{
    x: posiciones.map((p) => p.pct),
    y: posiciones.map((p) => p.posicion),
    type: "bar",
    orientation: "h",
    marker: { color: ["#0ea5e9", "#10b981", "#f59e0b"].slice(0, posiciones.length) },
    text: posiciones.map((p) => `${p.pct}%`), // Ponemos el % visualmente
    textposition: "auto",
    hoverinfo: "none",
  }];

  const barLayout = {
    height: 150,
    margin: { l: 80, r: 20, t: 10, b: 20 },
    xaxis: { 
      visible: false // Dejamos que Plotly calcule el ancho automáticamente, sin forzar a 100
    },
    yaxis: { 
      type: "category", // 🚀 ESTA ES LA CLAVE: Le obliga a entender que son textos, matando el bug de -0.5 a 0.5
      autorange: "reversed", 
      tickfont: { color: "white", size: 12, weight: "bold" }
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    showlegend: false,
    barmode: "group"
  };

  return (
    <div className="w-full h-[150px]">
      <PlotFigure data={barData as any} layout={barLayout as any} />
    </div>
  );
}

// ==================== BLOQUE 3: Historial Evolutivo ====================
import { ChevronDown, ChevronUp } from "lucide-react"; // 🚀 Importación nueva para los iconos (añádela arriba del todo si no la tienes)

function HistorialEvolutivo({ wyscoutId, posicion }: { wyscoutId: string, posicion: string }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filasAbiertas, setFilasAbiertas] = useState<number[]>([]);

  const toggleFila = (idx: number) => {
    if (filasAbiertas.includes(idx)) {
      // Si ya estaba abierta, la cerramos (la quitamos de la lista)
      setFilasAbiertas(filasAbiertas.filter(i => i !== idx));
    } else {
      // Si estaba cerrada, la añadimos a la lista de abiertas
      setFilasAbiertas([...filasAbiertas, idx]);
    }
  };

  useEffect(() => {
    if (!wyscoutId) return;
    
    fetch(`https://back-hssb.onrender.com/api/evolucion/${wyscoutId}?posicion=${encodeURIComponent(posicion)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Sin datos históricos");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setHistorial(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error cargando historial:", e);
        setLoading(false);
      });
  }, [wyscoutId, posicion]);

  if (loading) {
    return (
      <div className="mt-8 bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex justify-center items-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-400">Cargando evolución histórica...</span>
      </div>
    );
  }

  if (historial.length === 0) return null;

  // Gráfica de Líneas (Evolución del Rating)
  const chartData = [{
    x: historial.map((h) => `${h.Temporada}<br>${h.Equipo}`),
    y: historial.map((h) => h.Ratings?.Rating || 50),
    type: "scatter",
    mode: "lines+markers",
    line: { shape: "spline", color: "#10b981", width: 4 },
    marker: { size: 10, color: "#ffffff", line: { color: "#10b981", width: 3 } },
    text: historial.map((h) => h.Perfil),
    hovertemplate: "<b>%{y}</b><br>%{text}<extra></extra>",
  }];

  const chartLayout = {
    height: 250,
    margin: { l: 40, r: 20, t: 20, b: 60 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    xaxis: { 
      tickfont: { color: "#94a3b8", size: 10 }, 
      gridcolor: "rgba(150,150,150,0.1)",
      showgrid: false
    },
    yaxis: { 
      range: [0, 100], 
      tickfont: { color: "white", size: 12, weight: "bold" },
      gridcolor: "rgba(150,150,150,0.1)"
    },
    hovermode: "x unified"
  };

  return (
    <div className="mt-8 bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">
        Evolución Histórica
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Gráfica de Líneas */}
        <div className="xl:col-span-1 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
            Curva de Rendimiento (Rating)
          </h3>
          <PlotFigure data={chartData as any} layout={chartLayout as any} />
        </div>

        {/* Tabla Detallada Acordeón */}
        <div className="xl:col-span-2 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Temporada</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3 text-center">Mins</th>
                <th className="px-4 py-3 text-center">G / A</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 rounded-tr-lg">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {historial.map((h, idx) => (
                <Fragment key={idx}>
                  {/* Fila Principal */}
                  <tr 
                    onClick={() => toggleFila(idx)} // 🚀 AHORA USA LA FUNCIÓN MULTI-FILA
                    className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{h.Temporada}</td>
                    <td className="px-4 py-3">
                      {h.Equipo}
                      {h.Caracteristica === "Filial" && (
                        <span className="ml-2 bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30 uppercase">
                          Filial
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{h.Minutos}</td>
                    <td className="px-4 py-3 text-center text-blue-300 font-medium">
                      {h.Goles} <span className="text-slate-500">/</span> {h.Asistencias}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-emerald-400 text-base">{h.Ratings?.Rating || 50}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">
                      {/* 🚀 COMPRUEBA SI LA FILA ESTÁ EN LA LISTA DE ABIERTAS */}
                      {filasAbiertas.includes(idx) ? <ChevronUp size={18} className="mx-auto" /> : <ChevronDown size={18} className="mx-auto" />}
                    </td>
                  </tr>

                  {/* 🚀 NUEVO: Fila Desplegable con los Roles de esa Temporada */}
                  {filasAbiertas.includes(idx) && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={6} className="px-6 py-4">
                        
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Columna Izquierda: Veredicto IA de ese año */}
                          <div className="flex-1 bg-slate-800 p-4 rounded border border-blue-500/20">
                            <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Veredicto IA</h4>
                            <p className="text-white font-bold">{h.Perfil}</p>
                          </div>

                          {/* Columna Derecha: Ratings Desglosados */}
                          <div className="flex-[2]">
                            <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Desglose de Roles (Rating Punteado)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {h.Ratings && Object.entries(h.Ratings)
                                .filter(([rol]) => rol !== 'Rating')
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([rol, nota]) => (
                                  <div key={rol} className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/50">
                                    <span className="text-xs font-medium text-slate-300 truncate mr-2">{rol}</span>
                                    <span className={`text-sm font-black ${
                                      Number(nota) >= 85 ? 'text-purple-400' : 
                                      Number(nota) >= 75 ? 'text-blue-400' : 
                                      Number(nota) >= 65 ? 'text-emerald-400' : 
                                      Number(nota) >= 50 ? 'text-yellow-400' : 'text-rose-400'
                                    }`}>
                                      {String(nota)}
                                    </span>
                                  </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default function FichaJugador() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const nombreJugador = decodeURIComponent(params.nombre as string);
  const posicion = searchParams.get('posicion') || 'Delantero';
  // 🚀 AÑADIDO: Capturamos el ID de Wyscout de la URL (si viene)
  const idWyscout = searchParams.get('id') || ''; 
  
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);

  useEffect(() => {
    async function cargarFicha() {
      try {
        // 1. Leemos las ligas que dejamos guardadas en el Buscador PRO
        let ligasQuery = "";
        if (typeof window !== "undefined") {
          const savedFiltros = sessionStorage.getItem("fscouting_filtros");
          if (savedFiltros) {
            try {
              const parsed = JSON.parse(savedFiltros);
              if (parsed.ligas && Array.isArray(parsed.ligas) && parsed.ligas.length > 0) {
                ligasQuery = `&ligas_mercado=${encodeURIComponent(parsed.ligas.join(','))}`;
              }
            } catch (e) {}
          }
        }

        // 2. Le pasamos el parámetro al backend (añade ${ligasQuery} al final)
        const url = `[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/ficha/${encodeURIComponent(nombreJugador)}?posicion=${encodeURIComponent(posicion)}&id=${encodeURIComponent(idWyscout)}${ligasQuery}`;
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error al cargar la ficha:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarFicha();
  }, [nombreJugador, posicion, idWyscout]);
  useEffect(() => {
    if (data?.info) {
      const favoritosGuardados = JSON.parse(localStorage.getItem("fscouting_favoritos") || "[]");
      setEsFavorito(favoritosGuardados.some((f: any) => f.nombre === data.info.nombre));
    }
  }, [data]);

  const toggleFavorito = () => {
    if (!data?.info) return;
    
    let favoritos = JSON.parse(localStorage.getItem("fscouting_favoritos") || "[]");
    
    if (esFavorito) {
      favoritos = favoritos.filter((f: any) => f.nombre !== data.info.nombre);
      setEsFavorito(false);
    } else {
      // Guardamos un resumen del jugador para la tabla de favoritos
      favoritos.push({
        nombre: data.info.nombre,
        equipo: data.info.equipo,
        edad: data.info.edad,
        pais: data.info.pais,
        posicion: data.info.posicion_evaluada,
        perfil: data.info.perfil_scouting
      });
      setEsFavorito(true);
    }
    
    localStorage.setItem("fscouting_favoritos", JSON.stringify(favoritos));
  };

  if (cargando) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-slate-400">Analizando datos en DuckDB...</p>
      </div>
    );
  }

  if (!data || data.detail) {
    return <div className="p-8 text-red-400 text-xl font-bold">Error: Jugador no encontrado.</div>;
  }

  const { info, radar, clones, scatters } = data;
  const radarObj = typeof radar === 'string' ? JSON.parse(radar) : radar;

  // 🧠 MAGIA: Extraer métricas avanzadas directamente de las capas del radar de Plotly
  const metricasTabla: any[] = [];
  if (radarObj?.data) {
    radarObj.data.forEach((trace: any) => {
      // Solo cogemos la capa del jugador (la que no es gris/fondo) y que tenga datos
      if (trace.theta && trace.r && trace.name !== 'Liga') {
        trace.theta.forEach((metric: string, i: number) => {
          if (i === trace.theta.length - 1) return; // Saltamos el último punto (cierre del polígono)
          const rawText = trace.text && trace.text[i] ? trace.text[i] : "";
          const valMatch = rawText.match(/Valor:\s*([\d\.\-]+)/);
          
          metricasTabla.push({
            categoria: trace.name === info.nombre ? 'Métrica Evaluada' : trace.name,
            metrica: metric,
            percentil: Math.round(trace.r[i] || 0),
            valorBruto: valMatch ? valMatch[1] : 'N/D'
          });
        });
      }
    });
  }

  let scattersObj = null;
  if (scatters) {
    const parsedScatters = typeof scatters === 'string' ? JSON.parse(scatters) : scatters;
    scattersObj = Array.isArray(parsedScatters) ? parsedScatters[0] : parsedScatters;
  }

  // 📊 Gráfico de barras blindado contra strings y NaNs
  const posicionesData = info.posiciones && Object.keys(info.posiciones).length > 0 
    ? info.posiciones 
    : { [info.posicion_evaluada || "Principal"]: 100 };
  
  // Limpiamos los valores por si Python mandó un "%" o un string
  const posicionesNombres = Object.keys(posicionesData);
  const posicionesValores = Object.values(posicionesData).map(v => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v.replace(/[^0-9.]/g, '')) || 0;
    return 0;
  });

  const barChartData = [{
    x: posicionesNombres,
    y: posicionesValores,
    type: 'bar',
    marker: { color: '#3b82f6', opacity: 0.85 }
  }];

  const barChartLayout = {
    title: { text: 'Distribución de Minutos por Posición (%)', font: { color: '#f8fafc', size: 14 } },
    xaxis: { title: { text: 'Posición (Wyscout)', font: { color: '#94a3b8' } }, tickfont: { color: '#cbd5e1' } },
    yaxis: { title: { text: '% de Participación', font: { color: '#94a3b8' } }, tickfont: { color: '#cbd5e1' }, range: [0, 100] },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 40, r: 20, b: 40, l: 40 }
  };

  return (
    <div className="space-y-6">
      
      {/* Botón Volver, Cabecera y Favorito */}
      <div className="flex items-center justify-between">
        
        {/* PARTE IZQUIERDA: Flecha y Nombre */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
              {info.nombre} 
              <span className="text-sm bg-blue-600 px-3 py-1 rounded-full font-medium tracking-wide">
                {info.posicion_evaluada}
              </span>
            </h1>
            <p className="text-slate-400 mt-1 text-lg">
              {info.equipo} • {info.edad} años • {info.pais}
            </p>
          </div>
        </div>

        {/* PARTE DERECHA: Botón de Guardar en Shortlist */}
        <button
          onClick={toggleFavorito}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            esFavorito 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Star size={20} fill={esFavorito ? "currentColor" : "none"} />
          {esFavorito ? "En la Shortlist" : "Guardar Jugador"}
        </button>

      </div>

      {/* GRID SUPERIOR: Stats e Info + Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Columna 1: Stats e Info */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col gap-6">
          
          {/* Veredicto de IA (Arriba para más impacto) */}
          <div className="bg-slate-800 p-5 rounded-lg border border-blue-500/30">
            <h3 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-blue-500" /> Veredicto de IA
            </h3>
            <p className="text-xl font-bold text-white">{info.perfil_scouting}</p>
          </div>

          {/* 🚀 NUEVO: Evaluación por Roles */}
          {info.ratings_roles && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700/50 pb-2">
                Evaluación por Roles (vs Liga)
              </h4>
              <div className="flex flex-col gap-2">
                {Object.entries(info.ratings_roles)
                  .filter(([rol]) => rol !== 'Rating')
                  .sort(([, a], [, b]) => (b as number) - (a as number)) // Ordenar de mayor a menor
                  .map(([rol, nota]) => (
                    <div key={rol} className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded border border-slate-700/50">
                      <span className="text-sm font-medium text-slate-300">{rol}</span>
                      <span className={`text-base font-black ${
                        Number(nota) >= 85 ? 'text-purple-400' : 
                        Number(nota) >= 75 ? 'text-blue-400' : 
                        Number(nota) >= 65 ? 'text-emerald-400' : 
                        Number(nota) >= 50 ? 'text-yellow-400' : 'text-rose-400'
                      }`}>
                        {String(nota)}
                      </span>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Métricas Base (Más compactas) */}
          <div className="mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50">
                <p className="text-2xl font-black text-white">{info.minutos}</p>
                <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-widest">Minutos</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50">
                <p className="text-2xl font-black text-white">{info.partidos}</p>
                <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-widest">Partidos</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50">
                <p className="text-2xl font-black text-blue-400">{info.goles}</p>
                <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-widest">Goles</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-slate-700/50">
                <p className="text-2xl font-black text-emerald-400">{info.asistencias}</p>
                <p className="text-[10px] text-slate-400 uppercase mt-1 tracking-widest">Asistencias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: Radar Plotly y Tabla de Percentiles */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg xl:col-span-2 flex flex-col gap-8">
          
          {/* Gráfico Radar */}
          <div className="min-h-[450px]">
            <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-3 mb-4">Perfil Estadístico vs Liga</h2>
            <div className="w-full h-full -mt-6">
              <PlotFigure data={radarObj.data} layout={radarObj.layout} />
            </div>
          </div>

          {/* 🚀 NUEVA TABLA DE AUDITORÍA DE PERCENTILES */}
          {metricasTabla.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">
                Auditoría de Métricas (Percentiles)
              </h3>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 rounded-tl-lg">Métrica Analizada</th>
                      <th className="px-4 py-2 text-center">Valor Real (p90)</th>
                      <th className="px-4 py-2 text-center rounded-tr-lg">Percentil (Score)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {metricasTabla.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 font-medium text-white">{m.metrica}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{m.valorBruto}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            m.percentil >= 80 ? 'bg-purple-500/20 text-purple-400' :
                            m.percentil >= 60 ? 'bg-blue-500/20 text-blue-400' :
                            m.percentil >= 40 ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            P{m.percentil}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEGUNDA FILA: Posiciones Ocupadas y Similares */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* GRÁFICO: Posiciones Ocupadas */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="text-blue-500" /> Posiciones Ocupadas
          </h2>
          <PosicionesOcupadas info={info} />
        </div>

        {/* Jugadores Similares (IA) */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg xl:col-span-2">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-3 mb-4">
            Similares (IA)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                <tr>
                  <th className="px-4 py-2">Jugador</th>
                  <th className="px-4 py-2 text-center">Similitud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {clones && clones.length > 0 ? (
                  clones.map((clone: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        {clone.Player}
                        {clone.Tipo === 'Referencia' && (
                          <span className="bg-blue-600/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30">
                            Pro
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          clone.Similitud >= 90 ? 'text-purple-400' : 
                          clone.Similitud >= 80 ? 'text-blue-400' : 'text-emerald-400'
                        }`}>
                          {clone.Similitud}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                      No hay suficientes datos para buscar clones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* TERCERA FILA: GRÁFICOS DE DISPERSIÓN (SCATTERS) */}
      {data?.scatters && data.scatters.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Dispersión vs Liga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.scatters.map((scatter: any, idx: number) => {
              const sData = typeof scatter.json === 'string' ? JSON.parse(scatter.json) : scatter.json;
              return (
                <div key={idx} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-lg">
                  <div className="w-full h-[350px]">
                    <PlotFigure data={sData.data} layout={sData.layout} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🚀 NUEVA CUARTA FILA: HISTORIAL EVOLUTIVO */}
      {info?.wyscout_id && (
        <HistorialEvolutivo wyscoutId={info.wyscout_id} posicion={info.posicion_evaluada} />
      )}

    </div>
  );
}