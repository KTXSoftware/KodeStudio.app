/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'vs/editor/common/modes/nullMode'], function (require, exports, Strings, nullMode_1) {
    function tokenizeToHtmlContent(text, mode) {
        return _tokenizeToHtmlContent(text, _getSafeTokenizationSupport(mode));
    }
    exports.tokenizeToHtmlContent = tokenizeToHtmlContent;
    function tokenizeToString(text, mode, extraTokenClass) {
        return _tokenizeToString(text, _getSafeTokenizationSupport(mode), extraTokenClass);
    }
    exports.tokenizeToString = tokenizeToString;
    function _getSafeTokenizationSupport(mode) {
        if (mode && mode.tokenizationSupport) {
            return mode.tokenizationSupport;
        }
        return {
            shouldGenerateEmbeddedModels: false,
            getInitialState: function () { return new nullMode_1.NullState(null, null); },
            tokenize: function (buffer, state, deltaOffset, stopAtOffset) {
                if (deltaOffset === void 0) { deltaOffset = 0; }
                return nullMode_1.nullTokenize(null, buffer, state, deltaOffset, stopAtOffset);
            }
        };
    }
    function _tokenizeToHtmlContent(text, tokenizationSupport) {
        var result = {
            tagName: 'div',
            style: 'white-space: pre-wrap',
            children: []
        };
        var emitToken = function (className, tokenText) {
            result.children.push({
                tagName: 'span',
                className: className,
                text: tokenText
            });
        };
        var emitNewLine = function () {
            result.children.push({
                tagName: 'br'
            });
        };
        _tokenizeLines(text, tokenizationSupport, emitToken, emitNewLine);
        return result;
    }
    function _tokenizeToString(text, tokenizationSupport, extraTokenClass) {
        if (extraTokenClass === void 0) { extraTokenClass = ''; }
        if (extraTokenClass && extraTokenClass.length > 0) {
            extraTokenClass = ' ' + extraTokenClass;
        }
        var result = '';
        var emitToken = function (className, tokenText) {
            result += '<span class="' + className + extraTokenClass + '">' + Strings.escape(tokenText) + '</span>';
        };
        var emitNewLine = function () {
            result += '<br/>';
        };
        result = '<div style="white-space: pre;">';
        _tokenizeLines(text, tokenizationSupport, emitToken, emitNewLine);
        result += '</div>';
        return result;
    }
    function _tokenizeLines(text, tokenizationSupport, emitToken, emitNewLine) {
        var lines = text.split(/\r\n|\r|\n/);
        var currentState = tokenizationSupport.getInitialState();
        for (var i = 0; i < lines.length; i++) {
            currentState = _tokenizeLine(lines[i], tokenizationSupport, emitToken, currentState);
            // Keep new lines
            if (i < lines.length - 1) {
                emitNewLine();
            }
        }
    }
    function _tokenizeLine(line, tokenizationSupport, emitToken, startState) {
        var tokenized = tokenizationSupport.tokenize(line, startState), endState = tokenized.endState, tokens = tokenized.tokens, offset = 0, tokenText;
        // For each token inject spans with proper class names based on token type
        for (var j = 0; j < tokens.length; j++) {
            var token = tokens[j];
            // Tokens only provide a startIndex from where they are valid from. As such, we need to
            // look ahead the value of the token by advancing until the next tokens start inex or the
            // end of the line.
            if (j < tokens.length - 1) {
                tokenText = line.substring(offset, tokens[j + 1].startIndex);
                offset = tokens[j + 1].startIndex;
            }
            else {
                tokenText = line.substr(offset);
            }
            var className = 'token';
            var safeType = token.type.replace(/[^a-z0-9\-]/gi, ' ');
            if (safeType.length > 0) {
                className += ' ' + safeType;
            }
            emitToken(className, tokenText);
        }
        return endState;
    }
});
//# sourceMappingURL=textToHtmlTokenizer.js.map