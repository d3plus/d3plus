# @d3plus/react

[![NPM version](https://img.shields.io/npm/v/@d3plus/react.svg)](https://www.npmjs.com/package/@d3plus/react)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=react)](https://codecov.io/gh/d3plus/d3plus/flags)

React components for d3plus visualizations.

## Installing

If using npm, `npm install @d3plus/react`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/react).

```js
import {*} from "@d3plus/react";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/react"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`Area`](#area) | React component for rendering a d3plus Area shape. |
| [`AreaPlot`](#areaplot) | React component for rendering a d3plus AreaPlot visualization. |
| [`Axis`](#axis) | React component for rendering a d3plus Axis. |
| [`AxisBottom`](#axisbottom) | React component for rendering a d3plus AxisBottom. |
| [`AxisLeft`](#axisleft) | React component for rendering a d3plus AxisLeft. |
| [`AxisRight`](#axisright) | React component for rendering a d3plus AxisRight. |
| [`AxisTop`](#axistop) | React component for rendering a d3plus AxisTop. |
| [`Bar`](#bar) | React component for rendering a d3plus Bar shape. |
| [`BarChart`](#barchart) | React component for rendering a d3plus BarChart visualization. |
| [`BaseClass`](#baseclass) | React component for rendering a d3plus BaseClass instance. |
| [`Box`](#box) | React component for rendering a d3plus Box shape. |
| [`BoxWhisker`](#boxwhisker) | React component for rendering a d3plus BoxWhisker visualization. |
| [`BumpChart`](#bumpchart) | React component for rendering a d3plus BumpChart visualization. |
| [`Circle`](#circle) | React component for rendering a d3plus Circle shape. |
| [`ColorScale`](#colorscale) | React component for rendering a d3plus ColorScale. |
| [`Donut`](#donut) | React component for rendering a d3plus Donut visualization. |
| [`Geomap`](#geomap) | React component for rendering a d3plus Geomap visualization. |
| [`Image`](#image) | React component for rendering a d3plus Image shape. |
| [`Legend`](#legend) | React component for rendering a d3plus Legend. |
| [`Line`](#line) | React component for rendering a d3plus Line shape. |
| [`LinePlot`](#lineplot) | React component for rendering a d3plus LinePlot visualization. |
| [`Matrix`](#matrix) | React component for rendering a d3plus Matrix visualization. |
| [`Message`](#message) | React component for rendering a d3plus Message. |
| [`Network`](#network) | React component for rendering a d3plus Network visualization. |
| [`Pack`](#pack) | React component for rendering a d3plus Pack visualization. |
| [`Path`](#path) | React component for rendering a d3plus Path shape. |
| [`Pie`](#pie) | React component for rendering a d3plus Pie visualization. |
| [`Plot`](#plot) | React component for rendering a d3plus Plot visualization. |
| [`Priestley`](#priestley) | React component for rendering a d3plus Priestley visualization. |
| [`Radar`](#radar) | React component for rendering a d3plus Radar visualization. |
| [`RadialMatrix`](#radialmatrix) | React component for rendering a d3plus RadialMatrix visualization. |
| [`Rect`](#rect) | React component for rendering a d3plus Rect shape. |
| [`Rings`](#rings) | React component for rendering a d3plus Rings visualization. |
| [`Sankey`](#sankey) | React component for rendering a d3plus Sankey visualization. |
| [`Shape`](#shape) | React component for rendering a d3plus Shape shape. |
| [`StackedArea`](#stackedarea) | React component for rendering a d3plus StackedArea visualization. |
| [`TextBox`](#textbox) | React component for rendering a d3plus TextBox. |
| [`Timeline`](#timeline) | React component for rendering a d3plus Timeline. |
| [`Tooltip`](#tooltip) | React component for rendering a d3plus Tooltip. |
| [`Tree`](#tree) | React component for rendering a d3plus Tree visualization. |
| [`Treemap`](#treemap) | React component for rendering a d3plus Treemap visualization. |
| [`Viz`](#viz) | React component for rendering a base d3plus Viz instance. |
| [`Whisker`](#whisker) | React component for rendering a d3plus Whisker shape. |

| Variables | Description |
| --- | --- |
| [`D3plusContext`](#d3pluscontext) | A React context instance used to provide global config options via a provider (D3plusContext.Provider). |

| Interfaces | Description |
| --- | --- |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`RendererProps`](#rendererprops) | Props accepted by the Renderer component. |

| Type Aliases | Description |
| --- | --- |
| [`D3plusComponentProps`](#d3pluscomponentprops) | Props for d3plus React wrapper components (omits the internal constructor prop). |
| [`D3plusConstructor`](#d3plusconstructor) | Constructor type for d3plus visualization classes. |

## Functions

<a id="area"></a>

### Area()

> **Area**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:184](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L184)

React component for rendering a d3plus Area shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="areaplot"></a>

### AreaPlot()

> **AreaPlot**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:54](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L54)

React component for rendering a d3plus AreaPlot visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="axis"></a>

### Axis()

> **Axis**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:139](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L139)

React component for rendering a d3plus Axis.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="axisbottom"></a>

### AxisBottom()

> **AxisBottom**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:143](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L143)

React component for rendering a d3plus AxisBottom.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="axisleft"></a>

### AxisLeft()

> **AxisLeft**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:147](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L147)

React component for rendering a d3plus AxisLeft.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="axisright"></a>

### AxisRight()

> **AxisRight**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:151](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L151)

React component for rendering a d3plus AxisRight.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="axistop"></a>

### AxisTop()

> **AxisTop**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:155](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L155)

React component for rendering a d3plus AxisTop.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="bar"></a>

### Bar()

> **Bar**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:188](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L188)

React component for rendering a d3plus Bar shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="barchart"></a>

### BarChart()

> **BarChart**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:58](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L58)

React component for rendering a d3plus BarChart visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="baseclass"></a>

### BaseClass()

> **BaseClass**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:225](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L225)

React component for rendering a d3plus BaseClass instance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="box"></a>

### Box()

> **Box**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:192](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L192)

React component for rendering a d3plus Box shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="boxwhisker"></a>

### BoxWhisker()

> **BoxWhisker**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:62](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L62)

React component for rendering a d3plus BoxWhisker visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="bumpchart"></a>

### BumpChart()

> **BumpChart**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:66](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L66)

React component for rendering a d3plus BumpChart visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="circle"></a>

### Circle()

> **Circle**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:196](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L196)

React component for rendering a d3plus Circle shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="colorscale"></a>

### ColorScale()

> **ColorScale**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:159](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L159)

React component for rendering a d3plus ColorScale.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="donut"></a>

### Donut()

> **Donut**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:70](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L70)

React component for rendering a d3plus Donut visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="geomap"></a>

### Geomap()

> **Geomap**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:74](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L74)

React component for rendering a d3plus Geomap visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="image"></a>

### Image()

> **Image**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:200](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L200)

React component for rendering a d3plus Image shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="legend"></a>

### Legend()

> **Legend**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:163](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L163)

React component for rendering a d3plus Legend.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="line"></a>

### Line()

> **Line**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:204](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L204)

React component for rendering a d3plus Line shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="lineplot"></a>

### LinePlot()

> **LinePlot**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:78](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L78)

React component for rendering a d3plus LinePlot visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="matrix"></a>

### Matrix()

> **Matrix**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:82](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L82)

React component for rendering a d3plus Matrix visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="message"></a>

### Message()

> **Message**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:167](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L167)

React component for rendering a d3plus Message.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="network"></a>

### Network()

> **Network**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:86](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L86)

React component for rendering a d3plus Network visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="pack"></a>

### Pack()

> **Pack**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:90](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L90)

React component for rendering a d3plus Pack visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="path"></a>

### Path()

> **Path**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:208](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L208)

React component for rendering a d3plus Path shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="pie"></a>

### Pie()

> **Pie**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:94](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L94)

React component for rendering a d3plus Pie visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="plot"></a>

### Plot()

> **Plot**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:98](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L98)

React component for rendering a d3plus Plot visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="priestley"></a>

### Priestley()

> **Priestley**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:102](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L102)

React component for rendering a d3plus Priestley visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="radar"></a>

### Radar()

> **Radar**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:106](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L106)

React component for rendering a d3plus Radar visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="radialmatrix"></a>

### RadialMatrix()

> **RadialMatrix**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:110](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L110)

React component for rendering a d3plus RadialMatrix visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="rect"></a>

### Rect()

> **Rect**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:212](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L212)

React component for rendering a d3plus Rect shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="rings"></a>

### Rings()

> **Rings**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:114](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L114)

React component for rendering a d3plus Rings visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="sankey"></a>

### Sankey()

> **Sankey**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:118](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L118)

React component for rendering a d3plus Sankey visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="shape"></a>

### Shape()

> **Shape**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:216](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L216)

React component for rendering a d3plus Shape shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="stackedarea"></a>

### StackedArea()

> **StackedArea**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:122](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L122)

React component for rendering a d3plus StackedArea visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="textbox"></a>

### TextBox()

> **TextBox**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:171](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L171)

React component for rendering a d3plus TextBox.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="timeline"></a>

### Timeline()

> **Timeline**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:175](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L175)

React component for rendering a d3plus Timeline.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="tooltip"></a>

### Tooltip()

> **Tooltip**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:179](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L179)

React component for rendering a d3plus Tooltip.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="tree"></a>

### Tree()

> **Tree**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:126](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L126)

React component for rendering a d3plus Tree visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="treemap"></a>

### Treemap()

> **Treemap**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:130](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L130)

React component for rendering a d3plus Treemap visualization.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="viz"></a>

### Viz()

> **Viz**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:134](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L134)

React component for rendering a base d3plus Viz instance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

***

<a id="whisker"></a>

### Whisker()

> **Whisker**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [react/index.tsx:220](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L220)

React component for rendering a d3plus Whisker shape.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`D3plusComponentProps`](#d3pluscomponentprops) |

#### Returns

`Element`

## Variables

<a id="d3pluscontext"></a>

### D3plusContext

> `const` **D3plusContext**: `Context`\<[`D3plusConfig`](#d3plusconfig)\>

Defined in: [react/src/D3plusContext.tsx:7](https://github.com/d3plus/d3plus/blob/main/packages/react/src/D3plusContext.tsx#L7)

A React context instance used to provide global config options via a provider (D3plusContext.Provider).

## Interfaces

<a id="d3plusconfig"></a>

### D3plusConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:187

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | The active callback function for highlighting shapes. | core/types/src/utils/D3plusConfig.d.ts:193 |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | core/types/src/utils/D3plusConfig.d.ts:195 |
| <a id="property-ariahidden"></a> `ariaHidden?` | `boolean` | Hides the SVG from assistive technology when true (`aria-hidden`). | core/types/src/utils/D3plusConfig.d.ts:199 |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:201 |
| <a id="property-baseline"></a> `baseline?` | `number` | The baseline for the x/y plot. | core/types/src/utils/D3plusConfig.d.ts:203 |
| <a id="property-cache"></a> `cache?` | `boolean` | Whether to cache the processed data between renders. | core/types/src/utils/D3plusConfig.d.ts:205 |
| <a id="property-colorordinal"></a> `colorOrdinal?` | `boolean` | Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. | core/types/src/utils/D3plusConfig.d.ts:207 |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | core/types/src/utils/D3plusConfig.d.ts:209 |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | core/types/src/utils/D3plusConfig.d.ts:211 |
| `colorScaleConfig.axisConfig?` | `AxisConfig` | - | core/types/src/utils/D3plusConfig.d.ts:212 |
| `colorScaleConfig.centered?` | `boolean` | - | core/types/src/utils/D3plusConfig.d.ts:213 |
| `colorScaleConfig.colorMax?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:217 |
| `colorScaleConfig.colorMid?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:216 |
| `colorScaleConfig.colorMin?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:215 |
| `colorScaleConfig.colors?` | `string`[] | - | core/types/src/utils/D3plusConfig.d.ts:214 |
| `colorScaleConfig.scale?` | `AxisScale` | - | core/types/src/utils/D3plusConfig.d.ts:218 |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` | Position of the color scale, or false to hide it. | core/types/src/utils/D3plusConfig.d.ts:221 |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:223 |
| <a id="property-confidence"></a> `confidence?` | `false` \| \[`string` \| ((`d`: `DataPoint`, `i`: `number`) => `number`), `string` \| ((`d`: `DataPoint`, `i`: `number`) => `number`)\] | The confidence interval as `[lower, upper]` bounds — each given as an accessor function or a static data key (e.g. `["lci", "hci"]`), or `false` to disable. | core/types/src/utils/D3plusConfig.d.ts:229 |
| <a id="property-data"></a> `data?` | `string` \| `DataPoint`[] | Data array or URL string to load data from. | core/types/src/utils/D3plusConfig.d.ts:189 |
| <a id="property-datacutoff"></a> `dataCutoff?` | `number` | Maximum number of data points to render before downsampling. | core/types/src/utils/D3plusConfig.d.ts:234 |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | core/types/src/utils/D3plusConfig.d.ts:236 |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | core/types/src/utils/D3plusConfig.d.ts:238 |
| <a id="property-duration"></a> `duration?` | `number` | Default duration of transitions, in milliseconds. | core/types/src/utils/D3plusConfig.d.ts:240 |
| <a id="property-filter"></a> `filter?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | Predicate filtering which data points are included, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:242 |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | core/types/src/utils/D3plusConfig.d.ts:244 |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: `DataPoint`) => `string` \| `number`) \| (`d`: `DataPoint`) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | core/types/src/utils/D3plusConfig.d.ts:246 |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:248 |
| <a id="property-height"></a> `height?` | `number` | Overall height of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:250 |
| <a id="property-highlight"></a> `highlight?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | Persistently emphasizes matching marks (keep color) and grays the rest. | core/types/src/utils/D3plusConfig.d.ts:254 |
| <a id="property-hover"></a> `hover?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) \| `null` | The hover callback function for highlighting shapes on mouseover. | core/types/src/utils/D3plusConfig.d.ts:252 |
| <a id="property-label"></a> `label?` | `string` \| `false` \| `string`[] \| `AccessorFn` | Label accessor for shapes. | core/types/src/utils/D3plusConfig.d.ts:256 |
| <a id="property-legend"></a> `legend?` | `boolean` | Whether to show the legend. | core/types/src/utils/D3plusConfig.d.ts:258 |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | core/types/src/utils/D3plusConfig.d.ts:260 |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | core/types/src/utils/D3plusConfig.d.ts:261 |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:262 |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` | Position of the legend. | core/types/src/utils/D3plusConfig.d.ts:265 |
| <a id="property-legendsort"></a> `legendSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort comparator for legend items. | core/types/src/utils/D3plusConfig.d.ts:267 |
| <a id="property-legendtooltip"></a> `legendTooltip?` | `TooltipConfig` | Tooltip configuration for legend items. | core/types/src/utils/D3plusConfig.d.ts:269 |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | core/types/src/utils/D3plusConfig.d.ts:271 |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` | Custom HTML content for the loading indicator. | core/types/src/utils/D3plusConfig.d.ts:275 |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | core/types/src/utils/D3plusConfig.d.ts:273 |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | core/types/src/utils/D3plusConfig.d.ts:191 |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | core/types/src/utils/D3plusConfig.d.ts:277 |
| <a id="property-ocean"></a> `ocean?` | `string` | Ocean color for geomaps (any CSS value including 'transparent'). | core/types/src/utils/D3plusConfig.d.ts:279 |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | core/types/src/utils/D3plusConfig.d.ts:281 |
| <a id="property-point"></a> `point?` | (`d`: `DataPoint`) => `number`[] | Coordinate accessor for point-based geomaps. | core/types/src/utils/D3plusConfig.d.ts:283 |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: `DataPoint`) => `number`) | Point size accessor for geomaps. | core/types/src/utils/D3plusConfig.d.ts:285 |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:289 |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:287 |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | core/types/src/utils/D3plusConfig.d.ts:291 |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | core/types/src/utils/D3plusConfig.d.ts:293 |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | core/types/src/utils/D3plusConfig.d.ts:295 |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:297 |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` \| `Window` | Scrollable container selector for tooltip positioning. | core/types/src/utils/D3plusConfig.d.ts:299 |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | core/types/src/utils/D3plusConfig.d.ts:301 |
| `shapeConfig.duration?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:302 |
| <a id="property-shapesort"></a> `shapeSort?` | (`a`: `string`, `b`: `string`) => `number` | A [sort comparator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape class (e.g. "Circle", "Line") as its arguments. Shapes are drawn in groups by type, so this defines the layering order for all shapes of a given type. | core/types/src/utils/D3plusConfig.d.ts:311 |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | core/types/src/utils/D3plusConfig.d.ts:313 |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | core/types/src/utils/D3plusConfig.d.ts:315 |
| <a id="property-stackorder"></a> `stackOrder?` | `string`[] | Custom order for stacked series. | core/types/src/utils/D3plusConfig.d.ts:317 |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | core/types/src/utils/D3plusConfig.d.ts:319 |
| <a id="property-svgdesc"></a> `svgDesc?` | `string` | Accessible description applied to the root SVG (`<desc>`). | core/types/src/utils/D3plusConfig.d.ts:321 |
| <a id="property-svgtitle"></a> `svgTitle?` | `string` | Accessible title applied to the root SVG (`<title>`). | core/types/src/utils/D3plusConfig.d.ts:323 |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | core/types/src/utils/D3plusConfig.d.ts:325 |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` | Label for the threshold group. | core/types/src/utils/D3plusConfig.d.ts:327 |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | core/types/src/utils/D3plusConfig.d.ts:331 |
| <a id="property-tileurl"></a> `tileUrl?` | `string` | URL to XYZ map tiles. | core/types/src/utils/D3plusConfig.d.ts:329 |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | core/types/src/utils/D3plusConfig.d.ts:333 |
| <a id="property-timefilter"></a> `timeFilter?` | `false` \| ((`d`: `DataPoint`, `i`: `number`) => `boolean`) | Predicate filtering which time slices are shown, or false to disable. | core/types/src/utils/D3plusConfig.d.ts:335 |
| <a id="property-timeline"></a> `timeline?` | `boolean` | Whether to show the timeline component. | core/types/src/utils/D3plusConfig.d.ts:337 |
| <a id="property-title"></a> `title?` | `string` \| ((`data`: `DataPoint`[]) => `string`) | Chart title or title accessor function. | core/types/src/utils/D3plusConfig.d.ts:339 |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | core/types/src/utils/D3plusConfig.d.ts:341 |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` | Whether to show tooltips. | core/types/src/utils/D3plusConfig.d.ts:343 |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | `TooltipConfig` | Configuration for the tooltip component. | core/types/src/utils/D3plusConfig.d.ts:345 |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | core/types/src/utils/D3plusConfig.d.ts:347 |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | core/types/src/utils/D3plusConfig.d.ts:349 |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | core/types/src/utils/D3plusConfig.d.ts:351 |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | core/types/src/utils/D3plusConfig.d.ts:353 |
| <a id="property-width"></a> `width?` | `number` | Overall width of the visualization in pixels. | core/types/src/utils/D3plusConfig.d.ts:355 |
| <a id="property-x"></a> `x?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:357 |
| <a id="property-x2domain"></a> `x2Domain?` | (`number` \| `Date`)[] | The x2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:363 |
| <a id="property-x2sort"></a> `x2Sort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Defines a custom sorting comparator function for discrete x2 axes. | core/types/src/utils/D3plusConfig.d.ts:367 |
| <a id="property-xconfig"></a> `xConfig?` | `AxisConfig` | Configuration for the x-axis. | core/types/src/utils/D3plusConfig.d.ts:359 |
| <a id="property-xdomain"></a> `xDomain?` | (`number` \| `Date`)[] | The x domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:361 |
| <a id="property-xsort"></a> `xSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:365 |
| <a id="property-y"></a> `y?` | `string` \| `number` \| ((`d`: `DataPoint`, `i`: `number`) => `unknown`) | Key, index, or accessor function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:369 |
| <a id="property-y2domain"></a> `y2Domain?` | (`number` \| `Date`)[] | The y2 domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:375 |
| <a id="property-y2sort"></a> `y2Sort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Defines a custom sorting comparator function for discrete y2 axes. | core/types/src/utils/D3plusConfig.d.ts:379 |
| <a id="property-yconfig"></a> `yConfig?` | `AxisConfig` | Configuration for the y-axis. | core/types/src/utils/D3plusConfig.d.ts:371 |
| <a id="property-ydomain"></a> `yDomain?` | (`number` \| `Date`)[] | The y domain as an array. If either value is undefined, it is calculated from the data. | core/types/src/utils/D3plusConfig.d.ts:373 |
| <a id="property-ysort"></a> `ySort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:377 |
| <a id="property-zoom"></a> `zoom?` | `boolean` | Set to false to disable zooming on Geomap and Network. | core/types/src/utils/D3plusConfig.d.ts:381 |
| <a id="property-zoomfactor"></a> `zoomFactor?` | `number` | Multiplier applied to programmatic zoom steps. | core/types/src/utils/D3plusConfig.d.ts:383 |
| <a id="property-zoommax"></a> `zoomMax?` | `number` | Maximum zoom scale factor. | core/types/src/utils/D3plusConfig.d.ts:385 |
| <a id="property-zoompan"></a> `zoomPan?` | `boolean` | Whether panning (drag) is enabled while zoomed. | core/types/src/utils/D3plusConfig.d.ts:387 |
| <a id="property-zoomscroll"></a> `zoomScroll?` | `boolean` | Whether scroll-wheel zooming is enabled. | core/types/src/utils/D3plusConfig.d.ts:389 |

***

<a id="rendererprops"></a>

### RendererProps

Defined in: [react/src/Renderer.tsx:21](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L21)

Props accepted by the Renderer component.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback?` | () => `void` | A function to be invoked at the end of each render cycle (passed directly to the render method). | [react/src/Renderer.tsx:27](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L27) |
| <a id="property-classname"></a> `className?` | `string` | The class attribute value used for the root/wrapper <div> element. | [react/src/Renderer.tsx:25](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L25) |
| <a id="property-config"></a> `config?` | [`D3plusConfig`](#d3plusconfig) | An object containing method/value pairs to be passed to the visualization's .config() method. | [react/src/Renderer.tsx:23](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L23) |
| <a id="property-constructor"></a> `constructor` | [`D3plusConstructor`](#d3plusconstructor) | The d3plus visualization class to instantiate. | [react/src/Renderer.tsx:31](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L31) |
| <a id="property-forceupdate"></a> `forceUpdate?` | `boolean` | When true, the visualization re-renders on every React render cycle instead of only when config changes. | [react/src/Renderer.tsx:29](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L29) |

## Type Aliases

<a id="d3pluscomponentprops"></a>

### D3plusComponentProps

> **D3plusComponentProps** = `Omit`\<[`RendererProps`](#rendererprops), `"constructor"`\>

Defined in: [react/index.tsx:51](https://github.com/d3plus/d3plus/blob/main/packages/react/index.tsx#L51)

Props for d3plus React wrapper components (omits the internal constructor prop).

***

<a id="d3plusconstructor"></a>

### D3plusConstructor

> **D3plusConstructor** = (...`args`: `any`[]) => `any`

Defined in: [react/src/Renderer.tsx:18](https://github.com/d3plus/d3plus/blob/main/packages/react/src/Renderer.tsx#L18)

Constructor type for d3plus visualization classes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

#### Returns

`any`
