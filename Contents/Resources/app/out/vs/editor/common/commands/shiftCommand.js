/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'vs/editor/common/core/range', 'vs/editor/common/core/selection', 'vs/editor/common/controller/cursorMoveHelper', 'vs/editor/common/modes/supports/onEnter'], function (require, exports, Strings, range_1, selection_1, cursorMoveHelper_1, onEnter_1) {
    var ShiftCommand = (function () {
        function ShiftCommand(range, opts) {
            this._opts = opts;
            this._selection = range;
            this._useLastEditRangeForCursorEndPosition = false;
        }
        ShiftCommand.unshiftIndentCount = function (line, column, tabSize) {
            // Determine the visible column where the content starts
            var contentStartVisibleColumn = cursorMoveHelper_1.CursorMoveHelper.visibleColumnFromColumn2(line, column, tabSize);
            var desiredTabStop = cursorMoveHelper_1.CursorMoveHelper.prevTabColumn(contentStartVisibleColumn, tabSize);
            // The `desiredTabStop` is a multiple of `tabSize` => determine the number of indents
            return desiredTabStop / tabSize;
        };
        ShiftCommand.shiftIndentCount = function (line, column, tabSize) {
            // Determine the visible column where the content starts
            var contentStartVisibleColumn = cursorMoveHelper_1.CursorMoveHelper.visibleColumnFromColumn2(line, column, tabSize);
            var desiredTabStop = cursorMoveHelper_1.CursorMoveHelper.nextTabColumn(contentStartVisibleColumn, tabSize);
            // The `desiredTabStop` is a multiple of `tabSize` => determine the number of indents
            return desiredTabStop / tabSize;
        };
        ShiftCommand.prototype.getEditOperations = function (model, builder) {
            var startLine = this._selection.startLineNumber, endLine = this._selection.endLineNumber, _SPACE = ' '.charCodeAt(0);
            if (this._selection.endColumn === 1 && startLine !== endLine) {
                endLine = endLine - 1;
            }
            var lineNumber, tabSize = this._opts.tabSize, oneIndent = this._opts.oneIndent, shouldIndentEmptyLines = (startLine === endLine);
            // indents[i] represents i * oneIndent
            var indents = ['', oneIndent];
            // if indenting or outdenting on a whitespace only line
            if (this._selection.isEmpty()) {
                if (/^\s*$/.test(model.getLineContent(startLine))) {
                    this._useLastEditRangeForCursorEndPosition = true;
                }
            }
            // keep track of previous line's "miss-alignment"
            var previousLineExtraSpaces = 0, extraSpaces = 0;
            for (lineNumber = startLine; lineNumber <= endLine; lineNumber++, previousLineExtraSpaces = extraSpaces) {
                extraSpaces = 0;
                var lineText = model.getLineContent(lineNumber);
                var indentationEndIndex = Strings.firstNonWhitespaceIndex(lineText);
                if (this._opts.isUnshift && (lineText.length === 0 || indentationEndIndex === 0)) {
                    // empty line or line with no leading whitespace => nothing to do
                    continue;
                }
                if (!shouldIndentEmptyLines && !this._opts.isUnshift && lineText.length === 0) {
                    // do not indent empty lines => nothing to do
                    continue;
                }
                if (indentationEndIndex === -1) {
                    // the entire line is whitespace
                    indentationEndIndex = lineText.length;
                }
                if (lineNumber > 1) {
                    var contentStartVisibleColumn = cursorMoveHelper_1.CursorMoveHelper.visibleColumnFromColumn2(lineText, indentationEndIndex + 1, tabSize);
                    if (contentStartVisibleColumn % tabSize !== 0) {
                        // The current line is "miss-aligned", so let's see if this is expected...
                        // This can only happen when it has trailing commas in the indent
                        var enterAction = onEnter_1.getRawEnterActionAtPosition(model, lineNumber - 1, model.getLineMaxColumn(lineNumber - 1));
                        if (enterAction) {
                            extraSpaces = previousLineExtraSpaces;
                            if (enterAction.appendText) {
                                for (var j = 0, lenJ = enterAction.appendText.length; j < lenJ && extraSpaces < tabSize; j++) {
                                    if (enterAction.appendText.charCodeAt(j) === _SPACE) {
                                        extraSpaces++;
                                    }
                                    else {
                                        break;
                                    }
                                }
                            }
                            if (enterAction.removeText) {
                                extraSpaces = Math.max(0, extraSpaces - enterAction.removeText);
                            }
                            // Act as if `prefixSpaces` is not part of the indentation
                            for (var j = 0; j < extraSpaces; j++) {
                                if (indentationEndIndex === 0 || lineText.charCodeAt(indentationEndIndex - 1) !== _SPACE) {
                                    break;
                                }
                                indentationEndIndex--;
                            }
                        }
                    }
                }
                if (this._opts.isUnshift && indentationEndIndex === 0) {
                    // line with no leading whitespace => nothing to do
                    continue;
                }
                var desiredIndentCount = void 0;
                if (this._opts.isUnshift) {
                    desiredIndentCount = ShiftCommand.unshiftIndentCount(lineText, indentationEndIndex + 1, tabSize);
                }
                else {
                    desiredIndentCount = ShiftCommand.shiftIndentCount(lineText, indentationEndIndex + 1, tabSize);
                }
                // Fill `indents`, as needed
                for (var j = indents.length; j <= desiredIndentCount; j++) {
                    indents[j] = indents[j - 1] + oneIndent;
                }
                builder.addEditOperation(new range_1.Range(lineNumber, 1, lineNumber, indentationEndIndex + 1), indents[desiredIndentCount]);
            }
            this._selectionId = builder.trackSelection(this._selection);
        };
        ShiftCommand.prototype.computeCursorState = function (model, helper) {
            if (this._useLastEditRangeForCursorEndPosition) {
                var lastOp = helper.getInverseEditOperations()[0];
                return new selection_1.Selection(lastOp.range.endLineNumber, lastOp.range.endColumn, lastOp.range.endLineNumber, lastOp.range.endColumn);
            }
            return helper.getTrackedSelection(this._selectionId);
        };
        return ShiftCommand;
    })();
    exports.ShiftCommand = ShiftCommand;
});
//# sourceMappingURL=shiftCommand.js.map