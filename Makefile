JS_FILES = \
	src/begin.js \
	src/general.js \
	src/utils.js \
	src/tooltip.js \
	src/error.js \
	src/viz/viz.js \
	src/viz/network.js \
	src/viz/stacked.js \
	src/viz/tree_map.js \
	src/viz/geo_map.js \
	src/viz/pie_scatter.js \
	src/viz/bubbles.js \
	src/viz/rings.js \
	src/end.js \

JS_COMPILER = uglifyjs

all: d3plus.js d3plus.min.js
d3plus.js: $(JS_FILES)
d3plus.min.js: $(JS_FILES)

d3plus.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) >> $@

d3plus.min.js: Makefile
	rm -f $@
	$(JS_COMPILER) d3plus.js --output $@
  # cat $(filter %.js,$^) | $(JS_COMPILER) >> $@

clean:
	rm -rf d3plus.js d3plus.min.js

