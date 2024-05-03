
const TOKENS = {
  operators: ['?', '=', '+', '-', '*', '/', '%'],
  semicolons: [';'],
  colons: [':'],
  commas: [','],
  brackets: ['(', ')', '{', '}', '[', ']']
}

export class Token {
  constructor({
    type,
    value,
    line,
    column
  }){
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}


export default class Tokenizer {
	constructor(string) {
		this.string = string;
		this.tokens = [];
		this.currentIdentifier = '';
		this.currentString = '';
		this.line = 0;
		this.column = -1;
		this.isInString = false;
		this.stringDelimiter = '';
		this.isCommentLine = false;
	}

  makeToken({ 
    type,
    value
  }){
    this.tokens.push(
      new Token({
        type,
        value,
        line: this.line,
        column: this.column
      })
    )    
  }

	tokenize() {
		for (let i = 0; i < this.string.length; i++) {
			const char = this.string[i];

			if (char === '\n') {
				this.line += 1;
				this.column = -1;
				this.isCommentLine = false;
			} else {
				this.column += 1;
			}

			if (char === '#') {
				this.isCommentLine = true;
			}

			if (!this.isInString && this.isCommentLine) {
				continue;
			}

      if ((char === ' ' || char === '\t' || char === '\n') && !this.isInString) {
        if (this.currentIdentifier) {
          this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
        }
        continue;
      }

			if (char === '"' || char === "'") {
				if (!this.isInString) {
					this.isInString = true;
					this.stringDelimiter = char;
					this.currentString += char;
				} else if (this.isInString && char === this.stringDelimiter) {
					this.currentString += char;
          this.makeToken({
            type: 'String',
            value: this.currentString
          });
					this.currentString = '';
					this.isInString = false;
					this.stringDelimiter = '';
				} else {
					this.currentString += char;
				}
				continue;
			}

      if (this.isInString) {
        this.currentString += char;
        if (char === '\\' && i + 1 < string.length) {
          this.currentString += string[i + 1];
          i++;
          this.column++;
        }
        continue;
      } 

			if (TOKENS.operators.includes(char)) {
				if (this.currentIdentifier.length > 0) {
          this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
				}
        this.makeToken({ type: 'Operator', value: char });
				continue;
			}

			if (TOKENS.semicolons.includes(char)) {
				if (this.currentIdentifier.length > 0) {
					this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
				}
        this.makeToken({ type: 'Semicolon', value: char });
				continue;
			}

			if (TOKENS.colons.includes(char)) {
				if (this.currentIdentifier.length > 0) {
					this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
				}
				this.makeToken({ type: 'Colon', value: char });
				continue;
			}

			if (TOKENS.commas.includes(char)) {
				if (this.currentIdentifier.length > 0) {
					this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
				}
				this.makeToken({ type: 'Comma', value: char });
				continue;
			}

			if (TOKENS.brackets.includes(char)) {
				if (this.currentIdentifier.length > 0) {
					this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
          this.currentIdentifier = '';
				}
				this.makeToken({ type: 'Bracket', value: char });
				continue;
			}

			if (/[a-zA-Z0-9_.]/.test(char)) {
				this.currentIdentifier += char;
			}
		}

		if (this.currentIdentifier.length > 0) {
      this.makeToken({ type: 'Identifier', value: this.currentIdentifier });
		}

		return this.tokens;
	}
}
