JS_FILES = \
	src/begin.js \
	src/general.js \
	src/utils.js \
	src/tooltip.js \
	src/viz/network.js \
	src/viz/stacked.js \
	src/viz/tree_map.js \
	src/viz/geo_map.js \
	src/viz/pie_scatter.js \
	src/viz/bubbles.js \
	src/viz/rings.js \
	src/end.js \

JS_COMPILER = uglifyjs

all: vizwhiz.d3.js vizwhiz.d3.min.js
vizwhiz.d3.js: $(JS_FILES)
vizwhiz.d3.min.js: $(JS_FILES)

vizwhiz.d3.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) >> $@

vizwhiz.d3.min.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) -c sequences=true,unsafe=true >> $@

clean:
	rm -rf vizwhiz.d3.js vizwhiz.d3.min.js

