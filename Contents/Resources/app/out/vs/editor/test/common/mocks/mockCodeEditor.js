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
define(["require", "exports", 'vs/editor/common/commonCodeEditor', 'vs/base/common/eventEmitter', 'vs/editor/test/common/mocks/mockConfiguration', 'vs/platform/keybinding/test/common/mockKeybindingService', 'vs/editor/test/common/mocks/mockCodeEditorService', 'vs/platform/telemetry/test/common/mockTelemetryService', 'vs/platform/instantiation/common/instantiationService', 'vs/editor/common/model/model'], function (require, exports, commonCodeEditor_1, eventEmitter_1, mockConfiguration_1, mockKeybindingService_1, mockCodeEditorService_1, mockTelemetryService_1, InstantiationService, model_1) {
    var MockCodeEditor = (function (_super) {
        __extends(MockCodeEditor, _super);
        function MockCodeEditor() {
            _super.apply(this, arguments);
        }
        MockCodeEditor.prototype._createConfiguration = function (options, indentationGuesser) {
            return new mockConfiguration_1.MockConfiguration(options);
        };
        MockCodeEditor.prototype.getCenteredRangeInViewport = function () { return null; };
        MockCodeEditor.prototype.setScrollTop = function (newScrollTop) { };
        MockCodeEditor.prototype.getScrollTop = function () { return 0; };
        MockCodeEditor.prototype.setScrollLeft = function (newScrollLeft) { };
        MockCodeEditor.prototype.getScrollLeft = function () { return 0; };
        MockCodeEditor.prototype.getScrollWidth = function () { return 0; };
        MockCodeEditor.prototype.getScrollHeight = function () { return 0; };
        MockCodeEditor.prototype.saveViewState = function () { return null; };
        MockCodeEditor.prototype.restoreViewState = function (state) { };
        MockCodeEditor.prototype.layout = function (dimension) { };
        MockCodeEditor.prototype.focus = function () { };
        MockCodeEditor.prototype.isFocused = function () { return true; };
        MockCodeEditor.prototype._enableEmptySelectionClipboard = function () { return false; };
        MockCodeEditor.prototype._createView = function () { };
        MockCodeEditor.prototype._getViewInternalEventBus = function () { return new eventEmitter_1.EventEmitter(); };
        // --- test utils
        MockCodeEditor.prototype.getCursor = function () {
            return this.cursor;
        };
        MockCodeEditor.prototype.registerAndInstantiateContribution = function (ctor) {
            var r = this._instantiationService.createInstance(ctor, this);
            this.contributions[r.getId()] = r;
            return r;
        };
        return MockCodeEditor;
    })(commonCodeEditor_1.CommonCodeEditor);
    exports.MockCodeEditor = MockCodeEditor;
    var MockScopeLocation = (function () {
        function MockScopeLocation() {
        }
        MockScopeLocation.prototype.setAttribute = function (attr, value) { };
        MockScopeLocation.prototype.removeAttribute = function (attr) { };
        return MockScopeLocation;
    })();
    exports.MockScopeLocation = MockScopeLocation;
    function withMockCodeEditor(text, options, callback) {
        var codeEditorService = new mockCodeEditorService_1.MockCodeEditorService();
        var keybindingService = new mockKeybindingService_1.MockKeybindingService();
        var telemetryService = new mockTelemetryService_1.MockTelemetryService();
        var instantiationService = InstantiationService.create({
            codeEditorService: codeEditorService,
            keybindingService: keybindingService,
            telemetryService: telemetryService
        });
        var model = new model_1.Model(text.join('\n'), null);
        var editor = new MockCodeEditor(new MockScopeLocation(), options, instantiationService, codeEditorService, keybindingService, telemetryService);
        editor.setModel(model);
        callback(editor, editor.getCursor());
        editor.dispose();
        model.dispose();
        keybindingService.dispose();
        telemetryService.dispose();
    }
    exports.withMockCodeEditor = withMockCodeEditor;
});
//# sourceMappingURL=mockCodeEditor.js.map