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
define(["require", "exports", 'vs/editor/common/core/range', 'vs/editor/common/model/textModelWithMarkers', 'vs/editor/common/model/textModelWithTokens', 'vs/editor/common/editorCommon', 'vs/editor/common/core/idGenerator'], function (require, exports, range_1, textModelWithMarkers_1, textModelWithTokens_1, EditorCommon, idGenerator_1) {
    var TrackedRangeModelRetokenizer = (function (_super) {
        __extends(TrackedRangeModelRetokenizer, _super);
        function TrackedRangeModelRetokenizer(retokenizePromise, lineNumber, model) {
            _super.call(this, retokenizePromise, model);
            this.trackedRangeId = model.addTrackedRange({
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: model.getLineMaxColumn(lineNumber)
            }, EditorCommon.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges);
        }
        TrackedRangeModelRetokenizer.prototype.getRange = function () {
            return this._model.getTrackedRange(this.trackedRangeId);
        };
        TrackedRangeModelRetokenizer.prototype.dispose = function () {
            var model = this._model;
            // if this .dispose() is being called as part of the model.dispose(), then the tracked ranges might no longer be available (e.g. throw exceptions)
            if (model.isValidTrackedRange(this.trackedRangeId)) {
                model.removeTrackedRange(this.trackedRangeId);
            }
            _super.prototype.dispose.call(this);
        };
        return TrackedRangeModelRetokenizer;
    })(textModelWithTokens_1.FullModelRetokenizer);
    var TrackedRange = (function () {
        function TrackedRange(id, startMarkedId, endMarkerId) {
            this.id = id;
            this.startMarkerId = startMarkedId;
            this.endMarkerId = endMarkerId;
        }
        return TrackedRange;
    })();
    var _INSTANCE_COUNT = 0;
    var TextModelWithTrackedRanges = (function (_super) {
        __extends(TextModelWithTrackedRanges, _super);
        function TextModelWithTrackedRanges(allowedEventTypes, rawText, modeOrPromise) {
            _super.call(this, allowedEventTypes, rawText, modeOrPromise);
            this._rangeIdGenerator = new idGenerator_1.IdGenerator((++_INSTANCE_COUNT) + ';');
            this._ranges = {};
            this._markerIdToRangeId = {};
            this._multiLineTrackedRanges = {};
        }
        TextModelWithTrackedRanges.prototype._createRetokenizer = function (retokenizePromise, lineNumber) {
            return new TrackedRangeModelRetokenizer(retokenizePromise, lineNumber, this);
        };
        TextModelWithTrackedRanges.prototype.dispose = function () {
            this._ranges = null;
            this._markerIdToRangeId = null;
            this._multiLineTrackedRanges = null;
            _super.prototype.dispose.call(this);
        };
        TextModelWithTrackedRanges.prototype._resetValue = function (e, newValue) {
            _super.prototype._resetValue.call(this, e, newValue);
            // Destroy all my tracked ranges
            this._ranges = {};
            this._markerIdToRangeId = {};
            this._multiLineTrackedRanges = {};
        };
        TextModelWithTrackedRanges.prototype._setRangeIsMultiLine = function (rangeId, rangeIsMultiLine) {
            var rangeWasMultiLine = this._multiLineTrackedRanges.hasOwnProperty(rangeId);
            if (!rangeWasMultiLine && rangeIsMultiLine) {
                this._multiLineTrackedRanges[rangeId] = true;
            }
            else if (rangeWasMultiLine && !rangeIsMultiLine) {
                delete this._multiLineTrackedRanges[rangeId];
            }
        };
        TextModelWithTrackedRanges.prototype._shouldStartMarkerSticksToPreviousCharacter = function (stickiness) {
            if (stickiness === EditorCommon.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges || stickiness === EditorCommon.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore) {
                return true;
            }
            return false;
        };
        TextModelWithTrackedRanges.prototype._shouldEndMarkerSticksToPreviousCharacter = function (stickiness) {
            if (stickiness === EditorCommon.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges || stickiness === EditorCommon.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore) {
                return true;
            }
            return false;
        };
        TextModelWithTrackedRanges.prototype._getTrackedRangesCount = function () {
            return Object.keys(this._ranges).length;
        };
        TextModelWithTrackedRanges.prototype.addTrackedRange = function (textRange, stickiness) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.addTrackedRange: Model is disposed');
            }
            textRange = this.validateRange(textRange);
            var startMarkerSticksToPreviousCharacter = this._shouldStartMarkerSticksToPreviousCharacter(stickiness);
            var endMarkerSticksToPreviousCharacter = this._shouldEndMarkerSticksToPreviousCharacter(stickiness);
            var startMarkerId = this._addMarker(textRange.startLineNumber, textRange.startColumn, startMarkerSticksToPreviousCharacter);
            var endMarkerId = this._addMarker(textRange.endLineNumber, textRange.endColumn, endMarkerSticksToPreviousCharacter);
            var range = new TrackedRange(this._rangeIdGenerator.generate(), startMarkerId, endMarkerId);
            this._ranges[range.id] = range;
            this._markerIdToRangeId[startMarkerId] = range.id;
            this._markerIdToRangeId[endMarkerId] = range.id;
            this._setRangeIsMultiLine(range.id, (textRange.startLineNumber !== textRange.endLineNumber));
            return range.id;
        };
        TextModelWithTrackedRanges.prototype._addTrackedRanges = function (textRanges, stickinessArr) {
            var addMarkers = [];
            for (var i = 0, len = textRanges.length; i < len; i++) {
                var textRange = textRanges[i];
                var stickiness = stickinessArr[i];
                addMarkers.push({
                    lineNumber: textRange.startLineNumber,
                    column: textRange.startColumn,
                    stickToPreviousCharacter: this._shouldStartMarkerSticksToPreviousCharacter(stickiness)
                });
                addMarkers.push({
                    lineNumber: textRange.endLineNumber,
                    column: textRange.endColumn,
                    stickToPreviousCharacter: this._shouldEndMarkerSticksToPreviousCharacter(stickiness)
                });
            }
            var markerIds = this._addMarkers(addMarkers);
            var result = [];
            for (var i = 0, len = textRanges.length; i < len; i++) {
                var textRange = textRanges[i];
                var startMarkerId = markerIds[2 * i];
                var endMarkerId = markerIds[2 * i + 1];
                var range = new TrackedRange(this._rangeIdGenerator.generate(), startMarkerId, endMarkerId);
                this._ranges[range.id] = range;
                this._markerIdToRangeId[startMarkerId] = range.id;
                this._markerIdToRangeId[endMarkerId] = range.id;
                this._setRangeIsMultiLine(range.id, (textRange.startLineNumber !== textRange.endLineNumber));
                result.push(range.id);
            }
            return result;
        };
        TextModelWithTrackedRanges.prototype.changeTrackedRange = function (rangeId, newTextRange) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.changeTrackedRange: Model is disposed');
            }
            if (this._ranges.hasOwnProperty(rangeId)) {
                newTextRange = this.validateRange(newTextRange);
                var range = this._ranges[rangeId];
                this._changeMarker(range.startMarkerId, newTextRange.startLineNumber, newTextRange.startColumn);
                this._changeMarker(range.endMarkerId, newTextRange.endLineNumber, newTextRange.endColumn);
                this._setRangeIsMultiLine(range.id, (newTextRange.startLineNumber !== newTextRange.endLineNumber));
            }
        };
        TextModelWithTrackedRanges.prototype.changeTrackedRangeStickiness = function (rangeId, newStickiness) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.changeTrackedRangeStickiness: Model is disposed');
            }
            if (this._ranges.hasOwnProperty(rangeId)) {
                var range = this._ranges[rangeId];
                this._changeMarkerStickiness(range.startMarkerId, this._shouldStartMarkerSticksToPreviousCharacter(newStickiness));
                this._changeMarkerStickiness(range.endMarkerId, this._shouldEndMarkerSticksToPreviousCharacter(newStickiness));
            }
        };
        TextModelWithTrackedRanges.prototype.isValidTrackedRange = function (rangeId) {
            if (this._isDisposed || !this._ranges) {
                return false;
            }
            return this._ranges.hasOwnProperty(rangeId);
        };
        TextModelWithTrackedRanges.prototype.removeTrackedRange = function (rangeId) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.removeTrackedRange: Model is disposed');
            }
            if (this._ranges.hasOwnProperty(rangeId)) {
                var range = this._ranges[rangeId];
                this._removeMarker(range.startMarkerId);
                this._removeMarker(range.endMarkerId);
                this._setRangeIsMultiLine(range.id, false);
                delete this._ranges[range.id];
                delete this._markerIdToRangeId[range.startMarkerId];
                delete this._markerIdToRangeId[range.endMarkerId];
            }
        };
        TextModelWithTrackedRanges.prototype.removeTrackedRanges = function (ids) {
            var removeMarkers = [];
            for (var i = 0, len = ids.length; i < len; i++) {
                var rangeId = ids[i];
                if (!this._ranges.hasOwnProperty(rangeId)) {
                    continue;
                }
                var range = this._ranges[rangeId];
                removeMarkers.push(range.startMarkerId);
                removeMarkers.push(range.endMarkerId);
                this._setRangeIsMultiLine(range.id, false);
                delete this._ranges[range.id];
                delete this._markerIdToRangeId[range.startMarkerId];
                delete this._markerIdToRangeId[range.endMarkerId];
            }
            if (removeMarkers.length > 0) {
                this._removeMarkers(removeMarkers);
            }
        };
        TextModelWithTrackedRanges.prototype._newEditorRange = function (startPosition, endPosition) {
            if (endPosition.isBefore(startPosition)) {
                // This tracked range has turned in on itself (end marker before start marker)
                // This can happen in extreme editing conditions where lots of text is removed and lots is added
                // Treat it as a collapsed range
                return new range_1.Range(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column);
            }
            return new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
        };
        TextModelWithTrackedRanges.prototype.getTrackedRange = function (rangeId) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.getTrackedRange: Model is disposed');
            }
            var range = this._ranges[rangeId];
            var startMarker = this._getMarker(range.startMarkerId);
            var endMarker = this._getMarker(range.endMarkerId);
            return this._newEditorRange(startMarker, endMarker);
        };
        /**
         * Fetch only multi-line ranges that intersect with the given line number range
         */
        TextModelWithTrackedRanges.prototype._getMultiLineTrackedRanges = function (filterStartLineNumber, filterEndLineNumber) {
            var result = [], rangeId, range, startMarker, endMarker;
            for (rangeId in this._multiLineTrackedRanges) {
                if (this._multiLineTrackedRanges.hasOwnProperty(rangeId)) {
                    range = this._ranges[rangeId];
                    startMarker = this._getMarker(range.startMarkerId);
                    if (startMarker.lineNumber > filterEndLineNumber) {
                        continue;
                    }
                    endMarker = this._getMarker(range.endMarkerId);
                    if (endMarker.lineNumber < filterStartLineNumber) {
                        continue;
                    }
                    result.push({
                        id: range.id,
                        range: this._newEditorRange(startMarker, endMarker)
                    });
                }
            }
            return result;
        };
        TextModelWithTrackedRanges.prototype.getLinesTrackedRanges = function (startLineNumber, endLineNumber) {
            if (this._isDisposed) {
                throw new Error('TextModelWithTrackedRanges.getLinesTrackedRanges: Model is disposed');
            }
            var result = this._getMultiLineTrackedRanges(startLineNumber, endLineNumber), resultMap = {}, lineMarkers, lineMarker, rangeId, i, len, lineNumber, startMarker, endMarker;
            for (i = 0, len = result.length; i < len; i++) {
                resultMap[result[i].id] = true;
            }
            for (lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                lineMarkers = this._getLineMarkers(lineNumber);
                for (i = 0, len = lineMarkers.length; i < len; i++) {
                    lineMarker = lineMarkers[i];
                    if (this._markerIdToRangeId.hasOwnProperty(lineMarker.id)) {
                        rangeId = this._markerIdToRangeId[lineMarker.id];
                        if (!resultMap.hasOwnProperty(rangeId)) {
                            startMarker = this._getMarker(this._ranges[rangeId].startMarkerId);
                            endMarker = this._getMarker(this._ranges[rangeId].endMarkerId);
                            result.push({
                                id: rangeId,
                                range: this._newEditorRange(startMarker, endMarker)
                            });
                            resultMap[rangeId] = true;
                        }
                    }
                }
            }
            return result;
        };
        TextModelWithTrackedRanges.prototype._onChangedMarkers = function (changedMarkers) {
            var changedRanges = {}, changedRange, range, rangeId, marker, i, len;
            for (i = 0, len = changedMarkers.length; i < len; i++) {
                marker = changedMarkers[i];
                if (this._markerIdToRangeId.hasOwnProperty(marker.id)) {
                    rangeId = this._markerIdToRangeId[marker.id];
                    range = this._ranges[rangeId];
                    if (changedRanges.hasOwnProperty(range.id)) {
                        changedRange = changedRanges[range.id];
                    }
                    else {
                        changedRange = {
                            startLineNumber: 0,
                            startColumn: 0,
                            endLineNumber: 0,
                            endColumn: 0
                        };
                        changedRanges[range.id] = changedRange;
                    }
                    if (marker.id === range.startMarkerId) {
                        changedRange.startLineNumber = marker.oldLineNumber;
                        changedRange.startColumn = marker.oldColumn;
                    }
                    else {
                        changedRange.endLineNumber = marker.oldLineNumber;
                        changedRange.endColumn = marker.oldColumn;
                    }
                    this._setRangeIsMultiLine(range.id, (this._getMarker(range.startMarkerId).lineNumber !== this._getMarker(range.endMarkerId).lineNumber));
                }
            }
            return changedRanges;
        };
        return TextModelWithTrackedRanges;
    })(textModelWithMarkers_1.TextModelWithMarkers);
    exports.TextModelWithTrackedRanges = TextModelWithTrackedRanges;
});
//# sourceMappingURL=textModelWithTrackedRanges.js.map