/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'vs/base/common/arrays', 'vs/base/common/collections', 'vs/editor/common/modes', 'vs/editor/common/modes/supports', 'vs/languages/typescript/common/lib/typescriptServices', 'vs/editor/common/modes/abstractState'], function (require, exports, strings, arrays, collections, Modes, supports, ts, abstractState_1) {
    (function (Language) {
        Language[Language["TypeScript"] = 0] = "TypeScript";
        Language[Language["EcmaScript5"] = 1] = "EcmaScript5";
    })(exports.Language || (exports.Language = {}));
    var Language = exports.Language;
    function createTokenizationSupport(mode, language) {
        var classifier = ts.createClassifier(), bracketTypeTable = language === Language.TypeScript ? tsBracketTypeTable : jsBracketTypeTable, tokenTypeTable = language === Language.TypeScript ? tsTokenTypeTable : jsTokenTypeTable;
        return {
            shouldGenerateEmbeddedModels: false,
            getInitialState: function () { return new State(mode, null, language, 0 /* None */, false); },
            tokenize: function (line, state, offsetDelta, stopAtOffset) { return tokenize(bracketTypeTable, tokenTypeTable, classifier, state, line, offsetDelta, stopAtOffset); }
        };
    }
    exports.createTokenizationSupport = createTokenizationSupport;
    var State = (function () {
        function State(mode, state, language, eolState, inJsDocComment) {
            this._mode = mode;
            this._state = state;
            this.language = language;
            this.eolState = eolState;
            this.inJsDocComment = inJsDocComment;
        }
        State.prototype.clone = function () {
            return new State(this._mode, abstractState_1.AbstractState.safeClone(this._state), this.language, this.eolState, this.inJsDocComment);
        };
        State.prototype.equals = function (other) {
            if (other === this) {
                return true;
            }
            if (!other || !(other instanceof State)) {
                return false;
            }
            if (this.eolState !== other.eolState) {
                return false;
            }
            if (this.inJsDocComment !== other.inJsDocComment) {
                return false;
            }
            return abstractState_1.AbstractState.safeEquals(this._state, other._state);
        };
        State.prototype.getMode = function () {
            return this._mode;
        };
        State.prototype.tokenize = function (stream) {
            throw new Error();
        };
        State.prototype.getStateData = function () {
            return this._state;
        };
        State.prototype.setStateData = function (state) {
            this._state = state;
        };
        return State;
    })();
    function tokenize(bracketTypeTable, tokenTypeTable, classifier, state, text, offsetDelta, stopAtOffset) {
        if (offsetDelta === void 0) { offsetDelta = 0; }
        // Create result early and fill in tokens
        var ret = {
            tokens: [],
            actualStopOffset: offsetDelta + text.length,
            endState: new State(state.getMode(), state.getStateData(), state.language, 0 /* None */, false),
            modeTransitions: [{ startIndex: offsetDelta, mode: state.getMode() }],
        };
        function appendFn(startIndex, type, bracket) {
            if (ret.tokens.length === 0 || bracket !== void 0 || arrays.tail(ret.tokens).type !== type) {
                ret.tokens.push(new supports.Token(startIndex, type, bracket || Modes.Bracket.None));
            }
        }
        var isTypeScript = state.language === Language.TypeScript;
        // shebang statement, #! /bin/node
        if (!isTypeScript && checkSheBang(state, offsetDelta, text, appendFn)) {
            return ret;
        }
        var result = classifier.getClassificationsForLine(text, state.eolState, true), offset = 0;
        ret.endState.eolState = result.finalLexState;
        ret.endState.inJsDocComment = result.finalLexState === 1 /* InMultiLineCommentTrivia */ && (state.inJsDocComment || /\/\*\*.*$/.test(text));
        for (var _i = 0, _a = result.entries; _i < _a.length; _i++) {
            var entry = _a[_i];
            var bracket = Modes.Bracket.None, type;
            if (entry.classification === ts.TokenClass.Punctuation) {
                // punctions: check for brackets: (){}[]
                var ch = text.charCodeAt(offset);
                bracket = characterToBracket[ch] || Modes.Bracket.None;
                type = bracketTypeTable[ch] || tokenTypeTable[entry.classification];
                appendFn(offset + offsetDelta, type, bracket);
            }
            else if (entry.classification === ts.TokenClass.Comment) {
                // comments: check for JSDoc, block, and line comments
                if (ret.endState.inJsDocComment || /\/\*\*.*\*\//.test(text.substr(offset, entry.length))) {
                    appendFn(offset + offsetDelta, isTypeScript ? 'comment.doc.ts' : 'comment.doc.js', Modes.Bracket.None);
                }
                else {
                    appendFn(offset + offsetDelta, isTypeScript ? 'comment.ts' : 'comment.js', Modes.Bracket.None);
                }
            }
            else {
                // everything else
                appendFn(offset + offsetDelta, tokenTypeTable[entry.classification] || strings.empty, void 0);
            }
            offset += entry.length;
        }
        return ret;
    }
    var characterToBracket = collections.createNumberDictionary();
    characterToBracket['('.charCodeAt(0)] = Modes.Bracket.Open;
    characterToBracket[')'.charCodeAt(0)] = Modes.Bracket.Close;
    characterToBracket['{'.charCodeAt(0)] = Modes.Bracket.Open;
    characterToBracket['}'.charCodeAt(0)] = Modes.Bracket.Close;
    characterToBracket['['.charCodeAt(0)] = Modes.Bracket.Open;
    characterToBracket[']'.charCodeAt(0)] = Modes.Bracket.Close;
    var tsBracketTypeTable = collections.createNumberDictionary();
    tsBracketTypeTable['('.charCodeAt(0)] = 'delimiter.parenthesis.ts';
    tsBracketTypeTable[')'.charCodeAt(0)] = 'delimiter.parenthesis.ts';
    tsBracketTypeTable['{'.charCodeAt(0)] = 'delimiter.bracket.ts';
    tsBracketTypeTable['}'.charCodeAt(0)] = 'delimiter.bracket.ts';
    tsBracketTypeTable['['.charCodeAt(0)] = 'delimiter.array.ts';
    tsBracketTypeTable[']'.charCodeAt(0)] = 'delimiter.array.ts';
    var tsTokenTypeTable = collections.createNumberDictionary();
    tsTokenTypeTable[ts.TokenClass.Identifier] = 'identifier.ts';
    tsTokenTypeTable[ts.TokenClass.Keyword] = 'keyword.ts';
    tsTokenTypeTable[ts.TokenClass.Operator] = 'delimiter.ts';
    tsTokenTypeTable[ts.TokenClass.Punctuation] = 'delimiter.ts';
    tsTokenTypeTable[ts.TokenClass.NumberLiteral] = 'number.ts';
    tsTokenTypeTable[ts.TokenClass.RegExpLiteral] = 'regexp.ts';
    tsTokenTypeTable[ts.TokenClass.StringLiteral] = 'string.ts';
    var jsBracketTypeTable = collections.createNumberDictionary();
    jsBracketTypeTable['('.charCodeAt(0)] = 'delimiter.parenthesis.js';
    jsBracketTypeTable[')'.charCodeAt(0)] = 'delimiter.parenthesis.js';
    jsBracketTypeTable['{'.charCodeAt(0)] = 'delimiter.bracket.js';
    jsBracketTypeTable['}'.charCodeAt(0)] = 'delimiter.bracket.js';
    jsBracketTypeTable['['.charCodeAt(0)] = 'delimiter.array.js';
    jsBracketTypeTable[']'.charCodeAt(0)] = 'delimiter.array.js';
    var jsTokenTypeTable = collections.createNumberDictionary();
    jsTokenTypeTable[ts.TokenClass.Identifier] = 'identifier.js';
    jsTokenTypeTable[ts.TokenClass.Keyword] = 'keyword.js';
    jsTokenTypeTable[ts.TokenClass.Operator] = 'delimiter.js';
    jsTokenTypeTable[ts.TokenClass.Punctuation] = 'delimiter.js';
    jsTokenTypeTable[ts.TokenClass.NumberLiteral] = 'number.js';
    jsTokenTypeTable[ts.TokenClass.RegExpLiteral] = 'regexp.js';
    jsTokenTypeTable[ts.TokenClass.StringLiteral] = 'string.js';
    function checkSheBang(state, deltaOffset, line, appendFn) {
        if (line.indexOf('#!') === 0) {
            appendFn(deltaOffset, 'comment.shebang', Modes.Bracket.None);
            return true;
        }
    }
});
//# sourceMappingURL=tokenization.js.map