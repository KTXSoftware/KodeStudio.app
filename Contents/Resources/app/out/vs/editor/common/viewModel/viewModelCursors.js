/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/core/range', 'vs/editor/common/core/selection', 'vs/editor/common/editorCommon'], function (require, exports, range_1, selection_1, EditorCommon) {
    var ViewModelCursors = (function () {
        function ViewModelCursors(configuration, converter) {
            this.configuration = configuration;
            this.converter = converter;
            this.lastCursorPositionChangedEvent = null;
            this.lastCursorSelectionChangedEvent = null;
        }
        ViewModelCursors.prototype.getSelections = function () {
            if (this.lastCursorSelectionChangedEvent) {
                var selections = [];
                selections.push(this.converter.convertModelSelectionToViewSelection(this.lastCursorSelectionChangedEvent.selection));
                for (var i = 0, len = this.lastCursorSelectionChangedEvent.secondarySelections.length; i < len; i++) {
                    selections.push(this.converter.convertModelSelectionToViewSelection(this.lastCursorSelectionChangedEvent.secondarySelections[i]));
                }
                return selections;
            }
            else {
                return [new selection_1.Selection(1, 1, 1, 1)];
            }
        };
        ViewModelCursors.prototype.onCursorPositionChanged = function (e, emit) {
            this.lastCursorPositionChangedEvent = e;
            var position = this.converter.validateViewPosition(e.viewPosition.lineNumber, e.viewPosition.column, e.position), stopRenderingLineAfter = this.configuration.editor.stopRenderingLineAfter;
            // Limit position to be somewhere where it can actually be rendered
            if (stopRenderingLineAfter !== -1 && position.column > stopRenderingLineAfter) {
                position = position.clone();
                position.column = stopRenderingLineAfter;
            }
            var secondaryPositions = [];
            for (var i = 0, len = e.secondaryPositions.length; i < len; i++) {
                secondaryPositions[i] = this.converter.validateViewPosition(e.secondaryViewPositions[i].lineNumber, e.secondaryViewPositions[i].column, e.secondaryPositions[i]);
                // Limit position to be somewhere where it can actually be rendered
                if (stopRenderingLineAfter !== -1 && secondaryPositions[i].column > stopRenderingLineAfter) {
                    secondaryPositions[i] = secondaryPositions[i].clone();
                    secondaryPositions[i].column = stopRenderingLineAfter;
                }
            }
            var newEvent = {
                position: position,
                secondaryPositions: secondaryPositions,
                isInEditableRange: e.isInEditableRange
            };
            emit(EditorCommon.ViewEventNames.CursorPositionChangedEvent, newEvent);
        };
        ViewModelCursors.prototype.onCursorSelectionChanged = function (e, emit) {
            this.lastCursorSelectionChangedEvent = e;
            var selection = this.converter.validateViewSelection(e.viewSelection, e.selection);
            var secondarySelections = [];
            for (var i = 0, len = e.secondarySelections.length; i < len; i++) {
                secondarySelections[i] = this.converter.validateViewSelection(e.secondaryViewSelections[i], e.secondarySelections[i]);
            }
            var newEvent = {
                selection: selection,
                secondarySelections: secondarySelections
            };
            emit(EditorCommon.ViewEventNames.CursorSelectionChangedEvent, newEvent);
        };
        ViewModelCursors.prototype.onCursorRevealRange = function (e, emit) {
            var viewRange = null;
            if (e.viewRange) {
                var viewStartRange = this.converter.validateViewPosition(e.viewRange.startLineNumber, e.viewRange.startColumn, e.range.getStartPosition());
                var viewEndRange = this.converter.validateViewPosition(e.viewRange.endLineNumber, e.viewRange.endColumn, e.range.getEndPosition());
                viewRange = new range_1.Range(viewStartRange.lineNumber, viewStartRange.column, viewEndRange.lineNumber, viewEndRange.column);
            }
            else {
                viewRange = this.converter.convertModelRangeToViewRange(e.range);
            }
            var newEvent = {
                range: viewRange,
                verticalType: e.verticalType,
                revealHorizontal: e.revealHorizontal
            };
            emit(EditorCommon.ViewEventNames.RevealRangeEvent, newEvent);
        };
        ViewModelCursors.prototype.onCursorScrollRequest = function (e, emit) {
            var newEvent = {
                deltaLines: e.deltaLines
            };
            emit(EditorCommon.ViewEventNames.ScrollRequestEvent, newEvent);
        };
        ViewModelCursors.prototype.onLineMappingChanged = function (emit) {
            if (this.lastCursorPositionChangedEvent) {
                this.onCursorPositionChanged(this.lastCursorPositionChangedEvent, emit);
            }
            if (this.lastCursorSelectionChangedEvent) {
                this.onCursorSelectionChanged(this.lastCursorSelectionChangedEvent, emit);
            }
        };
        return ViewModelCursors;
    })();
    exports.ViewModelCursors = ViewModelCursors;
});
//# sourceMappingURL=viewModelCursors.js.map