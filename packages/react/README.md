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

Defined in: [react/index.tsx:184](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L184)

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

Defined in: [react/index.tsx:54](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L54)

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

Defined in: [react/index.tsx:139](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L139)

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

Defined in: [react/index.tsx:143](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L143)

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

Defined in: [react/index.tsx:147](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L147)

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

Defined in: [react/index.tsx:151](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L151)

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

Defined in: [react/index.tsx:155](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L155)

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

Defined in: [react/index.tsx:188](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L188)

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

Defined in: [react/index.tsx:58](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L58)

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

Defined in: [react/index.tsx:225](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L225)

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

Defined in: [react/index.tsx:192](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L192)

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

Defined in: [react/index.tsx:62](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L62)

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

Defined in: [react/index.tsx:66](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L66)

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

Defined in: [react/index.tsx:196](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L196)

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

Defined in: [react/index.tsx:159](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L159)

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

Defined in: [react/index.tsx:70](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L70)

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

Defined in: [react/index.tsx:74](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L74)

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

Defined in: [react/index.tsx:200](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L200)

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

Defined in: [react/index.tsx:163](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L163)

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

Defined in: [react/index.tsx:204](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L204)

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

Defined in: [react/index.tsx:78](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L78)

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

Defined in: [react/index.tsx:82](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L82)

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

Defined in: [react/index.tsx:167](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L167)

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

Defined in: [react/index.tsx:86](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L86)

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

Defined in: [react/index.tsx:90](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L90)

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

Defined in: [react/index.tsx:208](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L208)

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

Defined in: [react/index.tsx:94](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L94)

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

Defined in: [react/index.tsx:98](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L98)

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

Defined in: [react/index.tsx:102](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L102)

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

Defined in: [react/index.tsx:106](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L106)

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

Defined in: [react/index.tsx:110](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L110)

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

Defined in: [react/index.tsx:212](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L212)

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

Defined in: [react/index.tsx:114](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L114)

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

Defined in: [react/index.tsx:118](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L118)

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

Defined in: [react/index.tsx:216](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L216)

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

Defined in: [react/index.tsx:122](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L122)

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

Defined in: [react/index.tsx:171](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L171)

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

Defined in: [react/index.tsx:175](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L175)

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

Defined in: [react/index.tsx:179](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L179)

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

Defined in: [react/index.tsx:126](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L126)

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

Defined in: [react/index.tsx:130](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L130)

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

Defined in: [react/index.tsx:134](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L134)

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

Defined in: [react/index.tsx:220](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L220)

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

Defined in: [react/src/D3plusContext.tsx:7](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/D3plusContext.tsx#L7)

A React context instance used to provide global config options via a provider (D3plusContext.Provider).

## Interfaces

<a id="d3plusconfig"></a>

### D3plusConfig

Defined in: core/types/src/utils/D3plusConfig.d.ts:28

#### Indexable

> \[`key`: `string`\]: `unknown`

Allows additional custom properties.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aggs"></a> `aggs?` | `object` | Custom aggregation functions keyed by data property. | core/types/src/utils/D3plusConfig.d.ts:34 |
| <a id="property-barpadding"></a> `barPadding?` | `number` | Padding between bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:38 |
| <a id="property-colorscale"></a> `colorScale?` | `string` \| ((`d`: `number`) => `string`) | Color scale key or custom color function. | core/types/src/utils/D3plusConfig.d.ts:40 |
| <a id="property-colorscaleconfig"></a> `colorScaleConfig?` | `object` | Configuration for the color scale component. | core/types/src/utils/D3plusConfig.d.ts:42 |
| `colorScaleConfig.axisConfig?` | `AxisConfig` | - | core/types/src/utils/D3plusConfig.d.ts:43 |
| `colorScaleConfig.centered?` | `boolean` | - | core/types/src/utils/D3plusConfig.d.ts:44 |
| `colorScaleConfig.colorMax?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:48 |
| `colorScaleConfig.colorMid?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:47 |
| `colorScaleConfig.colorMin?` | `string` | - | core/types/src/utils/D3plusConfig.d.ts:46 |
| `colorScaleConfig.colors?` | `string`[] | - | core/types/src/utils/D3plusConfig.d.ts:45 |
| `colorScaleConfig.scale?` | `AxisScale` | - | core/types/src/utils/D3plusConfig.d.ts:49 |
| <a id="property-colorscaleposition"></a> `colorScalePosition?` | `false` \| `Position` | Position of the color scale, or false to hide it. | core/types/src/utils/D3plusConfig.d.ts:52 |
| <a id="property-column"></a> `column?` | `string` | Column key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:54 |
| <a id="property-data"></a> `data?` | `string` \| `DataPoint`[] | Data array or URL string to load data from. | core/types/src/utils/D3plusConfig.d.ts:30 |
| <a id="property-depth"></a> `depth?` | `number` | Active depth level for nested groupings. | core/types/src/utils/D3plusConfig.d.ts:56 |
| <a id="property-discrete"></a> `discrete?` | `"x"` \| `"y"` | Sets orientation of main category axis. | core/types/src/utils/D3plusConfig.d.ts:58 |
| <a id="property-fitfilter"></a> `fitFilter?` | `string` \| `number` \| ((`d`: `Record`\<`string`, `unknown`\>) => `boolean`) | Allows removing specific geographies from topojson file to improve zoom. | core/types/src/utils/D3plusConfig.d.ts:60 |
| <a id="property-groupby"></a> `groupBy?` | `string` \| `string`[] \| ((`d`: `DataPoint`) => `string` \| `number`) \| (`d`: `DataPoint`) => `string` \| `number`[] | Grouping key(s) or accessor function(s). | core/types/src/utils/D3plusConfig.d.ts:62 |
| <a id="property-grouppadding"></a> `groupPadding?` | `number` | Padding between groups of bars in pixels. | core/types/src/utils/D3plusConfig.d.ts:64 |
| <a id="property-label"></a> `label?` | `string` \| ((...`args`: `unknown`[]) => `string`) | Label accessor for shapes. | core/types/src/utils/D3plusConfig.d.ts:66 |
| <a id="property-legend"></a> `legend?` | `boolean` | Whether to show the legend. | core/types/src/utils/D3plusConfig.d.ts:68 |
| <a id="property-legendconfig"></a> `legendConfig?` | `object` | Configuration for the legend component. | core/types/src/utils/D3plusConfig.d.ts:70 |
| `legendConfig.label?` | `DataPointAccessor`\<`string`\> | - | core/types/src/utils/D3plusConfig.d.ts:71 |
| `legendConfig.shapeConfig?` | `Record`\<`string`, `string` \| `number`\> | - | core/types/src/utils/D3plusConfig.d.ts:72 |
| <a id="property-legendposition"></a> `legendPosition?` | `Position` | Position of the legend. | core/types/src/utils/D3plusConfig.d.ts:75 |
| <a id="property-legendtooltip"></a> `legendTooltip?` | `TooltipConfig` | Tooltip configuration for legend items. | core/types/src/utils/D3plusConfig.d.ts:77 |
| <a id="property-linelabels"></a> `lineLabels?` | `boolean` | Whether to show labels on line charts. | core/types/src/utils/D3plusConfig.d.ts:79 |
| <a id="property-loadinghtml"></a> `loadingHTML?` | `string` | Custom HTML content for the loading indicator. | core/types/src/utils/D3plusConfig.d.ts:83 |
| <a id="property-loadingmessage"></a> `loadingMessage?` | `boolean` | Whether to show the loading message. | core/types/src/utils/D3plusConfig.d.ts:81 |
| <a id="property-locale"></a> `locale?` | `string` | Locale code used for text and number formatting. | core/types/src/utils/D3plusConfig.d.ts:32 |
| <a id="property-metric"></a> `metric?` | `string` | Metric key for the visualization. | core/types/src/utils/D3plusConfig.d.ts:85 |
| <a id="property-ocean"></a> `ocean?` | `string` | Ocean color for geomaps (any CSS value including 'transparent'). | core/types/src/utils/D3plusConfig.d.ts:87 |
| <a id="property-on"></a> `on?` | `Record`\<`string`, (`event`: `Event`) => `void`\> | Event listeners keyed by event name. | core/types/src/utils/D3plusConfig.d.ts:89 |
| <a id="property-point"></a> `point?` | (`d`: `DataPoint`) => `number`[] | Coordinate accessor for point-based geomaps. | core/types/src/utils/D3plusConfig.d.ts:91 |
| <a id="property-pointsize"></a> `pointSize?` | `string` \| ((`d`: `DataPoint`) => `number`) | Point size accessor for geomaps. | core/types/src/utils/D3plusConfig.d.ts:93 |
| <a id="property-pointsizemax"></a> `pointSizeMax?` | `number` | Maximum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:97 |
| <a id="property-pointsizemin"></a> `pointSizeMin?` | `number` | Minimum point size for geomaps. | core/types/src/utils/D3plusConfig.d.ts:95 |
| <a id="property-projection"></a> `projection?` | `string` \| ((`x`: `number`, `y`: `number`) => \[`number`, `number`\]) | Map projection name or function. | core/types/src/utils/D3plusConfig.d.ts:99 |
| <a id="property-projectionpadding"></a> `projectionPadding?` | `string` \| `number` | Outer padding between the visualization edge and map shapes. | core/types/src/utils/D3plusConfig.d.ts:101 |
| <a id="property-projectionrotate"></a> `projectionRotate?` | \[`number`, `number`\] | Rotation offset for the map projection center. | core/types/src/utils/D3plusConfig.d.ts:103 |
| <a id="property-row"></a> `row?` | `string` | Row key for matrix-style layouts. | core/types/src/utils/D3plusConfig.d.ts:105 |
| <a id="property-scrollcontainer"></a> `scrollContainer?` | `string` | Scrollable container selector for tooltip positioning. | core/types/src/utils/D3plusConfig.d.ts:107 |
| <a id="property-shapeconfig"></a> `shapeConfig?` | `object` | Configuration for shape rendering. | core/types/src/utils/D3plusConfig.d.ts:109 |
| `shapeConfig.duration?` | `number` | - | core/types/src/utils/D3plusConfig.d.ts:110 |
| <a id="property-size"></a> `size?` | `string` | Size accessor key. | core/types/src/utils/D3plusConfig.d.ts:114 |
| <a id="property-stacked"></a> `stacked?` | `boolean` | Whether to stack series. | core/types/src/utils/D3plusConfig.d.ts:116 |
| <a id="property-stackorder"></a> `stackOrder?` | `string`[] | Custom order for stacked series. | core/types/src/utils/D3plusConfig.d.ts:118 |
| <a id="property-sum"></a> `sum?` | `DataPointAccessor`\<`number`\> | Value accessor for treemaps and aggregation. | core/types/src/utils/D3plusConfig.d.ts:120 |
| <a id="property-threshold"></a> `threshold?` | `number` | Threshold value for grouping small slices. | core/types/src/utils/D3plusConfig.d.ts:122 |
| <a id="property-thresholdname"></a> `thresholdName?` | `string` | Label for the threshold group. | core/types/src/utils/D3plusConfig.d.ts:124 |
| <a id="property-tiles"></a> `tiles?` | `boolean` | Whether to show map tiles. | core/types/src/utils/D3plusConfig.d.ts:128 |
| <a id="property-tileurl"></a> `tileUrl?` | `string` | URL to XYZ map tiles. | core/types/src/utils/D3plusConfig.d.ts:126 |
| <a id="property-time"></a> `time?` | `string` | Time key for temporal data. | core/types/src/utils/D3plusConfig.d.ts:130 |
| <a id="property-title"></a> `title?` | `string` \| ((`data`: `DataPoint`[]) => `string`) | Chart title or title accessor function. | core/types/src/utils/D3plusConfig.d.ts:132 |
| <a id="property-titleconfig"></a> `titleConfig?` | `Record`\<`string`, `string` \| `number`\> | CSS style configuration for the title. | core/types/src/utils/D3plusConfig.d.ts:134 |
| <a id="property-tooltip"></a> `tooltip?` | `boolean` | Whether to show tooltips. | core/types/src/utils/D3plusConfig.d.ts:136 |
| <a id="property-tooltipconfig"></a> `tooltipConfig?` | `TooltipConfig` | Configuration for the tooltip component. | core/types/src/utils/D3plusConfig.d.ts:138 |
| <a id="property-topojson"></a> `topojson?` | `string` \| `object` | Path or object for the topojson data. | core/types/src/utils/D3plusConfig.d.ts:140 |
| <a id="property-topojsonfill"></a> `topojsonFill?` | `string` | CSS color to fill the map shapes. | core/types/src/utils/D3plusConfig.d.ts:142 |
| <a id="property-topojsonid"></a> `topojsonId?` | (`obj`: `Record`\<`string`, `unknown`\>) => `string` | Accessor function for topojson feature IDs. | core/types/src/utils/D3plusConfig.d.ts:144 |
| <a id="property-value"></a> `value?` | `DataPointAccessor`\<`number`\> | Value accessor for the visualization. | core/types/src/utils/D3plusConfig.d.ts:146 |
| <a id="property-x"></a> `x?` | `string` \| `number` \| ((...`args`: `unknown`[]) => `unknown`) | Key, index, or accessor function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:148 |
| <a id="property-xconfig"></a> `xConfig?` | `AxisConfig` | Configuration for the x-axis. | core/types/src/utils/D3plusConfig.d.ts:150 |
| <a id="property-xsort"></a> `xSort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for x-axis values. | core/types/src/utils/D3plusConfig.d.ts:152 |
| <a id="property-y"></a> `y?` | `string` \| `number` \| ((...`args`: `unknown`[]) => `unknown`) | Key, index, or accessor function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:154 |
| <a id="property-yconfig"></a> `yConfig?` | `AxisConfig` | Configuration for the y-axis. | core/types/src/utils/D3plusConfig.d.ts:156 |
| <a id="property-ysort"></a> `ySort?` | (`a`: `DataPoint`, `b`: `DataPoint`) => `number` | Custom sort function for y-axis values. | core/types/src/utils/D3plusConfig.d.ts:158 |
| <a id="property-zoom"></a> `zoom?` | `false` | Set to false to disable zooming on geomaps. | core/types/src/utils/D3plusConfig.d.ts:160 |

***

<a id="rendererprops"></a>

### RendererProps

Defined in: [react/src/Renderer.tsx:21](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L21)

Props accepted by the Renderer component.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback?` | () => `void` | A function to be invoked at the end of each render cycle (passed directly to the render method). | [react/src/Renderer.tsx:27](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L27) |
| <a id="property-classname"></a> `className?` | `string` | The class attribute value used for the root/wrapper <div> element. | [react/src/Renderer.tsx:25](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L25) |
| <a id="property-config"></a> `config?` | [`D3plusConfig`](#d3plusconfig) | An object containing method/value pairs to be passed to the visualization's .config() method. | [react/src/Renderer.tsx:23](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L23) |
| <a id="property-constructor"></a> `constructor` | [`D3plusConstructor`](#d3plusconstructor) | The d3plus visualization class to instantiate. | [react/src/Renderer.tsx:31](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L31) |
| <a id="property-forceupdate"></a> `forceUpdate?` | `boolean` | When true, the visualization re-renders on every React render cycle instead of only when config changes. | [react/src/Renderer.tsx:29](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L29) |

## Type Aliases

<a id="d3pluscomponentprops"></a>

### D3plusComponentProps

> **D3plusComponentProps** = `Omit`\<[`RendererProps`](#rendererprops), `"constructor"`\>

Defined in: [react/index.tsx:51](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/index.tsx#L51)

Props for d3plus React wrapper components (omits the internal constructor prop).

***

<a id="d3plusconstructor"></a>

### D3plusConstructor

> **D3plusConstructor** = (...`args`: `any`[]) => `any`

Defined in: [react/src/Renderer.tsx:18](https://github.com/d3plus/d3plus/blob/e9db3c74352143cd7b6bdc8d0786477ea971eb6d/packages/react/src/Renderer.tsx#L18)

Constructor type for d3plus visualization classes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `any`[] |

#### Returns

`any`
