/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports"], function (require, exports) {
    var Arrays;
    (function (Arrays) {
        /**
         * Given a sorted array of natural number segments, find the segment containing a natural number.
         *    For example, the segments [0, 5), [5, 9), [9, infinity) will be represented in the following manner:
         *       [{ startIndex: 0 }, { startIndex: 5 }, { startIndex: 9 }]
         *    Searching for 0, 1, 2, 3 or 4 will return 0.
         *    Searching for 5, 6, 7 or 8 will return 1.
         *    Searching for 9, 10, 11, ... will return 2.
         * @param arr A sorted array representing natural number segments
         * @param desiredIndex The search
         * @return The index of the containing segment in the array.
         */
        function findIndexInSegmentsArray(arr, desiredIndex) {
            var low = 0, high = arr.length - 1, mid;
            while (low < high) {
                mid = low + Math.ceil((high - low) / 2);
                if (arr[mid].startIndex > desiredIndex) {
                    high = mid - 1;
                }
                else {
                    low = mid;
                }
            }
            return low;
        }
        Arrays.findIndexInSegmentsArray = findIndexInSegmentsArray;
    })(Arrays = exports.Arrays || (exports.Arrays = {}));
});
//# sourceMappingURL=arrays.js.map