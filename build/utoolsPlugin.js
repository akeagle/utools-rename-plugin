const plugin = function () {
	const path = require('path');
	const fs = require('fs');

	function readDir(dirPath, fileList) {
		const files = fs.readdirSync(dirPath);
		files.forEach(fileName => {
			const fillPath = path.join(dirPath, './', fileName);
			const file = fs.statSync(fillPath);
			if (file.isDirectory()) {
				readDir(fillPath, fileList);
			} else {
				fileList.push(fillPath)
			}
		})
	}

	function copy(src, dst) {
		const srcInfo = fs.statSync(src);
		const dstInfo = fs.statSync(dst);
		if (srcInfo.isFile() && dstInfo.isFile()) {
			fs.cpSync(src, dst);
		} else if (srcInfo.isFile() && dstInfo.isDirectory()) {
			fs.cpSync(src, path.resolve(dst, path.basename(src)));
		} else if (srcInfo.isDirectory() && dstInfo.isDirectory()) {
			const files = [];
			readDir(src, files);
			files.forEach(v => {
				fs.cpSync(v, path.resolve(dst, path.relative(src, v)));
			});
		} else {
			throw Error('unsupport');
		}
	}

	const doSomeThing = function () {
		copy('../dist', '../apk')
	};
	return {
		name: 'vite-plugin-utools',
		apply: 'build',
		closeBundle() {
			doSomeThing();
		},
	};
};
// module.exports = plugin;
plugin().closeBundle();

