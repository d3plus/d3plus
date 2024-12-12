/**
 * Adds left/right padding to a point or time scale.
 * @private
 */
export default (scale, data, discrete) => {

  if (scale.padding) scale.padding(0.5);
  else {
    let uniqueValues = Array.from(new Set(data.map(d => +d[discrete])));
    const closest = uniqueValues.reduce((acc, curr, i, arr) => {
      if (!i) return acc;
      const prev = arr[i - 1];
      if (!acc || curr - prev < acc) return curr - prev;
      else return acc;
    }, 0);
    const domain = scale.domain().slice();
    if (discrete === "y") domain.reverse();
    domain[0] = new Date(+domain[0] - closest / 2);
    domain[1] = new Date(+domain[1] + closest / 2);
    if (discrete === "y") domain.reverse();
    scale.domain(domain);
  }

};
