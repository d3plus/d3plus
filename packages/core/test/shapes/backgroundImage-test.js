import assert from "assert";
import {Circle, Path, Rect} from "../../es/index.js";

// Finds the shape geometry node, wrapping group + inner <image> for a shape's
// background image.
function bgImage(shape) {
  let group = null, image = null, shapeNode = null;
  const MARKS = new Set(["rect", "circle", "path", "area", "line"]);
  const walk = n => {
    if (!n) return;
    if (n.type === "image") image = n;
    else if (n.type === "group" && String(n.key).endsWith("-bgimage")) group = n;
    else if (MARKS.has(n.type)) shapeNode = n;
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  walk(shape.toScene());
  return {group, image, shapeNode};
}

const URL = "data:image/svg+xml,%3Csvg/%3E";

// Regression for #757: a Path has no width/height/cx/cy/r in its geometry, so the
// background image used to be emitted 0×0 at (0,0) — invisible, wrong corner. It
// should fill the path's exact (DOM-free) bounding box, clipped to the path.
it("Path backgroundImage fills the path's exact bounds, clipped to the path (#757)", () => {
  const diamond = "M320,40 L440,160 L320,280 L200,160 Z"; // exact bbox [200,440]×[40,280]
  const {group, image} = bgImage(new Path().data([{id: "a", path: diamond}]).backgroundImage(URL));

  assert.ok(image, "a background image node is emitted");
  assert.deepStrictEqual(
    {x: image.x, y: image.y, width: image.width, height: image.height},
    {x: 200, y: 40, width: 240, height: 240},
    "image fills the diamond's exact bounding box",
  );
  assert.strictEqual(image.preserveAspectRatio, "xMidYMid slice", "cover sizing");
  assert.strictEqual(image.interactive, false, "decorative: no pointer capture");
  assert.deepStrictEqual(group.clip, {type: "path", d: diamond}, "clipped to the path itself");
});

// Regression: the background image must not steal the shape's hit-testing. It
// (a) keys apart from the shape so it can't overwrite it in the pick index, and
// (b) is non-interactive; the wrapping group carries the shape's datum so hover
// dimming/raising treats the two as one unit.
it("background image keys apart from its shape and carries the shape datum", () => {
  const {group, image, shapeNode} = bgImage(
    new Path().data([{id: "a", path: "M0,0 L10,0 L10,10 L0,10 Z"}]).backgroundImage(URL),
  );
  assert.notStrictEqual(String(image.key), String(shapeNode.key), "image key ≠ shape key");
  assert.strictEqual(String(shapeNode.key), "a", "shape keeps its own key");
  assert.strictEqual(image.interactive, false);
  assert.strictEqual(group.interactive, false);
  assert.ok(group.datum && group.datum.id === "a", "group carries the shape datum for dimming");
  assert.strictEqual(group.index, 0);
  // A defined group opacity is the enter/exit fade target (collapse → 0 → this),
  // matching how shapes fade in.
  assert.strictEqual(group.paint && group.paint.opacity, 1, "group carries a fade-in opacity target");
});

// contain fit: the image is fit (meet) inside the shape's largest inscribed
// rectangle, fully visible, and NOT clipped.
it("backgroundImageFit 'contain' fits inside the inscribed rect, unclipped", () => {
  // Circle → inscribed square (side = r·√2), centered on the origin.
  const {group, image} = bgImage(
    new Circle().data([{id: "a", x: 250, y: 150, r: 60}])
      .backgroundImage(URL).backgroundImageFit("contain"),
  );
  assert.strictEqual(image.preserveAspectRatio, "xMidYMid meet", "contain sizing");
  assert.strictEqual(group.clip, undefined, "contain does not clip (image is inside the shape)");
  const side = 60 * Math.SQRT2;
  assert.ok(Math.abs(image.width - side) < 1e-6 && Math.abs(image.height - side) < 1e-6,
    "fit to the inscribed square");
  assert.ok(Math.abs((image.x + image.width / 2)) < 1e-6, "centered on the circle (local origin)");

  // Path diamond → an inner box strictly smaller than the 240×240 bbox.
  const {image: dImg} = bgImage(
    new Path().data([{id: "a", path: "M320,40 L440,160 L320,280 L200,160 Z"}])
      .backgroundImage(URL).backgroundImageFit("contain"),
  );
  assert.ok(dImg.width < 240 && dImg.height < 240, "inner rect smaller than the bbox");
  assert.ok(dImg.width > 80 && dImg.height > 80, "but a substantial inscribed rect");
});

// The image must cover the rect and be positioned by the group transform, not
// half a box up-and-left of it (the pre-fix corner-as-center bug).
it("Rect backgroundImage covers the rect and is clipped to it", () => {
  const {group, image} = bgImage(
    new Rect().data([{id: "a", x: 250, y: 150, width: 120, height: 80}]).backgroundImage(URL),
  );
  // Local box centered on origin; the group transform places it at (250,150).
  assert.deepStrictEqual(
    {x: image.x, y: image.y, width: image.width, height: image.height},
    {x: -60, y: -40, width: 120, height: 80},
    "image box is the rect in local space",
  );
  assert.strictEqual(group.transform.x, 250);
  assert.strictEqual(group.transform.y, 150);
  // Absolute coverage = transform + box → spans the rect [190,310]×[110,190].
  assert.strictEqual(group.transform.x + image.x, 190);
  assert.strictEqual(group.transform.y + image.y, 110);
  assert.deepStrictEqual(group.clip, {type: "rect", x: -60, y: -40, width: 120, height: 80});
});

// Circle already positioned correctly; pin the clip (a circle path) + cover.
it("Circle backgroundImage covers the circle and is clipped to it", () => {
  const {group, image} = bgImage(
    new Circle().data([{id: "a", x: 250, y: 150, r: 60}]).backgroundImage(URL),
  );
  assert.deepStrictEqual(
    {x: image.x, y: image.y, width: image.width, height: image.height},
    {x: -60, y: -60, width: 120, height: 120},
    "image box is the circle's square in local space",
  );
  assert.strictEqual(group.clip.type, "path", "circle clipped via a path region");
  assert.ok(/^M-60,0a60,60 /.test(group.clip.d), "clip is a radius-60 circle path");
});
