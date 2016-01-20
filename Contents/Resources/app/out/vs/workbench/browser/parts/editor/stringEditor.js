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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/nls', 'vs/base/common/types', 'vs/editor/common/config/defaultConfig', 'vs/editor/common/config/commonEditorConfig', 'vs/workbench/common/editor/textEditorModel', 'vs/workbench/common/editor/logEditorInput', 'vs/workbench/common/editor/untitledEditorInput', 'vs/workbench/browser/parts/editor/textEditor', 'vs/workbench/common/events', 'vs/platform/telemetry/common/telemetry', 'vs/workbench/services/workspace/common/contextService', 'vs/platform/storage/common/storage', 'vs/platform/configuration/common/configuration', 'vs/platform/event/common/event', 'vs/platform/instantiation/common/instantiation', 'vs/platform/message/common/message', 'vs/workbench/services/editor/common/editorService', 'vs/editor/common/services/modeService'], function (require, exports, winjs_base_1, nls, types, defaultConfig_1, commonEditorConfig_1, textEditorModel_1, logEditorInput_1, untitledEditorInput_1, textEditor_1, events_1, telemetry_1, contextService_1, storage_1, configuration_1, event_1, instantiation_1, message_1, editorService_1, modeService_1) {
    /**
     * An editor implementation that is capable of showing string inputs or promise inputs that resolve to a string.
     * Uses the Monaco TextEditor widget to show the contents.
     */
    var StringEditor = (function (_super) {
        __extends(StringEditor, _super);
        function StringEditor(telemetryService, instantiationService, contextService, storageService, messageService, configurationService, eventService, editorService, modeService) {
            var _this = this;
            _super.call(this, StringEditor.ID, telemetryService, instantiationService, contextService, storageService, messageService, configurationService, eventService, editorService, modeService);
            this.defaultWrappingColumn = defaultConfig_1.DefaultConfig.editor.wrappingColumn;
            this.defaultLineNumbers = defaultConfig_1.DefaultConfig.editor.lineNumbers;
            this.mapResourceToEditorViewState = Object.create(null);
            this.toUnbind.push(this.eventService.addListener(events_1.EventType.UNTITLED_FILE_DELETED, function (e) { return _this.onUntitledDeletedEvent(e); }));
        }
        StringEditor.prototype.onUntitledDeletedEvent = function (e) {
            delete this.mapResourceToEditorViewState[e.resource.toString()];
        };
        StringEditor.prototype.getTitle = function () {
            if (this.input) {
                return this.input.getName();
            }
            return nls.localize('textEditor', "Text Editor");
        };
        StringEditor.prototype.setInput = function (input, options) {
            var _this = this;
            var oldInput = this.getInput();
            _super.prototype.setInput.call(this, input, options);
            // Detect options
            var forceOpen = options && options.forceOpen;
            // Same Input
            if (!forceOpen && input.matches(oldInput)) {
                // TextOptions (avoiding instanceof here for a reason, do not change!)
                var textOptions = options;
                if (textOptions && types.isFunction(textOptions.apply)) {
                    textOptions.apply(this.getControl());
                }
                return winjs_base_1.TPromise.as(null);
            }
            // Remember view settings if input changes
            if (oldInput instanceof untitledEditorInput_1.UntitledEditorInput) {
                this.mapResourceToEditorViewState[oldInput.getResource().toString()] = this.getControl().saveViewState();
            }
            // Different Input (Reload)
            return this.editorService.resolveEditorModel(input, true /* Reload */).then(function (resolvedModel) {
                // Assert Model instance
                if (!(resolvedModel instanceof textEditorModel_1.BaseTextEditorModel)) {
                    return winjs_base_1.TPromise.wrapError('Invalid editor input. String editor requires a model instance of BaseTextEditorModel.');
                }
                // Assert that the current input is still the one we expect. This prevents a race condition when loading takes long and another input was set meanwhile
                if (!_this.getInput() || _this.getInput() !== input) {
                    return null;
                }
                // Set Editor Model
                var textEditor = _this.getControl();
                var textEditorModel = resolvedModel.textEditorModel;
                textEditor.setModel(textEditorModel);
                // Apply Options from TextOptions
                var optionsGotApplied = false;
                var textOptions = options;
                if (textOptions && types.isFunction(textOptions.apply)) {
                    optionsGotApplied = textOptions.apply(textEditor);
                }
                // Otherwise restore View State
                if (!optionsGotApplied && input instanceof untitledEditorInput_1.UntitledEditorInput) {
                    var viewState = _this.mapResourceToEditorViewState[input.getResource().toString()];
                    if (viewState) {
                        textEditor.restoreViewState(viewState);
                    }
                }
                // Apply options again because input has changed
                textEditor.updateOptions(_this.getCodeEditorOptions());
                // Auto reveal last line for log editors
                if (input instanceof logEditorInput_1.LogEditorInput) {
                    _this.revealLastLine();
                }
            });
        };
        StringEditor.prototype.applyConfiguration = function (configuration) {
            // Remember some settings that we overwrite from #getCodeEditorOptions()
            var editorConfig = configuration && configuration[commonEditorConfig_1.EditorConfiguration.EDITOR_SECTION];
            if (editorConfig) {
                this.defaultWrappingColumn = editorConfig.wrappingColumn;
                this.defaultLineNumbers = editorConfig.lineNumbers;
            }
            _super.prototype.applyConfiguration.call(this, configuration);
        };
        StringEditor.prototype.getCodeEditorOptions = function () {
            var options = _super.prototype.getCodeEditorOptions.call(this);
            var input = this.getInput();
            var isLog = input instanceof logEditorInput_1.LogEditorInput;
            var isUntitled = input instanceof untitledEditorInput_1.UntitledEditorInput;
            options.readOnly = !isUntitled; // all string editors are readonly except for the untitled one
            if (isLog) {
                options.wrappingColumn = 0; // all log editors wrap
                options.lineNumbers = false; // all log editors hide line numbers
            }
            else {
                options.wrappingColumn = this.defaultWrappingColumn; // otherwise make sure to restore the defaults
                options.lineNumbers = this.defaultLineNumbers; // otherwise make sure to restore the defaults
            }
            return options;
        };
        /**
         * Reveals the last line of this editor if it has a model set.
         */
        StringEditor.prototype.revealLastLine = function () {
            var codeEditor = this.getControl();
            var model = codeEditor.getModel();
            if (model) {
                var lastLine = model.getLineCount();
                codeEditor.revealLine(lastLine);
            }
        };
        StringEditor.prototype.supportsSplitEditor = function () {
            return true;
        };
        StringEditor.prototype.focus = function () {
            _super.prototype.focus.call(this);
            // Auto reveal last line for log editors
            if (this.getInput() instanceof logEditorInput_1.LogEditorInput) {
                this.revealLastLine();
            }
        };
        StringEditor.prototype.clearInput = function () {
            // Keep editor view state in settings to restore when coming back
            if (this.input instanceof untitledEditorInput_1.UntitledEditorInput) {
                this.mapResourceToEditorViewState[this.input.getResource().toString()] = this.getControl().saveViewState();
            }
            // Clear Model
            this.getControl().setModel(null);
            _super.prototype.clearInput.call(this);
        };
        StringEditor.ID = 'workbench.editors.stringEditor';
        StringEditor = __decorate([
            __param(0, telemetry_1.ITelemetryService),
            __param(1, instantiation_1.IInstantiationService),
            __param(2, contextService_1.IWorkspaceContextService),
            __param(3, storage_1.IStorageService),
            __param(4, message_1.IMessageService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, event_1.IEventService),
            __param(7, editorService_1.IWorkbenchEditorService),
            __param(8, modeService_1.IModeService)
        ], StringEditor);
        return StringEditor;
    })(textEditor_1.BaseTextEditor);
    exports.StringEditor = StringEditor;
});
//# sourceMappingURL=stringEditor.js.map