/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", './blockCommentCommand', 'vs/base/common/strings', 'vs/editor/common/core/range', 'vs/editor/common/core/position', 'vs/editor/common/core/selection', 'vs/editor/common/core/editOperation'], function (require, exports, BlockCommentCommand, Strings, range_1, position_1, selection_1, editOperation_1) {
    ;
    (function (Type) {
        Type[Type["Toggle"] = 0] = "Toggle";
        Type[Type["ForceAdd"] = 1] = "ForceAdd";
        Type[Type["ForceRemove"] = 2] = "ForceRemove";
    })(exports.Type || (exports.Type = {}));
    var Type = exports.Type;
    var LineCommentCommand = (function () {
        function LineCommentCommand(selection, tabSize, type) {
            this._selection = selection;
            this._tabSize = tabSize;
            this._type = type;
            this._deltaColumn = 0;
        }
        /**
         * Do an initial pass over the lines and gather info about the line comment string.
         * Returns null if any of the lines doesn't support a line comment string.
         */
        LineCommentCommand._gatherPreflightCommentStrings = function (model, startLineNumber, endLineNumber) {
            var lines = [], config, commentStr, seenModes = Object.create(null), i, lineCount, lineNumber, mode, modeId;
            for (i = 0, lineCount = endLineNumber - startLineNumber + 1; i < lineCount; i++) {
                lineNumber = startLineNumber + i;
                mode = model.getModeAtPosition(lineNumber, 1);
                modeId = mode.getId();
                // Find the commentStr for this line, if none is found then bail out: we cannot do line comments
                if (seenModes[modeId]) {
                    commentStr = seenModes[modeId];
                }
                else {
                    config = (mode.commentsSupport ? mode.commentsSupport.getCommentsConfiguration() : null);
                    commentStr = (config && config.lineCommentTokens && config.lineCommentTokens.length > 0 ? config.lineCommentTokens[0] : null);
                    if (commentStr === null || commentStr.length === 0) {
                        // Mode does not support line comments
                        return null;
                    }
                    seenModes[modeId] = commentStr;
                }
                lines.push({
                    ignore: false,
                    commentStr: commentStr,
                    commentStrOffset: 0,
                    commentStrLength: commentStr.length
                });
            }
            return lines;
        };
        /**
         * Analyze lines and decide which lines are relevant and what the toggle should do.
         * Also, build up several offsets and lengths useful in the generation of editor operations.
         */
        LineCommentCommand._analyzeLines = function (type, model, lines, startLineNumber) {
            var lineData, lineContentStartOffset, commentStrEndOffset, seenModes = Object.create(null), i, lineCount, lineNumber, shouldRemoveComments, lineContent, _space = ' '.charCodeAt(0), _tab = '\t'.charCodeAt(0), char, onlyWhitespaceLines = true;
            if (type === Type.Toggle) {
                shouldRemoveComments = true;
            }
            else if (type === Type.ForceAdd) {
                shouldRemoveComments = false;
            }
            else {
                shouldRemoveComments = true;
            }
            for (i = 0, lineCount = lines.length; i < lineCount; i++) {
                lineData = lines[i];
                lineNumber = startLineNumber + i;
                lineContent = model.getLineContent(lineNumber);
                lineContentStartOffset = Strings.firstNonWhitespaceIndex(lineContent);
                if (lineContentStartOffset === -1) {
                    // Empty or whitespace only line
                    if (type === Type.Toggle) {
                        lineData.ignore = true;
                    }
                    else if (type === Type.ForceAdd) {
                        lineData.ignore = false;
                    }
                    else {
                        lineData.ignore = true;
                    }
                    lineData.commentStrOffset = lineContent.length;
                    continue;
                }
                onlyWhitespaceLines = false;
                lineData.ignore = false;
                lineData.commentStrOffset = lineContentStartOffset;
                if (shouldRemoveComments && !BlockCommentCommand.BlockCommentCommand._haystackHasNeedleAtOffset(lineContent, lineData.commentStr, lineContentStartOffset)) {
                    if (type === Type.Toggle) {
                        // Every line so far has been a line comment, but this one is not
                        shouldRemoveComments = false;
                    }
                    else if (type === Type.ForceAdd) {
                    }
                    else {
                        lineData.ignore = true;
                    }
                }
                if (shouldRemoveComments) {
                    commentStrEndOffset = lineContentStartOffset + lineData.commentStrLength;
                    if (commentStrEndOffset < lineContent.length && lineContent.charCodeAt(commentStrEndOffset) === _space) {
                        lineData.commentStrLength += 1;
                    }
                }
            }
            if (type === Type.Toggle && onlyWhitespaceLines) {
                // For only whitespace lines, we insert comments
                shouldRemoveComments = false;
                // Also, no longer ignore them
                for (i = 0, lineCount = lines.length; i < lineCount; i++) {
                    lines[i].ignore = false;
                }
            }
            return {
                supported: true,
                shouldRemoveComments: shouldRemoveComments,
                lines: lines
            };
        };
        /**
         * Analyze all lines and decide exactly what to do => not supported | insert line comments | remove line comments
         */
        LineCommentCommand._gatherPreflightData = function (type, model, startLineNumber, endLineNumber) {
            var lines = LineCommentCommand._gatherPreflightCommentStrings(model, startLineNumber, endLineNumber);
            if (lines === null) {
                return {
                    supported: false,
                    shouldRemoveComments: false,
                    lines: null
                };
            }
            return LineCommentCommand._analyzeLines(type, model, lines, startLineNumber);
        };
        /**
         * Given a successful analysis, execute either insert line comments, either remove line comments
         */
        LineCommentCommand.prototype._executeLineComments = function (model, builder, data, s) {
            var ops;
            if (data.shouldRemoveComments) {
                ops = LineCommentCommand._createRemoveLineCommentsOperations(data.lines, s.startLineNumber);
            }
            else {
                LineCommentCommand._normalizeInsertionPoint(model, data.lines, s.startLineNumber, this._tabSize);
                ops = LineCommentCommand._createAddLineCommentsOperations(data.lines, s.startLineNumber);
            }
            var cursorPosition = new position_1.Position(s.positionLineNumber, s.positionColumn);
            for (var i = 0, len = ops.length; i < len; i++) {
                builder.addEditOperation(ops[i].range, ops[i].text);
                if (ops[i].range.isEmpty() && ops[i].range.getStartPosition().equals(cursorPosition)) {
                    this._deltaColumn = ops[i].text.length;
                }
            }
            this._selectionId = builder.trackSelection(s);
        };
        LineCommentCommand.prototype._attemptRemoveBlockComment = function (model, s, startToken, endToken) {
            var startLineNumber = s.startLineNumber;
            var endLineNumber = s.endLineNumber;
            var startTokenAllowedBeforeColumn = endToken.length + Math.max(model.getLineFirstNonWhitespaceColumn(s.startLineNumber), s.startColumn);
            var startTokenIndex = model.getLineContent(startLineNumber).lastIndexOf(startToken, startTokenAllowedBeforeColumn - 1);
            var endTokenIndex = model.getLineContent(endLineNumber).indexOf(endToken, s.endColumn - 1 - startToken.length);
            if (startTokenIndex !== -1 && endTokenIndex === -1) {
                endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                endLineNumber = startLineNumber;
            }
            if (startTokenIndex === -1 && endTokenIndex !== -1) {
                startTokenIndex = model.getLineContent(endLineNumber).lastIndexOf(startToken, endTokenIndex);
                startLineNumber = endLineNumber;
            }
            if (s.isEmpty() && (startTokenIndex === -1 || endTokenIndex === -1)) {
                startTokenIndex = model.getLineContent(startLineNumber).indexOf(startToken);
                if (startTokenIndex !== -1) {
                    endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                }
            }
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                return BlockCommentCommand.BlockCommentCommand._createRemoveBlockCommentOperations({
                    startLineNumber: startLineNumber,
                    startColumn: startTokenIndex + startToken.length + 1,
                    endLineNumber: endLineNumber,
                    endColumn: endTokenIndex + 1
                }, startToken, endToken);
            }
            return null;
        };
        /**
         * Given an unsuccessful analysis, delegate to the block comment command
         */
        LineCommentCommand.prototype._executeBlockComment = function (model, builder, s) {
            var commentsSupport = model.getModeAtPosition(s.startLineNumber, s.startColumn).commentsSupport;
            if (!commentsSupport) {
                // Mode does not support comments
                return;
            }
            var config = commentsSupport.getCommentsConfiguration();
            if (!config || !config.blockCommentStartToken || !config.blockCommentEndToken) {
                // Mode does not support block comments
                return;
            }
            var startToken = config.blockCommentStartToken, startTokenLength = startToken.length;
            var endToken = config.blockCommentEndToken, endTokenLength = endToken.length;
            var ops = this._attemptRemoveBlockComment(model, s, startToken, endToken);
            if (!ops) {
                if (s.isEmpty()) {
                    var lineContent = model.getLineContent(s.startLineNumber);
                    var firstNonWhitespaceIndex = Strings.firstNonWhitespaceIndex(lineContent);
                    if (firstNonWhitespaceIndex === -1) {
                        // Line is empty or contains only whitespace
                        firstNonWhitespaceIndex = lineContent.length;
                    }
                    ops = BlockCommentCommand.BlockCommentCommand._createAddBlockCommentOperations({
                        startLineNumber: s.startLineNumber,
                        startColumn: firstNonWhitespaceIndex + 1,
                        endLineNumber: s.startLineNumber,
                        endColumn: lineContent.length + 1
                    }, startToken, endToken);
                }
                else {
                    ops = BlockCommentCommand.BlockCommentCommand._createAddBlockCommentOperations({
                        startLineNumber: s.startLineNumber,
                        startColumn: model.getLineFirstNonWhitespaceColumn(s.startLineNumber),
                        endLineNumber: s.endLineNumber,
                        endColumn: model.getLineMaxColumn(s.endLineNumber)
                    }, startToken, endToken);
                }
                if (ops.length === 1) {
                    this._deltaColumn = startToken.length;
                }
            }
            this._selectionId = builder.trackSelection(s);
            for (var i = 0; i < ops.length; i++) {
                builder.addEditOperation(ops[i].range, ops[i].text);
            }
        };
        LineCommentCommand.prototype.getEditOperations = function (model, builder) {
            var s = this._selection;
            this._moveEndPositionDown = false;
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            var data = LineCommentCommand._gatherPreflightData(this._type, model, s.startLineNumber, s.endLineNumber);
            if (data.supported) {
                return this._executeLineComments(model, builder, data, s);
            }
            return this._executeBlockComment(model, builder, s);
        };
        LineCommentCommand.prototype.computeCursorState = function (model, helper) {
            var result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            return selection_1.Selection.createSelection(result.startLineNumber, result.startColumn + this._deltaColumn, result.endLineNumber, result.endColumn + this._deltaColumn);
        };
        /**
         * Generate edit operations in the remove line comment case
         */
        LineCommentCommand._createRemoveLineCommentsOperations = function (lines, startLineNumber) {
            var i, len, lineData, res = [];
            for (i = 0, len = lines.length; i < len; i++) {
                lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(startLineNumber + i, lineData.commentStrOffset + 1, startLineNumber + i, lineData.commentStrOffset + lineData.commentStrLength + 1)));
            }
            return res;
        };
        /**
         * Generate edit operations in the add line comment case
         */
        LineCommentCommand._createAddLineCommentsOperations = function (lines, startLineNumber) {
            var i, len, lineData, res = [];
            for (i = 0, len = lines.length; i < len; i++) {
                lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(startLineNumber + i, lineData.commentStrOffset + 1), lineData.commentStr + ' '));
            }
            return res;
        };
        // TODO@Alex -> duplicated in characterHardWrappingLineMapper
        LineCommentCommand.nextVisibleColumn = function (currentVisibleColumn, tabSize, isTab, columnSize) {
            if (isTab) {
                return currentVisibleColumn + (tabSize - (currentVisibleColumn % tabSize));
            }
            return currentVisibleColumn + columnSize;
        };
        /**
         * Adjust insertion points to have them vertically aligned in the add line comment case
         */
        LineCommentCommand._normalizeInsertionPoint = function (model, lines, startLineNumber, tabSize) {
            var minVisibleColumn = Number.MAX_VALUE, i, len, lineContent, j, lenJ, currentVisibleColumn, _tab = '\t'.charCodeAt(0);
            for (i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                lineContent = model.getLineContent(startLineNumber + i);
                currentVisibleColumn = 0;
                for (j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, tabSize, lineContent.charCodeAt(j) === _tab, 1);
                }
                if (currentVisibleColumn < minVisibleColumn) {
                    minVisibleColumn = currentVisibleColumn;
                }
            }
            minVisibleColumn = Math.floor(minVisibleColumn / tabSize) * tabSize;
            for (i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                lineContent = model.getLineContent(startLineNumber + i);
                currentVisibleColumn = 0;
                for (j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, tabSize, lineContent.charCodeAt(j) === _tab, 1);
                }
                if (currentVisibleColumn > minVisibleColumn) {
                    lines[i].commentStrOffset = j - 1;
                }
                else {
                    lines[i].commentStrOffset = j;
                }
            }
        };
        return LineCommentCommand;
    })();
    exports.LineCommentCommand = LineCommentCommand;
});
//# sourceMappingURL=lineCommentCommand.js.map