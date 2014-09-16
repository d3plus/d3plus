print = require "../core/console/print.coffee"

# Normalizes the graph input and checks if it is valid.
module.exports = (edges, options) ->
  # unpack options
  {source, target, directed, distance, nodeid, startpoint, endpoint, K, vdebug} = options
  if not directed then directed = false
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
    nodeA = startpoint edge
    nodeB = endpoint edge
    idA = nodeid nodeA
    idB = nodeid nodeB
    for node in [nodeA, nodeB]
      id = nodeid node
      if id not of nodes then nodes[id] = {node: node, outedges:[]}
    nodes[idA].outedges.push edge
    if not directed then nodes[idB].outedges.push edge

  # check input validity
  errormsg = null
  if edges.length is 0 then errormsg = 'The length of edges is 0'
  else if K < 0 then errormsg = 'K can not have negative value'
  else if not distance(edges[0])? then errormsg = 'Check the distance function/attribute'
  else if not startpoint(edges[0])? then errormsg = 'Check the startpoint function/attribute'
  else if not endpoint(edges[0])? then errormsg = 'Check the endpoint function/attribute'
  else
    id1 = nodeid(startpoint(edges[0]))
    if not id1? or typeof id1 not in ['string','number'] then errormsg = 'Check the nodeid function/attribute'
    else if source? and source not of nodes then errormsg = 'The source is not in the graph'
    else if target? and target not of nodes then errormsg = 'The target is not in the graph'

  if errormsg?
    print.error errormsg
    return null

  return [edges, {source, target, directed, distance, nodeid, startpoint, endpoint, K, nodes, vdebug}]
