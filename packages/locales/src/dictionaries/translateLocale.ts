export interface TranslationStrings {
  "% of First Stage": string;
  "% of Previous Stage": string;
  and: string;
  Back: string;
  Band: string;
  "Bar Total": string;
  "Brush Zoom": string;
  Change: string;
  Chart: string;
  Clear: string;
  "Click to Expand": string;
  "Click to Hide": string;
  "Click to Highlight": string;
  "Click to Show": string;
  "Click to Show All": string;
  "Click to Zoom Out": string;
  Close: string;
  Comparison: string;
  Count: string;
  "Cumulative Count": string;
  "Cumulative Relative Frequency": string;
  day: string;
  days: string;
  Decrease: string;
  Density: string;
  "Double-click or Escape to Clear": string;
  Download: string;
  "Drag to Filter": string;
  Duration: string;
  End: string;
  Equation: string;
  Exponential: string;
  Forecast: string;
  High: string;
  Increase: string;
  "interactive chart": string;
  "JPG image": string;
  Linear: string;
  "Loading Visualization": string;
  Logarithmic: string;
  Low: string;
  "Lower Bound": string;
  "Lower Quartile": string;
  "Lower Whisker": string;
  Match: string;
  Matches: string;
  Maximum: string;
  Mean: string;
  Median: string;
  Milestone: string;
  Minimum: string;
  more: string;
  "No Data": string;
  "No Data Available": string;
  "No Matches": string;
  Observations: string;
  "of first": string;
  "of previous": string;
  Open: string;
  "Percent of Total": string;
  "PNG image": string;
  Polynomial: string;
  Power: string;
  "Powered by D3plus": string;
  Progress: string;
  Projected: string;
  Range: string;
  "Relative Frequency": string;
  "Reset Zoom": string;
  "Running Total": string;
  Search: string;
  Share: string;
  "Share of Parent": string;
  "Shift+Click to Hide": string;
  "Shift+Click to Highlight": string;
  Start: string;
  "SVG vector": string;
  Target: string;
  Today: string;
  Total: string;
  "Trend Line": string;
  "Upper Bound": string;
  "Upper Quartile": string;
  "Upper Whisker": string;
  "Use arrow keys to move between data points, Enter to select, and Escape to exit.": string;
  Value: string;
  Values: string;
  Volume: string;
  Width: string;
  "Zoom In": string;
  "Zoom Out": string;
}

/**
    Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as `en-US` or `es-ES`. Each entry maps the English string to its translation.
*/
const translateLocale: Record<string, TranslationStrings> = {
  "ar-SA": {
    "% of First Stage":
      "% \u0645\u0646 \u0627\u0644\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0623\u0648\u0644\u0649",
    "% of Previous Stage":
      "% \u0645\u0646 \u0627\u0644\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
    and: "\u0648",
    Back: "\u0644\u0644\u062e\u0644\u0641",
    Band: "\u0646\u0637\u0627\u0642",
    "Bar Total":
      "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0645\u0648\u062f",
    "Brush Zoom":
      "\u062a\u0643\u0628\u064a\u0631 \u0628\u0627\u0644\u062a\u062d\u062f\u064a\u062f",
    Change: "\u0627\u0644\u062a\u063a\u064a\u064a\u0631",
    Chart: "\u0645\u062e\u0637\u0637",
    Clear: "\u0645\u0633\u062d",
    "Click to Expand":
      "\u0627\u0646\u0642\u0631 \u0644\u0644\u062a\u0648\u0633\u064a\u0639",
    "Click to Hide":
      "\u0627\u0636\u063a\u0637 \u0644\u0644\u0625\u062e\u0641\u0627\u0621",
    "Click to Highlight":
      "\u0627\u0636\u063a\u0637 \u0644\u0644\u062a\u062d\u062f\u064a\u062f",
    "Click to Show": "\u0627\u0646\u0642\u0631 \u0644\u0644\u0639\u0631\u0636",
    "Click to Show All":
      "\u0627\u0646\u0642\u0631 \u0644\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
    "Click to Zoom Out":
      "\u0627\u0646\u0642\u0631 \u0644\u0644\u062a\u0635\u063a\u064a\u0631",
    Close: "\u0627\u0644\u0625\u063a\u0644\u0627\u0642",
    Comparison: "\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629",
    Count: "\u0627\u0644\u0639\u062f\u062f",
    "Cumulative Count":
      "\u0627\u0644\u0639\u062f\u062f \u0627\u0644\u062a\u0631\u0627\u0643\u0645\u064a",
    "Cumulative Relative Frequency":
      "\u0627\u0644\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0646\u0633\u0628\u064a \u0627\u0644\u062a\u0631\u0627\u0643\u0645\u064a",
    day: "\u064a\u0648\u0645",
    days: "\u0623\u064a\u0627\u0645",
    Decrease: "\u0627\u0646\u062e\u0641\u0627\u0636",
    Density: "\u0627\u0644\u0643\u062b\u0627\u0641\u0629",
    "Double-click or Escape to Clear":
      "\u0627\u0646\u0642\u0631 \u0646\u0642\u0631\u064b\u0627 \u0645\u0632\u062f\u0648\u062c\u064b\u0627 \u0623\u0648 \u0627\u0636\u063a\u0637 Esc \u0644\u0644\u0645\u0633\u062d",
    Download: "\u062a\u062d\u0645\u064a\u0644",
    "Drag to Filter":
      "\u0627\u0633\u062d\u0628 \u0644\u0644\u062a\u0635\u0641\u064a\u0629",
    Duration: "\u0627\u0644\u0645\u062f\u0629",
    End: "\u0627\u0644\u0646\u0647\u0627\u064a\u0629",
    Equation: "\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629",
    Exponential: "\u0623\u0633\u064a",
    Forecast: "\u062a\u0648\u0642\u0639\u0627\u062a",
    High: "\u0627\u0644\u0623\u0639\u0644\u0649",
    Increase: "\u0632\u064a\u0627\u062f\u0629",
    "interactive chart":
      "\u0645\u062e\u0637\u0637 \u062a\u0641\u0627\u0639\u0644\u064a",
    "JPG image": "\u0635\u0648\u0631\u0629 JPG",
    Linear: "\u062e\u0637\u064a",
    "Loading Visualization":
      "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0635\u0648\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u064a",
    Logarithmic: "\u0644\u0648\u063a\u0627\u0631\u064a\u062a\u0645\u064a",
    Low: "\u0627\u0644\u0623\u062f\u0646\u0649",
    "Lower Bound":
      "\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u062f\u0646\u0649",
    "Lower Quartile":
      "\u0627\u0644\u0631\u0628\u064a\u0639 \u0627\u0644\u0623\u062f\u0646\u0649",
    "Lower Whisker":
      "\u0627\u0644\u0634\u0627\u0631\u0628 \u0627\u0644\u0633\u0641\u0644\u064a",
    "No Data":
      "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a",
    "No Data Available":
      "\u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u0628\u064a\u0627\u0646\u0627\u062a",
    "No Matches":
      "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c",
    Match: "\u062a\u0637\u0627\u0628\u0642",
    Matches: "\u062a\u0637\u0627\u0628\u0642\u0627\u062a",
    Maximum: "\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649",
    Mean: "\u0627\u0644\u0645\u062a\u0648\u0633\u0637",
    Median: "\u0627\u0644\u0648\u0633\u064a\u0637",
    Milestone: "\u0645\u0639\u0644\u0645",
    Minimum: "\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u062f\u0646\u0649",
    more: "\u0623\u062e\u0631\u0649",
    Observations: "\u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0627\u062a",
    "of first": "\u0645\u0646 \u0627\u0644\u0623\u0648\u0644\u0649",
    "of previous": "\u0645\u0646 \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
    Open: "\u0627\u0644\u0627\u0641\u062a\u062a\u0627\u062d",
    "Percent of Total":
      "\u0627\u0644\u0646\u0633\u0628\u0629 \u0645\u0646 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    "PNG image": "\u0635\u0648\u0631\u0629 PNG",
    Polynomial:
      "\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u062d\u062f\u0648\u062f",
    Power: "\u0642\u0648\u0629",
    "Powered by D3plus":
      "\u0645\u062f\u0639\u0648\u0645 \u0628\u0648\u0627\u0633\u0637\u0629 D3plus",
    Progress: "\u0627\u0644\u062a\u0642\u062f\u0645",
    Projected: "\u0645\u062a\u0648\u0642\u0639",
    Range: "\u0627\u0644\u0646\u0637\u0627\u0642",
    "Relative Frequency":
      "\u0627\u0644\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0646\u0633\u0628\u064a",
    "Reset Zoom":
      "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062a\u0643\u0628\u064a\u0631",
    "Running Total":
      "\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u062a\u0631\u0627\u0643\u0645\u064a",
    Search: "\u0628\u062d\u062b",
    Share: "\u0645\u0634\u0627\u0631\u0643\u0629",
    "Share of Parent":
      "\u0627\u0644\u062d\u0635\u0629 \u0645\u0646 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u0639\u0644\u0649",
    "Shift+Click to Hide":
      "Shift+\u0627\u0646\u0642\u0631 \u0644\u0644\u0625\u062e\u0641\u0627\u0621",
    "Shift+Click to Highlight":
      "Shift + \u0644\u0644\u062a\u062d\u062f\u064a\u062f \u0627\u0636\u063a\u0637",
    Start: "\u0627\u0644\u0628\u062f\u0627\u064a\u0629",
    "SVG vector": "\u0631\u0633\u0645 \u0645\u062a\u062c\u0647 SVG",
    Target: "\u0627\u0644\u0647\u062f\u0641",
    Today: "\u0627\u0644\u064a\u0648\u0645",
    Total: "\u0627\u0644\u0645\u062c\u0645\u0648\u0639",
    "Trend Line": "\u062e\u0637 \u0627\u0644\u0627\u062a\u062c\u0627\u0647",
    "Upper Bound":
      "\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0639\u0644\u0649",
    "Upper Quartile":
      "\u0627\u0644\u0631\u0628\u064a\u0639 \u0627\u0644\u0623\u0639\u0644\u0649",
    "Upper Whisker":
      "\u0627\u0644\u0634\u0627\u0631\u0628 \u0627\u0644\u0639\u0644\u0648\u064a",
    "Use arrow keys to move between data points, Enter to select, and Escape to exit.":
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0645\u0641\u0627\u062a\u064a\u062d \u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u062a\u0646\u0642\u0644 \u0628\u064a\u0646 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a\u060c \u0648Enter \u0644\u0644\u062a\u062d\u062f\u064a\u062f\u060c \u0648Escape \u0644\u0644\u062e\u0631\u0648\u062c.",
    Value: "\u0627\u0644\u0642\u064a\u0645\u0629",
    Values: "\u0627\u0644\u0642\u064a\u0645",
    Volume: "\u062d\u062c\u0645 \u0627\u0644\u062a\u062f\u0627\u0648\u0644",
    Width: "\u0627\u0644\u0639\u0631\u0636",
    "Zoom In": "\u062a\u0643\u0628\u064a\u0631",
    "Zoom Out": "\u062a\u0635\u063a\u064a\u0631",
  },
  "es-ES": {
    "% of First Stage": "% de la Primera Etapa",
    "% of Previous Stage": "% de la Etapa Anterior",
    and: "y",
    Back: "Atr\u00e1s",
    Band: "Banda",
    "Bar Total": "Total de la Barra",
    "Brush Zoom": "Zoom de Selecci\u00f3n",
    Change: "Variaci\u00f3n",
    Chart: "Gr\u00e1fico",
    Clear: "Borrar",
    "Click to Expand": "Clic para Ampliar",
    "Click to Hide": "Clic para Ocultar",
    "Click to Highlight": "Clic para Resaltar",
    "Click to Show": "Clic para Mostrar",
    "Click to Show All": "Clic para Mostrar Todo",
    "Click to Zoom Out": "Clic para Alejar",
    Close: "Cierre",
    Comparison: "Comparaci\u00f3n",
    Count: "Recuento",
    "Cumulative Count": "Recuento Acumulado",
    "Cumulative Relative Frequency": "Frecuencia Relativa Acumulada",
    day: "d\u00eda",
    days: "d\u00edas",
    Decrease: "Disminuci\u00f3n",
    Density: "Densidad",
    "Double-click or Escape to Clear": "Doble Clic o Escape para Borrar",
    Download: "Descargar",
    "Drag to Filter": "Arrastrar para Filtrar",
    Duration: "Duraci\u00f3n",
    End: "Fin",
    Equation: "Ecuaci\u00f3n",
    Exponential: "Exponencial",
    Forecast: "Pron\u00f3stico",
    High: "M\u00e1ximo",
    Increase: "Aumento",
    "interactive chart": "gr\u00e1fico interactivo",
    "JPG image": "Imagen JPG",
    Linear: "Lineal",
    "Loading Visualization": "Cargando Visualizaci\u00f3n",
    Logarithmic: "Logar\u00edtmica",
    Low: "M\u00ednimo",
    "Lower Bound": "L\u00edmite Inferior",
    "Lower Quartile": "Cuartil Inferior",
    "Lower Whisker": "Bigote Inferior",
    Match: "Coincidencia",
    Matches: "Coincidencias",
    Maximum: "M\u00e1ximo",
    Mean: "Media",
    Median: "Mediana",
    Milestone: "Hito",
    Minimum: "M\u00ednimo",
    more: "m\u00e1s",
    "No Data": "Sin Datos",
    "No Data Available": "Datos No Disponibles",
    "No Matches": "Sin Coincidencias",
    Observations: "Observaciones",
    "of first": "de la primera",
    "of previous": "de la anterior",
    Open: "Apertura",
    "Percent of Total": "Porcentaje del Total",
    "PNG image": "Imagen PNG",
    Polynomial: "Polin\u00f3mica",
    Power: "Potencial",
    "Powered by D3plus": "Funciona con D3plus",
    Progress: "Progreso",
    Projected: "Proyectado",
    Range: "Rango",
    "Relative Frequency": "Frecuencia Relativa",
    "Reset Zoom": "Restablecer Zoom",
    "Running Total": "Total Acumulado",
    Search: "Buscar",
    Share: "Porcentaje",
    "Share of Parent": "Porcentaje del Nivel Superior",
    "Shift+Click to Hide": "May\u00fas+Clic para Ocultar",
    "Shift+Click to Highlight": "May\u00fas+Clic para Resaltar",
    Start: "Inicio",
    "SVG vector": "Vector SVG",
    Target: "Objetivo",
    Today: "Hoy",
    Total: "Total",
    "Trend Line": "L\u00ednea de Tendencia",
    "Upper Bound": "L\u00edmite Superior",
    "Upper Quartile": "Cuartil Superior",
    "Upper Whisker": "Bigote Superior",
    "Use arrow keys to move between data points, Enter to select, and Escape to exit.":
      "Use las flechas para moverse entre los puntos de datos, Intro para seleccionar y Escape para salir.",
    Value: "Valor",
    Values: "Valores",
    Volume: "Volumen",
    Width: "Ancho",
    "Zoom In": "Acercar",
    "Zoom Out": "Alejar",
  },
  "pt-BR": {
    "% of First Stage": "% da Primeira Etapa",
    "% of Previous Stage": "% da Etapa Anterior",
    and: "e",
    Back: "Voltar",
    Band: "Faixa",
    "Bar Total": "Total da Barra",
    "Brush Zoom": "Zoom de Seleção",
    Change: "Varia\u00e7\u00e3o",
    Chart: "Gr\u00e1fico",
    Clear: "Limpar",
    "Click to Expand": "Clique para Expandir",
    "Click to Hide": "Clique para Ocultar",
    "Click to Highlight": "Clique para Destacar",
    "Click to Show": "Clique para Mostrar",
    "Click to Show All": "Clique para Mostrar Tudo",
    "Click to Zoom Out": "Clique para Afastar",
    Close: "Fechamento",
    Comparison: "Compara\u00e7\u00e3o",
    Count: "Contagem",
    "Cumulative Count": "Contagem Acumulada",
    "Cumulative Relative Frequency": "Frequ\u00eancia Relativa Acumulada",
    day: "dia",
    days: "dias",
    Decrease: "Redu\u00e7\u00e3o",
    Density: "Densidade",
    "Double-click or Escape to Clear": "Clique Duplo ou Esc para Limpar",
    Download: "Baixar",
    "Drag to Filter": "Arraste para Filtrar",
    Duration: "Dura\u00e7\u00e3o",
    End: "Fim",
    Equation: "Equa\u00e7\u00e3o",
    Exponential: "Exponencial",
    Forecast: "Previs\u00e3o",
    High: "M\u00e1xima",
    Increase: "Aumento",
    "interactive chart": "gr\u00e1fico interativo",
    "JPG image": "Imagem JPG",
    Linear: "Linear",
    "Loading Visualization": "Carregando Visualiza\u00e7\u00e3o",
    Logarithmic: "Logar\u00edtmica",
    Low: "M\u00ednima",
    "Lower Bound": "Limite Inferior",
    "Lower Quartile": "Quartil Inferior",
    "Lower Whisker": "Bigode Inferior",
    Match: "Correspond\u00eancia",
    Matches: "Correspond\u00eancias",
    Maximum: "M\u00e1ximo",
    Mean: "M\u00e9dia",
    Median: "Mediana",
    Milestone: "Marco",
    Minimum: "M\u00ednimo",
    more: "mais",
    "No Data": "Sem Dados",
    "No Data Available": "Dados N\u00e3o Dispon\u00edveis",
    "No Matches": "Sem Correspond\u00eancias",
    Observations: "Observa\u00e7\u00f5es",
    "of first": "da primeira",
    "of previous": "da anterior",
    Open: "Abertura",
    "Percent of Total": "Porcentagem do Total",
    "PNG image": "Imagem PNG",
    Polynomial: "Polinomial",
    Power: "Pot\u00eancia",
    "Powered by D3plus": "Funciona com D3plus",
    Progress: "Progresso",
    Projected: "Projetado",
    Range: "Intervalo",
    "Relative Frequency": "Frequ\u00eancia Relativa",
    "Reset Zoom": "Redefinir Zoom",
    "Running Total": "Total Acumulado",
    Search: "Pesquisar",
    Share: "Porcentagem",
    "Share of Parent": "Porcentagem do N\u00edvel Superior",
    "Shift+Click to Hide": "Shift+Clique para Ocultar",
    "Shift+Click to Highlight": "Shift+Clique para Destacar",
    Start: "In\u00edcio",
    "SVG vector": "Vetor SVG",
    Target: "Meta",
    Today: "Hoje",
    Total: "Total",
    "Trend Line": "Linha de Tend\u00eancia",
    "Upper Bound": "Limite Superior",
    "Upper Quartile": "Quartil Superior",
    "Upper Whisker": "Bigode Superior",
    "Use arrow keys to move between data points, Enter to select, and Escape to exit.":
      "Use as setas para mover-se entre os pontos de dados, Enter para selecionar e Esc para sair.",
    Value: "Valor",
    Values: "Valores",
    Volume: "Volume",
    Width: "Largura",
    "Zoom In": "Aproximar",
    "Zoom Out": "Afastar",
  },
  "zh-CN": {
    "% of First Stage":
      "\u5360\u7b2c\u4e00\u9636\u6bb5\u7684\u767e\u5206\u6bd4",
    "% of Previous Stage":
      "\u5360\u4e0a\u4e00\u9636\u6bb5\u7684\u767e\u5206\u6bd4",
    and: "\u548c",
    Back: "\u540e\u9762",
    Band: "\u533a\u95f4",
    "Bar Total": "\u67f1\u603b\u8ba1",
    "Brush Zoom": "\u6846\u9009\u7f29\u653e",
    Change: "\u6da8\u8dcc\u5e45",
    Chart: "\u56fe\u8868",
    Clear: "\u6e05\u9664",
    "Click to Expand": "\u5355\u51fb\u5c55\u5f00",
    "Click to Hide": "\u5355\u51fb\u9690\u85cf",
    "Click to Highlight": "\u5355\u51fb\u7a81\u51fa\u663e\u793a",
    "Click to Show": "\u5355\u51fb\u663e\u793a",
    "Click to Show All": "\u5355\u51fb\u663e\u793a\u5168\u90e8",
    "Click to Zoom Out": "\u5355\u51fb\u7f29\u5c0f",
    Close: "\u6536\u76d8",
    Comparison: "\u5bf9\u6bd4",
    Count: "\u8ba1\u6570",
    "Cumulative Count": "\u7d2f\u8ba1\u8ba1\u6570",
    "Cumulative Relative Frequency": "\u7d2f\u8ba1\u76f8\u5bf9\u9891\u7387",
    day: "\u5929",
    days: "\u5929",
    Decrease: "\u51cf\u5c11",
    Density: "\u5bc6\u5ea6",
    "Double-click or Escape to Clear":
      "\u53cc\u51fb\u6216\u6309 Esc \u6e05\u9664",
    Download: "\u4e0b\u8f7d",
    "Drag to Filter": "\u62d6\u52a8\u4ee5\u7b5b\u9009",
    Duration: "\u6301\u7eed\u65f6\u95f4",
    End: "\u7ed3\u675f",
    Equation: "\u65b9\u7a0b",
    Exponential: "\u6307\u6570",
    Forecast: "\u9884\u6d4b",
    High: "\u6700\u9ad8",
    Increase: "\u589e\u52a0",
    "interactive chart": "\u4ea4\u4e92\u5f0f\u56fe\u8868",
    "JPG image": "JPG \u56fe\u7247",
    Linear: "\u7ebf\u6027",
    "Loading Visualization": "\u52a0\u8f7d\u53ef\u89c6\u5316",
    Logarithmic: "\u5bf9\u6570",
    Low: "\u6700\u4f4e",
    "Lower Bound": "\u4e0b\u9650",
    "Lower Quartile": "\u4e0b\u56db\u5206\u4f4d\u6570",
    "Lower Whisker": "\u4e0b\u987b",
    Match: "\u5339\u914d\u9879",
    Matches: "\u5339\u914d\u9879",
    Maximum: "\u6700\u5927\u503c",
    Mean: "\u5e73\u5747\u503c",
    Median: "\u4e2d\u4f4d\u6570",
    Milestone: "\u91cc\u7a0b\u7891",
    Minimum: "\u6700\u5c0f\u503c",
    more: "\u66f4\u591a",
    "No Data": "\u65e0\u6570\u636e",
    "No Data Available": "\u65e0\u53ef\u7528\u6570\u636e",
    "No Matches": "\u65e0\u5339\u914d\u9879",
    Observations: "\u89c2\u6d4b\u6570",
    "of first": "\u5360\u7b2c\u4e00\u9636\u6bb5",
    "of previous": "\u5360\u4e0a\u4e00\u9636\u6bb5",
    Open: "\u5f00\u76d8",
    "Percent of Total": "\u5360\u603b\u6570\u767e\u5206\u6bd4",
    "PNG image": "PNG \u56fe\u7247",
    Polynomial: "\u591a\u9879\u5f0f",
    Power: "\u5e42",
    "Powered by D3plus": "\u7531 D3plus \u63d0\u4f9b\u652f\u6301",
    Progress: "\u8fdb\u5ea6",
    Projected: "\u9884\u6d4b",
    Range: "\u8303\u56f4",
    "Relative Frequency": "\u76f8\u5bf9\u9891\u7387",
    "Reset Zoom": "\u91cd\u7f6e\u7f29\u653e",
    "Running Total": "\u7d2f\u8ba1\u603b\u6570",
    Search: "\u641c\u7d22",
    Share: "\u5171\u4eab",
    "Share of Parent": "\u5360\u4e0a\u7ea7\u6bd4\u4f8b",
    "Shift+Click to Hide": "Shift+\u5355\u51fb\u9690\u85cf",
    "Shift+Click to Highlight": "Shift+\u5355\u51fb\u7a81\u51fa\u663e\u793a",
    Start: "\u5f00\u59cb",
    "SVG vector": "SVG \u77e2\u91cf\u56fe",
    Target: "\u76ee\u6807",
    Today: "\u4eca\u5929",
    Total: "\u603b",
    "Trend Line": "\u8d8b\u52bf\u7ebf",
    "Upper Bound": "\u4e0a\u9650",
    "Upper Quartile": "\u4e0a\u56db\u5206\u4f4d\u6570",
    "Upper Whisker": "\u4e0a\u987b",
    "Use arrow keys to move between data points, Enter to select, and Escape to exit.":
      "\u4f7f\u7528\u65b9\u5411\u952e\u5728\u6570\u636e\u70b9\u4e4b\u95f4\u79fb\u52a8\uff0c\u6309 Enter \u9009\u62e9\uff0c\u6309 Esc \u9000\u51fa\u3002",
    Value: "\u503c",
    Values: "\u503c",
    Volume: "\u6210\u4ea4\u91cf",
    Width: "\u5bbd\u5ea6",
    "Zoom In": "\u653e\u5927",
    "Zoom Out": "\u7f29\u5c0f",
  },
};

export default translateLocale;
