/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports"], function (require, exports) {
    /**
     * Represent whitespaces in between lines and provide fast CRUD management methods.
     * The whitespaces are sorted ascending by `afterLineNumber`.
     */
    var WhitespaceComputer = (function () {
        function WhitespaceComputer() {
            this.heights = [];
            this.ids = [];
            this.afterLineNumbers = [];
            this.ordinals = [];
            this.prefixSum = [];
            this.prefixSumValidIndex = -1;
            this.whitespaceId2Index = {};
            this.lastWhitespaceId = 0;
        }
        /**
         * Find the insertion index for a new value inside a sorted array of values.
         * If the value is already present in the sorted array, the insertion index will be after the already existing value.
         */
        WhitespaceComputer.findInsertionIndex = function (sortedArray, value, ordinals, valueOrdinal) {
            var low = 0, high = sortedArray.length, mid;
            while (low < high) {
                mid = Math.floor((low + high) / 2);
                if (value === sortedArray[mid]) {
                    if (valueOrdinal < ordinals[mid]) {
                        high = mid;
                    }
                    else {
                        low = mid + 1;
                    }
                }
                else if (value < sortedArray[mid]) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low;
        };
        /**
         * Insert a new whitespace of a certain height after a line number.
         * The whitespace has a "sticky" characteristic.
         * Irrespective of edits above or below `afterLineNumber`, the whitespace will follow the initial line.
         *
         * @param afterLineNumber The conceptual position of this whitespace. The whitespace will follow this line as best as possible even when deleting/inserting lines above/below.
         * @param heightInPx The height of the whitespace, in pixels.
         * @return An id that can be used later to mutate or delete the whitespace
         */
        WhitespaceComputer.prototype.insertWhitespace = function (afterLineNumber, ordinal, heightInPx) {
            var id = (++this.lastWhitespaceId);
            var insertionIndex = WhitespaceComputer.findInsertionIndex(this.afterLineNumbers, afterLineNumber, this.ordinals, ordinal);
            this.insertWhitespaceAtIndex(id, insertionIndex, afterLineNumber, ordinal, heightInPx);
            return id;
        };
        WhitespaceComputer.prototype.insertWhitespaceAtIndex = function (id, insertIndex, afterLineNumber, ordinal, heightInPx) {
            this.heights.splice(insertIndex, 0, heightInPx);
            this.ids.splice(insertIndex, 0, id);
            this.afterLineNumbers.splice(insertIndex, 0, afterLineNumber);
            this.ordinals.splice(insertIndex, 0, ordinal);
            this.prefixSum.splice(insertIndex, 0, 0);
            var sid, oldIndex;
            for (sid in this.whitespaceId2Index) {
                if (this.whitespaceId2Index.hasOwnProperty(sid)) {
                    oldIndex = this.whitespaceId2Index[sid];
                    if (oldIndex >= insertIndex) {
                        this.whitespaceId2Index[sid] = oldIndex + 1;
                    }
                }
            }
            this.whitespaceId2Index[id.toString()] = insertIndex;
            this.prefixSumValidIndex = Math.min(this.prefixSumValidIndex, insertIndex - 1);
        };
        /**
         * Change the height of an existing whitespace
         *
         * @param id The whitespace to change
         * @param newHeightInPx The new height of the whitespace, in pixels
         * @return Returns true if the whitespace is found and if the new height is different than the old height
         */
        WhitespaceComputer.prototype.changeWhitespace = function (id, newHeightInPx) {
            var sid = id.toString();
            if (this.whitespaceId2Index.hasOwnProperty(sid)) {
                var index = this.whitespaceId2Index[sid];
                if (this.heights[index] !== newHeightInPx) {
                    this.heights[index] = newHeightInPx;
                    this.prefixSumValidIndex = Math.min(this.prefixSumValidIndex, index - 1);
                    return true;
                }
            }
            return false;
        };
        /**
         * Change the line number after which an existing whitespace flows.
         *
         * @param id The whitespace to change
         * @param newAfterLineNumber The new line number the whitespace will follow
         * @return Returns true if the whitespace is found and if the new line number is different than the old line number
         */
        WhitespaceComputer.prototype.changeAfterLineNumberForWhitespace = function (id, newAfterLineNumber) {
            var sid = id.toString();
            if (this.whitespaceId2Index.hasOwnProperty(sid)) {
                var index = this.whitespaceId2Index[sid];
                if (this.afterLineNumbers[index] !== newAfterLineNumber) {
                    // `afterLineNumber` changed for this whitespace
                    // Record old ordinal
                    var ordinal = this.ordinals[index];
                    // Record old height
                    var heightInPx = this.heights[index];
                    // Since changing `afterLineNumber` can trigger a reordering, we're gonna remove this whitespace
                    this.removeWhitespace(id);
                    // And add it again
                    var insertionIndex = WhitespaceComputer.findInsertionIndex(this.afterLineNumbers, newAfterLineNumber, this.ordinals, ordinal);
                    this.insertWhitespaceAtIndex(id, insertionIndex, newAfterLineNumber, ordinal, heightInPx);
                    return true;
                }
            }
            return false;
        };
        /**
         * Remove an existing whitespace.
         *
         * @param id The whitespace to remove
         * @return Returns true if the whitespace is found and it is removed.
         */
        WhitespaceComputer.prototype.removeWhitespace = function (id) {
            var sid = id.toString();
            if (this.whitespaceId2Index.hasOwnProperty(sid)) {
                var index = this.whitespaceId2Index[sid];
                delete this.whitespaceId2Index[sid];
                this.removeWhitespaceAtIndex(index);
                return true;
            }
            return false;
        };
        WhitespaceComputer.prototype.removeWhitespaceAtIndex = function (removeIndex) {
            this.heights.splice(removeIndex, 1);
            this.ids.splice(removeIndex, 1);
            this.afterLineNumbers.splice(removeIndex, 1);
            this.ordinals.splice(removeIndex, 1);
            this.prefixSum.splice(removeIndex, 1);
            this.prefixSumValidIndex = Math.min(this.prefixSumValidIndex, removeIndex - 1);
            var sid, oldIndex;
            for (sid in this.whitespaceId2Index) {
                if (this.whitespaceId2Index.hasOwnProperty(sid)) {
                    oldIndex = this.whitespaceId2Index[sid];
                    if (oldIndex >= removeIndex) {
                        this.whitespaceId2Index[sid] = oldIndex - 1;
                    }
                }
            }
        };
        /**
         * Notify the computer that lines have been deleted (a continuous zone of lines).
         * This gives it a chance to update `afterLineNumber` for whitespaces, giving the "sticky" characteristic.
         *
         * @param fromLineNumber The line number at which the deletion started, inclusive
         * @param toLineNumber The line number at which the deletion ended, inclusive
         */
        WhitespaceComputer.prototype.onModelLinesDeleted = function (fromLineNumber, toLineNumber) {
            var afterLineNumber, i, len;
            for (i = 0, len = this.afterLineNumbers.length; i < len; i++) {
                afterLineNumber = this.afterLineNumbers[i];
                if (fromLineNumber <= afterLineNumber && afterLineNumber <= toLineNumber) {
                    // The line this whitespace was after has been deleted
                    //  => move whitespace to before first deleted line
                    this.afterLineNumbers[i] = fromLineNumber - 1;
                }
                else if (afterLineNumber > toLineNumber) {
                    // The line this whitespace was after has been moved up
                    //  => move whitespace up
                    this.afterLineNumbers[i] -= (toLineNumber - fromLineNumber + 1);
                }
            }
        };
        /**
         * Notify the computer that lines have been inserted (a continuous zone of lines).
         * This gives it a chance to update `afterLineNumber` for whitespaces, giving the "sticky" characteristic.
         *
         * @param fromLineNumber The line number at which the insertion started, inclusive
         * @param toLineNumber The line number at which the insertion ended, inclusive.
         */
        WhitespaceComputer.prototype.onModelLinesInserted = function (fromLineNumber, toLineNumber) {
            var afterLineNumber, i, len;
            for (i = 0, len = this.afterLineNumbers.length; i < len; i++) {
                afterLineNumber = this.afterLineNumbers[i];
                if (fromLineNumber <= afterLineNumber) {
                    this.afterLineNumbers[i] += (toLineNumber - fromLineNumber + 1);
                }
            }
        };
        /**
         * Get the sum of all the whitespaces.
         */
        WhitespaceComputer.prototype.getTotalHeight = function () {
            if (this.heights.length === 0) {
                return 0;
            }
            return this.getAccumulatedHeight(this.heights.length - 1);
        };
        /**
         * Return the sum of the heights of the whitespaces at [0..index].
         * This includes the whitespace at `index`.
         *
         * @param index The index of the whitespace.
         * @return The sum of the heights of all whitespaces before the one at `index`, including the one at `index`.
         */
        WhitespaceComputer.prototype.getAccumulatedHeight = function (index) {
            var startIndex = Math.max(0, this.prefixSumValidIndex + 1);
            if (startIndex === 0) {
                this.prefixSum[0] = this.heights[0];
                startIndex++;
            }
            for (var i = startIndex; i <= index; i++) {
                this.prefixSum[i] = this.prefixSum[i - 1] + this.heights[i];
            }
            this.prefixSumValidIndex = Math.max(this.prefixSumValidIndex, index);
            return this.prefixSum[index];
        };
        /**
         * Find all whitespaces with `afterLineNumber` < `lineNumber` and return the sum of their heights.
         *
         * @param lineNumber The line number whitespaces should be before.
         * @return The sum of the heights of the whitespaces before `lineNumber`.
         */
        WhitespaceComputer.prototype.getAccumulatedHeightBeforeLineNumber = function (lineNumber) {
            var lastWhitespaceBeforeLineNumber = this.findLastWhitespaceBeforeLineNumber(lineNumber);
            if (lastWhitespaceBeforeLineNumber === -1) {
                return 0;
            }
            return this.getAccumulatedHeight(lastWhitespaceBeforeLineNumber);
        };
        WhitespaceComputer.prototype.findLastWhitespaceBeforeLineNumber = function (lineNumber) {
            // Find the whitespace before line number
            var afterLineNumbers = this.afterLineNumbers, low = 0, high = afterLineNumbers.length - 1, mid;
            while (low <= high) {
                mid = Math.floor((low + high) / 2);
                if (afterLineNumbers[mid] < lineNumber) {
                    if (mid + 1 >= afterLineNumbers.length || afterLineNumbers[mid + 1] >= lineNumber) {
                        return mid;
                    }
                    else {
                        low = mid + 1;
                    }
                }
                else {
                    high = mid - 1;
                }
            }
            return -1;
        };
        WhitespaceComputer.prototype.findFirstWhitespaceAfterLineNumber = function (lineNumber) {
            var lastWhitespaceBeforeLineNumber = this.findLastWhitespaceBeforeLineNumber(lineNumber);
            var firstWhitespaceAfterLineNumber = lastWhitespaceBeforeLineNumber + 1;
            if (firstWhitespaceAfterLineNumber < this.heights.length) {
                return firstWhitespaceAfterLineNumber;
            }
            return -1;
        };
        /**
         * Find the index of the first whitespace which has `afterLineNumber` >= `lineNumber`.
         * @return The index of the first whitespace with `afterLineNumber` >= `lineNumber` or -1 if no whitespace is found.
         */
        WhitespaceComputer.prototype.getFirstWhitespaceIndexAfterLineNumber = function (lineNumber) {
            return this.findFirstWhitespaceAfterLineNumber(lineNumber);
        };
        /**
         * The number of whitespaces.
         */
        WhitespaceComputer.prototype.getCount = function () {
            return this.heights.length;
        };
        /**
         * Get the `afterLineNumber` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `afterLineNumber` of whitespace at `index`.
         */
        WhitespaceComputer.prototype.getAfterLineNumberForWhitespaceIndex = function (index) {
            return this.afterLineNumbers[index];
        };
        /**
         * Get the `id` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `id` of whitespace at `index`.
         */
        WhitespaceComputer.prototype.getIdForWhitespaceIndex = function (index) {
            return this.ids[index];
        };
        /**
         * Get the `height` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `height` of whitespace at `index`.
         */
        WhitespaceComputer.prototype.getHeightForWhitespaceIndex = function (index) {
            return this.heights[index];
        };
        WhitespaceComputer.prototype.getWhitespaces = function (deviceLineHeight) {
            var result = [];
            for (var i = 0; i < this.heights.length; i++) {
                result.push({
                    id: this.ids[i],
                    afterLineNumber: this.afterLineNumbers[i],
                    heightInLines: this.heights[i] / deviceLineHeight
                });
            }
            return result;
        };
        return WhitespaceComputer;
    })();
    exports.WhitespaceComputer = WhitespaceComputer;
});
//# sourceMappingURL=whitespaceComputer.js.map