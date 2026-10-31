import {kernelDensity} from "@d3plus/math";

const values = [1.2, 1.9, 2.1, 2.4, 2.6, 3, 3.1, 3.3, 4.8, 5.2, 5.5, 5.6, 6.1];
kernelDensity(values, {bandwidth: 0.3});
