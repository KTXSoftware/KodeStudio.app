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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/actions', 'vs/workbench/browser/actionBarRegistry', 'vs/base/common/types', 'vs/platform/platform', 'vs/workbench/browser/viewlet', 'vs/workbench/common/editor', 'vs/platform/editor/common/editor', 'vs/platform/instantiation/common/descriptors'], function (require, exports, winjs_base_1, actions_1, actionBarRegistry_1, types, platform_1, viewlet_1, editor_1, editor_2, descriptors_1) {
    /**
     * The base class of editors in the workbench. Editors register themselves for specific editor inputs.
     * Editors are layed out in the editor part of the workbench. Only one editor can be open at a time.
     * Each editor has a minimized representation that is good enough to provide some information about the
     * state of the editor data.
     * The workbench will keep an editor alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a editor goes in the order create(), setVisible(true|false),
     * layout(), setInput(), focus(), dispose(). During use of the workbench, a editor will often receive a
     * clearInput, setVisible, layout and focus call, but only one create and dispose call.
     *
     * This class is only intended to be subclassed and not instantiated.
     */
    var BaseEditor = (function (_super) {
        __extends(BaseEditor, _super);
        function BaseEditor(id, telemetryService) {
            _super.call(this, id, telemetryService);
        }
        Object.defineProperty(BaseEditor.prototype, "input", {
            get: function () {
                return this._input;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the current input of this editor or null if none.
         */
        BaseEditor.prototype.getInput = function () {
            return this._input || null;
        };
        Object.defineProperty(BaseEditor.prototype, "options", {
            get: function () {
                return this._options;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the current options of this editor or null if none.
         */
        BaseEditor.prototype.getOptions = function () {
            return this._options || null;
        };
        /**
         * Note: Clients should not call this method, the monaco workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given input with the options to the part. An editor has to deal with the
         * situation that the same input is being set with different options.
         */
        BaseEditor.prototype.setInput = function (input, options) {
            this._input = input;
            this._options = options;
            return winjs_base_1.TPromise.as(null);
        };
        /**
         * Called to indicate to the editor that the input should be cleared and resources associated with the
         * input should be freed.
         */
        BaseEditor.prototype.clearInput = function () {
            this._input = null;
            this._options = null;
        };
        BaseEditor.prototype.create = function (parent) {
            var res = _super.prototype.create.call(this, parent);
            // Create Editor
            this.createEditor(parent);
            return res;
        };
        /**
         * Overload this function to allow for passing in a position argument.
         */
        BaseEditor.prototype.setVisible = function (visible, position) {
            if (position === void 0) { position = null; }
            var promise = _super.prototype.setVisible.call(this, visible);
            this._position = position;
            return promise;
        };
        /**
         * Called when the position of the editor changes while it is visible.
         */
        BaseEditor.prototype.changePosition = function (position) {
            this._position = position;
        };
        Object.defineProperty(BaseEditor.prototype, "position", {
            /**
             * The position this editor is showing in or null if none.
             */
            get: function () {
                return this._position;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Controls if the editor shows an action to split the input of the editor to the side. Subclasses should override
         * if they are capable of showing the same editor input side by side.
         */
        BaseEditor.prototype.supportsSplitEditor = function () {
            return false;
        };
        BaseEditor.prototype.dispose = function () {
            this._input = null;
            this._options = null;
            // Super Dispose
            _super.prototype.dispose.call(this);
        };
        return BaseEditor;
    })(viewlet_1.Viewlet);
    exports.BaseEditor = BaseEditor;
    /**
     * A lightweight descriptor of an editor. The descriptor is deferred so that heavy editors
     * can load lazily in the workbench.
     */
    var EditorDescriptor = (function (_super) {
        __extends(EditorDescriptor, _super);
        function EditorDescriptor(id, name, moduleId, ctorName) {
            _super.call(this, moduleId, ctorName);
            this.id = id;
            this.name = name;
        }
        EditorDescriptor.prototype.getId = function () {
            return this.id;
        };
        EditorDescriptor.prototype.getName = function () {
            return this.name;
        };
        EditorDescriptor.prototype.describes = function (obj) {
            return obj instanceof BaseEditor && obj.getId() === this.id;
        };
        return EditorDescriptor;
    })(descriptors_1.AsyncDescriptor);
    exports.EditorDescriptor = EditorDescriptor;
    exports.Extensions = {
        Editors: 'workbench.contributions.editors'
    };
    var INPUT_DESCRIPTORS_PROPERTY = '__$inputDescriptors';
    var EditorRegistry = (function () {
        function EditorRegistry() {
            this.editorInputFactoryConstructors = Object.create(null);
            this.editorInputFactoryInstances = Object.create(null);
            this.editors = [];
        }
        EditorRegistry.prototype.setInstantiationService = function (service) {
            this.instantiationService = service;
            for (var key in this.editorInputFactoryConstructors) {
                var element = this.editorInputFactoryConstructors[key];
                this.createEditorInputFactory(key, element);
            }
            this.editorInputFactoryConstructors = {};
        };
        EditorRegistry.prototype.createEditorInputFactory = function (editorInputId, ctor) {
            var instance = this.instantiationService.createInstance(ctor);
            this.editorInputFactoryInstances[editorInputId] = instance;
        };
        EditorRegistry.prototype.registerEditor = function (descriptor, editorInputDescriptor) {
            // Support both non-array and array parameter
            var inputDescriptors = [];
            if (!types.isArray(editorInputDescriptor)) {
                inputDescriptors.push(editorInputDescriptor);
            }
            else {
                inputDescriptors = editorInputDescriptor;
            }
            // Register (Support multiple Editors per Input)
            descriptor[INPUT_DESCRIPTORS_PROPERTY] = inputDescriptors;
            this.editors.push(descriptor);
        };
        EditorRegistry.prototype.getEditor = function (input) {
            var _this = this;
            var findEditorDescriptors = function (input, byInstanceOf) {
                var matchingDescriptors = [];
                for (var i = 0; i < _this.editors.length; i++) {
                    var editor = _this.editors[i];
                    var inputDescriptors = editor[INPUT_DESCRIPTORS_PROPERTY];
                    for (var j = 0; j < inputDescriptors.length; j++) {
                        var inputClass = inputDescriptors[j].ctor;
                        // Direct check on constructor type (ignores prototype chain)
                        if (!byInstanceOf && input.constructor === inputClass) {
                            matchingDescriptors.push(editor);
                            break;
                        }
                        else if (byInstanceOf && input instanceof inputClass) {
                            matchingDescriptors.push(editor);
                            break;
                        }
                    }
                }
                // If no descriptors found, continue search using instanceof and prototype chain
                if (!byInstanceOf && matchingDescriptors.length === 0) {
                    return findEditorDescriptors(input, true);
                }
                if (byInstanceOf) {
                    return matchingDescriptors;
                }
                return matchingDescriptors;
            };
            var descriptors = findEditorDescriptors(input);
            if (descriptors && descriptors.length > 0) {
                // Ask the input for its preferred Editor
                var preferredEditorId = input.getPreferredEditorId(descriptors.map(function (d) { return d.getId(); }));
                if (preferredEditorId) {
                    return this.getEditorById(preferredEditorId);
                }
                // Otherwise, first come first serve
                return descriptors[0];
            }
            return null;
        };
        EditorRegistry.prototype.getEditorById = function (editorId) {
            for (var i = 0; i < this.editors.length; i++) {
                var editor = this.editors[i];
                if (editor.getId() === editorId) {
                    return editor;
                }
            }
            return null;
        };
        EditorRegistry.prototype.getEditors = function () {
            return this.editors.slice(0);
        };
        EditorRegistry.prototype.setEditors = function (editorsToSet) {
            this.editors = editorsToSet;
        };
        EditorRegistry.prototype.getEditorInputs = function () {
            var inputClasses = [];
            for (var i = 0; i < this.editors.length; i++) {
                var editor = this.editors[i];
                var editorInputDescriptors = editor[INPUT_DESCRIPTORS_PROPERTY];
                inputClasses.push.apply(inputClasses, editorInputDescriptors.map(function (descriptor) { return descriptor.ctor; }));
            }
            return inputClasses;
        };
        EditorRegistry.prototype.registerDefaultFileInput = function (editorInputDescriptor) {
            this.defaultFileInputDescriptor = editorInputDescriptor;
        };
        EditorRegistry.prototype.getDefaultFileInput = function () {
            return this.defaultFileInputDescriptor;
        };
        EditorRegistry.prototype.registerEditorInputFactory = function (editorInputId, ctor) {
            if (!this.instantiationService) {
                this.editorInputFactoryConstructors[editorInputId] = ctor;
            }
            else {
                this.createEditorInputFactory(editorInputId, ctor);
            }
        };
        EditorRegistry.prototype.getEditorInputFactory = function (editorInputId) {
            return this.editorInputFactoryInstances[editorInputId];
        };
        return EditorRegistry;
    })();
    platform_1.Registry.add(exports.Extensions.Editors, new EditorRegistry());
    /**
     * A variant of the action bar contributor to register actions to specific editor inputs of the editor. This allows to have more
     * fine grained control over actions compared to contributing an action to a specific editor.
     */
    var EditorInputActionContributor = (function (_super) {
        __extends(EditorInputActionContributor, _super);
        function EditorInputActionContributor() {
            _super.call(this);
            this.mapEditorInputActionContextToPrimaryActions = this.createPositionArray();
            this.mapEditorInputActionContextToSecondaryActions = this.createPositionArray();
        }
        EditorInputActionContributor.prototype.createPositionArray = function () {
            var array = [];
            for (var i = 0; i < editor_2.POSITIONS.length; i++) {
                array[i] = {};
            }
            return array;
        };
        /* Subclasses can override to provide a custom cache implementation */
        EditorInputActionContributor.prototype.toId = function (context) {
            return context.editor.getId() + context.input.getId();
        };
        EditorInputActionContributor.prototype.clearInputsFromCache = function (position, isPrimary) {
            if (isPrimary) {
                this.doClearInputsFromCache(this.mapEditorInputActionContextToPrimaryActions[position]);
            }
            else {
                this.doClearInputsFromCache(this.mapEditorInputActionContextToSecondaryActions[position]);
            }
        };
        EditorInputActionContributor.prototype.doClearInputsFromCache = function (cache) {
            for (var key in cache) {
                if (cache.hasOwnProperty(key)) {
                    var cachedActions = cache[key];
                    cachedActions.forEach(function (action) {
                        action.input = null;
                        action.position = null;
                    });
                }
            }
        };
        /**
         * Returns true if this contributor has actions for the given editor input. Subclasses must not
         * override this method but instead hasActionsForEditorInput();
         */
        EditorInputActionContributor.prototype.hasActions = function (context) {
            if (!this.checkEditorContext(context)) {
                return false;
            }
            // Ask Cache
            if (this.mapEditorInputActionContextToPrimaryActions[context.position][this.toId(context)]) {
                return true;
            }
            // Ask Client
            return this.hasActionsForEditorInput(context);
        };
        /**
         * Returns an array of actions for the given editor input. Subclasses must not override this
         * method but instead getActionsForEditorInput();
         */
        EditorInputActionContributor.prototype.getActions = function (context) {
            if (!this.checkEditorContext(context)) {
                return [];
            }
            // This will cause any cached action to be set with null for the current editor input to prevent
            // leaking actions that still think the current editor input is what was set before.
            this.clearInputsFromCache(context.position, true /* primary actions */);
            // First consult cache
            var editorInput = context.input;
            var editorPosition = context.position;
            var cachedActions = this.mapEditorInputActionContextToPrimaryActions[context.position][this.toId(context)];
            if (cachedActions) {
                // Update the input field and position in all actions to indicate this change and return
                cachedActions.forEach(function (action) {
                    action.input = editorInput;
                    action.position = editorPosition;
                });
                return cachedActions;
            }
            // Otherwise collect and keep in cache
            var actions = this.getActionsForEditorInput(context);
            actions.forEach(function (action) {
                action.input = editorInput;
                action.position = editorPosition;
            });
            this.mapEditorInputActionContextToPrimaryActions[context.position][this.toId(context)] = actions;
            return actions;
        };
        /**
         * Returns true if this contributor has actions for the given editor input. Subclasses must not
         * override this method but instead hasSecondaryActionsForEditorInput();
         */
        EditorInputActionContributor.prototype.hasSecondaryActions = function (context) {
            if (!this.checkEditorContext(context)) {
                return false;
            }
            // Ask Cache
            if (this.mapEditorInputActionContextToSecondaryActions[context.position][this.toId(context)]) {
                return true;
            }
            // Ask Client
            return this.hasSecondaryActionsForEditorInput(context);
        };
        /**
         * Returns an array of actions for the given editor input. Subclasses must not override this
         * method but instead getSecondaryActionsForEditorInput();
         */
        EditorInputActionContributor.prototype.getSecondaryActions = function (context) {
            if (!this.checkEditorContext(context)) {
                return [];
            }
            // This will cause any cached action to be set with null for the current editor input to prevent
            // leaking actions that still think the current editor input is what was set before.
            this.clearInputsFromCache(context.position, false /* secondary actions */);
            // First consult cache
            var editorInput = context.input;
            var editorPosition = context.position;
            var cachedActions = this.mapEditorInputActionContextToSecondaryActions[context.position][this.toId(context)];
            if (cachedActions) {
                // Update the input field and position in all actions to indicate this change and return
                cachedActions.forEach(function (action) {
                    action.input = editorInput;
                    action.position = editorPosition;
                });
                return cachedActions;
            }
            // Otherwise collect and keep in cache
            var actions = this.getSecondaryActionsForEditorInput(context);
            actions.forEach(function (action) {
                action.input = editorInput;
                action.position = editorPosition;
            });
            this.mapEditorInputActionContextToSecondaryActions[context.position][this.toId(context)] = actions;
            return actions;
        };
        EditorInputActionContributor.prototype.checkEditorContext = function (context) {
            return context && context.input instanceof editor_1.EditorInput && context.editor instanceof BaseEditor && !types.isUndefinedOrNull(context.position);
        };
        /**
         * Returns true if this contributor has primary actions for the given editor input.
         */
        EditorInputActionContributor.prototype.hasActionsForEditorInput = function (context) {
            return false;
        };
        /**
         * Returns an array of primary actions for the given editor input.
         */
        EditorInputActionContributor.prototype.getActionsForEditorInput = function (context) {
            return [];
        };
        /**
         * Returns true if this contributor has secondary actions for the given editor input.
         */
        EditorInputActionContributor.prototype.hasSecondaryActionsForEditorInput = function (context) {
            return false;
        };
        /**
         * Returns an array of secondary actions for the given editor input.
         */
        EditorInputActionContributor.prototype.getSecondaryActionsForEditorInput = function (context) {
            return [];
        };
        return EditorInputActionContributor;
    })(actionBarRegistry_1.ActionBarContributor);
    exports.EditorInputActionContributor = EditorInputActionContributor;
    var EditorInputAction = (function (_super) {
        __extends(EditorInputAction, _super);
        function EditorInputAction() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(EditorInputAction.prototype, "input", {
            get: function () {
                return this._input;
            },
            set: function (input) {
                this._input = input;
                this.enabled = this.isEnabled();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EditorInputAction.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (position) {
                this._position = position;
            },
            enumerable: true,
            configurable: true
        });
        EditorInputAction.prototype.isEnabled = function () {
            return !!this._input;
        };
        return EditorInputAction;
    })(actions_1.Action);
    exports.EditorInputAction = EditorInputAction;
});
//# sourceMappingURL=baseEditor.js.map