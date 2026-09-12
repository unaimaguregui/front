import Link from "next/link";
import { Search, Presentation, BrainCircuit, Sliders, Database, Star, Swords, Activity } from "lucide-react"; 

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#1e293b] border-r border-slate-800 p-4 flex flex-col z-50">
      
      {/* Cabecera del Menú */}
      <div className="mb-8 px-4 mt-4">
        <h2 className="text-2xl font-black text-white tracking-tight">F<span className="text-blue-500">Scouting</span></h2>
        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">Inteligencia Deportiva</p>
      </div>

      {/* Enlaces de Navegación */}
      <nav className="space-y-2 flex-1">
        
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Search size={20} />
          <span className="font-medium">Buscador Pro</span>
        </Link>

        {/* Comparador */}
        <Link href="/comparador" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors group">
          <Swords size={20} className="text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-rose-400">Comparador H2H</span>
        </Link>
        
        <Link href="/team-fit" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Sliders size={20} />
          <span className="font-medium">Team Fit</span>
        </Link>

        {/* Oportunidades */}
        <Link href="/oportunidades" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors group">
          <Activity size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-emerald-400">Oportunidades</span>
        </Link>

        {/* Pizarra Táctica */}
        <Link href="/pizarra-tactica" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Presentation size={20} />
          <span className="font-medium">Pizarra Táctica</span>
        </Link>

        {/* 🚀 CORREGIDO: Laboratorio de IA */}
        <Link href="/laboratorio-ia" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors group">
          <BrainCircuit size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-indigo-400">Laboratorio IA</span>
        </Link>

        {/* Favoritos / Shortlist */}
        <Link href="/favoritos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors group">
          <Star size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-yellow-400">Shortlist</span>
        </Link>

        <Link href="/catalogo" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Database size={20} />
          <span className="font-medium">Catálogo</span>
        </Link>
        
      </nav>
    </aside>
  );
}
