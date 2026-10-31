import {inViewport} from "@d3plus/dom";

// An element to test, in this example's container.
const badge = container.appendChild(document.createElement("span"));
badge.textContent = "badge";

// Only true once the element is at least 100px inside every viewport edge.
inViewport(badge, 100);
