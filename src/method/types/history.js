d3plus.method.history = {
  "accepted": [ Boolean ],
  "back": function() {

    if (this.states.length > 0) {

      var func = this.states.pop()

      func()

    }

  },
  "states": [],
  "value": true
}
