#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds the maximum area rectangle that fits inside a polygon
#------------------------------------------------------------------------------

# poly is an array of two-dimensional arrays corresponding to the points of the polygon

# options is a dictionary of options with attributes
  # angle; specifies the rotation of the polygon. An angle of zero means that
  # the longer side of the polygon (the width) will be aligned with the x axis.
  # An angle of +90 and/or -90 means that the longer side of the polygon (the width)
  # will be aligned with the y axis. The parameter angle can be
    # - a number between -90 and +90 specifying the angle of rotation of the polygon.
    # - a string which is parsed to a number
    # - an array of numbers, specifying the possible rotations of the polygon
    # - unspecified, which means the polygon can have any possible angle

  # aspectRatio; the ratio between the width and the height of the rectangle,
  # i.e. width/height. The parameter aspectRatio can be
    # - a number
    # - a string which is parsed to a number
    # - an array of numbers, specifying the possible aspectRatios of the polygon

  # maxAspectRatio; maximum aspect ratio (width/height). Default is 15.
  # This should be used if the aspectRatio is not provided.

  # nTries; the number of randomly drawn points inside the polygon which
  # the algorithm explores as possible center points of the maximal rectangle.
  # Default value is 20.

  # minWidth; the minimum width of the rectangle. Default is 0.

  # minHeight; the minimum height of the rectangle. Default is 0.

  # tolerance; The simplification tolerance factor. Should be between 0 and 1.
  # Default is 0.02. Larger tolerance corresponds to more extensive simplification.

  # origin; the center point of the rectangle. If specified, the rectangle is
  # fixed at that point, otherwise the algorithm optimizes across all possible points.
  # The parameter origin can be
    # - a two dimensional array specifying the x and y coordinate of the origin
    # - an array of two dimensional arrays specifying the the possible center points
    # of the maximal rectangle.

# Returns the largest found rectangle as an object with the following attributes
  # width - the width of the rectangle
  # height - the height of the rectangle
  # cx - the x coordinate of the rectangle's center
  # cy - the y coordinate of the rectangle's center
  # angle - rotation angle in degrees. The anchor of rotation is the center point

# print    = require "../core/console/print.coffee"
simplify = require "simplify-js"

module.exports = (poly, options) ->
  if poly.length < 3
    # print.error 'polygon has to have at least 3 points'
    return null
  ## For visualization debugging purposes ##
  events = []

  ########## Algorithm constants ##########
  # step size for the aspect ratio
  aspectRatioStep = 0.5
  # step size for angles (in degrees); has linear impact on running time
  angleStep = 5
  #######################################


  ##### User's input normalization #####
  if not options? then options = {}
  # maximum allowed aspect ratio for the rectangle solution
  if not options.maxAspectRatio? then options.maxAspectRatio = 15
  if not options.minWidth? then options.minWidth = 0
  if not options.minHeight? then options.minHeight = 0
  if not options.tolerance? then options.tolerance = 0.02
  if not options.nTries? then options.nTries = 20 # Default value for the number of possible center points of the maximal rectangle

  if options.angle?
    if options.angle instanceof Array then angles = options.angle
    else if typeof options.angle is 'number' then angles = [options.angle]
    else if typeof options.angle is 'string' and not isNaN(options.angle) then angles = [Number(options.angle)]
  if not angles? then angles = d3.range -90, 90+angleStep, angleStep

  if options.aspectRatio?
    if options.aspectRatio instanceof Array then aspectRatios = options.aspectRatio
    else if typeof options.aspectRatio is 'number' then aspectRatios = [options.aspectRatio]
    else if typeof options.aspectRatio is 'string' and not isNaN(options.aspectRatio) then aspectRatios = [Number(options.aspectRatio)]

  if options.origin?
    if options.origin instanceof Array
      if options.origin[0] instanceof Array then origins = options.origin
      else origins = [options.origin]


  ########################################
  area = Math.abs(d3.geom.polygon(poly).area()) # take absolute value of the signed area
  if area is 0
    # print.error 'polygon has 0 area'
    return null
  # get the width of the bounding box of the original polygon to determine tolerance
  [minx, maxx] = d3.extent poly, (d) -> d[0]
  [miny, maxy] = d3.extent poly, (d) -> d[1]

  # simplify polygon
  tolerance = Math.min(maxx - minx, maxy - miny) * options.tolerance
  tempPoly = ({x:p[0], y:p[1]} for p in poly)

  if tolerance > 0
    tempPoly = simplify tempPoly, tolerance
    poly = ([p.x, p.y] for p in tempPoly)
  if options.vdebug then events.push type: 'simplify', poly: poly

  # get the width of the bounding box of the simplified polygon
  [minx, maxx] = d3.extent poly, (d) -> d[0]
  [miny, maxy] = d3.extent poly, (d) -> d[1]
  bBox = [[minx, miny], [maxx, miny], [maxx, maxy] ,[minx, maxy]]
  [boxWidth, boxHeight] = [maxx - minx, maxy - miny]

  # discretize the binary search for optimal width to a resolution of this times the polygon width
  widthStep = Math.min(boxWidth, boxHeight)/50

  # populate possible center points with random points inside the polygon
  if not origins?
    origins = []
    # get the centroid of the polygon
    centroid = d3.geom.polygon(poly).centroid()
    if pointInPoly(centroid, poly) then origins.push centroid
    # get few more points inside the polygon
    while origins.length < options.nTries
      rndX = Math.random() * boxWidth + minx
      rndY = Math.random() * boxHeight + miny
      rndPoint = [rndX, rndY]
      if pointInPoly(rndPoint, poly) then origins.push rndPoint
  if options.vdebug then events.push type: 'origins', points: origins
  maxArea = 0
  maxRect = null
  for angle in angles
    angleRad = -angle*Math.PI/180
    if options.vdebug then events.push
      type: 'angle'
      angle: angle
    for origOrigin, i in origins
      # generate improved origins
      [p1W, p2W] = intersectPoints poly, origOrigin, angleRad
      [p1H, p2H] = intersectPoints poly, origOrigin, angleRad + Math.PI/2
      modifOrigins = []
      if p1W? and p2W? then modifOrigins.push [(p1W[0] + p2W[0])/2, (p1W[1] + p2W[1])/2] # average along with width axis
      if p1H? and p2H? then modifOrigins.push [(p1H[0] + p2H[0])/2, (p1H[1] + p2H[1])/2] # average along with height axis

      if options.vdebug then events.push type: 'modifOrigin', idx: i, p1W: p1W, p2W: p2W, p1H: p1H, p2H: p2H, modifOrigins: modifOrigins

      for origin in modifOrigins

        if options.vdebug then events.push type: 'origin', cx: origin[0], cy: origin[1]

        [p1W, p2W] = intersectPoints poly, origin, angleRad
        continue if p1W is null or p2W is null
        minSqDistW = Math.min squaredDist(origin, p1W), squaredDist(origin, p2W)
        maxWidth = 2*Math.sqrt(minSqDistW)

        [p1H, p2H] = intersectPoints poly, origin, angleRad + Math.PI/2
        continue if p1H is null or p2H is null
        minSqDistH = Math.min squaredDist(origin, p1H), squaredDist(origin, p2H)
        maxHeight = 2*Math.sqrt(minSqDistH)

        continue if maxWidth * maxHeight < maxArea

        if aspectRatios? then aRatios = aspectRatios
        else
          minAspectRatio = Math.max 1, options.minWidth / maxHeight, maxArea/(maxHeight*maxHeight)
          maxAspectRatio = Math.min options.maxAspectRatio, maxWidth/options.minHeight, (maxWidth*maxWidth)/maxArea
          aRatios = d3.range(minAspectRatio, maxAspectRatio + aspectRatioStep, aspectRatioStep)
        for aRatio in aRatios
          # do a binary search to find the max width that works
          left = Math.max options.minWidth, Math.sqrt(maxArea*aRatio)
          right = Math.min maxWidth, maxHeight*aRatio
          continue if right * maxHeight < maxArea

          if (right - left) >= widthStep
            if options.vdebug then events.push type: 'aRatio', aRatio: aRatio

          while (right - left) >= widthStep
            width = (left + right) / 2
            height = width / aRatio
            [x0, y0] = origin
            rectPoly = [
              [x0 - width/2, y0 - height/2],
              [x0 + width/2, y0 -  height/2],
              [x0 + width/2, y0 + height/2],
              [x0 - width/2, y0 + height/2]
            ]
            rectPoly = rotatePoly rectPoly, angleRad, origin
            if polyInsidePoly(rectPoly, poly)
              insidePoly = true
              # we know that the area is already greater than the maxArea found so far
              maxArea = width * height
              maxRect =
                cx: x0
                cy: y0
                width: width
                height: height
                angle: angle
              left = width # increase the width in the binary search
            else
              insidePoly = false
              right = width # decrease the width in the binary search
            if options.vdebug then events.push
              type: 'rectangle'
              cx: x0
              cy: y0
              width: width
              height: height
              areaFraction: (width*height)/area
              angle: angle
              insidePoly: insidePoly
  return [maxRect, maxArea, events]


#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Helper functions
#------------------------------------------------------------------------------

# Returns the squared euclidean distance between points a and b
squaredDist = (a, b) ->
  deltax = b[0] - a[0]
  deltay = b[1] - a[1]
  return deltax*deltax + deltay*deltay


# Checks whether the horizontal ray going through point p intersects the segment p1p2
# Implementation from: http://rosettacode.org/wiki/Ray-casting_algorithm#CoffeeScript
rayIntersectsSegment = (p, p1, p2) ->
  [a, b] = if p1[1] < p2[1] then [p1, p2] else [p2, p1]
  if p[1] is b[1] or p[1] is a[1]
    p[1] += Number.MIN_VALUE
  if p[1] > b[1] or p[1] < a[1] then false
  else if p[0] > a[0] and p[0] > b[0] then false
  else if p[0] < a[0] and p[0] < b[0] then true
  else
    mAB = (b[1] - a[1]) / (b[0] - a[0])
    mAP = (p[1] - a[1]) / (p[0] - a[0])
    mAP > mAB

# Checks whether the point p is inside a polygon using the Ray-Casting algorithm
# Implementation from: http://rosettacode.org/wiki/Ray-casting_algorithm#CoffeeScript
pointInPoly = (p, poly) ->
  i = -1
  n = poly.length
  b = poly[n-1]
  c = 0
  while ++i < n
    a = b
    b = poly[i]
    c++ if rayIntersectsSegment(p, a, b)
  return c % 2 isnt 0

# Checks whether the point p is inside the bounding box of the line segment p1q1
pointInSegmentBox = (p, p1, q1) ->
  # allow for some margins due to numerical errors
  eps = 1e-9
  [px, py] = p
  return false if px < Math.min(p1[0], q1[0]) - eps or
    px > Math.max(p1[0], q1[0]) + eps or
    py < Math.min(p1[1], q1[1]) - eps or
    py > Math.max(p1[1], q1[1]) + eps
  return true

# Finds the intersection point (if there is one) of the lines p1q1 and p2q2
lineIntersection = (p1, q1, p2, q2) ->
  # allow for some margins due to numerical errors
  eps = 1e-9
  # find the intersection point between the two infinite lines
  dx1 = p1[0] - q1[0]
  dy1 = p1[1] - q1[1]
  dx2 = p2[0] - q2[0]
  dy2 = p2[1] - q2[1]
  denom = dx1 * dy2 - dy1 * dx2
  return null if Math.abs(denom) < eps
  cross1 = p1[0]*q1[1] - p1[1]*q1[0]
  cross2 = p2[0]*q2[1] - p2[1]*q2[0]

  px = (cross1*dx2 - cross2*dx1) / denom
  py = (cross1*dy2 - cross2*dy1) / denom
  return [px, py]

# Checks whether the line segments p1q1 and p2q2 intersect
segmentsIntersect = (p1, q1, p2, q2) ->
  p = lineIntersection p1, q1, p2, q2
  return false if not p?
  return pointInSegmentBox(p, p1, q1) and pointInSegmentBox(p, p2, q2)

# Check if polygon polyA is inside polygon polyB
polyInsidePoly = (polyA, polyB) ->
  iA = -1
  nA = polyA.length
  nB = polyB.length
  bA = polyA[nA-1]

  while ++iA < nA
    aA = bA
    bA = polyA[iA]

    iB = -1
    bB = polyB[nB-1]
    while ++iB < nB
      aB = bB
      bB = polyB[iB]
      return false if segmentsIntersect aA, bA, aB, bB

  return pointInPoly polyA[0], polyB

# Rotates the point p for alpha radians around the origin
rotatePoint = (p, alpha, origin) ->
  if not origin? then origin = [0,0]
  xshifted = p[0] - origin[0]
  yshifted = p[1] - origin[1]
  cosAlpha = Math.cos alpha
  sinAlpha = Math.sin alpha
  return [ cosAlpha * xshifted - sinAlpha * yshifted + origin[0],
           sinAlpha * xshifted + cosAlpha * yshifted + origin[1]
  ]

# Rotates the polygon for alpha radians around the origin
rotatePoly = (poly, alpha, origin) -> rotatePoint(point, alpha, origin) for point in poly

# Gives the 2 closest intersection points between a ray with alpha radians
# from the origin and the polygon. The two points should lie on opposite sides of the origin
intersectPoints = (poly, origin, alpha) ->
  eps = 1e-9
  origin = [origin[0] + eps*Math.cos(alpha), origin[1] + eps*Math.sin(alpha)]
  [x0, y0] = origin
  shiftedOrigin = [x0 + Math.cos(alpha), y0 + Math.sin(alpha)]

  idx = 0
  if Math.abs(shiftedOrigin[0] - x0) < eps then idx = 1
  i = -1
  n = poly.length
  b = poly[n-1]
  minSqDistLeft = Number.MAX_VALUE
  minSqDistRight = Number.MAX_VALUE
  closestPointLeft = null
  closestPointRight = null
  while ++i < n
    a = b
    b = poly[i]
    p = lineIntersection origin, shiftedOrigin, a, b
    if p? and pointInSegmentBox p, a, b
      sqDist = squaredDist origin, p
      if p[idx] < origin[idx]
        if sqDist < minSqDistLeft
          minSqDistLeft = sqDist
          closestPointLeft = p
      else if p[idx] > origin[idx]
        if sqDist < minSqDistRight
          minSqDistRight = sqDist
          closestPointRight = p

  return [closestPointLeft, closestPointRight]
