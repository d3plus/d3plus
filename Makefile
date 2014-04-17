JS_FILES = \
src/begin.js \
$(wildcard src/**/*.js) \
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

clean:
	rm -rf d3plus.js d3plus.min.js
