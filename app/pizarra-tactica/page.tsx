"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, RotateCcw, Shirt, Plane, X, Eye, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const FORMACIONES: Record<string, {x: number, y: number}[]> = {
  '4-3-3': [{x:8, y:50}, {x:30, y:11.7}, {x:20, y:31.8}, {x:20, y:57.9}, {x:30, y:78}, {x:50, y:27.4}, {x:38, y:50}, {x:50, y:62.3}, {x:68, y:11.7}, {x:75, y:50}, {x:68, y:78}],
  '4-3-3-ofensivo': [{x:8, y:50}, {x:30, y:11.7}, {x:20, y:31.8}, {x:20, y:57.9}, {x:30, y:78}, {x:38, y:50}, {x:55, y:27.4}, {x:55, y:62.3}, {x:68, y:11.7}, {x:75, y:50}, {x:68, y:78}],
  '4-4-2': [{x:8, y:50}, {x:30, y:11.7}, {x:20, y:31.8}, {x:20, y:57.9}, {x:30, y:78}, {x:50, y:11.7}, {x:38, y:31.8}, {x:38, y:57.9}, {x:50, y:78}, {x:68, y:31.8}, {x:68, y:57.9}],
  '4-4-2-rombo': [{x:8, y:50}, {x:30, y:11.7}, {x:20, y:31.8}, {x:20, y:57.9}, {x:30, y:78}, {x:36, y:50}, {x:46, y:23.1}, {x:46, y:66.7}, {x:56, y:50}, {x:70, y:31.8}, {x:70, y:57.9}],
  '4-2-3-1': [{x:8, y:50}, {x:30, y:11.7}, {x:20, y:31.8}, {x:20, y:57.9}, {x:30, y:78}, {x:38, y:31.8}, {x:44, y:57.9}, {x:60, y:11.7}, {x:58, y:50}, {x:60, y:78}, {x:72, y:50}],
  '3-5-2': [{x:8, y:50}, {x:20, y:23.1}, {x:18, y:50}, {x:20, y:66.7}, {x:38, y:11.7}, {x:36, y:31.8}, {x:34, y:50}, {x:36, y:57.9}, {x:38, y:78}, {x:70, y:31.8}, {x:70, y:57.9}],
  '3-4-3': [{x:8, y:50}, {x:20, y:23.1}, {x:18, y:50}, {x:20, y:66.7}, {x:38, y:11.7}, {x:36, y:31.8}, {x:36, y:57.9}, {x:38, y:78}, {x:68, y:18.7}, {x:72, y:50}, {x:68, y:71}],
  '5-4-1': [{x:8, y:50}, {x:24, y:11.7}, {x:20, y:27.4}, {x:18, y:50}, {x:20, y:62.3}, {x:24, y:78}, {x:42, y:18.7}, {x:38, y:34.4}, {x:38, y:55.3}, {x:42, y:71}, {x:72, y:50}]
};

// Separación vertical en porcentaje para los suplentes
const Y_OFFSET = 6.5; 

// --- COMPONENTE DEL JUGADOR ARRASTRABLE (EFECTO CASCADA) ---
function PlayerSticker({ j, isFichaje, formacion, pitchRef, onMove, onRemove, onToggleFilial, todosLosJugadores }: any) {
  const [pos, setPos] = useState({ x: j.x || 50, y: j.y || 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // 🚀 Control del ratón

  useEffect(() => { setPos({ x: j.x || 50, y: j.y || 50 }); }, [j.x, j.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100));
    const ny = Math.max(0, Math.min(((e.clientY - rect.top) / rect.height) * 100, 100));
    setPos({ x: nx, y: ny });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    let finalX = pos.x; let finalY = pos.y;
    const slots = FORMACIONES[formacion] || [];
    
    let allValidSnapPoints: {x: number, y: number, baseX: number, baseY: number, index: number}[] = [];
    slots.forEach(slot => {
        for(let i=0; i<4; i++) {
            allValidSnapPoints.push({ x: slot.x, y: slot.y + (i * Y_OFFSET), baseX: slot.x, baseY: slot.y, index: i });
        }
    });
    
    let nearestPoint: any = null;
    let minD = 999;
    
    allValidSnapPoints.forEach(pt => {
        let dist = Math.sqrt(Math.pow((pos.x - pt.x)*1.5, 2) + Math.pow((pos.y - pt.y), 2));
        if (dist < 8 && dist < minD) { minD = dist; nearestPoint = pt; }
    });

    if (nearestPoint) {
        let foundEmpty = false;
        for (let i = nearestPoint.index; i < 5 && !foundEmpty; i++) {
            let checkY = nearestPoint.baseY + (i * Y_OFFSET);
            const isOccupied = todosLosJugadores.some((p: any) => p.nombre !== j.nombre && Math.abs((p.x || 50) - nearestPoint.baseX) < 1 && Math.abs((p.y || 50) - checkY) < 1);
            
            if (!isOccupied) {
                finalX = nearestPoint.baseX;
                finalY = checkY;
                foundEmpty = true;
            }
        }
        if (!foundEmpty) { finalX = nearestPoint.x; finalY = nearestPoint.y; }
    }

    setPos({ x: finalX, y: finalY });
    onMove(j.nombre, finalX, finalY);
  };
  const zIndexActual = isDragging ? 999 : (isHovered ? 500 : 100 - Math.round(pos.y));

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)} // 🚀 Detector de ratón
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => onToggleFilial(j.nombre)}
      className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 group ${isDragging ? 'scale-110' : 'hover:scale-105 transition-transform'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: zIndexActual }}
    >
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg backdrop-blur-sm ${j.is_filial ? 'bg-purple-600/90 border-purple-300' : (isFichaje ? 'bg-blue-600/90 border-blue-300' : 'bg-slate-800/90 border-slate-400')}`}>
        {isFichaje ? <Plane size={18} className="text-white" /> : <Shirt size={18} className="text-white" />}
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onRemove(j.nombre)}
          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-50"
        >
          <X size={12} />
        </button>
      </div>
      <span className="mt-0.5 px-2 py-0.5 rounded bg-black/90 text-white text-[9px] font-bold whitespace-nowrap border border-white/20 shadow-xl pointer-events-none z-10">
        {j.nombre}
      </span>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function PizarraTactica() {
  const router = useRouter();
  const pitchRef = useRef<HTMLDivElement>(null);

  const [shortlist, setShortlist] = useState<any[]>([]);
  const [plantilla, setPlantilla] = useState<any[]>([]);
  const [fichajes, setFichajes] = useState<any[]>([]);
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [formacion, setFormacion] = useState('4-3-3');
  const [nombreManual, setNombreManual] = useState('');
  const [verPapelera, setVerPapelera] = useState(false);

  // Lista unificada para la lógica de cascada
  const todosLosJugadores = [...plantilla, ...fichajes];

  useEffect(() => { cargarShortlist(); cargarSquad(); }, []);

  // 🚀 TODAS LAS PETICIONES APUNTAN A LOCALHOST CORRECTAMENTE
  const cargarShortlist = () => { fetch('http://localhost:8000/api/preseleccion/get').then(r=>r.json()).then(setShortlist).catch(console.error); };
  
  const cargarSquad = () => {
    fetch('http://localhost:8000/api/squad/get').then(r=>r.json()).then(data => {
      setPlantilla(data.plantilla || []); setFichajes(data.fichajes || []); setEliminados(data.eliminados || []);
    }).catch(console.error);
  };

  const eliminarShortlist = async (nombre: string) => {
    await fetch('http://localhost:8000/api/preseleccion/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre}) });
    cargarShortlist();
  };

  const añadirPizarra = async (nombre: string) => {
    await fetch('http://localhost:8000/api/squad/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre}) });
    cargarSquad();
  };

  const añadirManual = () => {
    if (!nombreManual.trim()) return;
    añadirPizarra(nombreManual.trim());
    setNombreManual('');
  };

  const moverJugador = (nombre: string, x: number, y: number) => {
    fetch('http://localhost:8000/api/squad/move', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre, x, y}) });
  };

  const quitarJugador = async (nombre: string) => {
    await fetch('http://localhost:8000/api/squad/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre}) });
    cargarSquad();
  };

  const restaurarJugador = async (nombre: string) => {
    await fetch('http://localhost:8000/api/squad/restore', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre}) });
    cargarSquad();
    if (eliminados.length === 1) setVerPapelera(false);
  };

  const toggleFilial = async (nombre: string) => {
    await fetch('http://localhost:8000/api/squad/toggle_filial', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nombre}) });
    cargarSquad();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Users className="text-blue-500" size={36} /> Centro de Planificación
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Depth Chart Inteligente: Arrastra un jugador sobre otro para enviarlo a la suplencia automáticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: SHORTLIST */}
        <div className="xl:col-span-1 bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl flex flex-col h-[750px]">
          <div className="p-5 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="text-emerald-500" size={20} /> En Seguimiento</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {shortlist.length === 0 ? <div className="text-center text-slate-500 italic mt-10">No tienes jugadores en la Shortlist.</div> : 
              shortlist.map((j, idx) => (
                <div key={idx} className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white cursor-pointer hover:text-blue-400" onClick={() => router.push(`/jugador/${encodeURIComponent(j.nombre)}`)}>{j.nombre}</h4>
                      <p className="text-xs text-slate-400 mt-1">{j.equipo} | {j.edad} años</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => añadirPizarra(j.nombre)} className="flex-1 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold py-1.5 rounded transition-colors">+ A Pizarra</button>
                    <button onClick={() => eliminarShortlist(j.nombre)} className="px-3 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* COLUMNA DERECHA: PIZARRA */}
        <div className="xl:col-span-3 bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl flex flex-col h-[750px]">
          
          <div className="p-4 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between bg-slate-900/50 rounded-t-xl">
            <div className="flex items-center gap-3">
              <select value={formacion} onChange={(e) => setFormacion(e.target.value)} className="bg-slate-800 text-white font-bold py-2 px-3 rounded-lg border border-slate-600 outline-none">
                {Object.keys(FORMACIONES).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              
              <div className="flex items-center">
                <input type="text" placeholder="Añadir manual..." value={nombreManual} onChange={(e) => setNombreManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && añadirManual()} className="bg-slate-800 border border-slate-600 border-r-0 text-white px-3 py-2 rounded-l-lg outline-none w-40 text-sm" />
                <button onClick={añadirManual} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-r-lg font-bold transition-colors border border-blue-600">Añadir</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVerPapelera(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                <Trash2 size={16} /> Descartes ({eliminados.length})
              </button>
              <button onClick={cargarSquad} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                <RotateCcw size={16} /> Recargar
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 relative flex items-center justify-center bg-slate-900">
            <div ref={pitchRef} className="relative w-full max-w-4xl aspect-[1.5/1] bg-emerald-800 border-2 border-white/60 rounded-sm shadow-2xl overflow-hidden touch-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/60 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-[20%] left-0 w-[15%] h-[60%] border-2 border-l-0 border-white/60"></div>
              <div className="absolute top-[35%] left-0 w-[5%] h-[30%] border-2 border-l-0 border-white/60"></div>
              <div className="absolute top-[20%] right-0 w-[15%] h-[60%] border-2 border-r-0 border-white/60"></div>
              <div className="absolute top-[35%] right-0 w-[5%] h-[30%] border-2 border-r-0 border-white/60"></div>

              {/* 🚀 FANTASMAS TITULARES */}
              {FORMACIONES[formacion]?.map((slot, idx) => (
                <div key={`tit-${idx}`} className="absolute w-12 h-12 border-2 border-white/20 border-dashed rounded-full -translate-x-1/2 -translate-y-1/2 z-0" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}></div>
              ))}

              {/* 🚀 FANTASMAS SUPLENTES (3 por posición, más pequeños) */}
              {FORMACIONES[formacion]?.map((slot, idx) => {
                return [1, 2, 3].map(subIdx => (
                  <div key={`sub-${idx}-${subIdx}`} className="absolute w-8 h-8 border border-white/10 border-dashed rounded-full -translate-x-1/2 -translate-y-1/2 z-0" style={{ left: `${slot.x}%`, top: `${slot.y + (subIdx * Y_OFFSET)}%` }}></div>
                ));
              })}

              {/* JUGADORES (Pasamos todosLosJugadores para que la IA calcule el choque) */}
              {plantilla.map((j) => <PlayerSticker key={`p-${j.nombre}`} j={j} isFichaje={false} formacion={formacion} pitchRef={pitchRef} onMove={moverJugador} onRemove={quitarJugador} onToggleFilial={toggleFilial} todosLosJugadores={todosLosJugadores} />)}
              {fichajes.map((j) => <PlayerSticker key={`f-${j.nombre}`} j={j} isFichaje={true} formacion={formacion} pitchRef={pitchRef} onMove={moverJugador} onRemove={quitarJugador} onToggleFilial={toggleFilial} todosLosJugadores={todosLosJugadores} />)}
            </div>

            <div className="absolute bottom-4 left-6 flex gap-4 text-xs font-bold bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
              <span className="flex items-center gap-1.5 text-slate-300"><Shirt size={14} /> Base</span>
              <span className="flex items-center gap-1.5 text-blue-400"><Plane size={14} /> Fichajes</span>
              <span className="flex items-center gap-1.5 text-purple-400"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Filial (Doble click)</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAPELERA */}
      {verPapelera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Trash2 className="text-rose-500"/> Descartes</h3>
              <button onClick={() => setVerPapelera(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {eliminados.length === 0 ? <p className="text-slate-500 italic text-center py-4">No hay descartes.</p> : 
                eliminados.map(nom => (
                  <div key={nom} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="font-medium text-slate-300">{nom}</span>
                    <button onClick={() => restaurarJugador(nom)} className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Restaurar</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}