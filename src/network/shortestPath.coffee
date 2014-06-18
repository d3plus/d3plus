#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Finds the shortest paths in the graph
#------------------------------------------------------------------------------

# edges is a list of edge objects

# source can be 
  # pointer to the source node or its id
  # string denoting the id of the source node

# target can be 
  # pointer to the target node or its id
  # string denoting the id of the target node

# directed specifies whether the graph is directed. Default is false

# distance can be
  # undefined; every edge has default distance of 1
  # constant; every edge has the same distance
  # string; the name of the atrribute in edge that describes the distance of that edge
  # array; each value corresponds to the distance of the respective edge in the edges array
  # function; given edge, returns the distance

# nodeid can be
  # undefined; then we assume that each node obtained by getting the endpoints of an edge is a string/number describing the id of the node
  # string; the name of the attribute in node that describes the id of the node.
  # function; given the node, returns the id.

# startpoint can be
  # undefined; it is assumed that edge.source points to the source of the edge
  # string; the name of the attribute in edge pointing to the source of the edge
  # function; given an edge returns the source node of that edge

# endpoint can be
  # undefined; it is assumed that edge.target points to the target of the edge
  # string; the name of the attribute in edge pointing to the target of the edge
  # function; given an edge returns the target node of that edge

# K, returns the top K results (defaults to 1). Depending on the target, it means:
  # if target is specified, returns the top K shortest paths to the given target
  # if target is not specified, returns the top K closest nodes to the given source

d3plus.network.shortestPath = (edges, source, target, directed, distance, nodeid, startpoint, endpoint, K) ->
  ######### User's input normalization ############
  if not K? then K = 1

  if not nodeid? then nodeid = (node) -> return node
  else if typeof nodeid is 'string' then nodeid = do (nodeid) -> (node) -> return node[nodeid]
  if source? and typeof source is 'object' then source = nodeid source
  if target? and typeof target is 'object' then target = nodeid target
  
  if not startpoint? then startpoint = (edge) -> return edge.source
  else if typeof startpoint is 'string' then startpoint = do (startpoint) -> (edge) -> return edge[startpoint]

  if not endpoint? then endpoint = (edge) -> return edge.target
  else if typeof endpoint is 'string' then endpoint = do (endpoint) -> (edge) -> return edge[endpoint]

  if not distance? then distance = (edge) -> return 1
  else if typeof distance is 'number' then distance = do (distance) -> (edge) -> return distance
  else if typeof distance is 'string' then distance = do (distance) -> (edge) -> return edge[distance]
  else if distance instanceof Array
    edge2distance = {}
    for edge, i in edges
      a = nodeid startpoint edge
      b = nodeid endpoint edge
      edge2distance[a + '_' + b] = distance[i]
    distance = (edge) ->
      a = nodeid startpoint edge
      b = nodeid endpoint edge
      return edge2distance[a + '_' + b]
  # create the nodes explicitly by going through the edges
  # and assign some bookkeeping variables to them
  nodes = {}
  for edge in edges
    a = nodeid startpoint edge
    b = nodeid endpoint edge
    for c in [a, b]
      if c not of nodes then nodes[c] = {id: c, outedges:[], count: 0}
    nodes[a].outedges.push edge
    if not directed then nodes[b].outedges.push edge

  ####### END user's input normalization #########

  heap = new d3plus.data.heap (a,b) -> return a.distance - b.distance
  
  getPath = (path) ->
    # path should be a combination of edges
    edges = []
    while path.edge?
      edges.push path.edge
      path = path.previous
    return edges.reverse()


  visited = {}
  if not target? then visited[source] = true
  heap.push {edge: null, target: source, distance: 0}
  # check if source is in the list of nodes
  if source not of nodes then return 'Error: the source of the search is not in the graph'
  if target? and target not of nodes then return 'Error: the target of the search is not in the graph'
  result = []
  # iterative by popping the node with minimum distance from the graph
  maxsize = 0
  
  while not heap.empty()
    maxsize = Math.max maxsize, heap.size()
    path = heap.pop()
    u = path.target
    nodes[u].count++
    if not target? then result.push path
    else if u is target then result.push path
    break if result.length is K
    if nodes[u].count <= K
      for edge in nodes[u].outedges
        a = nodeid startpoint edge
        b = nodeid endpoint edge
        if not directed and b is u then [a, b] = [b, a]
        if not target?
          continue if visited[b]
          visited[b] = true
        alt = path.distance + distance edge
        heap.push {edge: edge, previous: path, target: b, distance: alt}
  # expand the path information in the result object
  for res in result
    if target?
      delete res.target
      res.edges = getPath res
    delete res.edge
    delete res.previous
  return result
