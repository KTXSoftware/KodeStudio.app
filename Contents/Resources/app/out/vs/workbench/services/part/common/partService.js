/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/platform/instantiation/common/instantiation'], function (require, exports, instantiation_1) {
    (function (Parts) {
        Parts[Parts["ACTIVITYBAR_PART"] = 0] = "ACTIVITYBAR_PART";
        Parts[Parts["SIDEBAR_PART"] = 1] = "SIDEBAR_PART";
        Parts[Parts["EDITOR_PART"] = 2] = "EDITOR_PART";
        Parts[Parts["STATUSBAR_PART"] = 3] = "STATUSBAR_PART";
    })(exports.Parts || (exports.Parts = {}));
    var Parts = exports.Parts;
    (function (Position) {
        Position[Position["LEFT"] = 0] = "LEFT";
        Position[Position["RIGHT"] = 1] = "RIGHT";
    })(exports.Position || (exports.Position = {}));
    var Position = exports.Position;
    exports.IPartService = instantiation_1.createDecorator('partService');
});
//# sourceMappingURL=partService.js.map