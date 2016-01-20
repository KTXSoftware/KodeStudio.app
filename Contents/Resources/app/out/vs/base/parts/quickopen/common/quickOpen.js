/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports"], function (require, exports) {
    (function (Mode) {
        Mode[Mode["PREVIEW"] = 0] = "PREVIEW";
        Mode[Mode["OPEN"] = 1] = "OPEN";
    })(exports.Mode || (exports.Mode = {}));
    var Mode = exports.Mode;
});
//# sourceMappingURL=quickOpen.js.map