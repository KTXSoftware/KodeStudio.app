/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/core/selection', 'vs/editor/common/controller/oneCursor', 'vs/base/common/errors'], function (require, exports, selection_1, oneCursor_1, Errors) {
    var CursorCollection = (function () {
        function CursorCollection(editorId, model, configuration, viewModelHelper) {
            this.editorId = editorId;
            this.model = model;
            this.configuration = configuration;
            this.viewModelHelper = viewModelHelper;
            this.modeConfiguration = this.getModeConfiguration();
            this.primaryCursor = new oneCursor_1.OneCursor(this.editorId, this.model, this.configuration, this.modeConfiguration, this.viewModelHelper);
            this.secondaryCursors = [];
            this.lastAddedCursorIndex = 0;
        }
        CursorCollection.prototype.dispose = function () {
            this.primaryCursor.dispose();
            this.killSecondaryCursors();
        };
        CursorCollection.prototype.saveState = function () {
            return {
                primary: this.primaryCursor.saveState(),
                secondary: this.secondaryCursors.map(function (c) { return c.saveState(); })
            };
        };
        CursorCollection.prototype.restoreState = function (state) {
            this.primaryCursor.restoreState(state.primary);
            this.killSecondaryCursors();
            for (var i = 0; i < state.secondary.length; i++) {
                this.addSecondaryCursor(null);
                this.secondaryCursors[i].restoreState(state.secondary[i]);
            }
        };
        CursorCollection.prototype.updateMode = function () {
            var _this = this;
            this.modeConfiguration = this.getModeConfiguration();
            this.getAll().forEach(function (cursor) {
                cursor.updateModeConfiguration(_this.modeConfiguration);
            });
        };
        CursorCollection.prototype.getAll = function () {
            var result = [];
            result.push(this.primaryCursor);
            result = result.concat(this.secondaryCursors);
            return result;
        };
        CursorCollection.prototype.getPosition = function (index) {
            if (index === 0) {
                return this.primaryCursor.getPosition();
            }
            else {
                return this.secondaryCursors[index - 1].getPosition();
            }
        };
        CursorCollection.prototype.getViewPosition = function (index) {
            if (index === 0) {
                return this.primaryCursor.getViewPosition();
            }
            else {
                return this.secondaryCursors[index - 1].getViewPosition();
            }
        };
        CursorCollection.prototype.getPositions = function () {
            var result = [];
            result.push(this.primaryCursor.getPosition());
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                result.push(this.secondaryCursors[i].getPosition());
            }
            return result;
        };
        CursorCollection.prototype.getViewPositions = function () {
            var result = [];
            result.push(this.primaryCursor.getViewPosition());
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                result.push(this.secondaryCursors[i].getViewPosition());
            }
            return result;
        };
        CursorCollection.prototype.getSelection = function (index) {
            if (index === 0) {
                return this.primaryCursor.getSelection();
            }
            else {
                return this.secondaryCursors[index - 1].getSelection();
            }
        };
        CursorCollection.prototype.getSelections = function () {
            var result = [];
            result.push(this.primaryCursor.getSelection());
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                result.push(this.secondaryCursors[i].getSelection());
            }
            return result;
        };
        CursorCollection.prototype.getViewSelections = function () {
            var result = [];
            result.push(this.primaryCursor.getViewSelection());
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                result.push(this.secondaryCursors[i].getViewSelection());
            }
            return result;
        };
        CursorCollection.prototype.setSelections = function (selections) {
            this.primaryCursor.setSelection(selections[0]);
            this._setSecondarySelections(selections.slice(1));
        };
        CursorCollection.prototype.killSecondaryCursors = function () {
            return (this._setSecondarySelections([]) > 0);
        };
        CursorCollection.prototype.normalize = function () {
            this._mergeCursorsIfNecessary();
            this.primaryCursor.adjustBracketDecorations();
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                this.secondaryCursors[i].adjustBracketDecorations();
            }
        };
        CursorCollection.prototype.addSecondaryCursor = function (selection) {
            var newCursor = new oneCursor_1.OneCursor(this.editorId, this.model, this.configuration, this.modeConfiguration, this.viewModelHelper);
            if (selection) {
                newCursor.setSelection(selection);
            }
            this.secondaryCursors.push(newCursor);
            this.lastAddedCursorIndex = this.secondaryCursors.length;
        };
        CursorCollection.prototype.duplicateCursors = function () {
            var newCursors = [];
            newCursors.push(this.primaryCursor.duplicate());
            for (var i = 0, len = this.secondaryCursors.length; i < len; i++) {
                newCursors.push(this.secondaryCursors[i].duplicate());
            }
            this.secondaryCursors = this.secondaryCursors.concat(newCursors);
            this.lastAddedCursorIndex = this.secondaryCursors.length;
        };
        CursorCollection.prototype.getLastAddedCursor = function () {
            if (this.secondaryCursors.length === 0 || this.lastAddedCursorIndex === 0) {
                return this.primaryCursor;
            }
            return this.secondaryCursors[this.lastAddedCursorIndex - 1];
        };
        /**
         * Creates or disposes secondary cursors as necessary to match the number of `secondarySelections`.
         * Return value:
         * 		- a positive number indicates the number of secondary cursors added
         * 		- a negative number indicates the number of secondary cursors removed
         * 		- 0 indicates that no changes have been done to the secondary cursors list
         */
        CursorCollection.prototype._setSecondarySelections = function (secondarySelections) {
            var secondaryCursorsLength = this.secondaryCursors.length;
            var secondarySelectionsLength = secondarySelections.length;
            var returnValue = secondarySelectionsLength - secondaryCursorsLength;
            if (secondaryCursorsLength < secondarySelectionsLength) {
                var createCnt = secondarySelectionsLength - secondaryCursorsLength;
                for (var i = 0; i < createCnt; i++) {
                    this.addSecondaryCursor(null);
                }
            }
            else if (secondaryCursorsLength > secondarySelectionsLength) {
                var removeCnt = secondaryCursorsLength - secondarySelectionsLength;
                for (var i = 0; i < removeCnt; i++) {
                    this._removeSecondaryCursor(this.secondaryCursors.length - 1);
                }
            }
            for (var i = 0; i < secondarySelectionsLength; i++) {
                if (secondarySelections[i]) {
                    this.secondaryCursors[i].setSelection(secondarySelections[i]);
                }
            }
            return returnValue;
        };
        CursorCollection.prototype._removeSecondaryCursor = function (removeIndex) {
            if (this.lastAddedCursorIndex >= removeIndex + 1) {
                this.lastAddedCursorIndex--;
            }
            this.secondaryCursors[removeIndex].dispose();
            this.secondaryCursors.splice(removeIndex, 1);
        };
        CursorCollection.prototype._mergeCursorsIfNecessary = function () {
            if (this.secondaryCursors.length === 0) {
                return;
            }
            var cursors = this.getAll();
            var sortedCursors = [];
            for (var i = 0; i < cursors.length; i++) {
                sortedCursors.push({
                    index: i,
                    selection: cursors[i].getSelection()
                });
            }
            sortedCursors.sort(function (a, b) {
                if (a.selection.startLineNumber === b.selection.startLineNumber) {
                    return a.selection.startColumn - b.selection.startColumn;
                }
                return a.selection.startLineNumber - b.selection.startLineNumber;
            });
            for (var sortedCursorIndex = 0; sortedCursorIndex < sortedCursors.length - 1; sortedCursorIndex++) {
                var current = sortedCursors[sortedCursorIndex];
                var next = sortedCursors[sortedCursorIndex + 1];
                var currentSelection = current.selection;
                var nextSelection = next.selection;
                if (nextSelection.getStartPosition().isBeforeOrEqual(currentSelection.getEndPosition())) {
                    var winnerSortedCursorIndex = current.index < next.index ? sortedCursorIndex : sortedCursorIndex + 1;
                    var looserSortedCursorIndex = current.index < next.index ? sortedCursorIndex + 1 : sortedCursorIndex;
                    var looserIndex = sortedCursors[looserSortedCursorIndex].index;
                    var winnerIndex = sortedCursors[winnerSortedCursorIndex].index;
                    var looserSelection = sortedCursors[looserSortedCursorIndex].selection;
                    var winnerSelection = sortedCursors[winnerSortedCursorIndex].selection;
                    if (!looserSelection.equalsSelection(winnerSelection)) {
                        var resultingRange = looserSelection.plusRange(winnerSelection);
                        var looserSelectionIsLTR = (looserSelection.selectionStartLineNumber === looserSelection.startLineNumber && looserSelection.selectionStartColumn === looserSelection.startColumn);
                        var winnerSelectionIsLTR = (winnerSelection.selectionStartLineNumber === winnerSelection.startLineNumber && winnerSelection.selectionStartColumn === winnerSelection.startColumn);
                        // Give more importance to the last added cursor (think Ctrl-dragging + hitting another cursor)
                        var resultingSelectionIsLTR;
                        if (looserIndex === this.lastAddedCursorIndex) {
                            resultingSelectionIsLTR = looserSelectionIsLTR;
                            this.lastAddedCursorIndex = winnerIndex;
                        }
                        else {
                            // Winner takes it all
                            resultingSelectionIsLTR = winnerSelectionIsLTR;
                        }
                        var resultingSelection;
                        if (resultingSelectionIsLTR) {
                            resultingSelection = new selection_1.Selection(resultingRange.startLineNumber, resultingRange.startColumn, resultingRange.endLineNumber, resultingRange.endColumn);
                        }
                        else {
                            resultingSelection = new selection_1.Selection(resultingRange.endLineNumber, resultingRange.endColumn, resultingRange.startLineNumber, resultingRange.startColumn);
                        }
                        sortedCursors[winnerSortedCursorIndex].selection = resultingSelection;
                        cursors[winnerIndex].setSelection(resultingSelection);
                    }
                    for (var j = 0; j < sortedCursors.length; j++) {
                        if (sortedCursors[j].index > looserIndex) {
                            sortedCursors[j].index--;
                        }
                    }
                    cursors.splice(looserIndex, 1);
                    sortedCursors.splice(looserSortedCursorIndex, 1);
                    this._removeSecondaryCursor(looserIndex - 1);
                    sortedCursorIndex--;
                }
            }
        };
        CursorCollection.prototype.getModeConfiguration = function () {
            var i;
            var result = {
                electricChars: {},
                autoClosingPairsOpen: {},
                autoClosingPairsClose: {},
                surroundingPairs: {}
            };
            var electricChars;
            if (this.model.getMode().electricCharacterSupport) {
                try {
                    electricChars = this.model.getMode().electricCharacterSupport.getElectricCharacters();
                }
                catch (e) {
                    Errors.onUnexpectedError(e);
                    electricChars = null;
                }
            }
            if (electricChars) {
                for (i = 0; i < electricChars.length; i++) {
                    result.electricChars[electricChars[i]] = true;
                }
            }
            var autoClosingPairs;
            if (this.model.getMode().characterPairSupport) {
                try {
                    autoClosingPairs = this.model.getMode().characterPairSupport.getAutoClosingPairs();
                }
                catch (e) {
                    Errors.onUnexpectedError(e);
                    autoClosingPairs = null;
                }
            }
            if (autoClosingPairs) {
                for (i = 0; i < autoClosingPairs.length; i++) {
                    result.autoClosingPairsOpen[autoClosingPairs[i].open] = autoClosingPairs[i].close;
                    result.autoClosingPairsClose[autoClosingPairs[i].close] = autoClosingPairs[i].open;
                }
            }
            var surroundingPairs;
            if (this.model.getMode().characterPairSupport) {
                try {
                    surroundingPairs = this.model.getMode().characterPairSupport.getSurroundingPairs();
                }
                catch (e) {
                    Errors.onUnexpectedError(e);
                    surroundingPairs = null;
                }
            }
            if (surroundingPairs) {
                for (i = 0; i < surroundingPairs.length; i++) {
                    result.surroundingPairs[surroundingPairs[i].open] = surroundingPairs[i].close;
                }
            }
            return result;
        };
        return CursorCollection;
    })();
    exports.CursorCollection = CursorCollection;
});
//# sourceMappingURL=cursorCollection.js.map