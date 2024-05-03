import Context from "./Context.class";
import DefaultScripts from "./DefaultScripts.const";
import IFile from "./File.class";
import Tokenizer from "./Tokenizer.class";
import path from "path";

export default class Parser {

  filepath = '';
  filepaths = [];

  /**
   * 
   * @param {Tokenizer} tokenizer 
   */
  constructor(tokenizer) {
    this.tokenizer = tokenizer;
    this.context = new Context();
  }

  isValue(i) {
    return i === 'Identifier' || i === 'String' || i === 'Block';
  }

  parseIdentifier(tokens, index) {
    return tokens[index].value;
  }

  parseClassDeclaration({ type, name, id }) {
    const [parent, className] = name.split('.');
    if (this.context.namespaces[parent]) {
      this.context.namespaces[parent].classes[className] = {
        name,
        type,
        id,
        structures: {}
      };
    }
  }

  parseNamespaceDeclaration({ type, name, id }) {
    this.context.namespaces[name] = {
      name,
      type,
      id,
      classes: {}
    };
  }

  parseNode(o) {
    if (o.type === 'Node') {
      const values = {};
      o.value.map(i => i.value).forEach(o => {
        for (let i in o) values[i] = this.parseNode(o[i]);
      });
      return values;
    } else if (Array.isArray(o)) {
      const values = {};
      o.map(i => i.value).forEach(o => {
        for (let i in o) values[i] = this.parseNode(o[i]);
      });
      return values;
    } else {
      return typeof o === 'string' ? (
        o.trim().startsWith("'[") && o.trim().endsWith("]'") ? JSON.parse(o.split("'")[1].split("'")[0].replace(/\n/g, ' ')) : JSON.parse(o)
      ) : o;
    }
  }

  parseBlock(block, raw) {
    const values = raw ? block : {};
    if (!raw) block.value.map(i => i.value).forEach(o => {
      for (let i in o) values[i] = this.parseNode(o[i]);
    });
    return values;
  }

  parseValuesDeclaration(name, value, raw) {
    const [ns, cs, sc] = name.split('.');
    const values = this.parseBlock(value, raw);
    this.context.namespaces[ns].classes[cs].structures[sc] = {
      values,
      name
    };
  }

  parseVariable(variable) {
    const namespace = variable.split('.');
    if (this.context.current.context[namespace[0]]) {
      const B = this.context.current.context[namespace.shift()];
      let C = B.values;
      while (namespace.length) {
        if (C[namespace[0]]) {
          C = C[namespace.shift()];
        } else if (B[namespace[0]]) {
          return (C = B[namespace.shift()]);
        } else {
          // Error(Property not found, variable)
          break;
        }
      }
      return C;
    } else {
      // Error(Variable Not Found, variable)
    }
  }

  includeFile(filename, pkgname){
    if(pkgname in DefaultScripts.scripts){
      return new Tokenizer(DefaultScripts.scripts[pkgname]).tokenize();
    } else {
      return new Tokenizer(
        new IFile({ filepath: filename })
          .read()
      ).tokenize();
    }
  }

  unstringify(string){
    const delimiter = string[0];
    return string.split(delimiter)[1].split(delimiter)[0];
  }

  parse() {

    let tokens = this.tokenizer.tokenize();

    let current = {
      objects: []
    };

    const includeFiles = (cpath) => {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'Identifier' && token.value === 'Include') {
          const filePathToken = tokens[i + 1];
          if (filePathToken && filePathToken.type === 'String') {
            const filePath = this.unstringify(filePathToken.value);

            const cdir = path.dirname(cpath);
            const p = path.resolve(cdir, filePath);
            
            const includedTokens = this.includeFile(p, filePath);

            tokens.splice(i, 2, ...includedTokens);
            
            if(tokens.some(i => i.type == 'Identifier' && i.value == 'Include'))
              includeFiles(p);

            i += includedTokens.length - 1;
            continue;
          }
        }
      }

    }

    includeFiles(this.filepath);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.passed) {
        token.removeNext = true;
        continue;
      }

      if (token.type === 'Bracket' && token.value === '{') {
        token.removeNext = true;
        current.objects.push({ token, inside: [] });
      } else if (token.type === 'Bracket' && token.value === '}') {
        const object = current.objects.pop();
        token.type = 'Block';
        token.value = object.inside.map((token, i, tokens) => {
          if (token.passed) return;
          if (token.type === 'Identifier') {
            if (tokens[i + 1].value === '=') {
              const name = token.value;
              if (this.isValue(tokens[i + 2]?.type)) {
                const value = tokens[i + 2].value;
                tokens[i + 1].passed = true;
                tokens[i + 2].passed = true;
                tokens[i + 2].removeNext = true;
                return {
                  type: 'Node',
                  value: { [name]: value }
                };
              }
            }
          }
          return null;
        }).filter(Boolean);
        delete token.removeNext;
      } else if (current.objects.length) {
        current.objects[current.objects.length - 1].inside.push(token);
        token.removeNext = true;
      }
    }

    tokens = tokens.filter(t => !t.removeNext);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token && token.value === 'Std.Out') {
        const namespace = tokens[i + 1].value.split('.');
        let t;
        if (this.context.namespaces[namespace[0]]) {
          t = this.context.namespaces[namespace.shift()];
          if (namespace[0]) t = t.classes[namespace.shift()];
          if (namespace[0]) t = t.structures[namespace.shift()];
        } else {
          t = this.parseVariable(tokens[i + 1].value);
        }
        console.log(t);
        i += 2;
      } else if (token.type === 'Identifier') {
        if (!current.openStructure && token && token.value === 'Declare') {
          const type = tokens[i + 1].value;
          const name = tokens[i + 2].value;
          const id = tokens[i + 3].value;
          if (type === 'Namespace') {
            this.parseNamespaceDeclaration({
              type,
              name,
              id
            });
            i += 4;
          } else if (type === 'Class') {
            this.parseClassDeclaration({
              type,
              name,
              id
            });
            i += 4;
          } else if (type === 'Structure') {
            const value = tokens[i + 4];
            if (value.type === 'Identifier' && value.value === 'Copy') {
              const [ns, cs, sc] = tokens[i + 5].value.split('.');
              this.parseValuesDeclaration(name, {
                ...(this.context?.namespaces?.[ns]?.classes?.[cs]?.structures?.[sc]?.values || {}),
              }, true);
            } else {
              this.parseValuesDeclaration(name, value);
            }
            i += 4;
          }
        } else if (!current.openStructure && token.value in this.context.namespaces) {
          const namespace = this.context.namespaces[token.value];
          const next = tokens[i + 1];
          if (next.type === 'Identifier') {
            const id = tokens[i + 2];
            const name = next.value;
            const newNs = {
              type: 'Namespace',
              namespace,
              name,
              context: {},
              instances: []
            };
            if (namespace.id.startsWith('.')) {
              newNs[namespace.id.split('.')[1]] = this.parseNode(id.value);
            }
            this.context.all[name] = newNs;
            i += 2;
          }
        } else if (!current.openStructure && token.value === 'Using') {
          const name = tokens[i + 1];
          const ns = this.context.all[name.value];
          if (ns) this.context.current = ns;
          i += 2;
        } else if (current.openStructure) {
          if (token.type === 'Identifier') {
            const [className, structureName] = token.value.split('.');
            const nsClass = this.context.current.namespace.classes[className];
            const struct = nsClass.structures[structureName];
            const defValues = { ...struct.values };
            const nextToken = tokens[i + 1];
            let values = { ...defValues };
            if (nextToken.type === 'Identifier') {
              if (this.context.current.context[nextToken.value]) {
                values = this.context.current.context[nextToken.value];
              } else if (nextToken.value.indexOf('.') > -1) {
                const val = this.parseVariable(nextToken.value);
                if (val) {
                  values = {
                    ...values,
                    ...val
                  };
                }
              }
            } else if (nextToken.type === 'Block') {
              values = {
                ...values,
                ...this.parseBlock(nextToken)
              };
            }
            current.openStructure.class.values[structureName] = values;
            if (tokens[i + 2].type === 'Semicolon') {
              delete current.openStructure;
            }
            i += 1;
          }
        } else if (this.context.current) {
          if (token.value in this.context.current.namespace.classes) {
            const nsClass = this.context.current.namespace.classes[token.value];
            const name = tokens[i + 1];
            const id = tokens[i + 2];
            const newClass = {
              $class: nsClass,
              $parent: this.context.current,
              values: {},
              [nsClass.id.split('.')[1]]: this.context.current.id + ':' + this.parseNode(id.value),
              name: name.value
            };
            this.context.current.instances.push(newClass);
            this.context.current.context[name.value] = newClass;
            current.openStructure = {
              class: newClass
            };
            i += 2;
          }
        }
      }
    }

    return this.context;
  }

}
