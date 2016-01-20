/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/viewLayout/whitespaceComputer'], function (require, exports, whitespaceComputer_1) {
    /**
     * Layouting of objects that take vertical space (by having a height) and push down other objects.
     *
     * These objects are basically either text (lines) or spaces between those lines (whitespaces).
     * This provides commodity operations for working with lines that contain whitespace that pushes lines lower (vertically).
     * This is written with no knowledge of an editor in mind.
     */
    var VerticalObjects = (function () {
        function VerticalObjects() {
            this.whitespaces = new whitespaceComputer_1.WhitespaceComputer();
        }
        /**
         * Set the number of lines.
         *
         * @param newLineCount New number of lines.
         */
        VerticalObjects.prototype.replaceLines = function (newLineCount) {
            this.linesCount = newLineCount;
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
        VerticalObjects.prototype.insertWhitespace = function (afterLineNumber, ordinal, heightInPx) {
            return this.whitespaces.insertWhitespace(afterLineNumber, ordinal, heightInPx);
        };
        /**
         * Change the height of an existing whitespace
         *
         * @param id The whitespace to change
         * @param newHeightInPx The new height of the whitespace, in pixels
         * @return Returns true if the whitespace is found and if the new height is different than the old height
         */
        VerticalObjects.prototype.changeWhitespace = function (id, newHeightInPx) {
            return this.whitespaces.changeWhitespace(id, newHeightInPx);
        };
        /**
         * Change the line number after which an existing whitespace flows.
         *
         * @param id The whitespace to change
         * @param newAfterLineNumber The new line number the whitespace will follow
         * @return Returns true if the whitespace is found and if the new line number is different than the old line number
         */
        VerticalObjects.prototype.changeAfterLineNumberForWhitespace = function (id, newAfterLineNumber) {
            return this.whitespaces.changeAfterLineNumberForWhitespace(id, newAfterLineNumber);
        };
        /**
         * Remove an existing whitespace.
         *
         * @param id The whitespace to remove
         * @return Returns true if the whitespace is found and it is removed.
         */
        VerticalObjects.prototype.removeWhitespace = function (id) {
            return this.whitespaces.removeWhitespace(id);
        };
        /**
         * Notify the layouter that lines have been deleted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the deletion started, inclusive
         * @param toLineNumber The line number at which the deletion ended, inclusive
         */
        VerticalObjects.prototype.onModelLinesDeleted = function (fromLineNumber, toLineNumber) {
            this.linesCount -= (toLineNumber - fromLineNumber + 1);
            this.whitespaces.onModelLinesDeleted(fromLineNumber, toLineNumber);
        };
        /**
         * Notify the layouter that lines have been inserted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the insertion started, inclusive
         * @param toLineNumber The line number at which the insertion ended, inclusive.
         */
        VerticalObjects.prototype.onModelLinesInserted = function (fromLineNumber, toLineNumber) {
            this.linesCount += (toLineNumber - fromLineNumber + 1);
            this.whitespaces.onModelLinesInserted(fromLineNumber, toLineNumber);
        };
        /**
         * Get the sum of heights for all objects.
         *
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return The sum of heights for all objects.
         */
        VerticalObjects.prototype.getTotalHeight = function (deviceLineHeight) {
            var linesHeight = deviceLineHeight * this.linesCount;
            var whitespacesHeight = this.whitespaces.getTotalHeight();
            return linesHeight + whitespacesHeight;
        };
        /**
         * Get the vertical offset (the sum of heights for all objects above) a certain line number.
         *
         * @param lineNumber The line number
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return The sum of heights for all objects above `lineNumber`.
         */
        VerticalObjects.prototype.getVerticalOffsetForLineNumber = function (lineNumber, deviceLineHeight) {
            var previousLinesHeight;
            if (lineNumber > 1) {
                previousLinesHeight = deviceLineHeight * (lineNumber - 1);
            }
            else {
                previousLinesHeight = 0;
            }
            var previousWhitespacesHeight = this.whitespaces.getAccumulatedHeightBeforeLineNumber(lineNumber);
            return previousLinesHeight + previousWhitespacesHeight;
        };
        /**
         * Returns the accumulated height of whitespaces before the given line number.
         *
         * @param lineNumber The line number
         */
        VerticalObjects.prototype.getWhitespaceAccumulatedHeightBeforeLineNumber = function (lineNumber) {
            return this.whitespaces.getAccumulatedHeightBeforeLineNumber(lineNumber);
        };
        /**
         * Returns if there is any whitespace in the document.
         */
        VerticalObjects.prototype.hasWhitespace = function () {
            return this.whitespaces.getCount() > 0;
        };
        VerticalObjects.prototype.isAfterLines = function (verticalOffset, deviceLineHeight) {
            var totalHeight = this.getTotalHeight(deviceLineHeight);
            return verticalOffset > totalHeight;
        };
        /**
         * Find the first line number that is at or after vertical offset `verticalOffset`.
         * i.e. if getVerticalOffsetForLine(line) is x and getVerticalOffsetForLine(line + 1) is y, then
         * getLineNumberAtOrAfterVerticalOffset(i) = line, x <= i < y.
         *
         * @param verticalOffset The vertical offset to search at.
         * @param deviceLineHeight The height, in piexels, for one rendered line.
         * @return The line number at or after vertical offset `verticalOffset`.
         */
        VerticalObjects.prototype.getLineNumberAtOrAfterVerticalOffset = function (verticalOffset, deviceLineHeight) {
            if (verticalOffset < 0) {
                return 1;
            }
            var minLineNumber = 1, maxLineNumber = this.linesCount, midLineNumber, midLineNumberVerticalOffset, midLineNumberHeight;
            while (minLineNumber < maxLineNumber) {
                midLineNumber = Math.floor((minLineNumber + maxLineNumber) / 2);
                midLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(midLineNumber, deviceLineHeight);
                midLineNumberHeight = deviceLineHeight;
                if (verticalOffset >= midLineNumberVerticalOffset + midLineNumberHeight) {
                    // vertical offset is after mid line number
                    minLineNumber = midLineNumber + 1;
                }
                else if (verticalOffset >= midLineNumberVerticalOffset) {
                    // Hit
                    return midLineNumber;
                }
                else {
                    // vertical offset is before mid line number, but mid line number could still be what we're searching for
                    maxLineNumber = midLineNumber;
                }
            }
            if (minLineNumber > this.linesCount) {
                return this.linesCount;
            }
            return minLineNumber;
        };
        /**
         * Get the line that appears visually in the center between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport
         * @param verticalOffset2 The end of the viewport.
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return The line number that is closest to the center between `verticalOffset1` and `verticalOffset2`.
         */
        VerticalObjects.prototype.getCenteredLineInViewport = function (verticalOffset1, verticalOffset2, deviceLineHeight) {
            var viewportData = this.getLinesViewportData(verticalOffset1, verticalOffset2, deviceLineHeight);
            var verticalCenter = (verticalOffset2 - verticalOffset1) / 2;
            var currentLineActualTop, currentLineActualBottom;
            for (var lineNumber = viewportData.startLineNumber; lineNumber <= viewportData.endLineNumber; lineNumber++) {
                currentLineActualTop = viewportData.visibleRangesDeltaTop + viewportData.relativeVerticalOffset[lineNumber - viewportData.startLineNumber];
                currentLineActualBottom = currentLineActualTop + deviceLineHeight;
                if ((currentLineActualTop <= verticalCenter && verticalCenter < currentLineActualBottom) || currentLineActualTop > verticalCenter) {
                    return lineNumber;
                }
            }
            return viewportData.endLineNumber;
        };
        /**
         * Get all the lines and their relative vertical offsets that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return A structure describing the lines positioned between `verticalOffset1` and `verticalOffset2`.
         */
        VerticalObjects.prototype.getLinesViewportData = function (verticalOffset1, verticalOffset2, deviceLineHeight) {
            // Find first line number
            // We don't live in a perfect world, so the line number might start before or after verticalOffset1
            var startLineNumber = this.getLineNumberAtOrAfterVerticalOffset(verticalOffset1, deviceLineHeight);
            var endLineNumber = this.linesCount, startLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(startLineNumber, deviceLineHeight);
            // Also keep track of what whitespace we've got
            var whitespaceIndex = this.whitespaces.getFirstWhitespaceIndexAfterLineNumber(startLineNumber), whitespaceCount = this.whitespaces.getCount(), currentWhitespaceHeight, currentWhitespaceAfterLineNumber;
            if (whitespaceIndex === -1) {
                whitespaceIndex = whitespaceCount;
                currentWhitespaceAfterLineNumber = endLineNumber + 1;
            }
            else {
                currentWhitespaceAfterLineNumber = this.whitespaces.getAfterLineNumberForWhitespaceIndex(whitespaceIndex);
                currentWhitespaceHeight = this.whitespaces.getHeightForWhitespaceIndex(whitespaceIndex);
            }
            var currentVerticalOffset = startLineNumberVerticalOffset;
            var currentLineRelativeOffset = currentVerticalOffset;
            // IE (all versions) cannot handle units above about 1,533,908 px, so every 500k pixels bring numbers down
            var STEP_SIZE = 500000;
            var bigNumbersDelta = 0;
            if (startLineNumberVerticalOffset >= STEP_SIZE) {
                // Compute a delta that guarantees that lines are positioned at `lineHeight` increments
                bigNumbersDelta = Math.floor(startLineNumberVerticalOffset / STEP_SIZE) * STEP_SIZE;
                bigNumbersDelta = Math.floor(bigNumbersDelta / deviceLineHeight) * deviceLineHeight;
                currentLineRelativeOffset -= bigNumbersDelta;
            }
            var linesOffsets = [];
            // Figure out how far the lines go
            for (var lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                // Count current line height in the vertical offsets
                currentVerticalOffset += deviceLineHeight;
                linesOffsets.push(currentLineRelativeOffset);
                // Next line starts immediately after this one
                currentLineRelativeOffset += deviceLineHeight;
                while (currentWhitespaceAfterLineNumber === lineNumber) {
                    // Push down next line with the height of the current whitespace
                    currentLineRelativeOffset += currentWhitespaceHeight;
                    // Count current whitespace in the vertical offsets
                    currentVerticalOffset += currentWhitespaceHeight;
                    whitespaceIndex++;
                    if (whitespaceIndex >= whitespaceCount) {
                        currentWhitespaceAfterLineNumber = endLineNumber + 1;
                    }
                    else {
                        currentWhitespaceAfterLineNumber = this.whitespaces.getAfterLineNumberForWhitespaceIndex(whitespaceIndex);
                        currentWhitespaceHeight = this.whitespaces.getHeightForWhitespaceIndex(whitespaceIndex);
                    }
                }
                if (currentVerticalOffset > verticalOffset2) {
                    // We have covered the entire viewport area, time to stop
                    endLineNumber = lineNumber;
                    break;
                }
            }
            return {
                viewportTop: verticalOffset1 - bigNumbersDelta,
                viewportHeight: verticalOffset2 - verticalOffset1,
                bigNumbersDelta: bigNumbersDelta,
                startLineNumber: startLineNumber,
                endLineNumber: endLineNumber,
                visibleRangesDeltaTop: -(verticalOffset1 - bigNumbersDelta),
                relativeVerticalOffset: linesOffsets,
                visibleRange: null,
                getInlineDecorationsForLineInViewport: null,
                getDecorationsInViewport: null // This will be filled in by linesLayout
            };
        };
        VerticalObjects.prototype.getVerticalOffsetForWhitespaceIndex = function (whitespaceIndex, deviceLineHeight) {
            var previousLinesHeight;
            var afterLineNumber = this.whitespaces.getAfterLineNumberForWhitespaceIndex(whitespaceIndex);
            var previousLinesHeight;
            if (afterLineNumber >= 1) {
                previousLinesHeight = deviceLineHeight * afterLineNumber;
            }
            else {
                previousLinesHeight = 0;
            }
            var previousWhitespacesHeight;
            if (whitespaceIndex > 0) {
                previousWhitespacesHeight = this.whitespaces.getAccumulatedHeight(whitespaceIndex - 1);
            }
            else {
                previousWhitespacesHeight = 0;
            }
            return previousLinesHeight + previousWhitespacesHeight;
        };
        VerticalObjects.prototype.getWhitespaceIndexAtOrAfterVerticallOffset = function (verticalOffset, deviceLineHeight) {
            var midWhitespaceIndex, minWhitespaceIndex = 0, maxWhitespaceIndex = this.whitespaces.getCount() - 1, midWhitespaceVerticalOffset, midWhitespaceHeight;
            if (maxWhitespaceIndex < 0) {
                return -1;
            }
            // Special case: nothing to be found
            var maxWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(maxWhitespaceIndex, deviceLineHeight);
            var maxWhitespaceHeight = this.whitespaces.getHeightForWhitespaceIndex(maxWhitespaceIndex);
            if (verticalOffset >= maxWhitespaceVerticalOffset + maxWhitespaceHeight) {
                return -1;
            }
            while (minWhitespaceIndex < maxWhitespaceIndex) {
                midWhitespaceIndex = Math.floor((minWhitespaceIndex + maxWhitespaceIndex) / 2);
                midWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(midWhitespaceIndex, deviceLineHeight);
                midWhitespaceHeight = this.whitespaces.getHeightForWhitespaceIndex(midWhitespaceIndex);
                if (verticalOffset >= midWhitespaceVerticalOffset + midWhitespaceHeight) {
                    // vertical offset is after whitespace
                    minWhitespaceIndex = midWhitespaceIndex + 1;
                }
                else if (verticalOffset >= midWhitespaceVerticalOffset) {
                    // Hit
                    return midWhitespaceIndex;
                }
                else {
                    // vertical offset is before whitespace, but midWhitespaceIndex might still be what we're searching for
                    maxWhitespaceIndex = midWhitespaceIndex;
                }
            }
            return minWhitespaceIndex;
        };
        /**
         * Get exactly the whitespace that is layouted at `verticalOffset`.
         *
         * @param verticalOffset The vertical offset.
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return Precisely the whitespace that is layouted at `verticaloffset` or null.
         */
        VerticalObjects.prototype.getWhitespaceAtVerticalOffset = function (verticalOffset, deviceLineHeight) {
            var candidateIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset, deviceLineHeight);
            if (candidateIndex < 0) {
                return null;
            }
            if (candidateIndex >= this.whitespaces.getCount()) {
                return null;
            }
            var candidateTop = this.getVerticalOffsetForWhitespaceIndex(candidateIndex, deviceLineHeight);
            if (candidateTop > verticalOffset) {
                return null;
            }
            var candidateHeight = this.whitespaces.getHeightForWhitespaceIndex(candidateIndex);
            var candidateId = this.whitespaces.getIdForWhitespaceIndex(candidateIndex);
            var candidateAfterLineNumber = this.whitespaces.getAfterLineNumberForWhitespaceIndex(candidateIndex);
            return {
                id: candidateId,
                afterLineNumber: candidateAfterLineNumber,
                verticalOffset: candidateTop,
                height: candidateHeight
            };
        };
        /**
         * Get a list of whitespaces that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @param deviceLineHeight The height, in pixels, for one rendered line.
         * @return An array with all the whitespaces in the viewport. If no whitespace is in viewport, the array is empty.
         */
        VerticalObjects.prototype.getWhitespaceViewportData = function (verticalOffset1, verticalOffset2, deviceLineHeight) {
            var startIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset1, deviceLineHeight);
            var endIndex = this.whitespaces.getCount() - 1;
            if (startIndex < 0) {
                return [];
            }
            var result = [], i, top, height;
            for (i = startIndex; i <= endIndex; i++) {
                top = this.getVerticalOffsetForWhitespaceIndex(i, deviceLineHeight);
                height = this.whitespaces.getHeightForWhitespaceIndex(i);
                if (top >= verticalOffset2) {
                    break;
                }
                result.push({
                    id: this.whitespaces.getIdForWhitespaceIndex(i),
                    afterLineNumber: this.whitespaces.getAfterLineNumberForWhitespaceIndex(i),
                    verticalOffset: top,
                    height: height
                });
            }
            return result;
        };
        VerticalObjects.prototype.getWhitespaces = function (deviceLineHeight) {
            return this.whitespaces.getWhitespaces(deviceLineHeight);
        };
        return VerticalObjects;
    })();
    exports.VerticalObjects = VerticalObjects;
});
//# sourceMappingURL=verticalObjects.js.map