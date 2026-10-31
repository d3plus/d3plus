import {isObject} from "@d3plus/dom";

isObject({});
isObject({a: 1});
isObject(new Date());
isObject([]);
isObject(null);
isObject("text");
isObject(() => 1);
isObject(document.body);
isObject(window);
