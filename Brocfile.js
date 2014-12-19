var AMDFormatter 			= require('es6-module-transpiler-amd-formatter');
var compileModules 		= require('broccoli-compile-modules');
var mergeTrees 				= require('broccoli-merge-trees');
var closureCompiler 	= require('broccoli-closure-compiler');
var moveFile 					= require('broccoli-file-mover');

var buildTrees = [];

var bundle = compileModules('lib', {
  inputFiles: ['rx-socket-subject.umd.js'],
  output: '/rx-socket-subject.js',
  formatter: 'bundle',
});

buildTrees.push(bundle);

buildTrees.push(compileModules('lib', {
  inputFiles: ['**/*.js'],
  output: '/amd/',
  formatter: new AMDFormatter()
}));

if (process.env.EMBER_ENV === 'production') {
  buildTrees.push(closureCompiler(moveFile(bundle, {
    srcFile: 'rx-socket-subject.js',
    destFile: 'rx-socket-subject.min.js'
  }), {
    compilation_level: 'ADVANCED_OPTIMIZATIONS',
    externs: ['node'],
  }));
}

var buildTree = mergeTrees(buildTrees);

module.exports = buildTree;