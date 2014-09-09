normalize = require "./normalize.coffee"
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Returns a subgraph of distance K away from the source node
#------------------------------------------------------------------------------

# edges; a list of edge objects

# source; it can be a:
  # pointer to the source node or its id
  # string denoting the id of the source node

# options; a dictionary of options with attributes
    # K; returns the subgraph of nodes that are at most distance K from the source. Default is 1.

    # directed; whether the graph is directed. Default is false.

    # distance; it can be:
      # undefined; every edge has default distance of 1
      # constant; every edge has the same distance
      # string; the name of the atrribute in edge that describes the distance of that edge
      # array; each value corresponds to the distance of the respective edge in the edges array
      # function; given edge, returns the distance

    # nodeid; it can be:
      # undefined; then we assume that each node obtained by getting the endpoints of an edge is a string/number describing the id of the node
      # string; the name of the attribute in node that describes the id of the node.
      # function; given the node, returns the id.

    # startpoint; it can be:
      # undefined; it is assumed that edge.source points to the source of the edge
      # string; the name of the attribute in edge pointing to the source of the edge
      # function; given an edge returns the source node of that edge

    # endpoint; it can be:
      # undefined; it is assumed that edge.target points to the target of the edge
      # string; the name of the attribute in edge pointing to the target of the edge
      # function; given an edge returns the target node of that edge

    # nodes; if defined, the input is assumed to be normalized and nodes is assumed to be a dictionary
    # that maps node id to the outedges of the node

# returns a graph object composed of nodes of distance K away from the source node and the links between them.
module.exports = (edges, source, options) ->
  ######### User's input normalization ############
  if not options? then options = {}
  options.source = source
  if not options.nodes? or typeof options.nodes isnt 'object'
    [edges, options] = normalize edges, options
    if options is null then return null
  # unpack options object
  {source, directed, distance, nodeid, startpoint, endpoint, K, nodes} = options
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
    nodes: nodes[id].node for id of visited
    edges: edge for edge in edges when nodeid(startpoint(edge)) of visited and nodeid(endpoint(edge)) of visited
  }
