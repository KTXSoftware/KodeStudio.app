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
define(["require", "exports", 'vs/base/common/diff/diff', 'vs/base/common/strings'], function (require, exports, diff_1, Strings) {
    var MAXIMUM_RUN_TIME = 5000; // 5 seconds
    var MINIMUM_MATCHING_CHARACTER_LENGTH = 3;
    function computeDiff(originalSequence, modifiedSequence, continueProcessingPredicate) {
        var diffAlgo = new diff_1.LcsDiff(originalSequence, modifiedSequence, continueProcessingPredicate);
        return diffAlgo.ComputeDiff();
    }
    var MarkerSequence = (function () {
        function MarkerSequence(buffer, startMarkers, endMarkers) {
            this.buffer = buffer;
            this.startMarkers = startMarkers;
            this.endMarkers = endMarkers;
        }
        MarkerSequence.prototype.equals = function (other) {
            if (!(other instanceof MarkerSequence)) {
                return false;
            }
            var otherMarkerSequence = other;
            if (this.getLength() !== otherMarkerSequence.getLength()) {
                return false;
            }
            for (var i = 0, len = this.getLength(); i < len; i++) {
                var myElement = this.getElementHash(i);
                var otherElement = otherMarkerSequence.getElementHash(i);
                if (myElement !== otherElement) {
                    return false;
                }
            }
            return true;
        };
        MarkerSequence.prototype.getLength = function () {
            return this.startMarkers.length;
        };
        MarkerSequence.prototype.getElementHash = function (i) {
            return this.buffer.substring(this.startMarkers[i].offset, this.endMarkers[i].offset);
        };
        MarkerSequence.prototype.getStartLineNumber = function (i) {
            if (i === this.startMarkers.length) {
                // This is the special case where a change happened after the last marker
                return this.startMarkers[i - 1].lineNumber + 1;
            }
            return this.startMarkers[i].lineNumber;
        };
        MarkerSequence.prototype.getStartColumn = function (i) {
            return this.startMarkers[i].column;
        };
        MarkerSequence.prototype.getEndLineNumber = function (i) {
            return this.endMarkers[i].lineNumber;
        };
        MarkerSequence.prototype.getEndColumn = function (i) {
            return this.endMarkers[i].column;
        };
        return MarkerSequence;
    })();
    var LineMarkerSequence = (function (_super) {
        __extends(LineMarkerSequence, _super);
        function LineMarkerSequence(lines, shouldIgnoreTrimWhitespace) {
            var i, length, pos;
            var buffer = '';
            var startMarkers = [], endMarkers = [], startColumn, endColumn;
            for (pos = 0, i = 0, length = lines.length; i < length; i++) {
                buffer += lines[i];
                startColumn = 1;
                endColumn = lines[i].length + 1;
                if (shouldIgnoreTrimWhitespace) {
                    startColumn = this._getFirstNonBlankColumn(lines[i], 1);
                    endColumn = this._getLastNonBlankColumn(lines[i], 1);
                }
                startMarkers.push({
                    offset: pos + startColumn - 1,
                    lineNumber: i + 1,
                    column: startColumn
                });
                endMarkers.push({
                    offset: pos + endColumn - 1,
                    lineNumber: i + 1,
                    column: endColumn
                });
                pos += lines[i].length;
            }
            _super.call(this, buffer, startMarkers, endMarkers);
        }
        LineMarkerSequence.prototype._getFirstNonBlankColumn = function (txt, defaultValue) {
            var r = Strings.firstNonWhitespaceIndex(txt);
            if (r === -1) {
                return defaultValue;
            }
            return r + 1;
        };
        LineMarkerSequence.prototype._getLastNonBlankColumn = function (txt, defaultValue) {
            var r = Strings.lastNonWhitespaceIndex(txt);
            if (r === -1) {
                return defaultValue;
            }
            return r + 2;
        };
        LineMarkerSequence.prototype.getCharSequence = function (startIndex, endIndex) {
            var startMarkers = [], endMarkers = [], index, i, startMarker, endMarker;
            for (index = startIndex; index <= endIndex; index++) {
                startMarker = this.startMarkers[index];
                endMarker = this.endMarkers[index];
                for (i = startMarker.offset; i < endMarker.offset; i++) {
                    startMarkers.push({
                        offset: i,
                        lineNumber: startMarker.lineNumber,
                        column: startMarker.column + (i - startMarker.offset)
                    });
                    endMarkers.push({
                        offset: i + 1,
                        lineNumber: startMarker.lineNumber,
                        column: startMarker.column + (i - startMarker.offset) + 1
                    });
                }
            }
            return new MarkerSequence(this.buffer, startMarkers, endMarkers);
        };
        return LineMarkerSequence;
    })(MarkerSequence);
    var CharChange = (function () {
        function CharChange(diffChange, originalCharSequence, modifiedCharSequence) {
            if (diffChange.originalLength === 0) {
                this.originalStartLineNumber = 0;
                this.originalStartColumn = 0;
                this.originalEndLineNumber = 0;
                this.originalEndColumn = 0;
            }
            else {
                this.originalStartLineNumber = originalCharSequence.getStartLineNumber(diffChange.originalStart);
                this.originalStartColumn = originalCharSequence.getStartColumn(diffChange.originalStart);
                this.originalEndLineNumber = originalCharSequence.getEndLineNumber(diffChange.originalStart + diffChange.originalLength - 1);
                this.originalEndColumn = originalCharSequence.getEndColumn(diffChange.originalStart + diffChange.originalLength - 1);
            }
            if (diffChange.modifiedLength === 0) {
                this.modifiedStartLineNumber = 0;
                this.modifiedStartColumn = 0;
                this.modifiedEndLineNumber = 0;
                this.modifiedEndColumn = 0;
            }
            else {
                this.modifiedStartLineNumber = modifiedCharSequence.getStartLineNumber(diffChange.modifiedStart);
                this.modifiedStartColumn = modifiedCharSequence.getStartColumn(diffChange.modifiedStart);
                this.modifiedEndLineNumber = modifiedCharSequence.getEndLineNumber(diffChange.modifiedStart + diffChange.modifiedLength - 1);
                this.modifiedEndColumn = modifiedCharSequence.getEndColumn(diffChange.modifiedStart + diffChange.modifiedLength - 1);
            }
        }
        return CharChange;
    })();
    function postProcessCharChanges(rawChanges) {
        if (rawChanges.length <= 1) {
            return rawChanges;
        }
        var result = [rawChanges[0]];
        var i, len, originalMatchingLength, modifiedMatchingLength, matchingLength, prevChange = result[0], currChange;
        for (i = 1, len = rawChanges.length; i < len; i++) {
            currChange = rawChanges[i];
            originalMatchingLength = currChange.originalStart - (prevChange.originalStart + prevChange.originalLength);
            modifiedMatchingLength = currChange.modifiedStart - (prevChange.modifiedStart + prevChange.modifiedLength);
            // Both of the above should be equal, but the continueProcessingPredicate may prevent this from being true
            matchingLength = Math.min(originalMatchingLength, modifiedMatchingLength);
            if (matchingLength < MINIMUM_MATCHING_CHARACTER_LENGTH) {
                // Merge the current change into the previous one
                prevChange.originalLength = (currChange.originalStart + currChange.originalLength) - prevChange.originalStart;
                prevChange.modifiedLength = (currChange.modifiedStart + currChange.modifiedLength) - prevChange.modifiedStart;
            }
            else {
                // Add the current change
                result.push(currChange);
                prevChange = currChange;
            }
        }
        return result;
    }
    var LineChange = (function () {
        function LineChange(diffChange, originalLineSequence, modifiedLineSequence, continueProcessingPredicate, shouldPostProcessCharChanges) {
            if (diffChange.originalLength === 0) {
                this.originalStartLineNumber = originalLineSequence.getStartLineNumber(diffChange.originalStart) - 1;
                this.originalEndLineNumber = 0;
            }
            else {
                this.originalStartLineNumber = originalLineSequence.getStartLineNumber(diffChange.originalStart);
                this.originalEndLineNumber = originalLineSequence.getEndLineNumber(diffChange.originalStart + diffChange.originalLength - 1);
            }
            if (diffChange.modifiedLength === 0) {
                this.modifiedStartLineNumber = modifiedLineSequence.getStartLineNumber(diffChange.modifiedStart) - 1;
                this.modifiedEndLineNumber = 0;
            }
            else {
                this.modifiedStartLineNumber = modifiedLineSequence.getStartLineNumber(diffChange.modifiedStart);
                this.modifiedEndLineNumber = modifiedLineSequence.getEndLineNumber(diffChange.modifiedStart + diffChange.modifiedLength - 1);
            }
            if (diffChange.originalLength !== 0 && diffChange.modifiedLength !== 0 && continueProcessingPredicate()) {
                var originalCharSequence = originalLineSequence.getCharSequence(diffChange.originalStart, diffChange.originalStart + diffChange.originalLength - 1);
                var modifiedCharSequence = modifiedLineSequence.getCharSequence(diffChange.modifiedStart, diffChange.modifiedStart + diffChange.modifiedLength - 1);
                var rawChanges = computeDiff(originalCharSequence, modifiedCharSequence, continueProcessingPredicate);
                if (shouldPostProcessCharChanges) {
                    rawChanges = postProcessCharChanges(rawChanges);
                }
                this.charChanges = [];
                for (var i = 0, length = rawChanges.length; i < length; i++) {
                    this.charChanges.push(new CharChange(rawChanges[i], originalCharSequence, modifiedCharSequence));
                }
            }
        }
        return LineChange;
    })();
    var DiffComputer = (function () {
        function DiffComputer(originalLines, modifiedLines, opts) {
            this.shouldPostProcessCharChanges = opts.shouldPostProcessCharChanges;
            this.shouldIgnoreTrimWhitespace = opts.shouldIgnoreTrimWhitespace;
            this.maximumRunTimeMs = MAXIMUM_RUN_TIME;
            this.original = new LineMarkerSequence(originalLines, this.shouldIgnoreTrimWhitespace);
            this.modified = new LineMarkerSequence(modifiedLines, this.shouldIgnoreTrimWhitespace);
            if (opts.shouldConsiderTrimWhitespaceInEmptyCase && this.shouldIgnoreTrimWhitespace && this.original.equals(this.modified)) {
                // Diff would be empty with `shouldIgnoreTrimWhitespace`
                this.shouldIgnoreTrimWhitespace = false;
                this.original = new LineMarkerSequence(originalLines, this.shouldIgnoreTrimWhitespace);
                this.modified = new LineMarkerSequence(modifiedLines, this.shouldIgnoreTrimWhitespace);
            }
        }
        DiffComputer.prototype.computeDiff = function () {
            this.computationStartTime = (new Date()).getTime();
            var rawChanges = computeDiff(this.original, this.modified, this._continueProcessingPredicate.bind(this));
            var lineChanges = [];
            for (var i = 0, length = rawChanges.length; i < length; i++) {
                lineChanges.push(new LineChange(rawChanges[i], this.original, this.modified, this._continueProcessingPredicate.bind(this), this.shouldPostProcessCharChanges));
            }
            return lineChanges;
        };
        DiffComputer.prototype._continueProcessingPredicate = function () {
            if (this.maximumRunTimeMs === 0) {
                return true;
            }
            var now = (new Date()).getTime();
            return now - this.computationStartTime < this.maximumRunTimeMs;
        };
        return DiffComputer;
    })();
    exports.DiffComputer = DiffComputer;
});
//# sourceMappingURL=diffComputer.js.map