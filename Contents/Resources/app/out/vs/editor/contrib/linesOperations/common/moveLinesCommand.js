/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/core/range', 'vs/editor/common/core/selection'], function (require, exports, range_1, selection_1) {
    var MoveLinesCommand = (function () {
        function MoveLinesCommand(selection, isMovingDown) {
            this._selection = selection;
            this._isMovingDown = isMovingDown;
        }
        MoveLinesCommand.prototype.getEditOperations = function (model, builder) {
            var modelLineCount = model.getLineCount();
            if (this._isMovingDown && this._selection.endLineNumber === modelLineCount) {
                return;
            }
            if (!this._isMovingDown && this._selection.startLineNumber === 1) {
                return;
            }
            this._moveEndPositionDown = false;
            var s = this._selection;
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            if (s.startLineNumber === s.endLineNumber && model.getLineMaxColumn(s.startLineNumber) === 1) {
                // Current line is empty
                var lineNumber = s.startLineNumber;
                var otherLineNumber = (this._isMovingDown ? lineNumber + 1 : lineNumber - 1);
                if (model.getLineMaxColumn(otherLineNumber) === 1) {
                    // Other line number is empty too, so no editing is needed
                    // Add a no-op to force running by the model
                    builder.addEditOperation(new range_1.Range(1, 1, 1, 1), null);
                }
                else {
                    // Type content from other line number on line number
                    builder.addEditOperation(new range_1.Range(lineNumber, 1, lineNumber, 1), model.getLineContent(otherLineNumber));
                    // Remove content from other line number
                    builder.addEditOperation(new range_1.Range(otherLineNumber, 1, otherLineNumber, model.getLineMaxColumn(otherLineNumber)), null);
                }
                // Track selection at the other line number
                s = selection_1.Selection.createSelection(otherLineNumber, 1, otherLineNumber, 1);
            }
            else {
                var movingLineNumber, movingLineText;
                if (this._isMovingDown) {
                    movingLineNumber = s.endLineNumber + 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber - 1, model.getLineMaxColumn(movingLineNumber - 1), movingLineNumber, model.getLineMaxColumn(movingLineNumber)), null);
                    // Insert line that needs to be moved before
                    builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), movingLineText + '\n');
                }
                else {
                    movingLineNumber = s.startLineNumber - 1;
                    movingLineText = model.getLineContent(movingLineNumber);
                    // Delete line that needs to be moved
                    builder.addEditOperation(new range_1.Range(movingLineNumber, 1, movingLineNumber + 1, 1), null);
                    // Insert line that needs to be moved after
                    builder.addEditOperation(new range_1.Range(s.endLineNumber, model.getLineMaxColumn(s.endLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), '\n' + movingLineText);
                }
            }
            this._selectionId = builder.trackSelection(s);
        };
        MoveLinesCommand.prototype.computeCursorState = function (model, helper) {
            var result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            return result;
        };
        return MoveLinesCommand;
    })();
    exports.MoveLinesCommand = MoveLinesCommand;
});
//# sourceMappingURL=moveLinesCommand.js.map