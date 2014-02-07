JS_FILES = \
	src/begin.js \
	\
	src/general.js \
	\
	src/public.js \
	src/ui.js \
	src/viz.js \
	\
	src/apps/bubbles.js \
	src/apps/chart.js \
	src/apps/geo_map.js \
	src/apps/line.js \
	src/apps/network.js \
	src/apps/rings.js \
	src/apps/stacked.js \
	src/apps/tree_map.js \
	\
	src/data/analyze.js \
	src/data/color.js \
	src/data/fetch.js \
	src/data/filter.js \
	src/data/format.js \
	src/data/nest.js \
	\
	src/forms/button.js \
	src/forms/data.js \
	src/forms/drop.js \
	src/forms/radio.js \
	src/forms/value.js \
	\
	src/info/error.js \
	src/info/legend.js \
	src/info/timeline.js \
	src/info/titles.js \
	\
	src/shapes/area.js \
	src/shapes/color.js \
	src/shapes/coordinates.js \
	src/shapes/donut.js \
	src/shapes/draw.js \
	src/shapes/fill.js \
	src/shapes/labels.js \
	src/shapes/line.js \
	src/shapes/links.js \
	src/shapes/rect.js \
	src/shapes/style.js \
	\
	src/styles/default.js \
	\
	src/tooltip/app.js \
	src/tooltip/arrow.js \
	src/tooltip/create.js \
	src/tooltip/data.js \
	src/tooltip/move.js \
	src/tooltip/remove.js \
	\
	src/utils/color.js \
	src/utils/utils.js \
	src/utils/variables.js \
	src/utils/wordwrap.js \
	\
	src/zoom/bounds.js \
	src/zoom/controls.js \
	src/zoom/reset.js \
	\
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

