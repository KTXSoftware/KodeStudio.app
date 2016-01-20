/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", 'vs/base/common/arrays'], function (require, exports, arrays) {
    exports.EMPTY_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
    function isEmptyElement(e) {
        return arrays.binarySearch(exports.EMPTY_ELEMENTS, e, function (s1, s2) { return s1.localeCompare(s2); }) >= 0;
    }
    exports.isEmptyElement = isEmptyElement;
});
//# sourceMappingURL=htmlEmptyTagsShared.js.map