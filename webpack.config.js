var path = require('path');
var webpack = require("webpack");

module.exports = [{
	entry: {
		main: "./src/main.tsx"
	},
	output: {
		path: __dirname,
		filename: "bundle-[name].js"
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				exclude: /node_modules/
			},
			{
				enforce: 'pre',
				test: /\.js$/,
				loader: "source-map-loader"
			},
			{
				enforce: 'pre',
				test: /\.tsx?$/,
				use: "source-map-loader"
			}
		]
	},
	externals: {
		"easeljs": "createjs"
	}
}];