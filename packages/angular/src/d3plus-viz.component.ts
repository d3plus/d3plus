import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import type {OnChanges, OnDestroy, OnInit} from "@angular/core";
import {applyConfig, hash} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";

/**
    Renders a d3plus visualization into an `<svg>`, driven by Angular inputs.
    The instance is reused across input changes so the chart tweens between
    states, and is destroyed when the component is torn down.

    ```ts
    import {Treemap} from "@d3plus/core";

    @Component({
      imports: [D3plusVizComponent],
      template: `<d3plus-viz [viz]="Treemap" [config]="config" />`,
    })
    export class MyChart {
      readonly Treemap = Treemap;
      config = {data, groupBy: "id", sum: "value"};
    }
    ```
*/
@Component({
  selector: "d3plus-viz",
  template: "<svg #svg width=\"100%\" height=\"100%\"></svg>",
  styles: [":host{display:block}"],
  encapsulation: ViewEncapsulation.None,
})
export class D3plusVizComponent implements OnInit, OnChanges, OnDestroy {

  /** The d3plus visualization class to instantiate. */
  @Input({required: true}) viz!: D3plusConstructor;
  /** Config forwarded to the instance's `.config()` method. */
  @Input() config: Record<string, unknown> = {};
  /** Config merged ahead of `config` — a shared/global baseline. */
  @Input() globalConfig: Record<string, unknown> = {};
  /** A function invoked at the end of each render cycle. */
  @Input() callback?: () => void;
  /** Re-render on every change even when the merged config is unchanged. */
  @Input() forceUpdate = false;

  @ViewChild("svg", {static: true}) svgRef!: ElementRef<SVGSVGElement>;

  private instance: D3plusInstance | null = null;
  private lastHash: string | null = null;

  ngOnInit(): void {
    this.draw();
  }

  ngOnChanges(): void {
    // Fires before ngOnInit on the first cycle (when the static ViewChild may
    // not be resolved yet); `draw` no-ops until the <svg> exists, then ngOnInit
    // performs the initial render.
    this.draw();
  }

  ngOnDestroy(): void {
    this.instance?.destroy?.();
    this.instance = null;
  }

  /** Applies the merged config to the (reused) instance and renders it. */
  private draw(): void {
    const el = this.svgRef?.nativeElement;
    if (!el || !this.viz) return;
    const hashed = hash([this.globalConfig, this.config]);
    if (!this.forceUpdate && this.instance && hashed === this.lastHash) return;
    this.lastHash = hashed;
    if (!this.instance) this.instance = new this.viz();
    applyConfig(this.instance, el, this.globalConfig, this.config);
    this.instance.render?.(this.callback);
  }

}
