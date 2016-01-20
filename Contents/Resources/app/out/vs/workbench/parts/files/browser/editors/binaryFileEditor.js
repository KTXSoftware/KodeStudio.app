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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", 'vs/nls', 'vs/workbench/browser/parts/editor/binaryEditor', 'vs/workbench/parts/files/common/files', 'vs/platform/telemetry/common/telemetry', 'vs/workbench/services/editor/common/editorService'], function (require, exports, nls, binaryEditor_1, files_1, telemetry_1, editorService_1) {
    /**
     * An implementation of editor for binary files like images or videos leveraging the FileEditorInput.
     */
    var BinaryFileEditor = (function (_super) {
        __extends(BinaryFileEditor, _super);
        function BinaryFileEditor(telemetryService, editorService) {
            _super.call(this, BinaryFileEditor.ID, telemetryService, editorService);
        }
        BinaryFileEditor.prototype.getTitle = function () {
            return this.getInput() ? this.getInput().getName() : nls.localize('binaryFileEditor', "Binary File Viewer");
        };
        BinaryFileEditor.prototype.supportsSplitEditor = function () {
            return true; // yes, we can!
        };
        BinaryFileEditor.ID = files_1.BINARY_FILE_EDITOR_ID;
        BinaryFileEditor = __decorate([
            __param(0, telemetry_1.ITelemetryService),
            __param(1, editorService_1.IWorkbenchEditorService)
        ], BinaryFileEditor);
        return BinaryFileEditor;
    })(binaryEditor_1.BaseBinaryResourceEditor);
    exports.BinaryFileEditor = BinaryFileEditor;
});
//# sourceMappingURL=binaryFileEditor.js.map