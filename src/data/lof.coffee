#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds outliers in n-dim data using the Local Outlier Factor algorithm
# See:
#   http://en.wikipedia.org/wiki/Local_outlier_factor
#------------------------------------------------------------------------------

kdtree = require 'static-kdtree'

# points is an array of n-dimensional points. Each point is an array of length n

# K is the number of nearest neighbors to look for when comparing densities. Default value is 10

# Returns an array of [index, lof] tuples, where index is the index of the point in the original array
# and lof is the local outlier factor for that point. The array is ordered by descreasing order of LOF
# so the outliers are in the beginning of the array.

module.exports = (points, K=10) ->
  tree = kdtree points # construct a kd-tree
  neighbors = (tree.knn(p, K+1)[1...] for p in points) # get the k nearest neighbors for each point

  # calculate the squared euclidean distance between points p1 and p2
  sqDist = (i, j) ->
    A = points[i]
    B = points[j]
    dist = 0
    for i in [0...A.length]
      delta = A[i] - B[i]
      dist += delta * delta
    return dist

  # pre-compute kdist for all points
  kdists = (sqDist i, neighbors[i][K-1] for i in [0...points.length])

  # reachability distance
  reachDist = (i, j) -> Math.max sqDist(i, j), kdists[j]

  # local reachability density
  ldr = (i) ->
    rDist = 0
    rDist += reachDist i, j for j in neighbors[i]
    return K / rDist

  # pre-compute lrd for all points
  ldrs = (ldr i for i in [0...points.length])

  result = for i in [0...points.length]
    avg_lrd = 0
    avg_lrd += ldrs[j] for j in neighbors[i]
    avg_lrd /= K
    [i, avg_lrd / ldrs[i]]

  result.sort (a,b) -> b[1] - a[1]
