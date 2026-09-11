"use client";
import { useState, useEffect } from 'react';
import { Database, Activity, CheckCircle2, AlertCircle, Loader2, Server } from 'lucide-react';

export default function PanelAdministracion() {
  const [loading, setLoading] = useState<'etl' | 'curar' | null>(null);
  const [tiempo, setTiempo] = useState(0);
  const [resultado, setResultado] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  // Cronómetro estilo "tqdm" para dar feedback visual de cuánto lleva el proceso
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (loading) {
      setTiempo(0);
      intervalo = setInterval(() => setTiempo((t) => t + 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [loading]);

  const ejecutarProceso = async (endpoint: 'run_etl' | 'curar_bd', tipo: 'etl' | 'curar') => {
    setLoading(tipo);
    setResultado(null);
    try {
      // Ajusta la URL base si tu API está desplegada en otro sitio
      const res = await fetch(`https://back-hssb.onrender.com/api/admin/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setResultado({ 
          texto: `✅ ${data.mensaje} (Registros: ${data.registros_insertados} | Tiempo Real: ${data.tiempo_segundos}s)`, 
          tipo: 'success' 
        });
      } else {
        setResultado({ texto: `❌ Error: ${data.detail || 'Fallo interno en el servidor'}`, tipo: 'error' });
      }
    } catch (error) {
      setResultado({ texto: "❌ Error de conexión: Comprueba que el servidor FastAPI está encendido.", tipo: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Server className="text-blue-500" size={32} />
            Centro de Mando de Datos
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Controla el flujo de datos desde los CSV de Wyscout hasta el motor matemático de Scouting.
          </p>
        </div>

        {/* Tarjetas de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BOTÓN 1: ETL */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30">
                <Database size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">1. Ingesta y Limpieza (ETL)</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                <strong>¿Cuándo usarlo?</strong> Ejecútalo SOLAMENTE cuando metas archivos <code className="text-blue-300">.csv</code> nuevos en la carpeta Data.
                Lee todos los archivos, limpia errores de Wyscout y crea la base de datos DuckDB desde cero.
              </p>
            </div>
            <button
              onClick={() => ejecutarProceso('run_etl', 'etl')}
              disabled={loading !== null}
              className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                loading === 'etl' 
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
              }`}
            >
              {loading === 'etl' ? <><Loader2 className="animate-spin" size={20} /> Procesando ETL...</> : 'Ejecutar Ingesta ETL'}
            </button>
          </div>

          {/* BOTÓN 2: CURACIÓN */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/30">
                <Activity size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">2. Curación Matemática</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                <strong>¿Cuándo usarlo?</strong> Ejecútalo si cambias los diccionarios, los pesos de los perfiles o el algoritmo de Bayes.
                Recalcula todos los percentiles y ratings usando la base de datos existente (es más rápido que el ETL).
              </p>
            </div>
            <button
              onClick={() => ejecutarProceso('curar_bd', 'curar')}
              disabled={loading !== null}
              className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                loading === 'curar' 
                  ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {loading === 'curar' ? <><Loader2 className="animate-spin" size={20} /> Recalculando Datos...</> : 'Aplicar Matemáticas'}
            </button>
          </div>
        </div>

        {/* Zona de Estado (tqdm simulado) y Resultados */}
        <div className="mt-8">
          {loading && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 flex flex-col items-center justify-center text-center animate-pulse">
              <Loader2 className="animate-spin text-white mb-3" size={32} />
              <p className="text-white font-bold text-lg">
                {loading === 'etl' ? 'Leyendo y limpiando CSVs...' : 'Aplicando Campanas de Gauss y Z-Scores...'}
              </p>
              {/* Esto es el "tqdm" visual */}
              <p className="text-slate-400 text-sm mt-2 font-mono bg-slate-900 px-4 py-1 rounded-full">
                Tiempo transcurrido: {tiempo}s
              </p>
            </div>
          )}

          {resultado && !loading && (
            <div className={`p-5 rounded-xl border flex items-start gap-3 ${
              resultado.tipo === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {resultado.tipo === 'success' ? <CheckCircle2 className="mt-0.5" size={24} /> : <AlertCircle className="mt-0.5" size={24} />}
              <p className="text-sm font-medium leading-relaxed">{resultado.texto}</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}