/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/platform/instantiation/common/instantiation'], function (require, exports, instantiation_1) {
    exports.IEditorService = instantiation_1.createDecorator('editorService');
    /**
     * Possible locations for opening an editor.
     */
    (function (Position) {
        /** Opens the editor in the LEFT most position replacing the input currently showing */
        Position[Position["LEFT"] = 0] = "LEFT";
        /** Opens the editor in the CENTER position replacing the input currently showing */
        Position[Position["CENTER"] = 1] = "CENTER";
        /** Opens the editor in the RIGHT most position replacing the input currently showing */
        Position[Position["RIGHT"] = 2] = "RIGHT";
    })(exports.Position || (exports.Position = {}));
    var Position = exports.Position;
    exports.POSITIONS = [Position.LEFT, Position.CENTER, Position.RIGHT];
});
//# sourceMappingURL=editor.js.map