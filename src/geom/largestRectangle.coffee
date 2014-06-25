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

  # nTries; the number of randomly drawn points inside the polygon which
  # the algorithm explores as possible center points of the maximal rectangle.
  # Default value is 20.

  # origin; the center point of the rectangle. If specified, the rectangle is
  # fixed at that point, otherwise the algorithm optimizes across all possible points.
  # The parameter origin can be
    # - a two dimensional array specifying the x and y coordinate of the origin
    # - an array of two dimensional arrays specifying the the possible center points
    # of the maximal rectangle.

# Returns the largest found rectangle as an object with the following attributes
  # width - the width of the rectangle
  # height - the height of the rectangle
  # cx - the x coord of the rectangle's center
  # cy - the y coord of the rectangle's center
  # angle - rotation angle in degrees. The anchor of rotation is the center point

largestRectangle = (poly, options) ->
  ########## Algorithm constants ##########
  # step size for the aspect ratio. aspect ratio is the ratio of width to height;
  # it has has linear impact on running time
  aspectRatioStep = 0.5
  # step size for angles (in degrees); has linear impact on running time
  angleStep = 5
  # maximum allowed aspect ratio for the rectangle solution
  maxAspectRatio = 15
  #######################################


  ##### User's input normalization #####
  if not options? then options = {}
  
  options.nTries = options.nTries || 20 # Default value for the number of possible center points of the maximal rectangle
  
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

  # get the width of the bounding box of the original polygon to determine tolerance
  [minx, maxx] = d3.extent poly, (d) -> d[0]
  [miny, maxy] = d3.extent poly, (d) -> d[1]

  # simplify polygon
  tolerance = Math.min(maxx - minx, maxy - miny)/25
  poly = d3plus.geom.simplify poly, tolerance

  # get the width of the bounding box of the simplified polygon
  [minx, maxx] = d3.extent poly, (d) -> d[0]
  [miny, maxy] = d3.extent poly, (d) -> d[1]

  [boxWidth, boxHeight] = [maxx - minx, maxy - miny]
  # don't look for rectangles with area smaller than this times the polygon bounding box
  minAreaTimes = 200 # doesn't impact running time much. impacts recall rate.
  minWidth = Math.sqrt(boxWidth*boxHeight / minAreaTimes)
  
  # discretize the binary search for optimal width to a resolution of this times the polygon width
  widthStep = boxWidth / 100 # doesn't impact running time, recall nor precision
  
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
  maxArea = 0
  maxRect = null
  for angle in angles
    angleRad = -angle*Math.PI/180
    for origOrigin in origins
      # generate improved origins
      [p1W, p2W] = intersectPoints poly, origOrigin, angleRad
      [p1H, p2H] = intersectPoints poly, origOrigin, angleRad + Math.PI/2
      modifOrigins = [
        origOrigin,
        [(p1W[0] + p2W[0])/2, (p1W[1] + p2W[1])/2], # average along with width axis
        [(p1H[0] + p2H[0])/2, (p1H[1] + p2H[1])/2] # average along with height axis
      ]
      for origin in modifOrigins
        [p1W, p2W] = intersectPoints poly, origin, angleRad
        minSqDistW = Math.min squaredDist(origin, p1W), squaredDist(origin, p2W)
        maxWidthCurr = 2*Math.sqrt(minSqDistW)
        
        [p1H, p2H] = intersectPoints poly, origin, angleRad + Math.PI/2
        minSqDistH = Math.min squaredDist(origin, p1H), squaredDist(origin, p2H)
        maxHeightCurr = 2*Math.sqrt(minSqDistH)
        
        continue if maxWidthCurr * maxHeightCurr < maxArea
        if aspectRatios? then aRatios = aspectRatios
        else
          minAspectRatioCurr = Math.max(1, maxArea / (maxHeightCurr*maxHeightCurr))
          maxAspectRatioCurr = Math.min(maxAspectRatio, (maxWidthCurr*maxWidthCurr) / maxArea)
          aRatios = d3.range(minAspectRatioCurr, maxAspectRatioCurr + aspectRatioStep, aspectRatioStep)
        for aRatio in aRatios
          # do a binary search to find the max width that works
          left = Math.max(minWidth, Math.sqrt(maxArea*aRatio))
          right = Math.min maxWidthCurr, maxHeightCurr*aRatio
          continue if right * maxHeightCurr < maxArea
          
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
              # we know that the area is already greater than the maxArea found so far
              maxArea = width * height
              maxRect = 
                cx: x0
                cy: y0
                width: width
                height: height
                angle: angle
              left = width # increase the width in the search
            else right = width # descrease the width in the search
  return [maxRect, maxArea]

# export to library
d3plus.geom.largestRectangle = largestRectangle

#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Helper functions
#------------------------------------------------------------------------------

# Returns the squared eucledian distance between points a and b
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
