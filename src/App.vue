<template>
	<el-card class="box-card" :body-style="{ height: 'calc(100% - 90px)', padding: '10px'}">
		<template #header>
			<div class="card-header">
				<el-switch
						v-model="state.auto"
						active-text=""
						inactive-text=""
				/>
				<el-input placeholder="分隔符" v-model="state.sep" style="width: 75px"/>
				<el-input placeholder="工作目录" v-model="state.curDir" readonly
				          @click="handleOpenCwd" class="custom-input">
					<template #suffix>
						<el-icon size="21" style="cursor:pointer;" @click="handleOpenCwd">
							<FolderOpened></FolderOpened>
						</el-icon>
					</template>
				</el-input>
				<el-button class="button" text @click="handleSelect">选择文件</el-button>
				<el-button class="button" text @click="handleClear">清空</el-button>
				<el-button class="button" text @click="handleMerge">合并</el-button>
			</div>
		</template>
		<div class="card-body" @dragover="onDragover" @dragleave="onDragleave" @drop="onDrop"
		     @contextmenu="e => e.preventDefault()" @click="handleClearAll" ref="main">
			<draggable :list="state.list" animation="300" item-key="name" ref="dragComp">
				<template #item="{ element }">
					<div class="item" @click="handleClick(element, $event)" v-bind:class="{'item-selected': element.selected }"
					     @contextmenu.prevent="openMenu(element, $event)">{{ element.name }}
					</div>
				</template>
			</draggable>
		</div>
	</el-card>

	<ul v-show="state.visible" :style="{ left: state.left + 'px', top: state.top + 'px' }" class="contextmenu">
		<li @click="handleTop()">选中置顶</li>
		<li @click="handleTail()">选中置尾</li>
		<li @click="handleTop(state.selectedTag)">置顶</li>
		<li @click="handleTail(state.selectedTag)">置尾</li>
		<li @click="handleSelectAll">全选</li>
		<li @click="handleSelectOther">反选</li>
		<li @click="handleClearAll">清空选中</li>
		<li @click="handleClose(state.selectedTag)">删除</li>
		<li @click="handleCloseSelected">删除选中</li>
	</ul>
</template>

<script setup>
import { onMounted, reactive, ref, watch, unref, onBeforeUnmount, toRaw } from "vue";
import draggable from '@/components/vuedraggable/vuedraggable.js';
import {FolderOpened} from '@element-plus/icons-vue';
import {ElMessageBox, ElMessage} from "element-plus";
import { deepClone } from "@/utils/index.js";

const state = reactive({
	list: [],
	curDir: 'E:\\book\\03',
	visible: false,
	'top': 0,
	'left': 0,
	selectedTag: {},
	sep: '\n\n',
	auto: false
});

const main = ref(null);
const dragComp = ref(null);

// for(let i=0; i< 10; i++) {
//   state.list.push({
//     'name': '测试' + i
//   })
// }
onMounted(async () => {
	document.addEventListener('keydown', keyDownEvent, false)
	document.addEventListener('keyup', keyUpEvent, false);
	try {
		const curDir = await Neutralino.storage.getData("curDir");
		const auto = await Neutralino.storage.getData("auto");
		const sep = await Neutralino.storage.getData("sep");

		if(curDir) {
			state.curDir = curDir;
		}
		if(auto) {
			state.auto = eval(auto);
		}
		if(sep) {
			state.sep = sep;
		}
	} catch(e){
		console.log('err')
		console.log(e)
	}
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', keyDownEvent);
	document.removeEventListener('keyup', keyUpEvent);
});

let lastShiftKey = false;
let lastCtrlKey = false;
let curItem = null;

function keyDownEvent(e) {
	//  65 a 90 z
	if(e.ctrlKey && e.keyCode === 65) {
		handleSelectAll();
	} else if(e.ctrlKey && e.keyCode === 90) {
		handleClearAll();
	} else if(lastShiftKey !== e.shiftKey && e.shiftKey) {
		lastShiftKey = e.shiftKey;
	} else if(lastCtrlKey !== e.ctrlKey && e.ctrlKey) {
		lastCtrlKey = e.ctrlKey;
	}
}

const keyUpEvent = function (e) {
	lastShiftKey = e.shiftKey;
	lastCtrlKey = e.ctrlKey;
	curItem = null;
}


const onDrop = (e) => {
	e.preventDefault();
	const files = Array.from(e.dataTransfer.files);
	if(files.length === 0) {
		return;
	}
	if(state.auto) {
		state.list = [];
	}
	files.forEach(e => {
		if(state.list.find(x => x.name === e.name)) {
			return;
		}
		state.list.push({
			'name': e.name,
			'file': e
		})
	})
};
const onDragover = (e) => {
	e.preventDefault();
};

const onDragleave = (e) => {
	e.preventDefault();
};

function handleClear() {
	state.list = [];
	curItem = null;
}

async function handleOpenCwd() {
	const entries = await Neutralino.os.showFolderDialog('选择工作目录', {
		defaultPath: state.curDir,
	});
	state.curDir = entries;
}

function getBaseName(str) {
	const s = str.split(/[\\/]+/);
	return s[s.length - 1];
}

async function handleSelect() {
	let entries = await Neutralino.os.showOpenDialog('选择要合并的文件', {
		defaultPath: state.curDir,
		multiSelections: true,
		filters: [
			{name: '文本', extensions: ['txt']},
			{name: 'MarkDown', extensions: ['md']},
			{name: 'All files', extensions: ['*']}
		]
	});
	if(entries.length === 0) {
		return;
	}
	if(state.auto) {
		handleClear();
	}
	entries.forEach(e => {
		if(state.list.find(x => x.name === getBaseName(e))) {
			return;
		}
		state.list.push({
			'path': e,
			'name': getBaseName(e)
		})
	})
}


function openMenu(tag, e) {
	state.left = e.clientX;
	state.top = e.clientY;
	state.visible = true;
	state.selectedTag = tag;
}

function closeMenu() {
	state.visible = false;
}

watch(
		() => state.visible,
		(value) => {
			if (value) {
				document.body.addEventListener('click', closeMenu);
			} else {
				document.body.removeEventListener('click', closeMenu);
			}
		}
);


function handleClick(item, event) {
	event.stopPropagation();
	state.visible = false;
	if(lastShiftKey && curItem) {
		let f = false;
		state.list.forEach(v => {
			if(v.name === item.name || v.name === curItem.name) {
				v.selected = true;
				f = !f;
			} else {
				v.selected = f;
			}
		});
		return;
	}
	if(lastCtrlKey) {
		item.selected = true;
	} else {
		unref(dragComp).onClearAll();
		state.list.forEach(v => {
			if(v.name === item.name) {
				v.selected = true;
			} else {
				v.selected = false;
			}
		});
	}
	curItem = item;
}

function handleTop(item) {
	if (item) {
		state.list = state.list.filter(v => v.name !== item.name);
		state.list.unshift(item);
	} else {
		const selectedList = [];
		const unSelectedList = [];
		state.list.forEach(v => {
			if (v.selected) {
				selectedList.push(v);
			} else {
				unSelectedList.push(v);
			}
		});
		state.list = selectedList.concat(unSelectedList);
	}
}

function handleTail(item) {
	if (item) {
		state.list = state.list.filter(v => v.name !== item.name);
		state.list.push(item);
	} else {
		const selectedList = [];
		const unSelectedList = [];
		state.list.forEach(v => {
			if (v.selected) {
				selectedList.push(v);
			} else {
				unSelectedList.push(v);
			}
		});
		state.list = unSelectedList.concat(selectedList);
	}
}

function handleClose(item) {
	if(curItem && curItem.name === item.name) {
		curItem = null;
	}
	state.list = state.list.filter(v => {
		return v.name !== item.name;
	})
}

function handleCloseSelected() {
	state.list = state.list.filter(v => {
		if(curItem && curItem.name === v.name && v.selected) {
			curItem = null;
		}
		return !v.selected;
	})
}

function handleSelectAll() {
	state.list = state.list.map(v => {
		v.selected = true;
		return v;
	});
	curItem = null;
}

function handleSelectOther() {
	state.list = state.list.map(v => {
		v.selected = !v.selected;
		return v;
	});
	curItem = null;
}

function isUTF8(bytes) {
	var i = 0;
	while (i < bytes.length) {
		if ((// ASCII
				bytes[i] == 0x09 ||
				bytes[i] == 0x0A ||
				bytes[i] == 0x0D ||
				(0x20 <= bytes[i] && bytes[i] <= 0x7E)
		)
		) {
			i += 1;
			continue;
		}

		if ((// non-overlong 2-byte
				(0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
				(0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF)
		)
		) {
			i += 2;
			continue;
		}

		if ((// excluding overlongs
						bytes[i] == 0xE0 &&
						(0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
				) ||
				(// straight 3-byte
						((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
								bytes[i] == 0xEE ||
								bytes[i] == 0xEF) &&
						(0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
				) ||
				(// excluding surrogates
						bytes[i] == 0xED &&
						(0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x9F) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
				)
		) {
			i += 3;
			continue;
		}

		if ((// planes 1-3
						bytes[i] == 0xF0 &&
						(0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
						(0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
				) ||
				(// planes 4-15
						(0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
						(0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
						(0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
				) ||
				(// plane 16
						bytes[i] == 0xF4 &&
						(0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
						(0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
						(0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
				)
		) {
			i += 4;
			continue;
		}
		return false;
	}
	return true;
}

function handleMerge() {
	if (state.list.length < 2) {
		ElMessage({
			message: '清选择文件',
			type: 'warning',
		})
		return;
	}
	const taskList = [];
	state.list.forEach(v => {
		if (v.file) {
			taskList.push(v.file.arrayBuffer());
		} else if (v.path) {
			taskList.push(Neutralino.filesystem.readBinaryFile( v.path))
		}
	});
	let s = '';
	const sep = state.sep.replace(/\\n|\\r/, '\n');
	Promise.all(taskList).then(r => {
		r.forEach((e, i) => {
			const d = new Uint8Array(e);
			let dd = '';
			if (isUTF8(d)) {
				dd = new TextDecoder('utf8').decode(d);
			} else {
				dd = new TextDecoder('gbk').decode(d);
			}
			s += dd + sep;
			deposeLog(state.list[i].name, dd);
		});
		mergeTxt(s);
	})
}

function deposeLog(name, str) {
	const s = str.replaceAll(/\s+/g, "");
}

function mergeTxt(s) {
	let name = state.list[0].name;
	const suffix = name.substring(name.lastIndexOf('.'));
	name = name.replace(new RegExp('[\\.\\da-zA-Z_\\s一二三四五六七八九十（）【】\\(\\))]+'+ suffix + '|[（\\(].+?[）\\)]' + suffix), suffix);
	Neutralino.os.showSaveDialog('保存', {
		defaultPath: state.curDir + '\\' + name,
	}).then(ff => {
		if(!ff) {
			return;
		}
		if(!ff.endsWith(suffix)) {
			ff += suffix;
		}
		Neutralino.filesystem.writeFile(ff, s).then(() =>{});
		handleClear();
	})
}

function handleClearAll() {
	// state.list.forEach(v => {
	//   v.selected = false;
	// });
	unref(dragComp).onClearAll();
	curItem = null;
}
</script>

<style scoped lang="scss">
.box-card {
	width: 100%;
	height: 100%;

	.card-header {
		display: flex;
		justify-content: space-around;
		align-items: center;
	}

	.card-body {
		overflow-y: auto;
		height: 100%;
		width: 100%;
		position: relative;
		outline: none;

		.card-inner-body {
			width: 100%;
			border: none;
			margin: 0;
			padding: 0;
		}

		.item {
			padding: 5px 10px;
			cursor: move;
			box-sizing: border-box;
			color: #475669;
			font-size: 14px;
			font-variant: tabular-nums;
			line-height: 1.5;
			list-style: none;
			margin: 2px 0;
		}
	}
}

::v-deep(.custom-input) {
	min-width: 300px;
	width: 50%;

	.el-input__inner {
		cursor: pointer !important;
	}
}

.item-selected {
	background-color: #cccccc50;
}

.contextmenu {
	margin: 0;
	background: #fff;
	z-index: 3000;
	position: absolute;
	list-style-type: none;
	padding: 5px 0;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 400;
	color: #333;
	box-shadow: 1px 1px 2px 4px #ccccccd0;

	li {
		margin: 0;
		padding: 7px 16px;
		cursor: pointer;
		min-width: 120px;

		&:hover {
			background: #eee;
		}
	}
}
</style>
