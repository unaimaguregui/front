"use client";
import dynamic from "next/dynamic";

// Importamos Plotly dinámicamente desactivando el SSR (Server Side Rendering)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PlotFigure({ data, layout, config }: any) {
  return (
    <Plot
      data={data}
      layout={{
        ...layout,
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)', // Fondo transparente para que quede bonito
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#cbd5e1' } // Color del texto (Slate 300)
      }}
      config={{ responsive: true, displayModeBar: false, ...config }}
      style={{ width: "100%", height: "100%" }}
    />
  );
}