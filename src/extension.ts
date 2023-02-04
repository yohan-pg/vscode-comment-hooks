import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

let statusItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel; 

export function activate(context: vscode.ExtensionContext) {
	statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -999);
	outputChannel = vscode.window.createOutputChannel("Comment Hooks");

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		evalHook("save", document);
	});

	vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		evalHook("open", document);
	});

	vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
		evalHook("close", document);
	});
}

function evalHook(hookType: string, document: vscode.TextDocument) {
	statusItem.hide();
	for (const line of document.getText().split('\n')) {
		const command = isCommand(line, document.languageId);
		if (command) {
			for (const hook of command.hooks) {
				if (hook === hookType) {
					const cwd = getWorkspaceCwd() ?? path.dirname(document.uri.path);
					// keep an eye on this: https://github.com/microsoft/vscode/issues/46471
					const env = {
						file: document.uri.path,
						relativeFile: path.relative(getWorkspaceCwd() ?? "", document.uri.path),
						hookType: hookType,
						workspaceFolder: getWorkspaceCwd() ?? ""
					};
					const msg = `on ${hookType}: ` + command.code.replace("$", "\\$");
					statusItem.text = msg;
					const timeout = setTimeout(() => {
						statusItem.show();
						statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
					}, 500);
					exec(command.code, { timeout: 5000, env, cwd }, (err, stdout, stderr) => {
						clearTimeout(timeout);
						statusItem.tooltip = stdout;
						statusItem.show();
						outputChannel.appendLine(stderr);
						if (err) {
							statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
						} else {
							statusItem.backgroundColor = undefined;
						}
					});
				}
			}
		}
	}
}

const COMMENT_DELIMITERS = ["<!--", "#", "//", "--", "%", "(*"];

function isCommand(line: string, languageId: string) {
	// hacky until it is possible to read language configurations: https://github.com/microsoft/vscode/issues/109919
	for (const delimiter of COMMENT_DELIMITERS) {
		if (line.trim().startsWith(delimiter) && line.includes(":")) {
			let cleanLine = line.trim();
			while (cleanLine.replace(delimiter, "") !== cleanLine) {
				cleanLine = cleanLine.replace(delimiter, "").trim();
			}
			if (cleanLine.startsWith("on")) {
				const [hooksString, ...commandParts] = cleanLine.slice(1).split(":");
				return {
					hooks: hooksString.split(/(\s+)/),
					code: commandParts.join(":")
				}; 
			}
		}
	}
	return null;
}

function getWorkspaceCwd() {
	// keep an eye on this: https://github.com/microsoft/vscode/issues/46471
	if(vscode.workspace.workspaceFolders !== undefined) {
		return vscode.workspace.workspaceFolders[0].uri.path;
	} else {
		return null;
	}
}

export function deactivate() {}


