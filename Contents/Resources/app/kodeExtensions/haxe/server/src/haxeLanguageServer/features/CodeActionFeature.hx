package haxeLanguageServer.features;

import haxe.extern.EitherType;
import jsonrpc.CancellationToken;
import jsonrpc.ResponseError;
import jsonrpc.Types.NoData;

typedef CodeActionContributor = CodeActionParams->Array<CodeAction>;

class CodeActionFeature {
	final context:Context;
	final contributors:Array<CodeActionContributor> = [];

	public function new(context:Context) {
		this.context = context;
		context.protocol.onRequest(Methods.CodeAction, onCodeAction);
	}

	public function registerContributor(contributor:CodeActionContributor) {
		contributors.push(contributor);
	}

	function onCodeAction(params:CodeActionParams, token:CancellationToken, resolve:Array<CodeAction>->Void, reject:ResponseError<NoData>->Void) {
		var codeActions = [];
		for (contributor in contributors)
			codeActions = codeActions.concat(contributor(params));
		resolve(codeActions);
	}
}
