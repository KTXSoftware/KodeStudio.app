/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports"], function (require, exports) {
    var IdGenerator = (function () {
        function IdGenerator(prefix) {
            this._prefix = prefix;
            this._lastId = 0;
        }
        IdGenerator.prototype.generate = function () {
            return this._prefix + (++this._lastId);
        };
        return IdGenerator;
    })();
    exports.IdGenerator = IdGenerator;
});
//# sourceMappingURL=idGenerator.js.map