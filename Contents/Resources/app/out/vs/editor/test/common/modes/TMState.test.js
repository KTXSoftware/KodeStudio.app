/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'assert', 'vs/editor/common/modes/TMState'], function (require, exports, assert, TMState) {
    suite('Editor Modes - TMState', function () {
        test('Bug #16982: Cannot read property \'length\' of null', function () {
            var s1 = new TMState.TMState(null, null, null);
            var s2 = new TMState.TMState(null, null, null);
            assert.equal(s1.equals(s2), true);
        });
    });
});
//# sourceMappingURL=TMState.test.js.map