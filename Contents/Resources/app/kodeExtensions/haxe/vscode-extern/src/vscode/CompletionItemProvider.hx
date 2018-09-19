package vscode;

/**
 * The completion item provider interface defines the contract between extensions and
 * [IntelliSense](https://code.visualstudio.com/docs/editor/intellisense).
 *
 * Providers can delay the computation of the [`detail`](#CompletionItem.detail)
 * and [`documentation`](#CompletionItem.documentation) properties by implementing the
 * [`resolveCompletionItem`](#CompletionItemProvider.resolveCompletionItem)-function. However, properties that
 * are needed for the initial sorting and filtering, like `sortText`, `filterText`, `insertText`, and `range`, must
 * not be changed during resolve.
 *
 * Providers are asked for completions either explicitly by a user gesture or -depending on the configuration-
 * implicitly when typing words or trigger characters.
 */
typedef CompletionItemProvider = {
	/**
	 * Provide completion items for the given position and document.
	 *
	 * @param document The document in which the command was invoked.
	 * @param position The position at which the command was invoked.
	 * @param token A cancellation token.
	 * @param context How the completion was triggered.
	 * @return An array of completions, a [completion list](#CompletionList), or a thenable that resolves to either.
	 * The lack of a result can be signaled by returning `undefined`, `null`, or an empty array.
	 */
	function provideCompletionItems(document:TextDocument, position:Position, token:CancellationToken, context:CompletionContext):ProviderResult<EitherType<Array<CompletionItem>, CompletionList>>;

	/**
	 * Given a completion item fill in more data, like [doc-comment](#CompletionItem.documentation)
	 * or [details](#CompletionItem.detail).
	 *
	 * The editor will only resolve a completion item once.
	 *
	 * @param item A completion item currently active in the UI.
	 * @param token A cancellation token.
	 * @return The resolved completion item or a thenable that resolves to of such. It is OK to return the given
	 * `item`. When no result is returned, the given `item` will be used.
	 */
	@:optional // TODO: will that work?
	function resolveCompletionItem(item:CompletionItem, token:CancellationToken):ProviderResult<CompletionItem>;
}
