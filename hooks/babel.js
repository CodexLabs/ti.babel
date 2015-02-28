(function() {
	var babel = require('babel-core'),
		path = require('path'),
		fs = require('fs');

	exports.cliVersion = ">=3.2";

	/*
	 State.
	 */
	var config,
		cli,
		logger,
		minifyJS,
		cacheFile,
		cache;

	exports.init = function(_logger, _config, _cli) {
		logger = _logger;
		config = _config;
		cli = _cli;

		// Do they want to use babel?
		if (!cli.tiapp || !cli.tiapp.properties || !cli.tiapp.properties['ti.babel'] || cli.tiapp.properties['ti.babel'].value !== true) {
			return;
		}

		cli.on('build.pre.construct', prepareBuild);
		cli.on('build.ios.copyResource', { pre: preCopyResource });
		cli.on('build.android.copyResource', { pre: preCopyResource });
		cli.on('build.post.compile', finishedBuild);
	};

	/*
	 Hooks.
	 */

	/**
	 * Sets up the ti build for using babel and sets up a cache.
	 * @param builder
	 */
	function prepareBuild(builder) {
		// Force minification.
		minifyJS = builder.minifyJS;
		builder.minifyJS = true;

		// Set up our cache so we don't have to recompile every time. 
		cacheFile = path.join(builder.buildDir, '.babel.cache.json');
		if (fs.existsSync(cacheFile)) {
			try {
				cache = JSON.parse(fs.readFileSync(cacheFile, 'UTF-8'));
			}
			catch (err) {
				logger.warn('Failed to parse cache file:');
				logger.warn(err);
				logger.warn('Resetting cache.');
				cache = {};
			}
		}
		else {
			cache = {};
		}
	}

	/**
	 * Compiles JavaScript files through Babel.
	 * @param evt
	 * @param callback
	 */
	function preCopyResource(evt, callback) {
		var copyArgs = evt.args,
			from = copyArgs[0],
			to = copyArgs[1];

		if (to.slice(-3) !== '.js') {
			return callback();
		}

		// TODO: Is there a quicker way to detect changed files?
		fs.stat(from, function(err, stat) {
			var modifiedTime = stat.mtime.getTime();
			if (!minifyJS && cache[from] && cache[from] === modifiedTime) {
				// Already up to date.
				logger.trace('Already transformed, not updated: ' + from);
				return copyFinished();
			}
			// Translate and write out the results.
			babel.transformFile(from, function(err, transformed) {
				if (err) {
					return callback(err);
				}
				fs.writeFileSync(to, transformed.code);
				cache[from] = stat.mtime.getTime();
				logger.trace('Transformed: ' + from);
				return copyFinished();
			});
		});

		function copyFinished() {
			evt.minifyJS = minifyJS;
			copyArgs[0] = copyArgs[1];
			callback();
		}
	}

	function finishedBuild() {
		if (cache) {
			fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 4));
		}
	}
})();