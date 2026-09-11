"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Swords, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import PlotFigure from "@/components/PlotFigure";

const POSICIONES = [
  "Portero", "Central", "Lateral Izquierdo", "Lateral Derecho", 
  "Pivote", "Medio", "Interior", "Mediapunta", 
  "Extremo Izquierdo", "Extremo Derecho", "Delantero"
];

export default function ComparadorPage() {
  const [jugador1, setJugador1] = useState("");
  const [jugador2, setJugador2] = useState("");
  const [posicion, setPosicion] = useState("Delantero");
  
  const [listaNombres, setListaNombres] = useState<string[]>([]);
  const [data1, setData1] = useState<any>(null);
  const [data2, setData2] = useState<any>(null);
  const [dataH2H, setDataH2H] = useState<any>(null); // 🚀 NUEVO: Estado para la IA
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Cargar autocompletado al iniciar
  useEffect(() => {
    fetch("[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/jugadores")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setListaNombres(data); })
      .catch(() => console.error("Error cargando nombres"));
  }, []);

  const ejecutarComparativa = async () => {
    if (!jugador1.trim() || !jugador2.trim()) {
      setError("Por favor, introduce el nombre de los dos jugadores.");
      return;
    }

    setCargando(true);
    setError("");
    setData1(null);
    setData2(null);
    setDataH2H(null);

    try {
      // 1. Fichas individuales (Secuencial para no bloquear DuckDB)
      const url1 = `[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/ficha/${encodeURIComponent(jugador1.trim())}?posicion=${encodeURIComponent(posicion)}`;
      const res1 = await fetch(url1);
      const json1 = await res1.json();
      if (json1.detail) throw new Error(`Jugador A: ${json1.detail}`);

      const url2 = `[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/ficha/${encodeURIComponent(jugador2.trim())}?posicion=${encodeURIComponent(posicion)}`;
      const res2 = await fetch(url2);
      const json2 = await res2.json();
      if (json2.detail) throw new Error(`Jugador B: ${json2.detail}`);

      // 2. 🚀 NUEVO: Pedimos a la IA que redacte el veredicto
      const resH2H = await fetch("[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/comparar_h2h", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jugador1: jugador1.trim(), jugador2: jugador2.trim() })
      });
      const jsonH2H = await resH2H.json();

      setData1(json1);
      setData2(json2);
      setDataH2H(jsonH2H);
    } catch (e: any) {
      setError(e.message || "Error al conectar con la base de datos.");
    } finally {
      setCargando(false);
    }
  };

  // 🧠 TU MAGIA 2.0: Fusión total y Extracción de Tabla Avanzada (Intacta)
  let combinedRadar = null;
  const advancedStats: any[] = [];

  if (data1?.radar && data2?.radar) {
    const r1 = typeof data1.radar === 'string' ? JSON.parse(data1.radar) : data1.radar;
    const r2 = typeof data2.radar === 'string' ? JSON.parse(data2.radar) : data2.radar;

    const combinedData: any[] = [];
    const subplots = ['Ofensiva', 'Organización', 'Defensiva'];

    r1.data.forEach((traceP1: any, index: number) => {
      const traceP2 = r2.data[index];

      combinedData.push({
        ...traceP1,
        name: index === 0 ? data1.info.nombre : '', 
        showlegend: index === 0,
        line: { color: '#3b82f6', width: 2.5 },
        fill: 'toself',
        fillcolor: 'rgba(59, 130, 246, 0.25)'
      });

      if (traceP2) {
        combinedData.push({
          ...traceP2,
          name: index === 0 ? data2.info.nombre : '',
          showlegend: index === 0,
          line: { color: '#f43f5e', width: 2.5 },
          fill: 'toself',
          fillcolor: 'rgba(244, 63, 94, 0.25)'
        });
      }

      if (traceP1.theta && traceP1.text) {
        traceP1.theta.forEach((metricName: string, i: number) => {
          if (i === traceP1.theta.length - 1) return;
          const text1 = traceP1.text[i] || "";
          const text2 = (traceP2 && traceP2.text && traceP2.text[i]) ? traceP2.text[i] : "";

          const val1Match = text1.match(/Valor:\s*([\d\.\-]+|N\/D)/);
          const val2Match = text2.match(/Valor:\s*([\d\.\-]+|N\/D)/);

          advancedStats.push({
            categoria: subplots[index],
            metrica: metricName,
            val1: val1Match ? val1Match[1] : '0',
            val2: val2Match ? val2Match[1] : '0'
          });
        });
      }
    });

    combinedRadar = {
      data: combinedData,
      layout: {
        ...r1.layout,
        title: { text: `H2H: ${data1.info.nombre} vs ${data2.info.nombre}`, font: { color: '#f8fafc', size: 16 } },
      }
    };
  }

  const renderStatRow = (label: string, val1: any, val2: any, isNumber = true, higherIsBetter = true, rowKey?: string | number) => {
    const v1 = isNumber ? Number(val1) || 0 : val1;
    const v2 = isNumber ? Number(val2) || 0 : val2;
    const isTie = v1 === v2;
    const win1 = isNumber ? (higherIsBetter ? v1 > v2 : v1 < v2) : false;
    const win2 = isNumber ? (higherIsBetter ? v2 > v1 : v2 < v1) : false;

    return (
      <tr key={rowKey || label} className="border-b border-slate-700/50 hover:bg-slate-700/20">
        <td className={`px-4 py-2.5 text-center font-bold w-1/3 ${win1 && !isTie ? 'text-blue-400' : 'text-slate-300'}`}>{val1}</td>
        <td className="px-4 py-2.5 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/30 w-1/3">{label}</td>
        <td className={`px-4 py-2.5 text-center font-bold w-1/3 ${win2 && !isTie ? 'text-rose-400' : 'text-slate-300'}`}>{val2}</td>
      </tr>
    );
  };

  const opcionesJ1 = jugador1.length >= 2 ? listaNombres.filter(n => n.toLowerCase().includes(jugador1.toLowerCase())).slice(0, 15) : [];
  const opcionesJ2 = jugador2.length >= 2 ? listaNombres.filter(n => n.toLowerCase().includes(jugador2.toLowerCase())).slice(0, 15) : [];

  return (
    <div className="space-y-6">
      
      <datalist id="lista-jugadores-1">
        {opcionesJ1.map(nombre => <option key={nombre} value={nombre} />)}
      </datalist>
      <datalist id="lista-jugadores-2">
        {opcionesJ2.map(nombre => <option key={nombre} value={nombre} />)}
      </datalist>

      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <Swords className="text-purple-500" size={36} /> Comparador H2H Avanzado
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Enfrenta métricas y rendimiento entre dos candidatos del mercado apoyado por IA.
        </p>
      </div>

      {/* Controles */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-blue-400 uppercase">Jugador A (Azul)</label>
          <input 
            type="text" list="lista-jugadores-1" placeholder="Escribe y elige..."
            className="bg-slate-900 text-white p-2.5 rounded-lg border border-blue-500/50 focus:border-blue-400 outline-none font-bold"
            value={jugador1} onChange={(e) => setJugador1(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-rose-400 uppercase">Jugador B (Rojo)</label>
          <input 
            type="text" list="lista-jugadores-2" placeholder="Escribe y elige..."
            className="bg-slate-900 text-white p-2.5 rounded-lg border border-rose-500/50 focus:border-rose-400 outline-none font-bold"
            value={jugador2} onChange={(e) => setJugador2(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase">Posición de Análisis</label>
          <select 
            className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 outline-none focus:border-purple-500"
            value={posicion} onChange={(e) => setPosicion(e.target.value)}
          >
            {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <button 
          onClick={ejecutarComparativa} disabled={cargando}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {cargando ? "Analizando..." : "Comparar H2H"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} /> <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* RESULTADOS */}
      {data1 && data2 && dataH2H && combinedRadar && (
        <div className="space-y-6">
          
          {/* 🚀 NUEVO: Tarjetas de Identidad Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-950/40 to-[#1e293b] p-5 rounded-xl border border-blue-500/30 flex justify-between items-center shadow-lg">
              <div>
                <h3 className="text-2xl font-black text-blue-400">{data1.info.nombre}</h3>
                <p className="text-xs text-slate-400 uppercase mt-1">{data1.info.equipo} • {data1.info.edad} años</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Nota General</span>
                <span className="text-3xl font-black text-white">{data1.info.Rating || 0}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-l from-rose-950/40 to-[#1e293b] p-5 rounded-xl border border-rose-500/30 flex justify-between items-center shadow-lg flex-row-reverse">
              <div className="text-right">
                <h3 className="text-2xl font-black text-rose-400">{data2.info.nombre}</h3>
                <p className="text-xs text-slate-400 uppercase mt-1">{data2.info.equipo} • {data2.info.edad} años</p>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Nota General</span>
                <span className="text-3xl font-black text-white">{data2.info.Rating || 0}</span>
              </div>
            </div>
          </div>

          {/* 🚀 NUEVO: Veredicto de la IA */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-purple-500/30 shadow-lg">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4 flex items-center gap-2">
              <Sparkles size={18} /> Veredicto Analítico H2H
            </h3>
            <p className="text-slate-200 text-base leading-relaxed italic border-l-2 border-purple-500 pl-4">
              "{dataH2H.veredicto}"
            </p>
          </div>

          {/* Layout en Grid: Izquierda Radar / Derecha Tablas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Radar Superpuesto */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg h-[600px] flex flex-col">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Huella Táctica</h3>
              <div className="flex-1 w-full -mt-6">
                <PlotFigure data={combinedRadar.data} layout={{...combinedRadar.layout, margin: {t:40, b:40, l:40, r:40}}} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Tabla Base */}
              <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                <div className="bg-slate-800 p-3 text-center border-b border-slate-700 text-sm font-bold text-slate-300 uppercase tracking-widest">
                  Perfiles Scouting
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {renderStatRow("Veredicto IA", data1.info.perfil_scouting, data2.info.perfil_scouting, false)}
                    {renderStatRow("Minutos Jugados", data1.info.minutos, data2.info.minutos)}
                  </tbody>
                </table>
              </div>

              {/* Tabla Avanzada Dinámica (Tu magia) */}
              <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col h-[420px]">
                <div className="bg-slate-800 p-3 text-center border-b border-slate-700 text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <ChevronDown size={16} /> Métricas Avanzadas (Per 90)
                </div>
                <div className="overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 sticky top-0">
                      <tr>
                        <th className="py-2 px-4 text-blue-400">Jugador A</th>
                        <th className="py-2 px-4 text-slate-500 text-xs">MÉTRICA</th>
                        <th className="py-2 px-4 text-rose-400">Jugador B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancedStats.map((stat, idx) => (
                        renderStatRow(stat.metrica, stat.val1, stat.val2, true, true, `adv-${idx}`)
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}