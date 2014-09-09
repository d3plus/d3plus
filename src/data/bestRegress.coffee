#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds the best regression model that fits the data using Bayesian Information Criteria
#---------------------------------------------------------------------------------------

# data is an array of two-dimensional arrays in the format of [x, y]

# options is a dictionary of options with attributes
  # maxDegree; maximum possible degree of the polynomial. Default is 10.

# Returns the model with the best BIC score as a triple [degrees, betaHat, yHat]
  # where degrees is an array containing the degrees of each term in the polynomial.
  # and betaHat contains the coefficients for each term
  # and yHat contains the regressed output for each input term.

numeric = require 'numeric'

module.exports = (data, options) ->
  if not options? then options = {}
  if not options.maxDegree? then options.maxDegree = 5 # try to fit a polynomial up to this degree
  N = data.length
  # choose the model that has minimum BIC (penalty)
  prevBIC = Number.MAX_VALUE
  bestResult = null

  # construct the matrix X
  Xfulltr = ((Math.pow(point[0], degree) for point in data) for degree in [1...options.maxDegree+1])
  y = (point[1] for point in data)
  for i in [0...1<<options.maxDegree]
    Xtr = [1 for q in [0...N]]
    degrees = [0]
    for j in [0...options.maxDegree]
      if (i & 1<<j) > 0
        Xtr.push Xfulltr[j]
        degrees.push j+1
    #console.log Xtr
    X = numeric.transpose Xtr
    k = degrees.length # degrees of freedom
    beta_hat = numeric.dot(numeric.dot(numeric.inv(numeric.dot(Xtr, X)), Xtr), y)
    y_hat = numeric.dot(X, beta_hat)
    residual = numeric.sub y, y_hat
    sse = numeric.dot residual, residual
    # compute sigma2
    sigma2 = sse / (N - k)
    # compute log-likelihood
    loglike = -0.5*N*Math.log(2*Math.PI)-0.5*N*Math.log(sigma2)-sse/(2*sigma2)
    bic = -2*loglike + k*(Math.log(N)-Math.log(2*Math.PI))
    if bic < prevBIC
      prevBIC = bic
      bestResult = [degrees, beta_hat, y_hat]
  bestResult
