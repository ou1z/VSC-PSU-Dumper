const vscode = require('vscode');
const fs = require('fs')
const { exec } = require('child_process')
const luamin = require('./luamin.js')


/**
 * @param {vscode.ExtensionContext} context
 */


let dump = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
dump.command = 'psudumper.constantdump'
dump.tooltip = "Gets the constants for a PSU obfuscated script."
dump.text = 'Constant Dump PSU'

function getEditorText() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let document = editor.document;
		const documentText = document.getText();

		return documentText
	}
}
function replaceAll(string, search, replace) {
	return string.split(search).join(replace);
}

function activate(context) {

	dump.show()

	let disposable = vscode.commands.registerCommand('psudumper.constantdump', function () {
		let scripttodump = getEditorText()


		let header = `-----------------------------\nSuccessfully Constant Dumped!\nDate: ${new Date()}\n-----------------------------\n\n\n`


		let script = luamin.Beautify(scripttodump, {
			RenameGlobals: false,
			RenameVariables: false,
			SolveMath: false
		})
	

		let deserializer
		let dindex = 99999;
		let regex = /\w\[\w\] = \w;/g
		let lastbreak = script.lastIndexOf('break')
		script.replace(regex, function(match, index) {

			if (lastbreak - index < dindex && lastbreak - index > 0) {
				dindex = lastbreak - index
				deserializer = match
				console.log("NEW DESERIALIZER: " + match)
			}
			
		})
		let newscript = replaceAll(script, deserializer, deserializer + `print(${deserializer.charAt(deserializer.length-2)})`)



		fs.writeFileSync('./runscript.lua', newscript)
		exec('lua ./runscript.lua', (err,stdout,stderr) => {
			vscode.workspace.openTextDocument({'content': header + stdout})
			fs.unlinkSync('./runscript.lua')
		})


		vscode.window.showInformationMessage('Dumped!')
	});

	context.subscriptions.push(disposable);
}

exports.activate = activate;
function deactivate() {
	dump.dispose()
}

module.exports = {
	activate,
	deactivate
}
