/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/languages/html/common/htmlTokenTypes'], function (require, exports, htmlTokenTypes_1) {
    function isDelimiter(tokenType) {
        switch (tokenType) {
            case htmlTokenTypes_1.DELIM_START:
            case htmlTokenTypes_1.DELIM_END:
            case htmlTokenTypes_1.DELIM_ASSIGN:
                return true;
        }
        return false;
    }
    function isInterestingToken(tokenType) {
        switch (tokenType) {
            case htmlTokenTypes_1.DELIM_START:
            case htmlTokenTypes_1.DELIM_END:
            case htmlTokenTypes_1.DELIM_ASSIGN:
            case htmlTokenTypes_1.ATTRIB_NAME:
            case htmlTokenTypes_1.ATTRIB_VALUE:
                return true;
        }
        return htmlTokenTypes_1.isTag(tokenType);
    }
    function getScanner(model, position) {
        var lineOffset = position.column - 1;
        var currentLine = position.lineNumber;
        var tokens = model.getLineTokens(currentLine);
        var lineContent = model.getLineContent(currentLine);
        var tokenIndex = tokens.findIndexOfOffset(lineOffset);
        var tokensOnLine = tokens.getTokenCount();
        var tokenType = tokens.getTokenType(tokenIndex);
        var tokenStart = tokens.getTokenStartIndex(tokenIndex);
        var tokenEnd = tokens.getTokenEndIndex(tokenIndex, lineContent.length);
        if ((tokenType === '' || isDelimiter(tokenType)) && tokenStart === lineOffset) {
            tokenIndex--;
            if (tokenIndex >= 0) {
                // we are at the end of a different token
                tokenType = tokens.getTokenType(tokenIndex);
                tokenStart = tokens.getTokenStartIndex(tokenIndex);
                tokenEnd = tokens.getTokenEndIndex(tokenIndex, lineContent.length);
            }
            else {
                tokenType = '';
                tokenStart = tokenEnd = 0;
            }
        }
        return {
            getTokenType: function () { return tokenType; },
            isAtTokenEnd: function () { return lineOffset === tokenEnd; },
            isAtTokenStart: function () { return lineOffset === tokenStart; },
            getTokenContent: function () { return lineContent.substring(tokenStart, tokenEnd); },
            isOpenBrace: function () { return tokenStart < tokenEnd && lineContent.charAt(tokenStart) === '<'; },
            getTokenPosition: function () { return { lineNumber: currentLine, column: tokenStart + 1 }; },
            getTokenRange: function () { return { startLineNumber: currentLine, startColumn: tokenStart + 1, endLineNumber: currentLine, endColumn: tokenEnd + 1 }; },
            getModel: function () { return model; },
            scanBack: function () {
                if (currentLine <= 0) {
                    return false;
                }
                tokenIndex--;
                do {
                    while (tokenIndex >= 0) {
                        tokenType = tokens.getTokenType(tokenIndex);
                        tokenStart = tokens.getTokenStartIndex(tokenIndex);
                        tokenEnd = tokens.getTokenEndIndex(tokenIndex, lineContent.length);
                        if (isInterestingToken(tokenType)) {
                            return true;
                        }
                        tokenIndex--;
                    }
                    currentLine--;
                    if (currentLine > 0) {
                        tokens = model.getLineTokens(currentLine);
                        lineContent = model.getLineContent(currentLine);
                        tokensOnLine = tokens.getTokenCount();
                        tokenIndex = tokensOnLine - 1;
                    }
                } while (currentLine > 0);
                tokens = null;
                tokenType = lineContent = '';
                tokenStart = tokenEnd = tokensOnLine = 0;
                return false;
            },
            scanForward: function () {
                if (currentLine > model.getLineCount()) {
                    return false;
                }
                tokenIndex++;
                do {
                    while (tokenIndex < tokensOnLine) {
                        tokenType = tokens.getTokenType(tokenIndex);
                        tokenStart = tokens.getTokenStartIndex(tokenIndex);
                        tokenEnd = tokens.getTokenEndIndex(tokenIndex, lineContent.length);
                        if (isInterestingToken(tokenType)) {
                            return true;
                        }
                        tokenIndex++;
                    }
                    currentLine++;
                    tokenIndex = 0;
                    if (currentLine <= model.getLineCount()) {
                        tokens = model.getLineTokens(currentLine);
                        lineContent = model.getLineContent(currentLine);
                        tokensOnLine = tokens.getTokenCount();
                    }
                } while (currentLine <= model.getLineCount());
                tokenType = lineContent = '';
                tokenStart = tokenEnd = tokensOnLine = 0;
                return false;
            }
        };
    }
    exports.getScanner = getScanner;
});
//# sourceMappingURL=htmlScanner.js.map