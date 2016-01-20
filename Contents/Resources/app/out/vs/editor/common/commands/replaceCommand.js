/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'vs/editor/common/core/selection'], function (require, exports, selection_1) {
    var ReplaceCommand = (function () {
        function ReplaceCommand(range, text) {
            this._range = range;
            this._text = text;
        }
        ReplaceCommand.prototype.getText = function () {
            return this._text;
        };
        ReplaceCommand.prototype.getRange = function () {
            return this._range;
        };
        ReplaceCommand.prototype.setRange = function (newRange) {
            this._range = newRange;
        };
        ReplaceCommand.prototype.getEditOperations = function (model, builder) {
            builder.addEditOperation(this._range, this._text);
        };
        ReplaceCommand.prototype.computeCursorState = function (model, helper) {
            var inverseEditOperations = helper.getInverseEditOperations();
            var srcRange = inverseEditOperations[0].range;
            return new selection_1.Selection(srcRange.endLineNumber, srcRange.endColumn, srcRange.endLineNumber, srcRange.endColumn);
        };
        return ReplaceCommand;
    })();
    exports.ReplaceCommand = ReplaceCommand;
    var ReplaceCommandWithoutChangingPosition = (function (_super) {
        __extends(ReplaceCommandWithoutChangingPosition, _super);
        function ReplaceCommandWithoutChangingPosition(range, text) {
            _super.call(this, range, text);
        }
        ReplaceCommandWithoutChangingPosition.prototype.computeCursorState = function (model, helper) {
            var inverseEditOperations = helper.getInverseEditOperations();
            var srcRange = inverseEditOperations[0].range;
            return new selection_1.Selection(srcRange.startLineNumber, srcRange.startColumn, srcRange.startLineNumber, srcRange.startColumn);
        };
        return ReplaceCommandWithoutChangingPosition;
    })(ReplaceCommand);
    exports.ReplaceCommandWithoutChangingPosition = ReplaceCommandWithoutChangingPosition;
    var ReplaceCommandWithOffsetCursorState = (function (_super) {
        __extends(ReplaceCommandWithOffsetCursorState, _super);
        function ReplaceCommandWithOffsetCursorState(range, text, lineNumberDeltaOffset, columnDeltaOffset) {
            _super.call(this, range, text);
            this._columnDeltaOffset = columnDeltaOffset;
            this._lineNumberDeltaOffset = lineNumberDeltaOffset;
        }
        ReplaceCommandWithOffsetCursorState.prototype.computeCursorState = function (model, helper) {
            var inverseEditOperations = helper.getInverseEditOperations();
            var srcRange = inverseEditOperations[0].range;
            return new selection_1.Selection(srcRange.endLineNumber + this._lineNumberDeltaOffset, srcRange.endColumn + this._columnDeltaOffset, srcRange.endLineNumber + this._lineNumberDeltaOffset, srcRange.endColumn + this._columnDeltaOffset);
        };
        return ReplaceCommandWithOffsetCursorState;
    })(ReplaceCommand);
    exports.ReplaceCommandWithOffsetCursorState = ReplaceCommandWithOffsetCursorState;
    var ReplaceCommandThatPreservesSelection = (function (_super) {
        __extends(ReplaceCommandThatPreservesSelection, _super);
        function ReplaceCommandThatPreservesSelection(editRange, text, initialSelection) {
            _super.call(this, editRange, text);
            this._initialSelection = initialSelection;
        }
        ReplaceCommandThatPreservesSelection.prototype.getEditOperations = function (model, builder) {
            _super.prototype.getEditOperations.call(this, model, builder);
            this._selectionId = builder.trackSelection(this._initialSelection);
        };
        ReplaceCommandThatPreservesSelection.prototype.computeCursorState = function (model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        };
        return ReplaceCommandThatPreservesSelection;
    })(ReplaceCommand);
    exports.ReplaceCommandThatPreservesSelection = ReplaceCommandThatPreservesSelection;
});
//# sourceMappingURL=replaceCommand.js.map