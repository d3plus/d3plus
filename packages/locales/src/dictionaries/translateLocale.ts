export interface TranslationStrings {
  and: string;
  Back: string;
  "Brush Zoom": string;
  Clear: string;
  "Click to Expand": string;
  "Click to Hide": string;
  "Click to Highlight": string;
  "Click to Show": string;
  "Click to Show All": string;
  "Click to Zoom Out": string;
  Comparison: string;
  Count: string;
  Density: string;
  Download: string;
  Equation: string;
  Exponential: string;
  Linear: string;
  "Loading Visualization": string;
  Logarithmic: string;
  Match: string;
  Matches: string;
  more: string;
  "No Data Available": string;
  "No Matches": string;
  Observations: string;
  "Percent of Total": string;
  Polynomial: string;
  Power: string;
  "Powered by D3plus": string;
  Projected: string;
  Range: string;
  "Relative Frequency": string;
  "Reset Zoom": string;
  Search: string;
  Share: string;
  "Share of Parent": string;
  "Shift+Click to Hide": string;
  "Shift+Click to Highlight": string;
  Total: string;
  "Trend Line": string;
  Value: string;
  Values: string;
  "Zoom In": string;
  "Zoom Out": string;
}

/**
    Translations of the strings d3plus renders in its own UI (legend and timeline controls, zoom buttons, the table view, tooltip hints), keyed by locale code such as `en-US` or `es-ES`. Each entry maps the English string to its translation.
*/
const translateLocale: Record<string, TranslationStrings> = {
  "ar-SA": {
    and: "\u0648",
    Back: "\u0644\u0644\u062e\u0644\u0641",
    "Brush Zoom": "\u062a\u0643\u0628\u064a\u0631 \u0628\u0627\u0644\u062a\u062d\u062f\u064a\u062f",
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
    "Click to Zoom Out": "\u0627\u0646\u0642\u0631 \u0644\u0644\u062a\u0635\u063a\u064a\u0631",
    Comparison: "\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629",
    Count: "\u0627\u0644\u0639\u062f\u062f",
    Density: "\u0627\u0644\u0643\u062b\u0627\u0641\u0629",
    Download: "\u062a\u062d\u0645\u064a\u0644",
    Equation: "\u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629",
    Exponential: "\u0623\u0633\u064a",
    Linear: "\u062e\u0637\u064a",
    "Loading Visualization":
      "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0635\u0648\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u064a",
    Logarithmic: "\u0644\u0648\u063a\u0627\u0631\u064a\u062a\u0645\u064a",
    "No Data Available":
      "\u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u0628\u064a\u0627\u0646\u0627\u062a",
    "No Matches": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c",
    Match: "\u062a\u0637\u0627\u0628\u0642",
    Matches: "\u062a\u0637\u0627\u0628\u0642\u0627\u062a",
    more: "\u0623\u062e\u0631\u0649",
    Observations: "\u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0627\u062a",
    "Percent of Total": "\u0627\u0644\u0646\u0633\u0628\u0629 \u0645\u0646 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a",
    Polynomial: "\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u062d\u062f\u0648\u062f",
    Power: "\u0642\u0648\u0629",
    "Powered by D3plus":
      "\u0645\u062f\u0639\u0648\u0645 \u0628\u0648\u0627\u0633\u0637\u0629 D3plus",
    Projected: "\u0645\u062a\u0648\u0642\u0639",
    Range: "\u0627\u0644\u0646\u0637\u0627\u0642",
    "Relative Frequency": "\u0627\u0644\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0646\u0633\u0628\u064a",
    "Reset Zoom": "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062a\u0643\u0628\u064a\u0631",
    Search: "\u0628\u062d\u062b",
    Share: "\u0645\u0634\u0627\u0631\u0643\u0629",
    "Share of Parent": "\u0627\u0644\u062d\u0635\u0629 \u0645\u0646 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u0639\u0644\u0649",
    "Shift+Click to Hide":
      "Shift+\u0627\u0646\u0642\u0631 \u0644\u0644\u0625\u062e\u0641\u0627\u0621",
    "Shift+Click to Highlight":
      "Shift + \u0644\u0644\u062a\u062d\u062f\u064a\u062f \u0627\u0636\u063a\u0637",
    Total: "\u0627\u0644\u0645\u062c\u0645\u0648\u0639",
    "Trend Line": "\u062e\u0637 \u0627\u0644\u0627\u062a\u062c\u0627\u0647",
    Value: "\u0627\u0644\u0642\u064a\u0645\u0629",
    Values: "\u0627\u0644\u0642\u064a\u0645",
    "Zoom In": "\u062a\u0643\u0628\u064a\u0631",
    "Zoom Out": "\u062a\u0635\u063a\u064a\u0631",
  },
  "es-ES": {
    and: "y",
    Back: "Atr\u00e1s",
    "Brush Zoom": "Zoom de Selecci\u00f3n",
    Clear: "Borrar",
    "Click to Expand": "Clic para Ampliar",
    "Click to Hide": "Clic para Ocultar",
    "Click to Highlight": "Clic para Resaltar",
    "Click to Show": "Clic para Mostrar",
    "Click to Show All": "Clic para Mostrar Todo",
    "Click to Zoom Out": "Clic para Alejar",
    Comparison: "Comparaci\u00f3n",
    Count: "Recuento",
    Density: "Densidad",
    Download: "Descargar",
    Equation: "Ecuaci\u00f3n",
    Exponential: "Exponencial",
    Linear: "Lineal",
    "Loading Visualization": "Cargando Visualizaci\u00f3n",
    Logarithmic: "Logar\u00edtmica",
    Match: "Coincidencia",
    Matches: "Coincidencias",
    more: "m\u00e1s",
    "No Data Available": "Datos No Disponibles",
    "No Matches": "Sin Coincidencias",
    Observations: "Observaciones",
    "Percent of Total": "Porcentaje del Total",
    Polynomial: "Polin\u00f3mica",
    Power: "Potencial",
    "Powered by D3plus": "Funciona con D3plus",
    Projected: "Proyectado",
    Range: "Rango",
    "Relative Frequency": "Frecuencia Relativa",
    "Reset Zoom": "Restablecer Zoom",
    Search: "Buscar",
    Share: "Porcentaje",
    "Share of Parent": "Porcentaje del Nivel Superior",
    "Shift+Click to Hide": "May\u00fas+Clic para Ocultar",
    "Shift+Click to Highlight": "May\u00fas+Clic para Resaltar",
    Total: "Total",
    "Trend Line": "L\u00ednea de Tendencia",
    Value: "Valor",
    Values: "Valores",
    "Zoom In": "Acercar",
    "Zoom Out": "Alejar",
  },
  "pt-BR": {
    and: "e",
    Back: "Voltar",
    "Brush Zoom": "Zoom de Seleção",
    Clear: "Limpar",
    "Click to Expand": "Clique para Expandir",
    "Click to Hide": "Clique para Ocultar",
    "Click to Highlight": "Clique para Destacar",
    "Click to Show": "Clique para Mostrar",
    "Click to Show All": "Clique para Mostrar Tudo",
    "Click to Zoom Out": "Clique para Afastar",
    Comparison: "Compara\u00e7\u00e3o",
    Count: "Contagem",
    Density: "Densidade",
    Download: "Baixar",
    Equation: "Equa\u00e7\u00e3o",
    Exponential: "Exponencial",
    Linear: "Linear",
    "Loading Visualization": "Carregando Visualiza\u00e7\u00e3o",
    Logarithmic: "Logar\u00edtmica",
    Match: "Correspond\u00eancia",
    Matches: "Correspond\u00eancias",
    more: "mais",
    "No Data Available": "Dados N\u00e3o Dispon\u00edveis",
    "No Matches": "Sem Correspond\u00eancias",
    Observations: "Observa\u00e7\u00f5es",
    "Percent of Total": "Porcentagem do Total",
    Polynomial: "Polinomial",
    Power: "Pot\u00eancia",
    "Powered by D3plus": "Funciona com D3plus",
    Projected: "Projetado",
    Range: "Intervalo",
    "Relative Frequency": "Frequ\u00eancia Relativa",
    "Reset Zoom": "Redefinir Zoom",
    Search: "Pesquisar",
    Share: "Porcentagem",
    "Share of Parent": "Porcentagem do N\u00edvel Superior",
    "Shift+Click to Hide": "Shift+Clique para Ocultar",
    "Shift+Click to Highlight": "Shift+Clique para Destacar",
    Total: "Total",
    "Trend Line": "Linha de Tend\u00eancia",
    Value: "Valor",
    Values: "Valores",
    "Zoom In": "Aproximar",
    "Zoom Out": "Afastar",
  },
  "zh-CN": {
    and: "\u548c",
    Back: "\u540e\u9762",
    "Brush Zoom": "\u6846\u9009\u7f29\u653e",
    Clear: "\u6e05\u9664",
    "Click to Expand": "\u5355\u51fb\u5c55\u5f00",
    "Click to Hide": "\u5355\u51fb\u9690\u85cf",
    "Click to Highlight": "\u5355\u51fb\u7a81\u51fa\u663e\u793a",
    "Click to Show": "\u5355\u51fb\u663e\u793a",
    "Click to Show All": "\u5355\u51fb\u663e\u793a\u5168\u90e8",
    "Click to Zoom Out": "\u5355\u51fb\u7f29\u5c0f",
    Comparison: "\u5bf9\u6bd4",
    Count: "\u8ba1\u6570",
    Density: "\u5bc6\u5ea6",
    Download: "\u4e0b\u8f7d",
    Equation: "\u65b9\u7a0b",
    Exponential: "\u6307\u6570",
    Linear: "\u7ebf\u6027",
    "Loading Visualization": "\u52a0\u8f7d\u53ef\u89c6\u5316",
    Logarithmic: "\u5bf9\u6570",
    Match: "\u5339\u914d\u9879",
    Matches: "\u5339\u914d\u9879",
    more: "\u66f4\u591a",
    "No Data Available": "\u65e0\u53ef\u7528\u6570\u636e",
    "No Matches": "\u65e0\u5339\u914d\u9879",
    Observations: "\u89c2\u6d4b\u6570",
    "Percent of Total": "\u5360\u603b\u6570\u767e\u5206\u6bd4",
    Polynomial: "\u591a\u9879\u5f0f",
    Power: "\u5e42",
    "Powered by D3plus": "\u7531 D3plus \u63d0\u4f9b\u652f\u6301",
    Projected: "\u9884\u6d4b",
    Range: "\u8303\u56f4",
    "Relative Frequency": "\u76f8\u5bf9\u9891\u7387",
    "Reset Zoom": "\u91cd\u7f6e\u7f29\u653e",
    Search: "\u641c\u7d22",
    Share: "\u5171\u4eab",
    "Share of Parent": "\u5360\u4e0a\u7ea7\u6bd4\u4f8b",
    "Shift+Click to Hide": "Shift+\u5355\u51fb\u9690\u85cf",
    "Shift+Click to Highlight": "Shift+\u5355\u51fb\u7a81\u51fa\u663e\u793a",
    Total: "\u603b",
    "Trend Line": "\u8d8b\u52bf\u7ebf",
    Value: "\u503c",
    Values: "\u503c",
    "Zoom In": "\u653e\u5927",
    "Zoom Out": "\u7f29\u5c0f",
  },
};

export default translateLocale;
