normalize = require "./normalize.coffee"
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Community detection algorithm (graph clustering/partitioning)
# Based on the paper:
# Finding community structure in very large networks, A Clauset, MEJ Newman, C Moore - Physical review E, 2004
#------------------------------------------------------------------------------

# edges; a list of edge objects

# options; a dictionary of options with attributes
    # distance; it can be:
      # undefined; every edge has default distance of 1
      # constant; every edge has the same distance
      # string; the name of the attribute in edge that describes the distance of that edge
      # array; each value corresponds to the distance of the respective edge in the edges array
      # function; given edge, returns the distance

    # nodeid; it can be:
      # undefined; then we assume that each node obtained by getting the endpoints of an edge is a string/number describing the id of the node
      # string; the name of the attribute in node that describes the id of the node.
      # function; given the node, returns the id.

    # startpoint; it can be:
      # undefined; it is assumed that edge.source points to the source node of the edge
      # string; the name of the attribute in edge pointing to the source node of the edge
      # function; given an edge returns the source node of that edge

    # endpoint; it can be:
      # undefined; it is assumed that edge.target points to the target of the edge
      # string; the name of the attribute in edge pointing to the target of the edge
      # function; given an edge returns the target node of that edge

    # nodes; if defined, the input is assumed to be normalized and nodes is assumed to be a dictionary
    # that maps node id to the outedges of the node

# returns an array of communities, where each community is an array of node ids belonging to that community.

module.exports = (edges, options) ->
    ## For visualization debugging purposes ##
    events = []

    ######### User's options normalization ############
    if not options? then options = {}
    if not options.nodes? or typeof options.nodes isnt 'object'
      [edges, options] = normalize edges, options
      if options is null then return null
    # unpack options object
    {distance, nodeid, startpoint, endpoint, nodes} = options
    ####### END user's input normalization #########

    # build the nodes map, which stores the degree of every node
    nodesMap = {}
    for id of nodes
      nodesMap[id] = { node: nodes[id].node, degree:0 }

    # build the links map, which stores the expected number of links between every pair of nodes
    m = 0
    linksMap = {}
    for edge in edges
      a = nodeid startpoint edge
      b = nodeid endpoint edge
      linksMap[a] = {} if a not of linksMap
      linksMap[b] = {} if b not of linksMap

      if b not of linksMap[a]
        linksMap[a][b] = 0
        linksMap[b][a] = 0
        m++
        nodesMap[a].degree+=1
        nodesMap[b].degree+=1

    communities = {}
    Q = 0
    for id, node of nodesMap
      communities[id] = {score: node.degree / (2.0*m), nodes:[id]}

    for a of linksMap
      for b of linksMap[a]
        linksMap[a][b] = 1.0 / (2*m) - (nodesMap[a].degree * nodesMap[b].degree)/(4.0*m*m)

    iter = 0
    while iter < 1000
      ## find largest element of links
      deltaQ = -1
      maxa = undefined
      maxb = undefined
      for a of linksMap
        for b of linksMap[a]
          if linksMap[a][b] > deltaQ
            deltaQ = linksMap[a][b]
            maxa = a
            maxb = b
      break if deltaQ < 0
      ## merge maxa into maxb
      for k of linksMap[maxa]
        if k isnt maxb
          if k of linksMap[maxb]
            ## k is connected to both a and b
            linksMap[maxb][k] += linksMap[maxa][k]
          else
            ## k is connected to a but not b
            linksMap[maxb][k] = linksMap[maxa][k] - 2*communities[maxb].score*communities[k].score
          linksMap[k][maxb] = linksMap[maxb][k]
        delete linksMap[k][maxa]
      for k of linksMap[maxb]
        if k not of linksMap[maxa] and k isnt maxb
          ## k is connected to b but not a
          linksMap[maxb][k] -= 2*communities[maxa].score*communities[k].score
          linksMap[k][maxb] = linksMap[maxb][k]

      for node in communities[maxa].nodes
        communities[maxb].nodes.push node
      communities[maxb].score += communities[maxa].score
      if options.vdebug then events.push type: 'merge', father: maxb, child: maxa, nodes: communities[maxb].nodes
      delete communities[maxa]
      delete linksMap[maxa]
      Q += deltaQ
      iter++

    ## sort communities by size
    commSizes = ([cid, community.nodes.length] for cid, community of communities)
    commSizes.sort (a,b) -> b[1] - a[1]
    result = (communities[commSize[0]].nodes for commSize in commSizes)
    return [result, events]
