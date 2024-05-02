import Context from "./Context.class";
import IFile from "./File.class";





export class Script {

	parent;
	context;

	/**
	 * @type {IFile}
	 */
	file;

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
	}
	
}
