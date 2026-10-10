import assert from "assert";
import {labeledMark} from "../../es/src/charts/Plot/sharedHover.js";

const datum = {id: "b_A", data: {g: "b"}};
const bar = {type: "rect", key: "b_A", shapeType: "Bar", datum};
const label = {type: "text", key: "b_A_0", datum: {data: datum, text: "b"}};
const viz = {_chartScene: [{type: "group", key: "plot", children: [bar, label]}]};

it("sharedHover: labeledMark resolves a shape label to its mark", () => {
  assert.strictEqual(labeledMark(viz, label), bar);
});

it("sharedHover: labeledMark leaves marks and unlabeled nodes alone", () => {
  assert.strictEqual(labeledMark(viz, bar), undefined, "a mark is already a mark");
  assert.strictEqual(labeledMark(viz, undefined), undefined);
  assert.strictEqual(labeledMark(viz, {type: "text", key: "axis", datum: {text: "A"}}), undefined);
  assert.strictEqual(labeledMark(viz, {type: "text", datum: {data: {other: true}}}), undefined, "no mark owns it");
  assert.strictEqual(labeledMark({}, label), undefined, "no scene");
});
