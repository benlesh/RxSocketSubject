export function mixin(target, source) {
	var sources = arguments.length === 2 ? [source] : [].slice.call(arguments, 1);

	sources.forEach(function(source) {
		for(var key in source) {
			if(source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		}
	});
}