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
define(["require", "exports", 'vs/nls', 'vs/base/common/collections', 'vs/base/common/lifecycle', 'vs/base/browser/dom', 'vs/base/common/winjs.base', 'vs/base/common/strings', 'vs/base/common/network', 'vs/base/browser/ui/filelabel/fileLabel', 'vs/base/common/errors', 'vs/base/browser/builder', 'vs/base/common/labels', 'vs/base/parts/tree/browser/treeImpl', 'vs/base/parts/tree/browser/treeDefaults', 'vs/base/browser/ui/leftRightWidget/leftRightWidget', 'vs/base/browser/ui/countBadge/countBadge', 'vs/editor/common/editorCommon', 'vs/editor/common/config/defaultConfig', 'vs/editor/browser/widget/embeddedCodeEditorWidget', 'vs/editor/common/model/model', 'vs/editor/contrib/zoneWidget/browser/peekViewWidget', './referenceSearchModel', 'vs/editor/common/core/range', 'vs/platform/workspace/common/workspace', 'vs/css!./referenceSearchWidget'], function (require, exports, nls, collections, lifecycle, dom, winjs_base_1, strings, network, fileLabel, errors, builder, labels, treeWidget, treeDefaults, leftRightWidget, countBadge, EditorCommon, defaultConfig_1, embeddedCodeEditorWidget, codeEditorModel, peekViewWidget, model, range_1, workspace_1) {
    var DecorationsManager = (function () {
        function DecorationsManager(editor, model) {
            var _this = this;
            this.editor = editor;
            this.model = model;
            this._decorationSet = collections.createStringDictionary();
            this._decorationIgnoreSet = collections.createStringDictionary();
            this.callOnDispose = [];
            this.callOnModelChange = [];
            this.callOnDispose.push(this.editor.addListener(EditorCommon.EventType.ModelChanged, function () { return _this.onModelChanged(); }));
            this.onModelChanged();
        }
        DecorationsManager.prototype.dispose = function () {
            this.callOnModelChange = lifecycle.cAll(this.callOnModelChange);
            this.callOnDispose = lifecycle.cAll(this.callOnDispose);
            this.removeDecorations();
        };
        DecorationsManager.prototype.onModelChanged = function () {
            this.removeDecorations();
            this.callOnModelChange = lifecycle.cAll(this.callOnModelChange);
            var model = this.editor.getModel();
            if (!model) {
                return;
            }
            for (var i = 0, len = this.model.children.length; i < len; i++) {
                if (this.model.children[i].resource.toString() === model.getAssociatedResource().toString()) {
                    this.addDecorations(this.model.children[i]);
                    return;
                }
            }
        };
        DecorationsManager.prototype.addDecorations = function (reference) {
            var _this = this;
            this.callOnModelChange.push(this.editor.getModel().addListener(EditorCommon.EventType.ModelDecorationsChanged, function (event) { return _this.onDecorationChanged(event); }));
            this.editor.getModel().changeDecorations(function (accessor) {
                var newDecorations = [];
                var newDecorationsActualIndex = [];
                for (var i_1 = 0, len = reference.children.length; i_1 < len; i_1++) {
                    var oneReference = reference.children[i_1];
                    if (_this._decorationIgnoreSet[oneReference.id]) {
                        continue;
                    }
                    newDecorations.push({
                        range: oneReference.range,
                        options: DecorationsManager.DecorationOptions
                    });
                    newDecorationsActualIndex.push(i_1);
                }
                var decorations = accessor.deltaDecorations([], newDecorations);
                for (var i = 0; i < decorations.length; i++) {
                    _this._decorationSet[decorations[i]] = reference.children[newDecorationsActualIndex[i]];
                }
            });
        };
        DecorationsManager.prototype.onDecorationChanged = function (event) {
            var _this = this;
            var addedOrChangedDecorations = event.addedOrChangedDecorations, toRemove = [];
            for (var i = 0, len = addedOrChangedDecorations.length; i < len; i++) {
                var reference = collections.lookup(this._decorationSet, addedOrChangedDecorations[i].id);
                if (!reference) {
                    continue;
                }
                var newRange = addedOrChangedDecorations[i].range, ignore = false;
                if (range_1.Range.equalsRange(newRange, reference.range)) {
                    continue;
                }
                else if (range_1.Range.spansMultipleLines(newRange)) {
                    ignore = true;
                }
                else {
                    var lineLength = reference.range.endColumn - reference.range.startColumn, newLineLength = newRange.endColumn - newRange.startColumn;
                    if (lineLength !== newLineLength) {
                        ignore = true;
                    }
                }
                if (ignore) {
                    this._decorationIgnoreSet[reference.id] = reference;
                    toRemove.push(addedOrChangedDecorations[i].id);
                }
                else {
                    reference.range = newRange;
                }
            }
            this.editor.changeDecorations(function (accessor) {
                for (var i_2 = 0, len_1 = toRemove.length; i_2 < len_1; i_2++) {
                    delete _this._decorationSet[toRemove[i_2]];
                }
                accessor.deltaDecorations(toRemove, []);
            });
        };
        DecorationsManager.prototype.removeDecorations = function () {
            var keys = Object.keys(this._decorationSet);
            if (keys.length > 0) {
                this.editor.changeDecorations(function (accessor) {
                    accessor.deltaDecorations(keys, []);
                });
            }
            this._decorationSet = {};
        };
        DecorationsManager.DecorationOptions = {
            stickiness: EditorCommon.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            className: 'reference-decoration'
        };
        return DecorationsManager;
    })();
    var DataSource = (function () {
        function DataSource() {
        }
        DataSource.prototype.getId = function (tree, element) {
            if (element instanceof model.Model) {
                return 'root';
            }
            else if (element instanceof model.FileReferences) {
                return element.id;
            }
            else if (element instanceof model.OneReference) {
                return element.id;
            }
        };
        DataSource.prototype.hasChildren = function (tree, element) {
            return element instanceof model.FileReferences || element instanceof model.Model;
        };
        DataSource.prototype.getChildren = function (tree, element) {
            if (element instanceof model.Model) {
                return winjs_base_1.TPromise.as(element.children);
            }
            else if (element instanceof model.FileReferences) {
                return element.resolve().then(function (val) { return val.children; });
            }
            else {
                return winjs_base_1.TPromise.as([]);
            }
        };
        DataSource.prototype.getParent = function (tree, element) {
            var result = null;
            if (element instanceof model.FileReferences) {
                result = element.parent;
            }
            else if (element instanceof model.OneReference) {
                result = element.parent;
            }
            return winjs_base_1.TPromise.as(result);
        };
        return DataSource;
    })();
    var Controller = (function (_super) {
        __extends(Controller, _super);
        function Controller() {
            _super.apply(this, arguments);
        }
        Controller.prototype.onMouseDown = function (tree, element, event) {
            if (event.leftButton) {
                if (element instanceof model.FileReferences) {
                    event.preventDefault();
                    event.stopPropagation();
                    return this.expandCollapse(tree, element);
                }
                var result = _super.prototype.onClick.call(this, tree, element, event);
                if (event.ctrlKey || event.metaKey) {
                    tree.emit(Controller.Events.OPEN_TO_SIDE, element);
                }
                else if (event.detail === 2) {
                    tree.emit(Controller.Events.SELECTED, element);
                }
                else {
                    tree.emit(Controller.Events.FOCUSED, element);
                }
                return result;
            }
            return false;
        };
        Controller.prototype.onClick = function (tree, element, event) {
            if (event.leftButton) {
                return false; // Already handled by onMouseDown
            }
            return _super.prototype.onClick.call(this, tree, element, event);
        };
        Controller.prototype.expandCollapse = function (tree, element) {
            if (tree.isExpanded(element)) {
                tree.collapse(element).done(null, errors.onUnexpectedError);
            }
            else {
                tree.expand(element).done(null, errors.onUnexpectedError);
            }
            return true;
        };
        Controller.prototype.onEscape = function (tree, event) {
            return false;
        };
        Controller.prototype.onEnter = function (tree, event) {
            var element = tree.getFocus();
            if (element instanceof model.FileReferences) {
                return this.expandCollapse(tree, element);
            }
            var result = _super.prototype.onEnter.call(this, tree, event);
            if (event.ctrlKey || event.metaKey) {
                tree.emit(Controller.Events.OPEN_TO_SIDE, element);
            }
            else {
                tree.emit(Controller.Events.SELECTED, element);
            }
            return result;
        };
        Controller.prototype.onUp = function (tree, event) {
            _super.prototype.onUp.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.onPageUp = function (tree, event) {
            _super.prototype.onPageUp.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.onLeft = function (tree, event) {
            _super.prototype.onLeft.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.onDown = function (tree, event) {
            _super.prototype.onDown.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.onPageDown = function (tree, event) {
            _super.prototype.onPageDown.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.onRight = function (tree, event) {
            _super.prototype.onRight.call(this, tree, event);
            this.fakeFocus(tree, event);
            return true;
        };
        Controller.prototype.fakeFocus = function (tree, event) {
            // focus next item
            var focus = tree.getFocus();
            tree.setSelection([focus]);
            // send out event
            tree.emit(Controller.Events.FOCUSED, focus);
        };
        Controller.Events = {
            FOCUSED: 'events/custom/focused',
            SELECTED: 'events/custom/selected',
            OPEN_TO_SIDE: 'events/custom/opentoside'
        };
        return Controller;
    })(treeDefaults.DefaultController);
    var Renderer = (function (_super) {
        __extends(Renderer, _super);
        function Renderer(editor, contextService) {
            _super.call(this);
            this.editor = editor;
            this._contextService = contextService;
        }
        Renderer.prototype.getHeight = function (tree, element) {
            return 1.2 * this.editor.getConfiguration().lineHeight;
        };
        Renderer.prototype.render = function (tree, element, container) {
            var _this = this;
            dom.clearNode(container);
            if (element instanceof model.FileReferences) {
                var fileReferences = element, fileReferencesContainer = builder.$('.reference-file');
                new leftRightWidget.LeftRightWidget(fileReferencesContainer, function (left) {
                    var resource = fileReferences.resource;
                    new fileLabel.FileLabel(left, resource, _this._contextService);
                    return null;
                }, function (right) {
                    var len = fileReferences.children.length;
                    return new countBadge.CountBadge(right, len, len > 1 ? nls.localize('referencesCount', "{0} references", len) : nls.localize('referenceCount', "{0} reference", len));
                });
                fileReferencesContainer.appendTo(container);
            }
            else if (element instanceof model.OneReference) {
                var oneReference = element, oneReferenceContainer = builder.$('.reference'), preview = oneReference.parent.preview.preview(oneReference.range);
                oneReferenceContainer.innerHtml(strings.format('<span>{0}</span><span class="referenceMatch">{1}</span><span>{2}</span>', preview.before, preview.inside, preview.after)).appendTo(container);
            }
            return null;
        };
        Renderer = __decorate([
            __param(1, workspace_1.IWorkspaceContextService)
        ], Renderer);
        return Renderer;
    })(treeDefaults.LegacyRenderer);
    /**
     * ZoneWidget that is shown inside the editor
     */
    var ReferenceWidget = (function (_super) {
        __extends(ReferenceWidget, _super);
        function ReferenceWidget(editorService, keybindingService, contextService, instantiationService, editor) {
            _super.call(this, editor, keybindingService, ReferenceWidget.INNER_EDITOR_CONTEXT_KEY, { frameColor: '#007ACC', showFrame: false, showArrow: true });
            this.editorService = editorService;
            this.contextService = contextService;
            this.instantiationService = instantiationService.createChild({ peekViewService: this });
            this.callOnModel = [];
            this.tree = null;
            this.treeContainer = null;
            this.preview = null;
            this.previewContainer = null;
            this.previewDecorations = [];
            this.lastHeight = null;
            this.create();
        }
        ReferenceWidget.prototype._onTitleClick = function (e) {
            if (!this.preview || !this.preview.getModel()) {
                return;
            }
            var model = this.preview.getModel(), lineNumber = this.preview.getPosition().lineNumber, titleRange = new range_1.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber));
            this.emit(ReferenceWidget.Events.EditorDoubleClick, { reference: this.getFocusedReference(), range: titleRange, originalEvent: e });
        };
        ReferenceWidget.prototype._fillBody = function (containerElement) {
            var _this = this;
            var container = builder.$(containerElement);
            container.addClass('reference-zone-widget');
            // message pane
            container.div({ 'class': 'messages' }, function (div) {
                _this.messageContainer = div.hide();
            });
            // editor
            container.div({ 'class': 'preview inline' }, function (div) {
                var options = {
                    scrollBeyondLastLine: false,
                    scrollbar: defaultConfig_1.DefaultConfig.editor.scrollbar,
                    overviewRulerLanes: 2
                };
                _this.preview = _this.instantiationService.createInstance(embeddedCodeEditorWidget.EmbeddedCodeEditorWidget, div.getHTMLElement(), options, _this.editor);
                _this.previewContainer = div.hide();
                _this.previewNotAvailableMessage = new codeEditorModel.Model(nls.localize('missingPreviewMessage', "no preview available"), null);
            });
            // tree
            container.div({ 'class': 'tree inline' }, function (div) {
                var config = {
                    dataSource: _this.instantiationService.createInstance(DataSource),
                    renderer: _this.instantiationService.createInstance(Renderer, _this.editor),
                    //sorter: new Sorter(),
                    controller: new Controller()
                };
                var options = {
                    allowHorizontalScroll: false,
                    twistiePixels: 20
                };
                _this.tree = new treeWidget.Tree(div.getHTMLElement(), config, options);
                _this.treeContainer = div.hide();
            });
        };
        ReferenceWidget.prototype._doLayoutBody = function (heightInPixel) {
            _super.prototype._doLayoutBody.call(this, heightInPixel);
            var h = heightInPixel + 'px';
            if (h === this.lastHeight) {
                return;
            }
            // set height
            this.treeContainer.style({ height: h });
            this.previewContainer.style({ height: h });
            // forward
            this.tree.layout(heightInPixel);
            this.preview.layout();
            this.lastHeight = h;
        };
        ReferenceWidget.prototype.onWidth = function (widthInPixel) {
            this.preview.layout();
        };
        ReferenceWidget.prototype.setModel = function (newModel) {
            // clean up
            this.callOnModel = lifecycle.disposeAll(this.callOnModel);
            this.model = newModel;
            if (this.model) {
                this._onNewModel();
            }
        };
        ReferenceWidget.prototype.showMessage = function (message) {
            this.setTitle('');
            this.messageContainer.innerHtml(message).show();
        };
        ReferenceWidget.prototype._onNewModel = function () {
            var _this = this;
            this.messageContainer.hide();
            this.decorationsManager = new DecorationsManager(this.preview, this.model);
            this.callOnModel.push(this.decorationsManager);
            // listen on model changes
            this.callOnModel.push(this.model.addListener2(model.EventType.OnReferenceRangeChanged, function (reference) {
                _this.tree.refresh(reference);
            }));
            // listen on selection and focus
            this.callOnModel.push(this.tree.addListener2(Controller.Events.FOCUSED, function (element) {
                if (element instanceof model.OneReference) {
                    _this.showReferencePreview(element);
                }
            }));
            this.callOnModel.push(this.tree.addListener2(Controller.Events.SELECTED, function (element) {
                if (element instanceof model.OneReference) {
                    _this.showReferencePreview(element);
                    _this.model.currentReference = element;
                }
            }));
            this.callOnModel.push(this.tree.addListener2(Controller.Events.OPEN_TO_SIDE, function (element) {
                if (element instanceof model.OneReference) {
                    _this.editorService.openEditor({
                        resource: element.resource,
                        options: {
                            selection: element.range
                        }
                    }, true);
                }
            }));
            var input = this.model.children.length === 1 ? this.model.children[0] : this.model;
            this.tree.setInput(input).then(function () {
                _this.tree.setSelection([_this.model.currentReference]);
            }).done(null, errors.onUnexpectedError);
            // listen on editor
            this.callOnModel.push(this.preview.addListener2(EditorCommon.EventType.MouseDown, function (e) {
                if (e.event.detail === 2) {
                    _this.emit(ReferenceWidget.Events.EditorDoubleClick, { reference: _this.getFocusedReference(), range: e.target.range, originalEvent: e.event });
                }
            }));
            // make sure things are rendered
            dom.addClass(this.container, 'results-loaded');
            this.treeContainer.show();
            this.previewContainer.show();
            this.preview.layout();
            this.tree.layout();
            this.focus();
            // preview the current reference
            this.showReferencePreview(this.model.nextReference(this.model.currentReference));
        };
        ReferenceWidget.prototype.getFocusedReference = function () {
            var element = this.tree.getFocus();
            if (element instanceof model.OneReference) {
                return element.resource;
            }
            else if (element instanceof model.FileReferences) {
                var referenceFile = element;
                if (referenceFile.children.length > 0) {
                    return referenceFile.children[0].resource;
                }
            }
            return null;
        };
        ReferenceWidget.prototype.focus = function () {
            this.tree.DOMFocus();
        };
        ReferenceWidget.prototype.showReferencePreview = function (reference) {
            var _this = this;
            // show in editor
            this.editorService.resolveEditorModel({ resource: reference.resource }).done(function (model) {
                if (model) {
                    _this.preview.setModel(model.textEditorModel);
                    var sel = range_1.Range.lift(reference.range).collapseToStart();
                    _this.preview.setSelection(sel);
                    _this.preview.revealRangeInCenter(sel);
                }
                else {
                    _this.preview.setModel(_this.previewNotAvailableMessage);
                }
                // Update widget header
                if (reference.resource.scheme !== network.schemas.inMemory) {
                    _this.setTitle(reference.name, labels.getPathLabel(reference.directory, _this.contextService));
                }
                else {
                    _this.setTitle(nls.localize('peekView.alternateTitle', "References"));
                }
            }, errors.onUnexpectedError);
            // show in tree
            this.tree.reveal(reference)
                .then(function () {
                _this.tree.setSelection([reference]);
                _this.tree.setFocus(reference);
            })
                .done(null, errors.onUnexpectedError);
        };
        ReferenceWidget.prototype.dispose = function () {
            this.setModel(null);
            lifecycle.disposeAll([this.preview, this.previewNotAvailableMessage, this.tree]);
            _super.prototype.dispose.call(this);
        };
        ReferenceWidget.INNER_EDITOR_CONTEXT_KEY = 'inReferenceSearchEditor';
        ReferenceWidget.Events = {
            EditorDoubleClick: 'editorDoubleClick'
        };
        return ReferenceWidget;
    })(peekViewWidget.PeekViewWidget);
    exports.ReferenceWidget = ReferenceWidget;
});
//# sourceMappingURL=referenceSearchWidget.js.map