"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const guardados = localStorage.getItem("fscouting_favoritos");
    if (guardados) {
      try {
        setFavoritos(JSON.parse(guardados));
      } catch (e) {}
    }
  }, []);

  const quitarFavorito = (nombre: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se haga clic en la fila y te lleve a la ficha
    const nuevaLista = favoritos.filter(f => f.nombre !== nombre);
    setFavoritos(nuevaLista);
    localStorage.setItem("fscouting_favoritos", JSON.stringify(nuevaLista));
  };

  if (!montado) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Star className="text-yellow-400" size={32} fill="currentColor" /> 
          Shortlist (Mis Favoritos)
        </h1>
        <p className="text-slate-400 mt-1">Tu agenda personal de scouting. Los jugadores guardados permanecerán aquí.</p>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Jugador</th>
                <th className="px-6 py-4 font-semibold">Posición Evaluada</th>
                <th className="px-6 py-4 font-semibold">Equipo</th>
                <th className="px-6 py-4 font-semibold">País / Nacionalidad</th>
                <th className="px-6 py-4 font-semibold">Perfil Scouting</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {favoritos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Star className="mx-auto mb-3 opacity-20" size={48} />
                    <p className="text-lg">Tu shortlist está vacía.</p>
                    <p className="text-sm">Ve al buscador, entra en la ficha de un jugador y haz clic en "Guardar Jugador".</p>
                  </td>
                </tr>
              ) : (
                favoritos.map((jugador, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => router.push(`/jugador/${encodeURIComponent(jugador.nombre)}?posicion=${encodeURIComponent(jugador.posicion)}`)}
                    className="hover:bg-slate-700/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-white">{jugador.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs">
                        {jugador.posicion}
                      </span>
                    </td>
                    <td className="px-6 py-4">{jugador.equipo}</td>
                    <td className="px-6 py-4">{jugador.pais}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-600">
                        {jugador.perfil || "N/D"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => quitarFavorito(jugador.nombre, e)}
                        className="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition-colors"
                        title="Quitar de Favoritos"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}