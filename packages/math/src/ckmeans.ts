/**
    Sort an array of numbers by their numeric value, ensuring that the array is not changed in place.

This is necessary because the default behavior of .sort in JavaScript is to sort arrays as string values

[1, 10, 12, 102, 20].sort()
// output
[1, 10, 102, 12, 20]

    @param array input array
    @return {Array<number>} sorted array
    @private
    @example
numericSort([3, 2, 1]) // => [1, 2, 3]
*/
function numericSort(array: number[]): number[] {
  return array.slice().sort((a, b) => a - b);
}

/**
    For a sorted input, counting the number of unique values is possible in constant time and constant memory. This is a simple implementation of the algorithm.

    Values are compared with `===`, so objects and non-primitive objects are not handled in any special way.
    @private
    @param input an array of primitive values.
    @returns {number} count of unique values
    @example
uniqueCountSorted([1, 2, 3]); // => 3
uniqueCountSorted([1, 1, 1]); // => 1
*/
function uniqueCountSorted(input: number[]): number {
  let lastSeenValue: number | undefined,
    uniqueValueCount = 0;
  for (let i = 0; i < input.length; i++) {
    if (i === 0 || input[i] !== lastSeenValue) {
      lastSeenValue = input[i];
      uniqueValueCount++;
    }
  }
  return uniqueValueCount;
}

/**
    Create a new column x row matrix.
    @private

    @return {Array<Array<number>>} matrix
    @example
makeMatrix(10, 10);
*/
function makeMatrix(columns: number, rows: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < columns; i++) {
    const column: number[] = [];
    for (let j = 0; j < rows; j++) column.push(0);
    matrix.push(column);
  }
  return matrix;
}

/**
    Generates incrementally computed values based on the sums and sums of squares for the data array
    @private


@example
ssq(0, 1, [-1, 0, 2], [1, 1, 5]);
*/
function ssq(
  j: number,
  i: number,
  sums: number[],
  sumsOfSquares: number[],
): number {
  let sji: number; // s(j, i)

  if (j > 0) {
    const muji = (sums[i] - sums[j - 1]) / (i - j + 1); // mu(j, i)
    sji = sumsOfSquares[i] - sumsOfSquares[j - 1] - (i - j + 1) * muji * muji;
  } else sji = sumsOfSquares[i] - (sums[i] * sums[i]) / (i + 1);

  if (sji < 0) return 0;
  return sji;
}

/**
    Function that recursively divides and conquers computations for cluster j
    @private
    @param iMin Minimum index in cluster to be computed
    @param iMax Maximum index in cluster to be computed
    @param cluster Index of the cluster currently being computed
*/
function fillMatrixColumn(
  iMin: number,
  iMax: number,
  cluster: number,
  matrix: number[][],
  backtrackMatrix: number[][],
  sums: number[],
  sumsOfSquares: number[],
): void {
  if (iMin > iMax) return;

  // Start at midpoint between iMin and iMax
  const i = Math.floor((iMin + iMax) / 2);

  matrix[cluster][i] = matrix[cluster - 1][i - 1];
  backtrackMatrix[cluster][i] = i;

  let jlow = cluster; // the lower end for j
  if (iMin > cluster)
    jlow = Math.max(jlow, backtrackMatrix[cluster][iMin - 1] || 0);
  jlow = Math.max(jlow, backtrackMatrix[cluster - 1][i] || 0);

  let jhigh = i - 1; // the upper end for j
  if (iMax < matrix.length - 1)
    jhigh = Math.min(jhigh, backtrackMatrix[cluster][iMax + 1] || 0);

  for (let j = jhigh; j >= jlow; --j) {
    const sji = ssq(j, i, sums, sumsOfSquares);

    if (sji + matrix[cluster - 1][jlow - 1] >= matrix[cluster][i]) break;

    // Examine the lower bound of the cluster border
    const sjlowi = ssq(jlow, i, sums, sumsOfSquares);

    const ssqjlow = sjlowi + matrix[cluster - 1][jlow - 1];

    if (ssqjlow < matrix[cluster][i]) {
      // Shrink the lower bound
      matrix[cluster][i] = ssqjlow;
      backtrackMatrix[cluster][i] = jlow;
    }
    jlow++;

    const ssqj = sji + matrix[cluster - 1][j - 1];
    if (ssqj < matrix[cluster][i]) {
      matrix[cluster][i] = ssqj;
      backtrackMatrix[cluster][i] = j;
    }
  }

  fillMatrixColumn(
    iMin,
    i - 1,
    cluster,
    matrix,
    backtrackMatrix,
    sums,
    sumsOfSquares,
  );
  fillMatrixColumn(
    i + 1,
    iMax,
    cluster,
    matrix,
    backtrackMatrix,
    sums,
    sumsOfSquares,
  );
}

/**
    Initializes the main matrices used in Ckmeans and kicks off the divide and conquer cluster computation strategy
    @private
    @param data sorted array of values
*/
function fillMatrices(
  data: number[],
  matrix: number[][],
  backtrackMatrix: number[][],
): void {
  const nValues = matrix[0] ? matrix[0].length : 0;

  // Shift values by the median to improve numeric stability
  const shift = data[Math.floor(nValues / 2)];

  // Cumulative sum and cumulative sum of squares for all values in data array
  const sums: number[] = [];
  const sumsOfSquares: number[] = [];

  // Initialize first column in matrix & backtrackMatrix
  for (
    let i = 0, shiftedValue: number = void 0 as unknown as number;
    i < nValues;
    ++i
  ) {
    shiftedValue = data[i] - shift;
    if (i === 0) {
      sums.push(shiftedValue);
      sumsOfSquares.push(shiftedValue * shiftedValue);
    } else {
      sums.push(sums[i - 1] + shiftedValue);
      sumsOfSquares.push(sumsOfSquares[i - 1] + shiftedValue * shiftedValue);
    }

    // Initialize for cluster = 0
    matrix[0][i] = ssq(0, i, sums, sumsOfSquares);
    backtrackMatrix[0][i] = 0;
  }

  // Initialize the rest of the columns
  for (let cluster = 1; cluster < matrix.length; ++cluster) {
    let iMin = nValues - 1;
    if (cluster < matrix.length - 1) iMin = cluster;
    fillMatrixColumn(
      iMin,
      nValues - 1,
      cluster,
      matrix,
      backtrackMatrix,
      sums,
      sumsOfSquares,
    );
  }
}

/**
    Clusters one-dimensional numeric data into a specified number of groups using the Ckmeans dynamic programming algorithm, minimizing within-group sum-of-squared-deviations.
    @param data input data, as an array of number values
    @param nClusters number of desired classes. This cannot be greater than the number of values in the data array.
    @private
*/
export default function (data: number[], nClusters: number): number[][] {
  if (nClusters > data.length) {
    throw new Error("Cannot generate more classes than there are data values");
  }

  const sorted = numericSort(data);

  // we'll use this as the maximum number of clusters
  const uniqueCount = uniqueCountSorted(sorted);

  // if all of the input values are identical, there's one cluster with all of the input in it.
  if (uniqueCount === 1) {
    return [sorted];
  }

  const backtrackMatrix = makeMatrix(nClusters, sorted.length),
    matrix = makeMatrix(nClusters, sorted.length);

  // This is a dynamic programming way to solve the problem of minimizing within-cluster sum of squares. It's similar to linear regression in this way, and this calculation incrementally computes the sum of squares that are later read.
  fillMatrices(sorted, matrix, backtrackMatrix);

  // The real work of Ckmeans clustering happens in the matrix generation: the generated matrices encode all possible clustering combinations, and once they're generated we can solve for the best clustering groups very quickly.
  let clusterRight = backtrackMatrix[0] ? backtrackMatrix[0].length - 1 : 0;
  const clusters: number[][] = [];

  // Backtrack the clusters from the dynamic programming matrix. This starts at the bottom-right corner of the matrix (if the top-left is 0, 0), and moves the cluster target with the loop.
  for (let cluster = backtrackMatrix.length - 1; cluster >= 0; cluster--) {
    const clusterLeft = backtrackMatrix[cluster][clusterRight];

    // fill the cluster from the sorted input by taking a slice of the array. the backtrack matrix makes this easy - it stores the indexes where the cluster should start and end.
    clusters[cluster] = sorted.slice(clusterLeft, clusterRight + 1);

    if (cluster > 0) clusterRight = clusterLeft - 1;
  }

  return clusters;
}
