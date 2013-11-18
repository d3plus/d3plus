JS_FILES = \
	src/begin.js \
	src/general.js \
	src/viz.js \
	src/apps/network.js \
	src/apps/stacked.js \
	src/apps/tree_map.js \
	src/apps/geo_map.js \
	src/apps/pie_scatter.js \
	src/apps/bubbles.js \
	src/apps/rings.js \
	src/ui/tooltip.js \
	src/utils/data.js \
	src/utils/error.js \
	src/utils/nesting.js \
	src/utils/titles.js \
	src/utils/tooltip.js \
	src/utils/utils.js \
	src/utils/variables.js \
	src/utils/wordwrap.js \
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

