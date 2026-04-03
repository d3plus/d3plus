# @d3plus/react

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
| [`RendererProps`](#rendererprops) | Props accepted by the Renderer component. |

| Type Aliases | Description |
| --- | --- |
| [`D3plusComponentProps`](#d3pluscomponentprops) | Props for d3plus React wrapper components (omits the internal constructor prop). |
| [`D3plusConfig`](#d3plusconfig) |  |
| [`D3plusConstructor`](#d3plusconstructor) | Constructor type for d3plus visualization classes. |

## Functions

<a id="area"></a>

### Area()

> **Area**(`props`: [`D3plusComponentProps`](#d3pluscomponentprops)): `Element`

Defined in: [index.tsx:184](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L184)

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

Defined in: [index.tsx:54](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L54)

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

Defined in: [index.tsx:139](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L139)

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

Defined in: [index.tsx:143](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L143)

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

Defined in: [index.tsx:147](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L147)

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

Defined in: [index.tsx:151](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L151)

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

Defined in: [index.tsx:155](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L155)

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

Defined in: [index.tsx:188](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L188)

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

Defined in: [index.tsx:58](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L58)

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

Defined in: [index.tsx:225](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L225)

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

Defined in: [index.tsx:192](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L192)

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

Defined in: [index.tsx:62](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L62)

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

Defined in: [index.tsx:66](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L66)

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

Defined in: [index.tsx:196](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L196)

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

Defined in: [index.tsx:159](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L159)

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

Defined in: [index.tsx:70](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L70)

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

Defined in: [index.tsx:74](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L74)

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

Defined in: [index.tsx:200](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L200)

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

Defined in: [index.tsx:163](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L163)

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

Defined in: [index.tsx:204](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L204)

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

Defined in: [index.tsx:78](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L78)

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

Defined in: [index.tsx:82](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L82)

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

Defined in: [index.tsx:167](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L167)

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

Defined in: [index.tsx:86](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L86)

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

Defined in: [index.tsx:90](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L90)

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

Defined in: [index.tsx:208](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L208)

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

Defined in: [index.tsx:94](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L94)

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

Defined in: [index.tsx:98](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L98)

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

Defined in: [index.tsx:102](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L102)

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

Defined in: [index.tsx:106](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L106)

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

Defined in: [index.tsx:110](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L110)

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

Defined in: [index.tsx:212](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L212)

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

Defined in: [index.tsx:114](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L114)

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

Defined in: [index.tsx:118](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L118)

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

Defined in: [index.tsx:216](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L216)

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

Defined in: [index.tsx:122](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L122)

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

Defined in: [index.tsx:171](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L171)

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

Defined in: [index.tsx:175](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L175)

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

Defined in: [index.tsx:179](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L179)

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

Defined in: [index.tsx:126](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L126)

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

Defined in: [index.tsx:130](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L130)

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

Defined in: [index.tsx:134](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L134)

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

Defined in: [index.tsx:220](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L220)

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

> `const` **D3plusContext**: `Context`\<`D3plusConfig`\>

Defined in: [src/D3plusContext.tsx:7](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/D3plusContext.tsx#L7)

A React context instance used to provide global config options via a provider (D3plusContext.Provider).

## Interfaces

<a id="rendererprops"></a>

### RendererProps

Defined in: [src/Renderer.tsx:13](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L13)

Props accepted by the Renderer component.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback?` | () => `void` | A function to be invoked at the end of each render cycle (passed directly to the render method). | [src/Renderer.tsx:19](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L19) |
| <a id="property-classname"></a> `className?` | `string` | The class attribute value used for the root/wrapper <div> element. | [src/Renderer.tsx:17](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L17) |
| <a id="property-config"></a> `config?` | `D3plusConfig` | An object containing method/value pairs to be passed to the visualization's .config() method. | [src/Renderer.tsx:15](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L15) |
| <a id="property-constructor"></a> `constructor` | [`D3plusConstructor`](#d3plusconstructor) | The d3plus visualization class to instantiate. | [src/Renderer.tsx:23](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L23) |
| <a id="property-forceupdate"></a> `forceUpdate?` | `boolean` | When true, the visualization re-renders on every React render cycle instead of only when config changes. | [src/Renderer.tsx:21](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L21) |

## Type Aliases

<a id="d3pluscomponentprops"></a>

### D3plusComponentProps

> **D3plusComponentProps** = `Omit`\<[`RendererProps`](#rendererprops), `"constructor"`\>

Defined in: [index.tsx:51](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/index.tsx#L51)

Props for d3plus React wrapper components (omits the internal constructor prop).

***

<a id="d3plusconfig"></a>

### D3plusConfig

> **D3plusConfig** = `any`

***

<a id="d3plusconstructor"></a>

### D3plusConstructor

> **D3plusConstructor** = () => [`D3plusConfig`](#d3plusconfig)

Defined in: [src/Renderer.tsx:10](https://github.com/d3plus/d3plus/blob/0a09e0d36e71d7e958894d9c179b2ef817280d7c/packages/react/src/Renderer.tsx#L10)

Constructor type for d3plus visualization classes.

#### Returns

[`D3plusConfig`](#d3plusconfig)
