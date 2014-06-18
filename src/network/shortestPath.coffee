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

# if nodes is defined, the input is assumed to be normalized and nodes is assumed to be a dictionary
# that mappes node id to the outedges of the node

d3plus.network.shortestPath = (edges, source, target, directed, distance, nodeid, startpoint, endpoint, K, nodes) ->
  ######### User's input normalization ############
  if not nodes? or typeof nodes isnt 'object'
    input = d3plus.network.normalize edges, source, target, directed, distance, nodeid, startpoint, endpoint, K
    if input is null then return null
    [edges, source, target, directed, distance, nodeid, startpoint, endpoint, K, nodes] = input
  ####### END user's input normalization #########

  #bookkeeping
  node.count = 0 for id, node of nodes
  
  heap = new d3plus.data.heap (a,b) -> return a.distance - b.distance
  visited = {}
  if not target? then visited[source] = true
  heap.push {edge: null, target: source, distance: 0}
  
  # iterative by popping the node with minimum distance from the graph
  maxsize = 0
  result = []
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
  getPath = (path) ->
    # path should be a combination of edges
    edges = []
    while path.edge?
      edges.push path.edge
      path = path.previous
    return edges.reverse()

  for res in result
    if target?
      delete res.target
      res.edges = getPath res
    delete res.edge
    delete res.previous
  return result
