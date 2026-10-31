import {BaseClass} from "@d3plus/core";

class Widget extends BaseClass {
  constructor() {
    super();
    this._size = 10;
  }

  // Getter/setter pairs are what config() drives: no argument reads, one writes.
  size(_) {
    return arguments.length ? ((this._size = _), this) : this._size;
  }
}

const widget = new Widget().config({size: 20, locale: "es-ES"});
widget.size();
widget.on("click", d => console.log(d));
