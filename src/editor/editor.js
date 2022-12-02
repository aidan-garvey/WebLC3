import * as monaco from 'monaco-editor'

self.MonacoEnvironment = {
	getWorker: function (workerId, label) {
		const getWorkerModule = (moduleUrl, label) => {
			return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
				name: label,
				type: 'module'
			});
		};

		switch (label) {
			case 'json':
				return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
			case 'css':
			case 'scss':
			case 'less':
				return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
			case 'html':
			case 'handlebars':
			case 'razor':
				return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
			case 'typescript':
			case 'javascript':
				return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
			default:
				return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
		}
	}
};

function getCode() {
	return [
	'; comment',
	'',
	'.orig x3000',
	'',
	'	lea R0, hello',
	'	puts',
	'	halt',
	'',
	'hello: .stringz "Hello World!\\n"',
	'.end'
	].join('\n');
}

monaco.languages.register({
	id: 'lc3Asm'
});

monaco.languages.setMonarchTokensProvider('lc3Asm', {
	defaultToken: "invalid",
	ignoreCase: true,

	instructions: [
		"add", "and", "br", "brn", "brz", "brp",
		"brnz", "brnp", "brzp", "brnzp", "jmp", "jsr",
		"jsrr", "ld", "ldi", "ldr", "lea", "not",
		"ret", "rti", "st", "sti", "str", "trap"
	],

	trapAliases: [
		"getc", "halt", "in", "out", "puts", "putsp"
	],

	origDirective: [
		".orig"
	],

	directives: [
		".end", ".fill", ".blkw", ".stringz"
	],

	digits: /\d+/,
	binDigits: /[0-1]+/,
	hexDigits: /[0-9a-fA-F]+/,

	tokenizer: {
		root: [
			// numbers
			[/#?[xX](@hexDigits)/, "hexNumber"],
			[/#?[bB](@binDigits)/, "binNumber"],
			[/#?-?(@digits)/, "number"],

			// strings
			[/"([^"])*$/, "invalidString"],
			[/'([^'])*$/, "invalidString"],
			[/"/, "string", "@doubleString"],
			[/'/, "string", "@singleString"],

			// registers
			[/[rR][0-7]/, "register"],

			[/\.[\w]+/, {
				cases: {
					"@origDirective": "orig",
					"@directives": "directive",
					"@default": "invalid"
				}
			}],

			// instructions and labels
			[/[a-zA-Z_][\w]*/, {
				cases: {
					"@instructions": "instruction",
					"@trapAliases": "trapAlias",
					"@default": "label"
				}
			}],

			{include: "@whitespace"},

			// delimiter
			[/[,:]/, "delimiter"]
		],

		whitespace: [
			[/\s/, ''],
			[/;.*$/, "comment"]
		],

		doubleString: [
			[/[^"]+/, "string"],
			[/"/, "string", "@pop"]
		],

		singleString: [
			[/[^']+/, "string"],
			[/'/, "string", "@pop"]
		]
	}
});

// Define a new theme that contains only rules that match this language
monaco.editor.defineTheme('lc3Theme', {
	colors: {
		'editor.background': '2F2F2F'
	},
	base: 'vs-dark',
	inherit: false,
	rules: [
		{ token: 'register', foreground: '8786CC' },
		{ token: 'instruction', foreground: 'FFAB40' },
		{ token: 'trapAlias', foreground: 'FFAB40' },
		{ token: 'orig', foreground: 'F6F180' },
		{ token: 'directive', foreground: '90D050'},
		{ token: 'label', foreground: '60B6FF'},
		{ token: 'number', foreground: 'CE608C'},
		{ token: 'hexNumber', foreground: 'CE608C'},
		{ token: 'binNumber', foreground: 'CE608C'},
		{ token: 'delimiter', foreground: 'F0F0F0'},
		{ token: 'invalidString', foreground: 'FF3724', fontStyle: 'bold'},
		{ token: 'comment', foreground: '8F878C'},
		{ token: 'string', foreground: '80B49A'},
		{ token: 'invalid', foreground: 'C33333', fontStyle: 'bold'}
	]
});

globalThis.editor = monaco.editor.create(document.getElementById('container'), {
	theme: 'lc3Theme',
	value: getCode(),
	language: 'lc3Asm'
});
