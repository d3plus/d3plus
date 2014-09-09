#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds outliers in 1-dim data by computing the median absolute deviation for each point
# See:
#	http://eurekastatistics.com/using-the-median-absolute-deviation-to-find-outliers
#	http://en.wikipedia.org/wiki/Median_absolute_deviation
#------------------------------------------------------------------------------

# points is an array of numbers (1-dim points).

# Returns an array of [index, deviation] tuples, where index is the index of the point in the original array
# and deviation is the distance from the median in MAD units for that point. The array is ordered by
# descreasing order of deviation so the outliers are in the beginning of the array.
module.exports = (points) ->

  median = d3.median points
  mad = d3.median points.map (p) -> Math.abs(p-median)
  result = points.map (p, i) -> [i, Math.abs(p-median)/mad]

  result.sort (a,b) -> b[1] - a[1]
