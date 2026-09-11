"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// 🌍 DICCIONARIO DE PAÍSES: Mapeamos las competiciones de Wyscout a su país
const MAPA_PAISES: Record<string, string[]> = {
  "España": ["La Liga", "La Liga 2", "Primera RFEF", "Segunda RFEF"],
  "Inglaterra": ["Premier League", "Championship", "League One", "League Two", "English National League", "English National League North South", "English Non-League Premier Division - Step 7", "Premier League 2"],
  "Italia": ["Serie A", "Serie B", "Serie C", "Serie D - Girone A", "Serie D - Girone B", "Serie D - Girone C", "Serie D - Girone D", "Serie D - Girone E", "Serie D - Girone F", "Serie D - Girone G", "Serie D - Girone H", "Primavera 1"],
  "Alemania": ["Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga", "U17 Bundesliga", "U19 Bundesliga"],
  "Francia": ["Ligue 1", "Ligue 2", "French National 1"],
  "Portugal": ["Primeira Liga", "Portuguese Segunda Liga", "Portuguese Liga 3", "Campeonato de Portugal", "Portuguese Liga Revelacao Sub 23", "Portuguese Liga Revelação Sub 23", "Portuguese Juniores U17", "Portuguese Júniores U17", "Portuguese Juniores U19", "Portuguese Júniores U19"],
  "Países Bajos": ["Eredivisie", "Eerste Divisie", "Tweede Divisie"],
  "Bélgica": ["Belgian Pro League", "Belgian First Division B"],
  "Brasil": ["Brasileirão", "Brazil Serie B", "Brazil Serie C"],
  "Argentina": ["Argentina LPF", "Argentina Primera Nacional", "Argentina Copa de la Liga", "Argentina Reserve League"],
  "Estados Unidos": ["MLS", "MLS Next Pro", "USL Championship", "USL League 1", "NCAA D2", "NCAA D3"],
  "México": ["Liga MX", "Liga de Expansion MX", "Liga de Expansión MX", "Mexican U17 League", "Mexican U18 League", "Mexican U19 League", "Mexican U23 League"],
  "Colombia": ["Colombian Primera A", "Colombian Torneo BetPlay"],
  "Chile": ["Chilean Primera Division", "Chilean Primera División", "Chilean Primera B"],
  "Uruguay": ["Uruguay Primera Division", "Uruguay Primera División"],
  "Croacia": ["1. HNL", "2. HNL"],
  "Australia": ["A-League Men", "Australian NPLs", "Capital Territory NPL", "New South Wales NPL", "Queensland NPL", "Queensland Premier League", "South Australia NPL", "South Australia State League 1", "Victoria NPL", "Western Australia NPL"],
  "Dinamarca": ["Superliga", "Danish 1. Division", "Danish 2. Division", "Danish 3. Division", "Danish U17 Division", "Danish U17 Ligaen", "Danish U19 Division", "Danish U19 Ligaen"],
  "Suecia": ["Allsvenskan", "Ettan", "Superettan"],
  "Noruega": ["Eliteserien", "OBOS Ligaen", "Norwegian 2. Division"],
  "Finlandia": ["Veikkausliiga", "Ykkonen", "Ykkönen", "Ykkosliiga", "Ykkösliiga"],
  "Suiza": ["Swiss Super League", "Swiss Challenge League", "Swiss 1. Liga Promotion", "Swiss 1. Liga Classic", "Swiss U17 Elite", "Swiss U19 Elite"],
  "Austria": ["Austrian Bundesliga", "Austrian 2. Liga"],
  "Polonia": ["Ekstraklasa", "Polish I Liga", "Polish II Liga"],
  "Turquía": ["Super Lig", "Süper Lig", "Turkish 1. Lig"],
  "Grecia": ["Greek Super League", "Greek Super League 2", "Greek U19 Super League"],
  "Rusia": ["Russian Premier League", "Russian First League"],
  "Ucrania": ["Ukrainian Premier League", "Ukrainian Persha Liga", "Ukrainian U19 League"],
  "Escocia": ["Scottish Premiership", "Scottish Championship", "Scottish League One", "Scottish League Two"],
  "República Checa": ["Czech Fortuna Liga", "Czech FNL", "Czech 1. Liga U19", "Czech U17 League"],
  "Rumania": ["Romanian Superliga", "Romanian Liga II", "Romanian Liga Elitelor U17", "Romanian Liga Tineret U18"],
  "Serbia": ["Serbian Super Liga", "Serbian Prva Liga", "Serbian U17 League", "Serbian U19 League"],
  "Eslovaquia": ["Slovak Super Liga", "Slovak 2. Liga", "Slovak U19 League"],
  "Arabia Saudita": ["Saudi Pro League", "Saudi Division 1"],
  "Catar": ["Qatari Stars League"],
  "Emiratos Árabes Unidos": ["UAE Pro League"],
  "Japón": ["J1", "J2", "J3"],
  "Corea del Sur": ["K League 1", "K League 2", "K3 League", "K4 League"],
  "China": ["Chinese Super League", "China League One", "China League Two"],
  "Kazajistán": ["Kazakh Premier League", "Kazakh 1. Division", "Kazakh 2. Division", "Kazakh U16 League", "Kazakh U17 League", "Kazakh U18 League"],
  "Albania": ["Albanian Kategoria Superiore"],
  "Andorra": ["Andorra Primera Divisió"],
  "Armenia": ["Armenian Premier League"],
  "Azerbaiyán": ["Azeri Premyer Liqa", "Azeri Birinci Dasta"],
  "Indonesia": ["BRI Liga 1"],
  "Baréin": ["Bahrain Premier League"],
  "Bielorrusia": ["Belarusian Premier League", "Belarusian 1. Division", "Belarusian Reserve League"],
  "Islandia": ["Besta-deild karla", "Iceland 1. Deild"],
  "Bolivia": ["Bolivian LFPB"],
  "Bosnia y Herzegovina": ["Bosnian Premier League"],
  "Marruecos": ["Botola Pro"],
  "Bulgaria": ["Bulgarian First League"],
  "Camboya": ["Cambodian Premier League"],
  "Canadá": ["Canadian Premier League"],
  "Costa Rica": ["Costa Rican Primera Division", "Costa Rican Primera División"],
  "Chipre": ["Cyprus 1. Division", "Cyprus 2. Division"],
  "Ecuador": ["Ecuador Liga Pro"],
  "Egipto": ["Egyptian Premier League"],
  "El Salvador": ["El Salvador Primera Division", "El Salvador Primera División"],
  "Georgia": ["Erovnuli Liga", "Erovnuli Liga 2"],
  "Estonia": ["Estonia Meistriliiga", "Estonian Esiliiga A"],
  "Islas Feroe": ["Faroe Islands Meistaradeildin"],
  "Guatemala": ["Guatemalan Liga Nacional"],
  "Honduras": ["Honduran Liga Nacional"],
  "Hong Kong": ["Hong Kong Premier League"],
  "India": ["Indian Super League"],
  "Irlanda": ["Irish Premier Division", "Irish First Division"],
  "Jordania": ["Jordan Pro League"],
  "Kosovo": ["Kosovo Superliga"],
  "Kirguistán": ["Kyrgyz Premier League"],
  "Letonia": ["Latvian Virsliga", "Latvian 1. Liga"],
  "Israel": ["Ligat ha'Al", "Liga Leumit"],
  "Lituania": ["Lithuanian A Lyga", "Lithuanian 1 Lyga"],
  "Luxemburgo": ["Luxembourg National Division"],
  "Malasia": ["Malaysian Super League"],
  "Malta": ["Malta Premier League", "Malta Challenge League"],
  "Moldavia": ["Moldovan Super Liga"],
  "Montenegro": ["Montenegro First League", "Montenegro Second League"],
  "Hungría": ["NB I", "NB II"],
  "Nueva Zelanda": ["New Zealand National League"],
  "Nicaragua": ["Nicaragua Primera Division"],
  "Nigeria": ["Nigerian Creative Championship"],
  "Macedonia del Norte": ["North Macedonia First League"],
  "Irlanda del Norte": ["Northern Irish Premiership"],
  "Panamá": ["Panama LPF"],
  "Paraguay": ["Paraguay Division Profesional"],
  "Perú": ["Peruvian Liga 1"],
  "Singapur": ["Singapore Premier League"],
  "Eslovenia": ["Slovenian 1. SNL", "Slovenian 2. SNL"],
  "Sudáfrica": ["South African PSL"],
  "Tailandia": ["Thai League 1", "Thai League 2"],
  "Túnez": ["Tunisia Ligue 1"],
  "Uzbekistán": ["Uzbek Super League"],
  "Vietnam": ["V.League 1"],
  "Gales": ["Welsh Premier League"]
};

// Función para averiguar el país de una liga
const getPaisDeLiga = (liga: string) => {
  for (const [pais, ligas] of Object.entries(MAPA_PAISES)) {
    if (ligas.includes(liga)) return pais;
  }
  return "Otros"; // Si no está en el diccionario, la mandamos a "Otros"
};

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

export default function BuscadorPro() {
  const router = useRouter();
  const [ligasDisponibles, setLigasDisponibles] = useState<string[]>([]);
  const [temporadasDisponibles, setTemporadasDisponibles] = useState<string[]>([]);
  
  // Nuevo estado para controlar qué pestaña de país estamos viendo
  const [paisFiltro, setPaisFiltro] = useState<string>("Todos");

  // Estado para guardar lo que se escribe en el input del equipo
  const [equipoInput, setEquipoInput] = useState<string>("");
  const [equiposDisponibles, setEquiposDisponibles] = useState<string[]>([]);
  const [sugerenciasEquipos, setSugerenciasEquipos] = useState<string[]>([]);

  const [filtros, setFiltros] = useState({
    posicion: "Delantero",
    estilo: "Rematador",
    ligas: ["Premier League"],
    temporada: "25-26",
    mins: 500,
    edad_min: 15,
    edad_max: 40
  });

  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (typeof window !== "undefined") {
      const savedFiltros = sessionStorage.getItem("fscouting_filtros");
      if (savedFiltros) {
        try {
          const parsed = JSON.parse(savedFiltros);
          setFiltros({
            posicion: parsed.posicion || "Delantero",
            estilo: parsed.estilo || "Rematador",
            ligas: Array.isArray(parsed.ligas) ? parsed.ligas : ["Premier League"],
            temporada: parsed.temporada || "25-26",
            mins: parsed.mins ?? 500,
            edad_min: parsed.edad_min ?? 15,
            edad_max: parsed.edad_max ?? 40
          });
        } catch (e) {}
      }

      const savedResultados = sessionStorage.getItem("fscouting_resultados");
      if (savedResultados) {
        try {
          const parsedRes = JSON.parse(savedResultados);
          if (Array.isArray(parsedRes)) setResultados(parsedRes);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (montado) {
      sessionStorage.setItem("fscouting_filtros", JSON.stringify(filtros));
    }
  }, [filtros, montado]);

  useEffect(() => {
    async function cargarCatalogo() {
      const catalogCache = sessionStorage.getItem("fscouting_catalogo");
      if (catalogCache) {
        try {
          const data = JSON.parse(catalogCache);
          const ligasUnicas = Array.from(new Set(data.map((d: any) => d.liga))) as string[];
          const tempUnicas = Array.from(new Set(data.map((d: any) => d.temporada))) as string[];
          setLigasDisponibles(ligasUnicas.sort());
          setTemporadasDisponibles(tempUnicas.sort().reverse());
          return; 
        } catch (e) {}
      }

      try {
        const res = await fetch("[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/catalogo");
        const data = await res.json();
        if (!data.error && Array.isArray(data)) {
          sessionStorage.setItem("fscouting_catalogo", JSON.stringify(data));
          const ligasUnicas = Array.from(new Set(data.map((d: any) => d.liga))) as string[];
          const tempUnicas = Array.from(new Set(data.map((d: any) => d.temporada))) as string[];
          setLigasDisponibles(ligasUnicas.sort());
          setTemporadasDisponibles(tempUnicas.sort().reverse());
        }
      } catch (error) {
        console.error("Error cargando catálogo:", error);
      }
    }
    cargarCatalogo();
  }, []);

  useEffect(() => {
    async function cargarEquipos() {
      const cache = sessionStorage.getItem("fscouting_equipos");
      if (cache) {
        setEquiposDisponibles(JSON.parse(cache));
        return;
      }
      try {
        const res = await fetch("[https://back-hssb.onrender.com](https://back-hssb.onrender.com)/api/equipos");
        const data = await res.json();
        if (Array.isArray(data)) {
          setEquiposDisponibles(data);
          sessionStorage.setItem("fscouting_equipos", JSON.stringify(data));
        }
      } catch(e) {}
    }
    cargarEquipos();
  }, []);

  // Lógica de Atajos
  const aplicarAtajo = (tipo: string) => {
    let seleccionadas: string[] = [];
    if (tipo === 'top5') {
      seleccionadas = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
    } else if (tipo === 'puente') {
      seleccionadas = ['Primeira Liga', 'Eredivisie', 'Belgian Pro League', 'Serie A Brasil', 'Austrian Bundesliga', 'Liga Profesional', '1. HNL'];
    } else if (tipo === '2asdivisiones') {
      seleccionadas = ['Championship', 'La Liga 2', 'Serie B', '2. Bundesliga', 'Ligue 2'];
    } else if (tipo === 'limpiar') {
      seleccionadas = [];
    }
    const validas = seleccionadas.filter(l => ligasDisponibles.includes(l));
    setFiltros({ ...filtros, ligas: validas.length > 0 ? validas : seleccionadas });
  };

  const toggleLiga = (ligaName: string) => {
    const actuales = Array.isArray(filtros.ligas) ? filtros.ligas : [];
    if (actuales.includes(ligaName)) {
      setFiltros({ ...filtros, ligas: actuales.filter((l: string) => l !== ligaName) });
    } else {
      setFiltros({ ...filtros, ligas: [...actuales, ligaName] });
    }
  };

  // Se ejecuta cada vez que tecleas una letra en el input del equipo
  const handleEquipoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEquipoInput(val);
    
    // Si escribe "Barca, Mad", solo cogemos "Mad" para buscar sugerencias
    const parts = val.split(',');
    const currentSearch = parts[parts.length - 1].trim().toLowerCase();
    
    if (currentSearch.length >= 2) {
      const matches = equiposDisponibles
        .filter(eq => eq.toLowerCase().includes(currentSearch))
        .slice(0, 6); // Mostramos máximo 6 sugerencias
      setSugerenciasEquipos(matches);
    } else {
      setSugerenciasEquipos([]);
    }
  };

  // Se ejecuta cuando el usuario hace clic en una de las recomendaciones
  const seleccionarEquipo = (equipoSugerido: string) => {
    const parts = equipoInput.split(',');
    parts[parts.length - 1] = " " + equipoSugerido + ", "; // Ponemos el equipo real y una coma lista para otro equipo
    setEquipoInput(parts.join(',').trim());
    setSugerenciasEquipos([]); // Ocultamos la lista
  };

  const ejecutarBusqueda = async () => {
    setCargando(true);
    setResultados([]); 
    
    const listaEquipos = equipoInput
      .split(',')
      .map(eq => eq.trim())
      .filter(eq => eq !== "");

    const payload = {
        paises: [], 
        ligas: filtros.ligas,
        temporadas: [filtros.temporada],
        posicion: filtros.posicion,
        estilo: filtros.estilo,
        mins: filtros.mins,
        edad_min: filtros.edad_min,
        edad_max: filtros.edad_max,
        equipos_filtro: listaEquipos,
        perfiles: []
      };

    try {
      const response = await fetch("https://back-hssb.onrender.com/api/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data && data.jugadores && Array.isArray(data.jugadores)) {
        setResultados(data.jugadores);
        sessionStorage.setItem("fscouting_resultados", JSON.stringify(data.jugadores));
      } else if (Array.isArray(data)) {
        setResultados(data);
        sessionStorage.setItem("fscouting_resultados", JSON.stringify(data));
      } else {
        console.error("❌ El backend devolvió un error:", data);
        setResultados([]); 
      }
    } catch (error) {
      console.error("❌ Error de conexión al buscar jugadores:", error);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  // Preparamos los datos visuales para los filtros de países
  const ligasActivas = Array.isArray(filtros.ligas) ? filtros.ligas : [];
  const paisesDisponibles = ["Todos", ...Array.from(new Set(ligasDisponibles.map(getPaisDeLiga))).sort()];
  
  const ligasParaAnadir = ligasDisponibles
    .filter(l => paisFiltro === "Todos" || getPaisDeLiga(l) === paisFiltro)
    .filter(l => !ligasActivas.includes(l));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Explorador de Mercado</h1>
          <p className="text-slate-400">Selecciona múltiples ligas y analiza talento global.</p>
        </div>
      </div>

      {/* ATAJOS RÁPIDOS */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-lg flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase">Atajos:</span>
        <button onClick={() => aplicarAtajo('top5')} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          ⭐ Top 5 Ligas
        </button>
        <button onClick={() => aplicarAtajo('puente')} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          🌉 Ligas Puente
        </button>
        <button onClick={() => aplicarAtajo('2asdivisiones')} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
          🥈 Segundas Divisiones
        </button>
        <button onClick={() => aplicarAtajo('limpiar')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto">
          Limpiar Ligas
        </button>
      </div>

      {/* PANEL PRINCIPAL DE FILTROS */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg space-y-6">
        
        {/* Fila 1: Posición, Rol, Temporada, Minutos, Edades y Buscar */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase">Posición</label>
            <select 
              className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"
              value={filtros.posicion}
              onChange={(e) => setFiltros({...filtros, posicion: e.target.value, estilo: POSICIONES_ESTILOS[e.target.value][0]})}
            >
              {Object.keys(POSICIONES_ESTILOS).map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase">Rol Táctico</label>
            <select 
              className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"
              value={filtros.estilo}
              onChange={(e) => setFiltros({...filtros, estilo: e.target.value})}
            >
              {POSICIONES_ESTILOS[filtros.posicion]?.map(est => <option key={est} value={est}>{est}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase">Temporada</label>
            <select 
              className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"
              value={filtros.temporada}
              onChange={(e) => setFiltros({...filtros, temporada: e.target.value})}
            >
              {temporadasDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase">Minutos Min.</label>
            <input 
              type="number" 
              className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"
              value={filtros.mins}
              onChange={(e) => setFiltros({...filtros, mins: parseInt(e.target.value) || 0})}
            />
          </div>

          {/* 🚀 EL NUEVO BLOQUE DE EDAD MÍNIMA Y MÁXIMA */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase">Edad (Mín - Máx)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="15" max="45"
                className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none w-full text-center"
                value={filtros.edad_min}
                onChange={(e) => setFiltros({...filtros, edad_min: parseInt(e.target.value) || 0})}
              />
              <input 
                type="number" 
                min="15" max="45"
                className="bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none w-full text-center"
                value={filtros.edad_max}
                onChange={(e) => setFiltros({...filtros, edad_max: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={ejecutarBusqueda}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {cargando ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {cargando ? "Buscando..." : "Buscar Multiliga"}
            </button>
          </div>
        </div>

        {/* 🌍 Fila 2: SELECCIÓN INTELIGENTE DE LIGAS */}
        <div className="border-t border-slate-700 pt-5 space-y-5">
          
          {/* Zona A: Ligas Seleccionadas (Siempre Visibles) */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
            <label className="text-xs font-semibold text-blue-400 uppercase flex items-center gap-2 mb-3">
              Ligas Seleccionadas ({ligasActivas.length} en uso)
            </label>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {ligasActivas.length > 0 ? (
                ligasActivas.map(liga => (
                  <button 
                    key={liga} 
                    onClick={() => toggleLiga(liga)} 
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600/90 text-white shadow-md hover:bg-red-500 transition-colors"
                    title="Click para quitar"
                  >
                    {liga} <X size={14} className="group-hover:scale-125 transition-transform" />
                  </button>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic">No hay ninguna competición seleccionada. Usa el catálogo de abajo.</span>
              )}
            </div>
          </div>

          {/* Zona B: Catálogo de Ligas por País */}
          <div>
            {/* Pestañas de Países */}
            <div className="flex flex-wrap gap-2 mb-4">
              {paisesDisponibles.map(pais => (
                <button
                  key={pais}
                  onClick={() => setPaisFiltro(pais)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    paisFiltro === pais 
                      ? 'bg-slate-300 text-slate-900 shadow-lg' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {pais}
                </button>
              ))}
            </div>

            {/* Ligas disponibles del País seleccionado (oculta las que ya están seleccionadas arriba) */}
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
              {ligasParaAnadir.length > 0 ? (
                ligasParaAnadir.map((liga) => (
                  <button
                    key={liga}
                    onClick={() => toggleLiga(liga)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1e293b] text-slate-300 border border-slate-600 hover:border-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={14} className="text-slate-500" /> {liga}
                  </button>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic p-2">
                  {ligasActivas.length > 0 && paisFiltro !== "Todos" 
                    ? `Ya has añadido todas las competiciones de ${paisFiltro}.` 
                    : "No hay ligas disponibles para este filtro."}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🚀 FILTRO DE EQUIPOS CON AUTOCOMPLETADO */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg relative">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              Filtrar por Equipo
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: Barcelona, Real Madrid..."
                value={equipoInput}
                onChange={handleEquipoChange}
                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
              />
              
              {/* DROPDOWN DE SUGERENCIAS FLOTANTE */}
              {sugerenciasEquipos.length > 0 && (
                <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 overflow-hidden shadow-2xl">
                  {sugerenciasEquipos.map(eq => (
                    <li 
                      key={eq} 
                      onClick={() => seleccionarEquipo(eq)}
                      className="px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                    >
                      {eq}
                    </li>
                  ))}
                </ul>
              )}
              
              <p className="text-xs text-slate-500 mt-2">
                Escribe 2 letras y te sugeriremos el equipo. Puedes separar varios con comas.
              </p>
            </div>
          </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Jugador</th>
                <th className="px-6 py-4 font-semibold">Competición</th>
                <th className="px-6 py-4 font-semibold">Equipo</th>
                <th className="px-6 py-4 font-semibold">Edad</th>
                <th className="px-6 py-4 font-semibold">Mins</th>
                <th className="px-6 py-4 font-semibold text-center">Nota (Z-Score)</th>
                <th className="px-6 py-4 font-semibold">Perfil Scouting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {resultados.length === 0 && !cargando && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Selecciona tus ligas, configura los filtros y pulsa buscar para ver talento.
                  </td>
                </tr>
              )}
              {resultados.map((jugador, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => router.push(`/jugador/${encodeURIComponent(jugador.Player)}?id=${jugador["Wyscout id"] || jugador.Wyscout_id || ""}&posicion=${encodeURIComponent(filtros.posicion)}`)}
                  className="hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-white">{jugador.Player}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{jugador.Competition || jugador.League || jugador.liga || jugador.Competicion || jugador.competition || "N/D"}</td>
                  <td className="px-6 py-4">{jugador.Team}</td>
                  <td className="px-6 py-4">{jugador.Age}</td>
                  <td className="px-6 py-4">{jugador["Minutes played"]}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                      jugador.Tier === 'S' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      jugador.Tier === 'A' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      jugador.Tier === 'B' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {jugador.Rating} - {jugador.Tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-600">
                      {jugador.Perfil_Scouting}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}