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
define(["require", "exports", 'vs/editor/common/core/position', 'vs/editor/common/model/textModelWithTokens', 'vs/editor/common/core/idGenerator'], function (require, exports, position_1, textModelWithTokens_1, idGenerator_1) {
    var LineMarker = (function () {
        function LineMarker(id, column, stickToPreviousCharacter) {
            this.id = id;
            this.column = column;
            this.stickToPreviousCharacter = stickToPreviousCharacter;
            this.oldLineNumber = 0;
            this.oldColumn = 0;
            this.line = null;
        }
        LineMarker.prototype.toString = function () {
            return '{\'' + this.id + '\';' + this.column + ',' + this.stickToPreviousCharacter + ',[' + this.oldLineNumber + ',' + this.oldColumn + ']}';
        };
        return LineMarker;
    })();
    exports.LineMarker = LineMarker;
    var _INSTANCE_COUNT = 0;
    var TextModelWithMarkers = (function (_super) {
        __extends(TextModelWithMarkers, _super);
        function TextModelWithMarkers(allowedEventTypes, rawText, modeOrPromise) {
            _super.call(this, allowedEventTypes, rawText, true, modeOrPromise);
            this._markerIdGenerator = new idGenerator_1.IdGenerator((++_INSTANCE_COUNT) + ';');
            this._markerIdToMarker = {};
        }
        TextModelWithMarkers.prototype.dispose = function () {
            this._markerIdToMarker = null;
            _super.prototype.dispose.call(this);
        };
        TextModelWithMarkers.prototype._resetValue = function (e, newValue) {
            _super.prototype._resetValue.call(this, e, newValue);
            // Destroy all my markers
            this._markerIdToMarker = {};
        };
        TextModelWithMarkers.prototype._addMarker = function (lineNumber, column, stickToPreviousCharacter) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._addMarker: Model is disposed');
            }
            var pos = this.validatePosition(new position_1.Position(lineNumber, column));
            var marker = new LineMarker(this._markerIdGenerator.generate(), pos.column, stickToPreviousCharacter);
            this._markerIdToMarker[marker.id] = marker;
            this._lines[pos.lineNumber - 1].addMarker(marker);
            return marker.id;
        };
        TextModelWithMarkers.prototype._addMarkers = function (newMarkers) {
            var addMarkersPerLine = Object.create(null);
            var result = [];
            for (var i = 0, len = newMarkers.length; i < len; i++) {
                var newMarker = newMarkers[i];
                var marker = new LineMarker(this._markerIdGenerator.generate(), newMarker.column, newMarker.stickToPreviousCharacter);
                this._markerIdToMarker[marker.id] = marker;
                if (!addMarkersPerLine[newMarker.lineNumber]) {
                    addMarkersPerLine[newMarker.lineNumber] = [];
                }
                addMarkersPerLine[newMarker.lineNumber].push(marker);
                result.push(marker.id);
            }
            var lineNumbers = Object.keys(addMarkersPerLine);
            for (var i = 0, len = lineNumbers.length; i < len; i++) {
                var lineNumber = parseInt(lineNumbers[i], 10);
                this._lines[lineNumber - 1].addMarkers(addMarkersPerLine[lineNumbers[i]]);
            }
            return result;
        };
        TextModelWithMarkers.prototype._changeMarker = function (id, lineNumber, column) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._changeMarker: Model is disposed');
            }
            if (this._markerIdToMarker.hasOwnProperty(id)) {
                var marker = this._markerIdToMarker[id];
                var newPos = this.validatePosition(new position_1.Position(lineNumber, column));
                if (newPos.lineNumber !== marker.line.lineNumber) {
                    // Move marker between lines
                    marker.line.removeMarker(marker);
                    this._lines[newPos.lineNumber - 1].addMarker(marker);
                }
                // Update marker column
                marker.column = newPos.column;
            }
        };
        TextModelWithMarkers.prototype._changeMarkerStickiness = function (id, newStickToPreviousCharacter) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._changeMarkerStickiness: Model is disposed');
            }
            if (this._markerIdToMarker.hasOwnProperty(id)) {
                var marker = this._markerIdToMarker[id];
                if (marker.stickToPreviousCharacter !== newStickToPreviousCharacter) {
                    marker.stickToPreviousCharacter = newStickToPreviousCharacter;
                }
            }
        };
        TextModelWithMarkers.prototype._getMarker = function (id) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._getMarker: Model is disposed');
            }
            if (this._markerIdToMarker.hasOwnProperty(id)) {
                var marker = this._markerIdToMarker[id];
                return new position_1.Position(marker.line.lineNumber, marker.column);
            }
            return null;
        };
        TextModelWithMarkers.prototype._getMarkersCount = function () {
            return Object.keys(this._markerIdToMarker).length;
        };
        TextModelWithMarkers.prototype._getLineMarkers = function (lineNumber) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._getLineMarkers: Model is disposed');
            }
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new Error('Illegal value ' + lineNumber + ' for `lineNumber`');
            }
            return this._lines[lineNumber - 1].getMarkers();
        };
        TextModelWithMarkers.prototype._removeMarker = function (id) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._removeMarker: Model is disposed');
            }
            if (this._markerIdToMarker.hasOwnProperty(id)) {
                var marker = this._markerIdToMarker[id];
                marker.line.removeMarker(marker);
                delete this._markerIdToMarker[id];
            }
        };
        TextModelWithMarkers.prototype._removeMarkers = function (ids) {
            var removeMarkersPerLine = Object.create(null);
            for (var i = 0, len = ids.length; i < len; i++) {
                var id = ids[i];
                if (!this._markerIdToMarker.hasOwnProperty(id)) {
                    continue;
                }
                var marker = this._markerIdToMarker[id];
                var lineNumber = marker.line.lineNumber;
                if (!removeMarkersPerLine[lineNumber]) {
                    removeMarkersPerLine[lineNumber] = Object.create(null);
                }
                removeMarkersPerLine[lineNumber][id] = true;
                delete this._markerIdToMarker[id];
            }
            var lineNumbers = Object.keys(removeMarkersPerLine);
            for (var i = 0, len = lineNumbers.length; i < len; i++) {
                var lineNumber = parseInt(lineNumbers[i], 10);
                this._lines[lineNumber - 1].removeMarkers(removeMarkersPerLine[lineNumbers[i]]);
            }
        };
        TextModelWithMarkers.prototype._getMarkersInMap = function (markersMap) {
            if (this._isDisposed) {
                throw new Error('TextModelWithMarkers._getMarkersInMap: Model is disposed');
            }
            var result = [], markerId;
            for (markerId in markersMap) {
                if (markersMap.hasOwnProperty(markerId) && this._markerIdToMarker.hasOwnProperty(markerId)) {
                    result.push(this._markerIdToMarker[markerId]);
                }
            }
            return result;
        };
        return TextModelWithMarkers;
    })(textModelWithTokens_1.TextModelWithTokens);
    exports.TextModelWithMarkers = TextModelWithMarkers;
});
//# sourceMappingURL=textModelWithMarkers.js.map