var path = require('path');
module.exports = {
	entry: './entry.js',
	output: {
		// Make sure to use [name] or [id] in output.filename
		//  when using multiple entry points
		path: path.resolve(__dirname),
		filename: "./build/[name].bundle.js",
		chunkFilename: "./build/[id].bundle.js"
	},
	module: {
		loaders: [{
			test: /\.css$/,
			loader: "style!css"
		}]
	},
	devServer: {
		contentBase: "./build",
	}
};