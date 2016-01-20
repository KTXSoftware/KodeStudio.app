/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/json'], function (require, exports, Json) {
    function format(model, range, options) {
        var initialIndentLevel;
        var value;
        var rangeOffset;
        if (range) {
            range = { startLineNumber: range.startLineNumber, startColumn: 1, endLineNumber: range.endLineNumber, endColumn: model.getLineMaxColumn(range.endLineNumber) }; // extend to full range
            initialIndentLevel = computeIndentLevel(model.getLineContent(range.startLineNumber), options);
            value = model.getValueInRange(range);
            rangeOffset = model.getOffsetFromPosition({ lineNumber: range.startLineNumber, column: range.startColumn });
        }
        else {
            range = model.getFullModelRange();
            initialIndentLevel = 0;
            value = model.getValue();
            rangeOffset = 0;
        }
        var lineBreak = false;
        var indentLevel = 0;
        var indentValue;
        if (options.insertSpaces) {
            indentValue = repeat(' ', options.tabSize);
        }
        else {
            indentValue = '\t';
        }
        var scanner = Json.createScanner(value, false);
        function newLineAndIndent() {
            return model.getEOL() + repeat(indentValue, initialIndentLevel + indentLevel);
        }
        function scanNext() {
            var token = scanner.scan();
            lineBreak = false;
            while (token === Json.SyntaxKind.Trivia || token === Json.SyntaxKind.LineBreakTrivia) {
                lineBreak = lineBreak || (token === Json.SyntaxKind.LineBreakTrivia);
                token = scanner.scan();
            }
            return token;
        }
        var editOperations = [];
        function addEdit(text, range) {
            if (model.getValueInRange(range) !== text) {
                editOperations.push({ range: range, text: text });
            }
        }
        var firstToken = scanNext();
        if (firstToken !== Json.SyntaxKind.EOF) {
            var firstTokenStart = model.getPositionFromOffset(scanner.getTokenOffset() + rangeOffset);
            var initialIndent = repeat(indentValue, initialIndentLevel);
            addEdit(initialIndent, { startLineNumber: range.startLineNumber, startColumn: range.startColumn, endLineNumber: firstTokenStart.lineNumber, endColumn: firstTokenStart.column });
        }
        while (firstToken !== Json.SyntaxKind.EOF) {
            var firstTokenEnd = model.getPositionFromOffset(scanner.getTokenOffset() + scanner.getTokenLength() + rangeOffset);
            var secondToken = scanNext();
            while (!lineBreak && (secondToken === Json.SyntaxKind.LineCommentTrivia || secondToken === Json.SyntaxKind.BlockCommentTrivia)) {
                // comments on the same line: keep them on the same line, but ignore them otherwise
                var commentTokenStart = model.getPositionFromOffset(scanner.getTokenOffset() + rangeOffset);
                addEdit(' ', { startLineNumber: firstTokenEnd.lineNumber, startColumn: firstTokenEnd.column, endLineNumber: commentTokenStart.lineNumber, endColumn: commentTokenStart.column });
                firstTokenEnd = model.getPositionFromOffset(scanner.getTokenOffset() + scanner.getTokenLength() + rangeOffset);
                secondToken = scanNext();
            }
            var replaceContent = '';
            if (secondToken === Json.SyntaxKind.CloseBraceToken) {
                if (firstToken !== Json.SyntaxKind.OpenBraceToken) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else if (secondToken === Json.SyntaxKind.CloseBracketToken) {
                if (firstToken !== Json.SyntaxKind.OpenBracketToken) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else {
                switch (firstToken) {
                    case Json.SyntaxKind.OpenBracketToken:
                    case Json.SyntaxKind.OpenBraceToken:
                        indentLevel++;
                        replaceContent = newLineAndIndent();
                        break;
                    case Json.SyntaxKind.CommaToken:
                    case Json.SyntaxKind.LineCommentTrivia:
                        replaceContent = newLineAndIndent();
                        break;
                    case Json.SyntaxKind.BlockCommentTrivia:
                        if (lineBreak) {
                            replaceContent = newLineAndIndent();
                        }
                        else {
                            // symbol following comment on the same line: keep on same line, separate with ' '
                            replaceContent = ' ';
                        }
                        break;
                    case Json.SyntaxKind.ColonToken:
                        replaceContent = ' ';
                        break;
                    case Json.SyntaxKind.NullKeyword:
                    case Json.SyntaxKind.TrueKeyword:
                    case Json.SyntaxKind.FalseKeyword:
                    case Json.SyntaxKind.NumericLiteral:
                        if (secondToken === Json.SyntaxKind.NullKeyword || secondToken === Json.SyntaxKind.FalseKeyword || secondToken === Json.SyntaxKind.NumericLiteral) {
                            replaceContent = ' ';
                        }
                        break;
                }
                if (lineBreak && (secondToken === Json.SyntaxKind.LineCommentTrivia || secondToken === Json.SyntaxKind.BlockCommentTrivia)) {
                    replaceContent = newLineAndIndent();
                }
            }
            var secondTokenStart = model.getPositionFromOffset(scanner.getTokenOffset() + rangeOffset);
            addEdit(replaceContent, { startLineNumber: firstTokenEnd.lineNumber, startColumn: firstTokenEnd.column, endLineNumber: secondTokenStart.lineNumber, endColumn: secondTokenStart.column });
            firstToken = secondToken;
        }
        return editOperations;
    }
    exports.format = format;
    function repeat(s, count) {
        var result = '';
        for (var i = 0; i < count; i++) {
            result += s;
        }
        return result;
    }
    function computeIndentLevel(line, options) {
        var i = 0;
        var nChars = 0;
        var tabSize = options.tabSize || 4;
        while (i < line.length) {
            var ch = line.charAt(i);
            if (ch === ' ') {
                nChars++;
            }
            else if (ch === '\t') {
                nChars += tabSize;
            }
            else {
                break;
            }
            i++;
        }
        return Math.floor(nChars / tabSize);
    }
});
//# sourceMappingURL=jsonFormatter.js.map