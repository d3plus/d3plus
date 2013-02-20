JS_FILES = \
	src/general.js \
	src/utils.js \
	src/viz/network.js \
	src/viz/stacked.js \
	src/viz/tree_map.js \

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

