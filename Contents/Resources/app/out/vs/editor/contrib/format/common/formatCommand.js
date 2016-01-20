/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'vs/editor/common/core/range'], function (require, exports, Strings, range_1) {
    var EditOperationsCommand = (function () {
        function EditOperationsCommand(edits, initialSelection) {
            this._edits = edits;
            this._initialSelection = initialSelection;
        }
        EditOperationsCommand.prototype.getEditOperations = function (model, builder) {
            this._edits
                .map(function (edit) { return EditOperationsCommand.trimEdit(edit, model); })
                .filter(function (edit) { return edit !== null; }) // produced above in case the edit.text is identical to the existing text
                .forEach(function (edit) { return builder.addEditOperation(range_1.Range.lift(edit.range), edit.text); });
            var selectionIsSet = false;
            if (Array.isArray(this._edits) && this._edits.length === 1 && this._initialSelection.isEmpty()) {
                if (this._edits[0].range.startColumn === this._initialSelection.endColumn &&
                    this._edits[0].range.startLineNumber === this._initialSelection.endLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, true);
                }
                else if (this._edits[0].range.endColumn === this._initialSelection.startColumn &&
                    this._edits[0].range.endLineNumber === this._initialSelection.startLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, false);
                }
            }
            if (!selectionIsSet) {
                this._selectionId = builder.trackSelection(this._initialSelection);
            }
        };
        EditOperationsCommand.prototype.computeCursorState = function (model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        };
        EditOperationsCommand.fixLineTerminators = function (edit, model) {
            edit.text = edit.text.replace(/\r\n|\r|\n/g, model.getEOL());
        };
        /**
         * This is used to minimize the edits by removing changes that appear on the edges of the range which are identical
         * to the current text.
         *
         * The reason this was introduced is to allow better selection tracking of the current cursor and solve
         * bug #15108. There the cursor was jumping since the tracked selection was in the middle of the range edit
         * and was lost.
         */
        EditOperationsCommand.trimEdit = function (edit, model) {
            this.fixLineTerminators(edit, model);
            return this._trimEdit(model.validateRange(edit.range), edit.text, edit.forceMoveMarkers, model);
        };
        EditOperationsCommand._trimEdit = function (editRange, editText, editForceMoveMarkers, model) {
            var currentText = model.getValueInRange(editRange);
            // Find the equal characters in the front
            var commonPrefixLength = Strings.commonPrefixLength(editText, currentText);
            // If the two strings are identical, return no edit (no-op)
            if (commonPrefixLength === currentText.length && commonPrefixLength === editText.length) {
                return null;
            }
            if (commonPrefixLength > 0) {
                // Apply front trimming
                var newStartPosition = model.modifyPosition(editRange.getStartPosition(), commonPrefixLength);
                editRange = new range_1.Range(newStartPosition.lineNumber, newStartPosition.column, editRange.endLineNumber, editRange.endColumn);
                editText = editText.substring(commonPrefixLength);
                currentText = currentText.substr(commonPrefixLength);
            }
            // Find the equal characters in the rear
            var commonSuffixLength = Strings.commonSuffixLength(editText, currentText);
            if (commonSuffixLength > 0) {
                // Apply rear trimming
                var newEndPosition = model.modifyPosition(editRange.getEndPosition(), -commonSuffixLength);
                editRange = new range_1.Range(editRange.startLineNumber, editRange.startColumn, newEndPosition.lineNumber, newEndPosition.column);
                editText = editText.substring(0, editText.length - commonSuffixLength);
                currentText = currentText.substring(0, currentText.length - commonSuffixLength);
            }
            return {
                text: editText,
                range: editRange,
                forceMoveMarkers: editForceMoveMarkers
            };
        };
        return EditOperationsCommand;
    })();
    exports.EditOperationsCommand = EditOperationsCommand;
});
//# sourceMappingURL=formatCommand.js.map