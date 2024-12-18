export function deepClone(source, noClone = []) {
	if (!source && typeof source !== 'object') {
		throw new Error('error arguments deepClone');
	}
	const targetObj = source.constructor === Array ? [] : {};
	Object.keys(source).forEach((keys) => {
		if (source[keys] && typeof source[keys] === 'object' && noClone.indexOf(keys) === -1) {
			targetObj[keys] = deepClone(source[keys], noClone);
		} else {
			targetObj[keys] = source[keys];
		}
	});
	return targetObj;
}

