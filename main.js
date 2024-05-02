import fs from "fs";
console.log('=====================');

function nameSpaceLookUp(context, classname){}

function tokenize(string) {
	const operators = ['?', '=', '+', '-', '*', '/', '%'];
	const semicolons = [';'];
	const colons = [':'];
	const commas = [','];
	const brackets = ['[', ']', '(', ')', '{', '}'];

	const tokens = [];

	let currentIdentifier = '';
	let currentString = '';
	let line = 0;
	let column = -1;
	let isInString = false;
	let stringDelimiter = '';
	let isCommentLine = false;

	for (let i = 0; i < string.length; i++) {
		const char = string[i];

		if (char === '\n') {
			line += 1;
			column = -1;
			isCommentLine = false;
		} else {
			column += 1;
		}

		if(char == '#'){
			isCommentLine = true;
		}

		if(!isInString && isCommentLine){
			continue;
		}

		if ((char === ' ' || char === '\t' || char === '\n') && !isInString) {
			if (currentIdentifier) {
				tokens.push({ type: 'Identifier', value: currentIdentifier, line, column });
				currentIdentifier = '';
			}
			continue;
		}

		if (char === '"' || char === "'") {
			if (!isInString) {
				isInString = true;
				stringDelimiter = char;
				currentString += char;
			} else if (isInString && char === stringDelimiter) {
				currentString += char;
				tokens.push({ type: 'String', value: currentString, line, column });
				currentString = '';
				isInString = false;
				stringDelimiter = '';
			} else {
				currentString += char;
			}
			continue;
		}

		if (isInString) {
			currentString += char;
			if (char === '\\' && i + 1 < string.length) {
				currentString += string[i + 1];
				i++;
				column++;
			}
			continue;
		}

		if (operators.includes(char)) {
			if (currentIdentifier.length > 0) {
				tokens.push({ type: 'Identifier', value: currentIdentifier, line, column });
				currentIdentifier = '';
			}
			tokens.push({ type: 'Operator', value: char, line, column });
			continue;
		}

		if (semicolons.includes(char)) {
			if (currentIdentifier.length > 0) {
				tokens.push({ type: 'Identifier', value: currentIdentifier, line, column });
				currentIdentifier = '';
			}
			tokens.push({ type: 'Semicolon', value: char, line, column });
			continue;
		}

		if (colons.includes(char)) {
			tokens.push({ type: 'Colon', value: char, line, column });
			continue;
		}
		
		if (commas.includes(char)) {
			tokens.push({ type: 'Comma', value: char, line, column });
			continue;
		}

		if (brackets.includes(char)) {
			if (currentIdentifier.length > 0) {
				tokens.push({ type: 'Identifier', value: currentIdentifier, line, column });
				currentIdentifier = '';
			}
			tokens.push({ type: 'Bracket', value: char, line, column });
			continue;
		}

		if (/[a-zA-Z0-9_.]/.test(char)) {
			currentIdentifier += char;
		}
	}

	if (currentIdentifier.length > 0) {
		tokens.push({ type: 'Identifier', value: currentIdentifier, line, column });
	}

	return tokens;
}

const isValue = (i) => i == 'Identifier' || i == 'String' || i == 'Block';
function parse(tokens) {
	const context = {
		namespaces: {},
		all: {},
		current: null
	};

	function parseIdentifier(tokens, index) {
		return tokens[index].value;
	}

	function parseClassDeclaration({
		type,
		name,
		id
	}) {
		const [parent, className] = name.split('.');

		if (context.namespaces[parent]) {
			context.namespaces[parent].classes[className] = {
				name,
				type,
				id,
				structures: {}
			}
		}

	}

	function parseNamespaceDeclaration({
		type,
		name,
		id
	}) {
		context.namespaces[name] = {
			name,
			type,
			id,
			classes: {

			}
		}
	}

	function parseNode(o) {
		console.log(o);
		if (o.type == 'Node') {
			const values = {};
			o.value.map(i => i.value).forEach(o => { for (let i in o) values[i] = parseNode(o[i]) });
			return values;
		} if (Array.isArray(o)) {
			const values = {};
			o.map(i => i.value).forEach(o => { for (let i in o) values[i] = parseNode(o[i]) });
			return values;
		} else return typeof o == "string" ? (
			o.trim().startsWith("'[") && o.trim().endsWith("]'") ? JSON.parse(o.split("'")[1].split("'")[0].replace(/\n/g, ' ')) : JSON.parse(o)
		) : o;
	}

	function parseBlock(block, raw){
		const values = raw ? block : {};
		if (!raw) block.value.map(i => i.value).forEach(o => { for (let i in o) values[i] = parseNode(o[i]) });
		return values;
	}

	function parseValuesDeclaration(name, value, raw) {
		const [ns, cs, sc] = name.split('.');
		// console.log(name, value);
		if (value.type == 'Bracket') return;
		const values = parseBlock(value, raw);
		context.namespaces[ns].classes[cs].structures[sc] = {
			values,
			name
		}
	}

	let current = {
		objects: []
	};

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.passed) {
			token.removeNext = true;
			continue;
		}

		if (token.type == 'Bracket' && token.value == '{') {
			token.removeNext = true;
			current.objects.push({ token, inside: [] });
		} else if (token.type == 'Bracket' && token.value == '}') {
			const object = current.objects.pop();
			// console.log('object', object)
			// console.log(tokens[i], 'b', i);
			tokens[i + 1].type = "Block";
			tokens[i + 1].value = object.inside.map((token, i, tokens) => {
				if (token.passed) return;
				if (token.type == "Identifier") {
					if (tokens[i + 1].value == '=') {
						const name = token.value;
						// console.log(tokens[i + 2], 'values');
						if (isValue(tokens[i + 2]?.type)) {
							const value = tokens[i + 2].value;
							tokens[i + 1].passed = true;
							tokens[i + 2].passed = true;
							tokens[i + 2].removeNext = true;
							return {
								type: "Node",
								value: { [name]: value }
							}
						}
					}
				}
				return null;
			}).filter(Boolean);
			delete tokens[i + 1].removeNext;
			token.removeNext = true;
		} else if (current.objects.length) {
			current.objects[current.objects.length - 1].inside.push(token);
			token.removeNext = true;
		}

	}

	tokens = tokens.filter(t => !t.removeNext);

	console.log(tokens);

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token && token.value === 'Std.Out') {
			const [ns, cs, sc] = tokens[i + 1].value.split('.');
			let t = context.namespaces[ns] || context.current?.context[ns];
			if (cs) t = t.classes?.[cs] || t[cs];
			if (sc) t = t.structures?.[sc] || t[sc];
			console.log(t);
			i += 2;
		} else if (token.type === 'Identifier') {

			if (!current.openStructure && token && token.value === 'Declare') {

				const type = tokens[i + 1].value;

				const name = tokens[i + 2].value;

				const id = tokens[i + 3].value;

				if (type == 'Namespace') {
					parseNamespaceDeclaration({
						type,
						name,
						id
					});
					i += 4;
				} else if (type == 'Class') {
					parseClassDeclaration({
						type,
						name,
						id
					});
					i += 4;
				} else if (type == 'Structure') {

					const value = tokens[i + 4];

					if (value.type == 'Identifier' && value.value == 'Copy') {
						const [ns, cs, sc] = tokens[i + 5].value.split('.');
						parseValuesDeclaration(name, {
							...(context?.namespaces?.[ns]?.classes?.[cs]?.structures?.[sc]?.values || {}),
						}, true);
					} else {
						parseValuesDeclaration(name, value);
					}
					i += 4;

					// let value;

					// if(tokens[i + 4].value == '{'){
					// 	current.openStructure = {
					// 		name,
					// 		values: {}
					// 	};
					// 	i += 4;
					// } else if(tokens[i + 4].type == 'Identifier' && tokens[i + 4].value == 'Copy'){
					// 	const [ns, cs, sc] = tokens[i + 5].value.split('.');
					// 	value = {
					// 		...context.namespaces[ns].classes[cs].structures[sc].values,
					// 	}
					// 	i += 4;
					// }

					// if(value){
					// 	parseValuesDeclaration(name, value);
					// }

				}

			} else if (!current.openStructure && token.value in context.namespaces) {
				const namespace = context.namespaces[token.value];

				const next = tokens[i + 1];

				if(next.type == 'Identifier'){
					const id = tokens[i + 2];
					const name = next.value;

					const newNs = {
						type: 'Namespace',
						namespace,
						name: name,
						context: {},
						instances: []
					};

					if(namespace.id.startsWith('.')) newNs[namespace.id.split('.')[1]] = parseNode(id.value);

					context.all[name] = newNs;

					i += 2;
				}
			} else if(!current.openStructure && token.value == 'Using') {

				const name = tokens[i + 1];
				
				const ns = context.all[name.value];

				if(ns) context.current = ns;

				i += 2;

			} else if(current.openStructure) {
				if(token.type == 'Identifier'){
					// in current.openStructure.class.class.structure
					const [className, structureName] = token.value.split('.');
					
					const nsClass = context.current.namespace.classes[className];
					console.log('class', token.value);
					const struct = nsClass.structures[structureName];

					const defValues = {...struct.values};

					const values = {
						...defValues,
						...parseBlock(tokens[i + 1])
					};	


					current.openStructure.class.values
						[structureName] = values;

					i += 1;

					if(tokens[i + 2].type !== "Comma"){
						delete current.openStructure;
					}

				}

			} else if(context.current){
				if(token.value in context.current.namespace.classes){
					const nsClass = context.current.namespace.classes[token.value];
					const name = tokens[i + 1];
					const id = tokens[i + 2];
					const newClass = {
						$class: nsClass,
						$parent: context.current,
						values: {},
						[nsClass.id.split('.')[1]]: context.current.id + ':' + parseNode(id.value),
						name: name.value
					}
					context.current.instances.push(newClass);
					context.current.context[name.value] = newClass;

					current.openStructure = {
						class: newClass
					};

					i += 2;
				}

			}

		}

	}

	return context;
}

const inputString = `
Declare Namespace Package .id;
Declare Class Package.Entity .id;
Declare Class Package.Item .id;
Declare Class Package.Biome .id;
Declare Class Package.BiomeStructure .id;
Declare Class Package.RawObject .id;
Declare Class Package.RawTexture .id;
Declare Class Package.EffectShader .id;
Declare Class Package.UI .id;

Declare Structure Package.Entity.baseData = {
	health = 100;
};

Declare Structure Package.Entity.resource = {
	source = "";
	type = "";
	loader = "obj";
};

Declare Structure Package.Item.resource = Copy Package.Entity.resource;
Declare Structure Package.RawObject.resource = Copy Package.Entity.resource;
Declare Structure Package.RawTexture.resource = Copy Package.Entity.resource;

Declare Structure Package.RawTexture.texture = {
	map = "[1, 1, 0, 1, 1, 0]"
};

Std.Out Package.Entity.baseData;

Package I "i";
Using I;

RawTexture GrassSegmentTexture "grass" = RawTexture.resource {
  sources = '[
    "./grass-texture-top.png",
    "./grass-texture-side.png"
	]';
  type = "texture-map";
}, RawTexture.texture {
  map = '[1, 1, 0, 1, 1, 0]'
};

Entity Goober "goober" = Entity.resource {
	source = "/rrr";
}, Entity.baseData {
	health = 10;
};

Std.Out Goober;
`;


const text = fs.readFileSync('./packages/I/main.idg', { encoding: 'utf-8' });
const tokens = tokenize(inputString);
const context = parse(tokens);

// console.log(context);
