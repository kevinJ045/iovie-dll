import Context from "./Context.class";
import IFile from "./File.class";
import Parser from "./Parser.class";
import Tokenizer from "./Tokenizer.class";





export class Script {

	parent;
	context;

	/**
	 * @type {IFile}
	 */
	file;

	context = new Context();
	tokenizer;
	parser;

	/**
	 * 
	 * @param {{ filepath?: string, file?: IFile, context: Context }} param0 
	 */
	constructor({
		filepath,
		file,
	}){
		if(filepath){
			this.file = new IFile({ filepath });
		} else if(file instanceof IFile){
			this.file = file;
		}

		if(!this.file.content) this.file.read();

		this.tokenizer = new Tokenizer(this.file.content);
		this.parser = new Parser(this.tokenizer);

		this.parser.filepath = this.file.filepath;

		this.parser.context = this.context;
	}

	execute(){
		this.parser.parse();
	}
	
}
