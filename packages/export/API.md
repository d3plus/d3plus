# @d3plus/export API Reference

| Functions                     | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| [`saveElement`](#saveelement) | Downloads an HTML Element as a bitmap PNG image. |

## Functions

<a id="saveelement"></a>

### saveElement()

> **saveElement**(`elem`: `HTMLElement` \| `SVGElement`, `options?`: `SaveElementOptions`, `renderOptions?`: `SaveElementRenderOptions`): `void`

Defined in: [saveElement.ts:78](https://github.com/d3plus/d3plus/blob/main/packages/export/src/saveElement.ts#L78)

Downloads an HTML Element as a bitmap PNG image.

#### Parameters

| Parameter       | Type                          | Description                                                |
| --------------- | ----------------------------- | ---------------------------------------------------------- |
| `elem`          | `HTMLElement` \| `SVGElement` | The DOM element or d3 selection to export.                 |
| `options`       | `SaveElementOptions`          | Additional options to specify.                             |
| `renderOptions` | `SaveElementRenderOptions`    | Custom options to be passed to the html-to-image function. |

#### Returns

`void`
