/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/core/selection'], function (require, exports, selection_1) {
    var InPlaceReplaceCommand = (function () {
        function InPlaceReplaceCommand(editRange, originalSelection, text) {
            this._editRange = editRange;
            this._originalSelection = originalSelection;
            this._text = text;
        }
        InPlaceReplaceCommand.prototype.getEditOperations = function (model, builder) {
            builder.addEditOperation(this._editRange, this._text);
        };
        InPlaceReplaceCommand.prototype.computeCursorState = function (model, helper) {
            var inverseEditOperations = helper.getInverseEditOperations();
            var srcRange = inverseEditOperations[0].range;
            if (!this._originalSelection.isEmpty()) {
                // Preserve selection and extends to typed text
                return selection_1.Selection.createSelection(srcRange.endLineNumber, srcRange.endColumn - this._text.length, srcRange.endLineNumber, srcRange.endColumn);
            }
            return selection_1.Selection.createSelection(srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn), srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn));
        };
        return InPlaceReplaceCommand;
    })();
    exports.InPlaceReplaceCommand = InPlaceReplaceCommand;
});
//# sourceMappingURL=inPlaceReplaceCommand.js.map