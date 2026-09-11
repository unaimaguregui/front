"use client";

import { useState, useEffect, useRef } from "react";
import { BrainCircuit, Search, PlaneTakeoff, WandSparkles, Dna, Loader2 } from "lucide-react";
import PlotFigure from "@/components/PlotFigure";
import { useRouter } from "next/navigation";

const POSICIONES = ["Portero", "Central", "Lateral Izquierdo", "Lateral Derecho", "Pivote", "Medio", "Interior", "Mediapunta", "Extremo Izquierdo", "Extremo Derecho", "Delantero"];

export default function LaboratorioIAPage() {
  const [edadMin, setEdadMin] = useState<number>(15);
  const [edadMax, setEdadMax] = useState<number>(40);
  const router = useRouter();
  
  // Listas Globales
  const [jugadoresLista, setJugadoresLista] = useState<string[]>([]);
  const [ligasLista, setLigasLista] = useState<string[]>([]);
  
  // Controles de Configuración
  const [jugadorObjetivo, setJugadorObjetivo] = useState("");
  const [posicion, setPosicion] = useState("Delantero");
  const [ligaDestino, setLigaDestino] = useState("");
  const [ligasClonador, setLigasClonador] = useState<string[]>([]);
  
  // Estados para el Buscador Predictivo (¡Los que faltaban!)
  const [busquedaInput, setBusquedaInput] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const buscadorRef = useRef<HTMLDivElement>(null);

  // Estados de carga
  const [modoActivo, setModoActivo] = useState<'clonador' | 'traductor' | 'potencial'>('clonador');
  const [cargando, setCargando] = useState(false);
  
  // Resultados
  const [resultadoClonador, setResultadoClonador] = useState<any>(null);
  const [resultadoTraductor, setResultadoTraductor] = useState<any>(null);
  const [resultadoPotencial, setResultadoPotencial] = useState<any>(null);

  // Cargar catálogo y jugadores al inicio
  useEffect(() => {
    fetch('[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/jugadores_totales')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setJugadoresLista(data.sort());
      })
      .catch((e) => console.error("Error cargando jugadores:", e));

    fetch('[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/catalogo')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ligasUnicas = Array.from(new Set(data.map(d => d.liga))).sort() as string[];
          const filtradas = ligasUnicas.filter(l => l !== 'Desconocida' && l !== '');
          setLigasLista(filtradas);
          if (filtradas.length > 0) setLigaDestino(filtradas[0]);
        }
      })
      .catch((e) => console.error("Error cargando catálogo:", e));

    // Cerrar sugerencias al hacer clic fuera del buscador
    const handleClickOutside = (event: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚀 LÓGICA DEL BUSCADOR RÁPIDO
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusquedaInput(val);
    
    if (val.length > 1) {
      const filtrados = jugadoresLista.filter(j => j.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
      setSugerencias(filtrados);
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const seleccionarJugador = (nombre: string) => {
    setJugadorObjetivo(nombre);
    setBusquedaInput(nombre);
    setMostrarSugerencias(false);
    limpiarResultados();
  };

  const limpiarResultados = () => {
    setResultadoClonador(null);
    setResultadoTraductor(null);
    setResultadoPotencial(null);
  };

  const aplicarAtajo = (tipo: string) => {
    let seleccionadas: string[] = [];
    if (tipo === 'top5') {
      seleccionadas = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
    } else if (tipo === 'puente') {
      seleccionadas = ['Primeira Liga', 'Eredivisie', 'Belgian Pro League', 'Serie A Brasil', 'Austrian Bundesliga', '1. HNL'];
    } else if (tipo === '2asdivisiones') {
      seleccionadas = ['Championship', 'La Liga 2', 'Serie B', '2. Bundesliga', 'Ligue 2'];
    } else if (tipo === 'limpiar') {
      seleccionadas = [];
    }
    const validas = seleccionadas.filter(l => ligasLista.includes(l));
    setLigasClonador(validas.length > 0 ? validas : seleccionadas);
};  

  // 1. CLONADOR (PCA)
  const ejecutarClonador = async () => {
    if (!jugadorObjetivo) return;
    setCargando(true); setModoActivo('clonador'); limpiarResultados();
    try {
      const res = await fetch('[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/buscar_similares', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, 
        // 🚀 AÑADIMOS "posicion: posicion" AQUÍ
        body: JSON.stringify({
          nombre: jugadorObjetivo, 
          ligas: ligasClonador, 
          edad_min: edadMin, 
          edad_max: edadMax,
          posicion: posicion 
        })
      });
      const data = await res.json();
      setResultadoClonador(data);
    } catch(e) { console.error(e); } finally { setCargando(false); }
  };

  // 2. TRADUCTOR DE LIGAS (Con parche del Radar)
  const ejecutarTraductor = async () => {
    if (!jugadorObjetivo || !ligaDestino) return;
    setCargando(true); setModoActivo('traductor'); limpiarResultados();
    try {
      const res = await fetch('[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/simular_traspaso', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({jugador: jugadorObjetivo, liga_destino: ligaDestino, posicion})
      });
      const data = await res.json();
      
      if (!data.error && data.datos_reales && data.datos_proyectados) {
        let rawKeys = Object.keys(data.datos_reales);
        let proyectadasObj = data.datos_proyectados;
        let proyectadasArr = Object.values(proyectadasObj);
        
        let reales: number[] = [];
        let proyectadas: number[] = [];
        let cleanKeys: string[] = [];
        
        rawKeys.forEach((rawKey, idx) => {
          let cleanKey = rawKey.replace(' Scale','').replace(' Master','').replace(' per 90',' p90');
          cleanKeys.push(cleanKey);
          reales.push(Number(data.datos_reales[rawKey]) || 0);
          
          let valProyectado = proyectadasObj[rawKey];
          if (valProyectado === undefined) valProyectado = proyectadasObj[cleanKey];
          if (valProyectado === undefined) valProyectado = proyectadasArr[idx];
          
          proyectadas.push(Number(valProyectado) || 0);
        });
        
        if (cleanKeys.length > 0) { 
          cleanKeys.push(cleanKeys[0]); 
          reales.push(reales[0]); 
          proyectadas.push(proyectadas[0]); 
        }
        
        data.radar_config = {
          data: [
            { type: 'scatterpolar', r: reales, theta: cleanKeys, fill: 'toself', name: `Real (${data.origen})`, line: {color: 'rgba(148,163,184,0.8)'}, marker: {color: '#94a3b8'} },
            { type: 'scatterpolar', r: proyectadas, theta: cleanKeys, fill: 'toself', name: `Proyectado (${data.destino})`, line: {color: '#0ea5e9'}, marker: {color: '#0ea5e9'} }
          ],
          layout: {
            polar: { radialaxis: { visible: true, range: [0, 100], gridcolor: 'rgba(255,255,255,0.05)' }, angularaxis: { gridcolor: 'rgba(255,255,255,0.1)', tickfont: {size: 10, color: '#94a3b8'} } },
            paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', margin: { l: 40, r: 40, t: 40, b: 40 }, font: { color: 'white' }, legend: { orientation: "h", y: -0.15 }
          }
        };
      } else if (!data.error) {
        data.error = "Faltan datos de origen o destino para este jugador.";
      }
      setResultadoTraductor(data);
    } catch(e) { console.error(e); } finally { setCargando(false); }
  };

  // 3. POTENCIAL SHAP (Con parche para evitar cuelgues)
  const ejecutarPotencial = async () => {
    if (!jugadorObjetivo) return;
    setCargando(true); setModoActivo('potencial'); limpiarResultados();
    try {
      const res = await fetch(`[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/predecir_potencial/${encodeURIComponent(jugadorObjetivo)}?posicion=${encodeURIComponent(posicion)}`);
      const data = await res.json();
      
      if (!data.error) {
        if (Array.isArray(data.factores)) {
          let factores = [...data.factores].reverse();
          let colores = factores.map((f:any) => f.impacto_shap > 0 ? '#10b981' : '#f43f5e');
          
          data.shap_config = {
            data: [{
              type: 'bar', x: factores.map((f:any) => f.impacto_shap), y: factores.map((f:any) => f.metrica),
              orientation: 'h', marker: { color: colores, line: {width: 1, color: 'rgba(255,255,255,0.1)'} },
              text: factores.map((f:any) => `Valor: ${Number(f.valor_real || 0).toFixed(1)}`), textposition: 'inside', insidetextanchor: 'middle', hoverinfo: 'x+text'
            }],
            layout: {
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', margin: { l: 180, r: 20, t: 20, b: 40 },
              xaxis: { title: 'Impacto SHAP', gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.2)', zerolinewidth: 2 },
              yaxis: { tickfont: {size: 11, color: '#94a3b8'} }, font: { color: 'white' }
            }
          };
        } else {
          data.error = "El modelo no pudo generar los valores explicativos SHAP para este jugador.";
        }
      }
      setResultadoPotencial(data);
    } catch(e) { console.error(e); } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <BrainCircuit className="text-blue-500" size={36} /> Laboratorio de IA
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Clonación de perfiles, simulación de traspasos a nuevas ligas y modelos predictivos de revalorización.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* PANEL DE CONTROL (Izquierda) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl space-y-5">
            
            {/* 1. EL NUEVO BUSCADOR PREDICTIVO */}
            <div ref={buscadorRef} className="relative z-50">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">1. Seleccionar Sujeto</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={busquedaInput}
                  onChange={handleBusquedaChange}
                  onFocus={() => { if(sugerencias.length > 0) setMostrarSugerencias(true); }}
                  placeholder="Ej: Lamine Yamal..."
                  className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2.5 pl-10 rounded-lg focus:border-blue-500 outline-none text-sm transition-colors"
                />
                <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
              </div>
              
              {/* Caja de sugerencias flotante */}
              {mostrarSugerencias && (
                <div className="absolute w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-50">
                  {sugerencias.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 italic">
                      {jugadoresLista.length === 0 ? "Cargando base de datos..." : "No se encontró ningún jugador."}
                    </div>
                  ) : (
                    sugerencias.map((sug, i) => (
                      <div 
                        key={i} 
                        onClick={() => seleccionarJugador(sug)}
                        className="px-4 py-2.5 hover:bg-blue-600 cursor-pointer text-sm border-b border-slate-700/50 last:border-0 transition-colors"
                      >
                        {sug}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2. NUEVO SELECTOR MÚLTIPLE DE LIGAS Y ATAJOS (Solo para Clonador) */}
            <div className="relative z-40 flex flex-col gap-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                Ligas Mercado (Clonador) <span className="text-[10px] text-slate-500 normal-case font-normal">- Usa Ctrl para varias</span>
              </label>
              <select 
                multiple 
                value={ligasClonador} 
                onChange={(e) => setLigasClonador(Array.from(e.target.selectedOptions, option => option.value))} 
                className="w-full bg-slate-900 border border-slate-600 text-slate-300 px-3 py-2 rounded-lg outline-none text-xs h-24 custom-scrollbar"
              >
                <option value="">Por defecto (Su misma liga)</option>
                {ligasLista.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              
              {/* Botones de atajos agrupados y alineados */}
              <div className="flex flex-wrap gap-2 mt-1">
                <button onClick={() => aplicarAtajo('top5')} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">
                  Top 5
                </button>
                <button onClick={() => aplicarAtajo('puente')} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">
                  Puente
                </button>
                <button onClick={() => aplicarAtajo('2asdivisiones')} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-semibold transition-colors">
                  2ª Div
                </button>
                <button onClick={() => aplicarAtajo('limpiar')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-[10px] font-semibold transition-colors ml-auto">
                  Limpiar
                </button>
              </div>
            </div>

            {/* 🚀 NUEVO SELECTOR DE EDADES (Solo para Clonador) */}
            <div className="relative z-30 flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Edad Mínima</label>
                <input 
                  type="number" min="15" max="45" value={edadMin} 
                  onChange={e => setEdadMin(Number(e.target.value))} 
                  className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg outline-none text-sm" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Edad Máxima</label>
                <input 
                  type="number" min="15" max="45" value={edadMax} 
                  onChange={e => setEdadMax(Number(e.target.value))} 
                  className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg outline-none text-sm" 
                />
              </div>
            </div>

            {/* 3. EVALUAR COMO (Posición) */}
            <div className="relative z-20">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">3. Evaluar como...</label>
              <select value={posicion} onChange={(e) => setPosicion(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2.5 rounded-lg outline-none text-sm cursor-pointer">
                {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 4. LIGA DE DESTINO (Traductor) */}
            <div className="relative z-10">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">4. Liga de Destino (Traductor)</label>
              <select value={ligaDestino} onChange={(e) => setLigaDestino(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2.5 rounded-lg outline-none text-sm cursor-pointer">
                {ligasLista.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col gap-3 relative z-0">
            <button onClick={ejecutarClonador} disabled={!jugadorObjetivo || cargando} className={`p-4 rounded-xl border flex items-center gap-3 font-bold transition-all ${modoActivo === 'clonador' && resultadoClonador ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-[#1e293b] border-slate-700 hover:border-slate-500 text-white disabled:opacity-50'}`}>
              <Dna size={20} /> 1. Clonador (PCA)
            </button>
            <button onClick={ejecutarTraductor} disabled={!jugadorObjetivo || cargando} className={`p-4 rounded-xl border flex items-center gap-3 font-bold transition-all ${modoActivo === 'traductor' && resultadoTraductor ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-[#1e293b] border-slate-700 hover:border-slate-500 text-white disabled:opacity-50'}`}>
              <PlaneTakeoff size={20} /> 2. Traductor de Ligas
            </button>
            <button onClick={ejecutarPotencial} disabled={!jugadorObjetivo || cargando} className={`p-4 rounded-xl border flex items-center gap-3 font-bold transition-all ${modoActivo === 'potencial' && resultadoPotencial ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-[#1e293b] border-slate-700 hover:border-slate-500 text-white disabled:opacity-50'}`}>
              <WandSparkles size={20} /> 3. Predictor de Potencial
            </button>
          </div>
        </div>

        {/* PANTALLA PRINCIPAL (Derecha) */}
        <div className="xl:col-span-3 bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl overflow-hidden min-h-[600px] flex flex-col relative z-0">
          
          {cargando ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={48} />
              <p className="text-lg">Procesando redes neuronales...</p>
            </div>
          ) : !jugadorObjetivo ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
              <BrainCircuit size={64} className="opacity-20" />
              <p className="text-lg italic">Busca a un jugador en el panel izquierdo para iniciar el análisis.</p>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
              
              {/* CLONADOR */}
              {modoActivo === 'clonador' && resultadoClonador && (
                <div className="animate-in fade-in space-y-6">
                  {/* Escudo protector por si el backend devuelve un error */}
                  {resultadoClonador.detail || resultadoClonador.error ? (
                    <div className="bg-rose-500/20 text-rose-400 p-4 rounded-lg border border-rose-500/50 flex flex-col gap-2">
                      <strong>⚠️ No se pudo generar la clonación:</strong>
                      <p>{resultadoClonador.detail || resultadoClonador.error}</p>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-2">
                        Clones de <span className="text-indigo-400">{jugadorObjetivo}</span>
                      </h2>
                      
                      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 h-[400px]">
                        {resultadoClonador.grafico_pca && (
                          <PlotFigure data={JSON.parse(resultadoClonador.grafico_pca).data} layout={{...JSON.parse(resultadoClonador.grafico_pca).layout, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: {color: 'white'}}} />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {resultadoClonador.similares?.map((sim: any, idx: number) => (
                          <div key={idx} onClick={() => router.push(`/jugador/${encodeURIComponent(sim.Player)}`)} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 cursor-pointer transition-colors flex justify-between items-center group">
                            <div>
                              <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{sim.Player}</h4>
                              <p className="text-xs text-slate-400 mt-1">{sim.Team} | {sim.Age} años</p>
                            </div>
                            <div className={`text-xl font-black ${sim.Similitud >= 90 ? 'text-indigo-400' : (sim.Similitud >= 80 ? 'text-emerald-400' : 'text-slate-300')}`}>
                              {sim.Similitud}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TRADUCTOR */}
              {modoActivo === 'traductor' && resultadoTraductor && (
                <div className="animate-in fade-in space-y-6">
                  {resultadoTraductor.error ? (
                    <div className="bg-rose-500/20 text-rose-400 p-4 rounded-lg border border-rose-500/50">{resultadoTraductor.error}</div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-2">Traspaso Simulado a <span className="text-sky-400">{resultadoTraductor.destino}</span></h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-4">
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                            <span className="text-slate-400">Origen: <strong className="text-white">{resultadoTraductor.origen}</strong></span>
                            <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded font-mono text-sm border border-slate-600">Coef. {resultadoTraductor.peso_origen}</span>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                            <span className="text-slate-400">Destino: <strong className="text-sky-400">{resultadoTraductor.destino}</strong></span>
                            <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded font-mono text-sm border border-sky-500/50">Coef. {resultadoTraductor.peso_destino}</span>
                          </div>

                          {resultadoTraductor.peso_origen > resultadoTraductor.peso_destino ? (
                            <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-lg">
                              <h4 className="text-emerald-400 font-bold mb-1">Salto a Liga Inferior (Drop-down)</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">El modelo proyecta que sus métricas <b>mejorarán</b> drásticamente debido a la menor intensidad y exigencia de la {resultadoTraductor.destino}.</p>
                            </div>
                          ) : resultadoTraductor.peso_origen < resultadoTraductor.peso_destino ? (
                            <div className="p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-lg">
                              <h4 className="text-rose-400 font-bold mb-1">Salto de Dificultad (Step-up)</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">Se espera un <b>drop-off (caída)</b> de rendimiento general debido a la mayor exigencia competitiva.</p>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-800 border-l-4 border-slate-500 rounded-r-lg">
                              <h4 className="text-slate-300 font-bold mb-1">Traspaso Lateral</h4>
                              <p className="text-sm text-slate-400">Ambas ligas tienen el mismo coeficiente. No se prevé impacto extremo por el cambio de competición.</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-2 h-[350px]">
                          <PlotFigure data={resultadoTraductor.radar_config.data} layout={resultadoTraductor.radar_config.layout} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* POTENCIAL */}
              {modoActivo === 'potencial' && resultadoPotencial && (
                <div className="animate-in fade-in space-y-6">
                  {resultadoPotencial.error ? (
                    <div className="bg-rose-500/20 text-rose-400 p-4 rounded-lg border border-rose-500/50">{resultadoPotencial.error}</div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-2">Análisis de Revalorización (XGBoost)</h2>
                      
                      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-800/80 rounded-xl border border-emerald-500/30">
                        <div className="text-center md:border-r md:border-slate-700 md:pr-8">
                          <div className={`text-6xl font-black ${resultadoPotencial.probabilidad > 65 ? 'text-emerald-400' : (resultadoPotencial.probabilidad > 40 ? 'text-yellow-400' : 'text-rose-400')}`}>
                            {resultadoPotencial.probabilidad}%
                          </div>
                          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-2">Probabilidad Breakout</div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">Veredicto de la IA</h4>
                          <p className="text-slate-300 leading-relaxed">
                            {resultadoPotencial.probabilidad > 70 ? "Altamente Recomendado. Patrones estadísticos idénticos a la élite de su demarcación. Fichaje de muy bajo riesgo y alta revalorización." : 
                             resultadoPotencial.probabilidad > 40 ? "Interesante. Atributos positivos, pero con debilidades métricas que limitan su techo." : 
                             "Riesgo Alto. Métricas actuales insuficientes para el estatus de élite a corto plazo."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Explicabilidad SHAP (Impacto de Métricas)</h4>
                        <div className="h-[350px]">
                          <PlotFigure data={resultadoPotencial.shap_config.data} layout={resultadoPotencial.shap_config.layout} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}