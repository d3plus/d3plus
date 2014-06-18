#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Returns a subgraph of distance K away from the source node
#------------------------------------------------------------------------------

# edges is a list of edge objects

# source can be 
  # pointer to the source node or its id
  # string denoting the id of the source node

# K, returns the subgraph of nodes that are at most distance K from the source. Default is 1

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

d3plus.network.subgraph = (edges, source, K, directed, distance, nodeid, startpoint, endpoint) ->
  ######### User's input normalization ############
  if not K? then K = 1

  if not nodeid? then nodeid = (node) -> return node
  else if typeof nodeid is 'string' then nodeid = do (nodeid) -> (node) -> return node[nodeid]
  
  if source? and typeof source is 'object' then source = nodeid source
  
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
      if c not of nodes then nodes[c] = {id: c, outedges:[]}
    nodes[a].outedges.push edge
    if not directed then nodes[b].outedges.push edge
  ####### END user's input normalization #########
  
  # start expanding from the source node to get the subgraph in DFS fashion
  # to find all the nodes that are within distance K away from the source node
  visited = {}
  visited[source] = true
  dfs = (origin, curr_distance) ->
    for edge in nodes[origin].outedges
        a = nodeid startpoint edge
        b = nodeid endpoint edge
        if not directed and b is origin then [a, b] = [b, a]
        if b not of visited
          new_distance = curr_distance + distance(edge)
          if new_distance <= K
            visited[b] = true
            dfs b, new_distance
  dfs source, 0
  # find all the edges for these nodes
  return {
    nodes: Object.keys(visited)
    edges: edge for edge in edges when nodeid(startpoint(edge)) of visited and nodeid(endpoint(edge)) of visited
  }
