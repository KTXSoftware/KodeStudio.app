/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/core/range', 'vs/editor/common/core/position', 'vs/editor/common/core/selection', 'vs/editor/common/core/editOperation'], function (require, exports, range_1, position_1, selection_1, editOperation_1) {
    var BlockCommentCommand = (function () {
        function BlockCommentCommand(selection) {
            this._selection = selection;
            this._usedEndToken = null;
        }
        BlockCommentCommand._haystackHasNeedleAtOffset = function (haystack, needle, offset) {
            if (offset < 0) {
                return false;
            }
            var needleLength = needle.length;
            var haystackLength = haystack.length;
            if (offset + needleLength > haystackLength) {
                return false;
            }
            for (var i = 0; i < needleLength; i++) {
                if (haystack.charCodeAt(offset + i) !== needle.charCodeAt(i)) {
                    return false;
                }
            }
            return true;
        };
        BlockCommentCommand.prototype._createOperationsForBlockComment = function (selection, config, model, builder) {
            var startLineNumber = selection.startLineNumber;
            var startColumn = selection.startColumn;
            var endLineNumber = selection.endLineNumber;
            var endColumn = selection.endColumn;
            var selectionIsEmpty = range_1.Range.isEmpty(selection);
            var startToken = config.blockCommentStartToken;
            var endToken = config.blockCommentEndToken;
            var startTokenIndex = model.getLineContent(startLineNumber).lastIndexOf(startToken, startColumn - 1 + startToken.length);
            var endTokenIndex = model.getLineContent(endLineNumber).indexOf(endToken, endColumn - 1 - endToken.length);
            var ops;
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                ops = BlockCommentCommand._createRemoveBlockCommentOperations({
                    startLineNumber: startLineNumber,
                    startColumn: startTokenIndex + 1 + startToken.length,
                    endLineNumber: endLineNumber,
                    endColumn: endTokenIndex + 1
                }, startToken, endToken);
            }
            else {
                ops = BlockCommentCommand._createAddBlockCommentOperations(selection, startToken, endToken);
                this._usedEndToken = ops.length === 1 ? endToken : null;
            }
            for (var i = 0; i < ops.length; i++) {
                builder.addEditOperation(ops[i].range, ops[i].text);
            }
        };
        BlockCommentCommand._createRemoveBlockCommentOperations = function (r, startToken, endToken) {
            var res = [];
            if (!range_1.Range.isEmpty(r)) {
                // Remove block comment start
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.startLineNumber, r.startColumn - startToken.length, r.startLineNumber, r.startColumn)));
                // Remove block comment end
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.endLineNumber, r.endColumn, r.endLineNumber, r.endColumn + endToken.length)));
            }
            else {
                // Remove both continuously
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(r.startLineNumber, r.startColumn - startToken.length, r.endLineNumber, r.endColumn + endToken.length)));
            }
            return res;
        };
        BlockCommentCommand._createAddBlockCommentOperations = function (r, startToken, endToken) {
            var res = [];
            if (!range_1.Range.isEmpty(r)) {
                // Insert block comment start
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(r.startLineNumber, r.startColumn), startToken));
                // Insert block comment end
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(r.endLineNumber, r.endColumn), endToken));
            }
            else {
                // Insert both continuously
                res.push(editOperation_1.EditOperation.replace(new range_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn), startToken + endToken));
            }
            return res;
        };
        BlockCommentCommand.prototype.getEditOperations = function (model, builder) {
            var startLineNumber = this._selection.startLineNumber;
            var startColumn = this._selection.startColumn;
            var endLineNumber = this._selection.endLineNumber;
            var endColumn = this._selection.endColumn;
            var commentsSupport = model.getModeAtPosition(startLineNumber, startColumn).commentsSupport;
            if (!commentsSupport) {
                // Mode does not support comments
                return;
            }
            var config = commentsSupport.getCommentsConfiguration();
            if (!config || !config.blockCommentStartToken || !config.blockCommentEndToken) {
                // Mode does not support block comments
                return;
            }
            this._createOperationsForBlockComment({
                startLineNumber: startLineNumber,
                startColumn: startColumn,
                endLineNumber: endLineNumber,
                endColumn: endColumn
            }, config, model, builder);
        };
        BlockCommentCommand.prototype.computeCursorState = function (model, helper) {
            var inverseEditOperations = helper.getInverseEditOperations();
            if (inverseEditOperations.length === 2) {
                var startTokenEditOperation = inverseEditOperations[0];
                var endTokenEditOperation = inverseEditOperations[1];
                return selection_1.Selection.createSelection(startTokenEditOperation.range.endLineNumber, startTokenEditOperation.range.endColumn, endTokenEditOperation.range.startLineNumber, endTokenEditOperation.range.startColumn);
            }
            else {
                var srcRange = inverseEditOperations[0].range;
                var deltaColumn = this._usedEndToken ? -this._usedEndToken.length : 0;
                return selection_1.Selection.createSelection(srcRange.endLineNumber, srcRange.endColumn + deltaColumn, srcRange.endLineNumber, srcRange.endColumn + deltaColumn);
            }
        };
        return BlockCommentCommand;
    })();
    exports.BlockCommentCommand = BlockCommentCommand;
});
//# sourceMappingURL=blockCommentCommand.js.map