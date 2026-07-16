import {defineComponent, h, inject, onMounted, onUnmounted, ref, watch} from "vue";
import type {InjectionKey, PropType} from "vue";
import {applyConfig, hash} from "@d3plus/dom";
import type {D3plusInstance} from "@d3plus/dom";

/**
    Injection key for a global config object merged ahead of each component's
    own config — the Vue analogue of the React wrapper's D3plusContext. Provide
    it from an ancestor: `provide(D3plusConfigKey, {locale: "es-ES"})`.
*/
export const D3plusConfigKey: InjectionKey<Record<string, unknown>> = Symbol("d3plus-config");

/**
    Builds a Vue 3 component that renders the given d3plus class into an `<svg>`.
    The instance is reused across prop changes so the chart tweens between
    states, and destroyed on unmount. Assigning a structurally-identical config
    is a no-op; pass `forceUpdate` to render on every update.
    @param Constructor The d3plus visualization class to instantiate.
    @param className The wrapper `<div>`'s class attribute (default `chart`).
*/
export function createD3plusComponent(
  Constructor: new (...args: any[]) => any,
  className = "chart",
) {
  return defineComponent({
    name: "D3plusRenderer",
    props: {
      /** Config forwarded to the instance's `.config()` method. */
      config: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
      /** A function invoked at the end of each render cycle. */
      callback: {type: Function as PropType<() => void>, default: undefined},
      /** Re-render on every update even when the merged config is unchanged. */
      forceUpdate: {type: Boolean, default: false},
      /** The wrapper `<div>`'s class attribute. */
      className: {type: String, default: className},
    },
    setup(props) {
      const container = ref<SVGSVGElement | null>(null);
      const globalConfig = inject(D3plusConfigKey, {});
      let instance: D3plusInstance | null = null;
      let lastHash: string | null = null;

      /** Applies the merged config to the (reused) instance and renders it. */
      function draw(): void {
        if (!container.value) return;
        const hashed = hash([globalConfig, props.config]);
        if (!props.forceUpdate && instance && hashed === lastHash) return;
        lastHash = hashed;
        const inst: D3plusInstance = instance ?? (instance = new Constructor());
        applyConfig(inst, container.value, globalConfig, props.config);
        inst.render?.(props.callback);
      }

      onMounted(draw);
      watch(() => [props.config, props.forceUpdate, globalConfig], draw, {deep: true});
      onUnmounted(() => {
        instance?.destroy?.();
        instance = null;
      });

      return () => h("div", {class: props.className, style: {height: "100%"}}, [
        h("svg", {ref: container, width: "100%", height: "100%"}),
      ]);
    },
  });
}
