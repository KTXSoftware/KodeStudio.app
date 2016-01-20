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
define(["require", "exports", 'vs/editor/common/config/defaultConfig', 'vs/base/common/lifecycle', 'vs/base/common/objects', 'vs/editor/browser/widget/codeEditorWidget', 'vs/base/browser/dom', 'vs/base/common/eventEmitter', 'vs/editor/common/editorCommon', 'vs/base/browser/ui/sash/sash', 'vs/editor/common/viewLayout/viewLineParts', 'vs/base/common/async', 'vs/editor/common/core/range', 'vs/platform/instantiation/common/instantiation', 'vs/editor/common/viewLayout/viewLineRenderer', 'vs/css!./media/diffEditor'], function (require, exports, defaultConfig_1, Lifecycle, Objects, CodeEditorWidget, DomUtils, EventEmitter, EditorCommon, Sash, ViewLineParts, Schedulers, range_1, instantiation_1, viewLineRenderer_1) {
    var VisualEditorState = (function () {
        function VisualEditorState() {
            this._zones = [];
            this._zonesMap = {};
            this._decorations = [];
        }
        VisualEditorState.prototype.getForeignViewZones = function (allViewZones) {
            var _this = this;
            return allViewZones.filter(function (z) { return !_this._zonesMap[String(z.id)]; });
        };
        VisualEditorState.prototype.clean = function (editor) {
            var _this = this;
            // (1) View zones
            if (this._zones.length > 0) {
                editor.changeViewZones(function (viewChangeAccessor) {
                    for (var i = 0, length = _this._zones.length; i < length; i++) {
                        viewChangeAccessor.removeZone(_this._zones[i]);
                    }
                });
            }
            this._zones = [];
            this._zonesMap = {};
            // (2) Model decorations
            if (this._decorations.length > 0) {
                editor.changeDecorations(function (changeAccessor) {
                    changeAccessor.deltaDecorations(_this._decorations, []);
                });
            }
            this._decorations = [];
        };
        VisualEditorState.prototype.apply = function (editor, overviewRuler, newDecorations) {
            var _this = this;
            var i, length;
            // view zones
            editor.changeViewZones(function (viewChangeAccessor) {
                for (i = 0, length = _this._zones.length; i < length; i++) {
                    viewChangeAccessor.removeZone(_this._zones[i]);
                }
                _this._zones = [];
                _this._zonesMap = {};
                for (i = 0, length = newDecorations.zones.length; i < length; i++) {
                    newDecorations.zones[i].suppressMouseDown = true;
                    var zoneId = viewChangeAccessor.addZone(newDecorations.zones[i]);
                    _this._zones.push(zoneId);
                    _this._zonesMap[String(zoneId)] = true;
                }
            });
            // decorations
            this._decorations = editor.deltaDecorations(this._decorations, newDecorations.decorations);
            // overview ruler
            overviewRuler.setZones(newDecorations.overviewZones);
        };
        return VisualEditorState;
    })();
    var DIFF_EDITOR_ID = 0;
    var DiffEditorWidget = (function (_super) {
        __extends(DiffEditorWidget, _super);
        function DiffEditorWidget(domElement, options, instantiationService) {
            var _this = this;
            _super.call(this);
            this.id = (++DIFF_EDITOR_ID);
            this._domElement = domElement;
            options = options || {};
            this._theme = options.theme || defaultConfig_1.DefaultConfig.editor.theme;
            // renderSideBySide
            this._renderSideBySide = true;
            if (typeof options.renderSideBySide !== 'undefined') {
                this._renderSideBySide = options.renderSideBySide;
            }
            // ignoreTrimWhitespace
            this._ignoreTrimWhitespace = true;
            if (typeof options.ignoreTrimWhitespace !== 'undefined') {
                this._ignoreTrimWhitespace = options.ignoreTrimWhitespace;
            }
            this._updateDecorationsRunner = new Schedulers.RunOnceScheduler(function () { return _this._updateDecorations(); }, 0);
            this._toDispose = [];
            this._toDispose.push(this._updateDecorationsRunner);
            this._containerDomElement = document.createElement('div');
            this._containerDomElement.className = DiffEditorWidget._getClassName(this._theme, this._renderSideBySide);
            this._containerDomElement.style.position = 'relative';
            this._containerDomElement.style.height = '100%';
            this._domElement.appendChild(this._containerDomElement);
            this._overviewViewportDomElement = document.createElement('div');
            this._overviewViewportDomElement.className = 'diffViewport';
            this._overviewViewportDomElement.style.position = 'absolute';
            this._overviewDomElement = document.createElement('div');
            this._overviewDomElement.className = 'diffOverview';
            this._overviewDomElement.style.position = 'absolute';
            this._overviewDomElement.style.height = '100%';
            this._overviewDomElement.appendChild(this._overviewViewportDomElement);
            this._toDispose.push(DomUtils.addDisposableListener(this._overviewDomElement, 'mousedown', function (e) {
                _this.modifiedEditor.delegateVerticalScrollbarMouseDown(e);
            }));
            this._containerDomElement.appendChild(this._overviewDomElement);
            this._createLeftHandSide();
            this._createRightHandSide();
            this._beginUpdateDecorationsTimeout = -1;
            this._currentlyChangingViewZones = false;
            this._diffComputationToken = 0;
            this._originalEditorState = new VisualEditorState();
            this._modifiedEditorState = new VisualEditorState();
            this._isVisible = true;
            this._isHandlingScrollEvent = false;
            this._width = 0;
            this._height = 0;
            this._lineChanges = null;
            this._createLeftHandSideEditor(options, instantiationService);
            this._createRightHandSideEditor(options, instantiationService);
            if (options.automaticLayout) {
                this._measureDomElementToken = window.setInterval(function () { return _this._measureDomElement(false); }, 100);
            }
            // enableSplitViewResizing
            this._enableSplitViewResizing = true;
            if (typeof options.enableSplitViewResizing !== 'undefined') {
                this._enableSplitViewResizing = options.enableSplitViewResizing;
            }
            if (this._renderSideBySide) {
                this._setStrategy(new DiffEdtorWidgetSideBySide(this._createDataSource(), this._enableSplitViewResizing));
            }
            else {
                this._setStrategy(new DiffEdtorWidgetInline(this._createDataSource(), this._enableSplitViewResizing));
            }
        }
        Object.defineProperty(DiffEditorWidget.prototype, "ignoreTrimWhitespace", {
            get: function () {
                return this._ignoreTrimWhitespace;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DiffEditorWidget.prototype, "renderSideBySide", {
            get: function () {
                return this._renderSideBySide;
            },
            enumerable: true,
            configurable: true
        });
        DiffEditorWidget._getClassName = function (theme, renderSideBySide) {
            var result = 'monaco-diff-editor monaco-editor-background ';
            if (renderSideBySide) {
                result += 'side-by-side ';
            }
            result += theme;
            return result;
        };
        DiffEditorWidget.prototype._recreateOverviewRulers = function () {
            if (this._originalOverviewRuler) {
                this._overviewDomElement.removeChild(this._originalOverviewRuler.getDomNode());
                this._originalOverviewRuler.dispose();
            }
            this._originalOverviewRuler = this.originalEditor.getView().createOverviewRuler('original diffOverviewRuler', 4, Number.MAX_VALUE);
            this._overviewDomElement.appendChild(this._originalOverviewRuler.getDomNode());
            if (this._modifiedOverviewRuler) {
                this._overviewDomElement.removeChild(this._modifiedOverviewRuler.getDomNode());
                this._modifiedOverviewRuler.dispose();
            }
            this._modifiedOverviewRuler = this.modifiedEditor.getView().createOverviewRuler('modified diffOverviewRuler', 4, Number.MAX_VALUE);
            this._overviewDomElement.appendChild(this._modifiedOverviewRuler.getDomNode());
            this._layoutOverviewRulers();
        };
        DiffEditorWidget.prototype._createLeftHandSide = function () {
            this._originalDomNode = document.createElement('div');
            this._originalDomNode.className = 'editor original';
            this._originalDomNode.style.position = 'absolute';
            this._originalDomNode.style.height = '100%';
            this._containerDomElement.appendChild(this._originalDomNode);
        };
        DiffEditorWidget.prototype._createRightHandSide = function () {
            this._modifiedDomNode = document.createElement('div');
            this._modifiedDomNode.className = 'editor modified';
            this._modifiedDomNode.style.position = 'absolute';
            this._modifiedDomNode.style.height = '100%';
            this._containerDomElement.appendChild(this._modifiedDomNode);
        };
        DiffEditorWidget.prototype._createLeftHandSideEditor = function (options, instantiationService) {
            var _this = this;
            this.originalEditor = instantiationService.createInstance(CodeEditorWidget.CodeEditorWidget, this._originalDomNode, this._adjustOptionsForLeftHandSide(options)); //TS bug: IDiffEditorOptions are not compatable with IEditorCreationOptions
            this._toDispose.push(this.originalEditor.addBulkListener2(function (events) { return _this._onOriginalEditorEvents(events); }));
            this._toDispose.push(this.addEmitter2(this.originalEditor, 'leftHandSide'));
        };
        DiffEditorWidget.prototype._createRightHandSideEditor = function (options, instantiationService) {
            var _this = this;
            this.modifiedEditor = instantiationService.createInstance(CodeEditorWidget.CodeEditorWidget, this._modifiedDomNode, this._adjustOptionsForRightHandSide(options)); //TS bug: IDiffEditorOptions are not compatable with IEditorCreationOptions
            this._toDispose.push(this.modifiedEditor.addBulkListener2(function (events) { return _this._onModifiedEditorEvents(events); }));
            this._toDispose.push(this.addEmitter2(this.modifiedEditor, 'rightHandSide'));
        };
        DiffEditorWidget.prototype.destroy = function () {
            this.dispose();
        };
        DiffEditorWidget.prototype.dispose = function () {
            this._toDispose = Lifecycle.disposeAll(this._toDispose);
            window.clearInterval(this._measureDomElementToken);
            this._cleanViewZonesAndDecorations();
            this._originalOverviewRuler.dispose();
            this._modifiedOverviewRuler.dispose();
            this.originalEditor.destroy();
            this.modifiedEditor.destroy();
            this._strategy.dispose();
            _super.prototype.dispose.call(this);
        };
        //------------ begin IDiffEditor methods
        DiffEditorWidget.prototype.getId = function () {
            return this.getEditorType() + ':' + this.id;
        };
        DiffEditorWidget.prototype.getEditorType = function () {
            return EditorCommon.EditorType.IDiffEditor;
        };
        DiffEditorWidget.prototype.getLineChanges = function () {
            return this._lineChanges;
        };
        DiffEditorWidget.prototype.getOriginalEditor = function () {
            return this.originalEditor;
        };
        DiffEditorWidget.prototype.getModifiedEditor = function () {
            return this.modifiedEditor;
        };
        DiffEditorWidget.prototype.updateOptions = function (newOptions) {
            // Handle new theme
            this._theme = newOptions && newOptions.theme ? newOptions.theme : this._theme;
            // Handle side by side
            var renderSideBySideChanged = false;
            if (typeof newOptions.renderSideBySide !== 'undefined') {
                if (this._renderSideBySide !== newOptions.renderSideBySide) {
                    this._renderSideBySide = newOptions.renderSideBySide;
                    renderSideBySideChanged = true;
                }
            }
            if (typeof newOptions.ignoreTrimWhitespace !== 'undefined') {
                if (this._ignoreTrimWhitespace !== newOptions.ignoreTrimWhitespace) {
                    this._ignoreTrimWhitespace = newOptions.ignoreTrimWhitespace;
                    // Begin comparing
                    this._beginUpdateDecorations();
                }
            }
            // Update class name
            this._containerDomElement.className = DiffEditorWidget._getClassName(this._theme, this._renderSideBySide);
            this.modifiedEditor.updateOptions(this._adjustOptionsForRightHandSide(newOptions));
            this.originalEditor.updateOptions(this._adjustOptionsForLeftHandSide(newOptions));
            // enableSplitViewResizing
            if (typeof newOptions.enableSplitViewResizing !== 'undefined') {
                this._enableSplitViewResizing = newOptions.enableSplitViewResizing;
            }
            this._strategy.setEnableSplitViewResizing(this._enableSplitViewResizing);
            // renderSideBySide
            if (renderSideBySideChanged) {
                if (this._renderSideBySide) {
                    this._setStrategy(new DiffEdtorWidgetSideBySide(this._createDataSource(), this._enableSplitViewResizing));
                }
                else {
                    this._setStrategy(new DiffEdtorWidgetInline(this._createDataSource(), this._enableSplitViewResizing));
                }
            }
        };
        DiffEditorWidget.prototype.getValue = function (options) {
            if (options === void 0) { options = null; }
            return this.modifiedEditor.getValue(options);
        };
        DiffEditorWidget.prototype.getModel = function () {
            return {
                original: this.originalEditor.getModel(),
                modified: this.modifiedEditor.getModel()
            };
        };
        DiffEditorWidget.prototype.setModel = function (model) {
            // Guard us against partial null model
            if (model && (!model.original || !model.modified)) {
                throw new Error(!model.original ? 'DiffEditorWidget.setModel: Original model is null' : 'DiffEditorWidget.setModel: Modified model is null');
            }
            // Remove all view zones & decorations
            this._cleanViewZonesAndDecorations();
            // Update code editor models
            this.originalEditor.setModel(model ? model.original : null);
            this.modifiedEditor.setModel(model ? model.modified : null);
            this._updateDecorationsRunner.cancel();
            if (model) {
                this.originalEditor.setScrollTop(0);
                this.modifiedEditor.setScrollTop(0);
            }
            // Disable any diff computations that will come in
            this._lineChanges = null;
            this._diffComputationToken++;
            if (model) {
                this._recreateOverviewRulers();
                // Begin comparing
                this._beginUpdateDecorations();
            }
            else {
                this._lineChanges = null;
            }
            this._layoutOverviewViewport();
        };
        DiffEditorWidget.prototype.getDomNode = function () {
            return this._domElement;
        };
        DiffEditorWidget.prototype.getVisibleColumnFromPosition = function (position) {
            return this.modifiedEditor.getVisibleColumnFromPosition(position);
        };
        DiffEditorWidget.prototype.getPosition = function () {
            return this.modifiedEditor.getPosition();
        };
        DiffEditorWidget.prototype.setPosition = function (position, reveal, revealVerticalInCenter, revealHorizontal) {
            this.modifiedEditor.setPosition(position, reveal, revealVerticalInCenter, revealHorizontal);
        };
        DiffEditorWidget.prototype.revealLine = function (lineNumber) {
            this.modifiedEditor.revealLine(lineNumber);
        };
        DiffEditorWidget.prototype.revealLineInCenter = function (lineNumber) {
            this.modifiedEditor.revealLineInCenter(lineNumber);
        };
        DiffEditorWidget.prototype.revealLineInCenterIfOutsideViewport = function (lineNumber) {
            this.modifiedEditor.revealLineInCenterIfOutsideViewport(lineNumber);
        };
        DiffEditorWidget.prototype.revealPosition = function (position, revealVerticalInCenter, revealHorizontal) {
            if (revealVerticalInCenter === void 0) { revealVerticalInCenter = false; }
            if (revealHorizontal === void 0) { revealHorizontal = false; }
            this.modifiedEditor.revealPosition(position, revealVerticalInCenter, revealHorizontal);
        };
        DiffEditorWidget.prototype.revealPositionInCenter = function (position) {
            this.modifiedEditor.revealPositionInCenter(position);
        };
        DiffEditorWidget.prototype.revealPositionInCenterIfOutsideViewport = function (position) {
            this.modifiedEditor.revealPositionInCenterIfOutsideViewport(position);
        };
        DiffEditorWidget.prototype.getSelection = function () {
            return this.modifiedEditor.getSelection();
        };
        DiffEditorWidget.prototype.getSelections = function () {
            return this.modifiedEditor.getSelections();
        };
        DiffEditorWidget.prototype.setSelection = function (something, reveal, revealVerticalInCenter, revealHorizontal) {
            this.modifiedEditor.setSelection(something, reveal, revealVerticalInCenter, revealHorizontal);
        };
        DiffEditorWidget.prototype.setSelections = function (ranges) {
            this.modifiedEditor.setSelections(ranges);
        };
        DiffEditorWidget.prototype.revealLines = function (startLineNumber, endLineNumber) {
            this.modifiedEditor.revealLines(startLineNumber, endLineNumber);
        };
        DiffEditorWidget.prototype.revealLinesInCenter = function (startLineNumber, endLineNumber) {
            this.modifiedEditor.revealLinesInCenter(startLineNumber, endLineNumber);
        };
        DiffEditorWidget.prototype.revealLinesInCenterIfOutsideViewport = function (startLineNumber, endLineNumber) {
            this.modifiedEditor.revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber);
        };
        DiffEditorWidget.prototype.revealRange = function (range, revealVerticalInCenter, revealHorizontal) {
            if (revealVerticalInCenter === void 0) { revealVerticalInCenter = false; }
            if (revealHorizontal === void 0) { revealHorizontal = true; }
            this.modifiedEditor.revealRange(range, revealVerticalInCenter, revealHorizontal);
        };
        DiffEditorWidget.prototype.revealRangeInCenter = function (range) {
            this.modifiedEditor.revealRangeInCenter(range);
        };
        DiffEditorWidget.prototype.revealRangeInCenterIfOutsideViewport = function (range) {
            this.modifiedEditor.revealRangeInCenterIfOutsideViewport(range);
        };
        DiffEditorWidget.prototype.addAction = function (descriptor) {
            this.modifiedEditor.addAction(descriptor);
        };
        DiffEditorWidget.prototype.getActions = function () {
            return this.modifiedEditor.getActions();
        };
        DiffEditorWidget.prototype.getAction = function (id) {
            return this.modifiedEditor.getAction(id);
        };
        DiffEditorWidget.prototype.saveViewState = function () {
            var originalViewState = this.originalEditor.saveViewState();
            var modifiedViewState = this.modifiedEditor.saveViewState();
            return {
                original: originalViewState,
                modified: modifiedViewState
            };
        };
        DiffEditorWidget.prototype.restoreViewState = function (state) {
            var s = state;
            if (s.original && s.original) {
                var diffEditorState = s;
                this.originalEditor.restoreViewState(diffEditorState.original);
                this.modifiedEditor.restoreViewState(diffEditorState.modified);
            }
        };
        DiffEditorWidget.prototype.layout = function (dimension) {
            this._measureDomElement(false, dimension);
        };
        DiffEditorWidget.prototype.focus = function () {
            this.modifiedEditor.focus();
        };
        DiffEditorWidget.prototype.isFocused = function () {
            return this.originalEditor.isFocused() || this.modifiedEditor.isFocused();
        };
        DiffEditorWidget.prototype.onVisible = function () {
            this._isVisible = true;
            this.originalEditor.onVisible();
            this.modifiedEditor.onVisible();
            // Begin comparing
            this._beginUpdateDecorations();
        };
        DiffEditorWidget.prototype.onHide = function () {
            this._isVisible = false;
            this.originalEditor.onHide();
            this.modifiedEditor.onHide();
            // Remove all view zones & decorations
            this._cleanViewZonesAndDecorations();
        };
        DiffEditorWidget.prototype.trigger = function (source, handlerId, payload) {
            this.modifiedEditor.trigger(source, handlerId, payload);
        };
        DiffEditorWidget.prototype.changeDecorations = function (callback) {
            return this.modifiedEditor.changeDecorations(callback);
        };
        //------------ end IDiffEditor methods
        //------------ begin layouting methods
        DiffEditorWidget.prototype._measureDomElement = function (forceDoLayoutCall, dimensions) {
            dimensions = dimensions || DomUtils.getDomNodePosition(this._containerDomElement);
            if (dimensions.width <= 0) {
                return;
            }
            if (!forceDoLayoutCall && dimensions.width === this._width && dimensions.height === this._height) {
                // Nothing has changed
                return;
            }
            this._width = dimensions.width;
            this._height = dimensions.height;
            this._doLayout();
        };
        DiffEditorWidget.prototype._layoutOverviewRulers = function () {
            var freeSpace = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH - 2 * DiffEditorWidget.ONE_OVERVIEW_WIDTH;
            var layoutInfo = this.modifiedEditor.getLayoutInfo();
            if (layoutInfo) {
                this._originalOverviewRuler.setLayout({
                    top: 0,
                    width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    right: freeSpace + DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    height: this._height - layoutInfo.horizontalScrollbarHeight
                });
                this._modifiedOverviewRuler.setLayout({
                    top: 0,
                    right: 0,
                    width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    height: this._height - layoutInfo.horizontalScrollbarHeight
                });
            }
        };
        //------------ end layouting methods
        DiffEditorWidget.prototype._recomputeIfNecessary = function (events) {
            var _this = this;
            var changed = false;
            for (var i = 0; !changed && i < events.length; i++) {
                var type = events[i].getType();
                changed = changed || type === 'change' || type === EditorCommon.EventType.ModelModeChanged;
            }
            if (changed && this._isVisible) {
                // Clear previous timeout if necessary
                if (this._beginUpdateDecorationsTimeout !== -1) {
                    window.clearTimeout(this._beginUpdateDecorationsTimeout);
                    this._beginUpdateDecorationsTimeout = -1;
                }
                this._beginUpdateDecorationsTimeout = window.setTimeout(function () { return _this._beginUpdateDecorations(); }, DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY);
            }
        };
        DiffEditorWidget.prototype._onOriginalEditorEvents = function (events) {
            for (var i = 0; i < events.length; i++) {
                if (events[i].getType() === 'scroll') {
                    this._onOriginalEditorScroll(events[i].getData());
                }
                if (events[i].getType() === EditorCommon.EventType.ViewZonesChanged) {
                    this._onViewZonesChanged();
                }
            }
            this._recomputeIfNecessary(events);
        };
        DiffEditorWidget.prototype._onModifiedEditorEvents = function (events) {
            for (var i = 0; i < events.length; i++) {
                if (events[i].getType() === 'scroll') {
                    this._onModifiedEditorScroll(events[i].getData());
                    this._layoutOverviewViewport();
                }
                if (events[i].getType() === 'scrollSize') {
                    this._layoutOverviewViewport();
                }
                if (events[i].getType() === 'viewLayoutChanged') {
                    this._layoutOverviewViewport();
                }
                if (events[i].getType() === EditorCommon.EventType.ViewZonesChanged) {
                    this._onViewZonesChanged();
                }
            }
            this._recomputeIfNecessary(events);
        };
        DiffEditorWidget.prototype._onViewZonesChanged = function () {
            if (this._currentlyChangingViewZones) {
                return;
            }
            this._updateDecorationsRunner.schedule();
        };
        DiffEditorWidget.prototype._beginUpdateDecorations = function () {
            var _this = this;
            this._beginUpdateDecorationsTimeout = -1;
            if (!this.modifiedEditor.getModel()) {
                return;
            }
            // Prevent old diff requests to come if a new request has been initiated
            // The best method would be to call cancel on the Promise, but this is not
            // yet supported, so using tokens for now.
            this._diffComputationToken++;
            var currentToken = this._diffComputationToken;
            var currentOriginalModel = this.originalEditor.getModel();
            var currentModifiedModel = this.modifiedEditor.getModel();
            var diffSupport = this.modifiedEditor.getModel().getMode().diffSupport;
            if (!diffSupport) {
                // no diffing support
                this._lineChanges = null;
                this._updateDecorationsRunner.schedule();
            }
            else {
                try {
                    diffSupport.computeDiff(currentOriginalModel.getAssociatedResource(), currentModifiedModel.getAssociatedResource(), this._ignoreTrimWhitespace).then(function (result) {
                        if (currentToken === _this._diffComputationToken
                            && currentOriginalModel === _this.originalEditor.getModel()
                            && currentModifiedModel === _this.modifiedEditor.getModel()) {
                            _this._lineChanges = result;
                            _this._updateDecorationsRunner.schedule();
                            _this.emit(EditorCommon.EventType.DiffUpdated, { editor: _this, lineChanges: result });
                        }
                    }, function (error) {
                        if (currentToken === _this._diffComputationToken
                            && currentOriginalModel === _this.originalEditor.getModel()
                            && currentModifiedModel === _this.modifiedEditor.getModel()) {
                            _this._lineChanges = null;
                            _this._updateDecorationsRunner.schedule();
                        }
                    });
                }
                catch (e) {
                    console.error(e);
                    this._lineChanges = null;
                    this._updateDecorationsRunner.schedule();
                }
            }
        };
        DiffEditorWidget.prototype._cleanViewZonesAndDecorations = function () {
            this._originalEditorState.clean(this.originalEditor);
            this._modifiedEditorState.clean(this.modifiedEditor);
        };
        DiffEditorWidget.prototype._updateDecorations = function () {
            var lineChanges = this._lineChanges || [];
            var foreignOriginal = this._originalEditorState.getForeignViewZones(this.originalEditor.getWhitespaces());
            var foreignModified = this._modifiedEditorState.getForeignViewZones(this.modifiedEditor.getWhitespaces());
            var diffDecorations = this._strategy.getEditorsDiffDecorations(lineChanges, this._ignoreTrimWhitespace, foreignOriginal, foreignModified, this.originalEditor, this.modifiedEditor);
            try {
                this._currentlyChangingViewZones = true;
                this._originalEditorState.apply(this.originalEditor, this._originalOverviewRuler, diffDecorations.original);
                this._modifiedEditorState.apply(this.modifiedEditor, this._modifiedOverviewRuler, diffDecorations.modified);
            }
            finally {
                this._currentlyChangingViewZones = false;
            }
        };
        DiffEditorWidget.prototype._adjustOptionsForLeftHandSide = function (options) {
            var clonedOptions = Objects.clone(options || {});
            clonedOptions.wrappingColumn = -1;
            clonedOptions.readOnly = true;
            clonedOptions.automaticLayout = false;
            clonedOptions.scrollbar = clonedOptions.scrollbar || {};
            clonedOptions.scrollbar.vertical = 'visible';
            clonedOptions.overviewRulerLanes = 1;
            clonedOptions.theme = this._theme + ' original-in-monaco-diff-editor';
            return clonedOptions;
        };
        DiffEditorWidget.prototype._adjustOptionsForRightHandSide = function (options) {
            var clonedOptions = Objects.clone(options || {});
            clonedOptions.wrappingColumn = -1;
            clonedOptions.automaticLayout = false;
            clonedOptions.revealHorizontalRightPadding = defaultConfig_1.DefaultConfig.editor.revealHorizontalRightPadding + DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
            clonedOptions.scrollbar = clonedOptions.scrollbar || {};
            clonedOptions.scrollbar.vertical = 'visible';
            clonedOptions.scrollbar.verticalHasArrows = false;
            clonedOptions.theme = this._theme + ' modified-in-monaco-diff-editor';
            return clonedOptions;
        };
        DiffEditorWidget.prototype._onOriginalEditorScroll = function (e) {
            if (this._isHandlingScrollEvent) {
                return;
            }
            this._isHandlingScrollEvent = true;
            this.modifiedEditor.setScrollLeft(e.scrollLeft);
            this.modifiedEditor.setScrollTop(e.scrollTop);
            this._isHandlingScrollEvent = false;
        };
        DiffEditorWidget.prototype._onModifiedEditorScroll = function (e) {
            if (this._isHandlingScrollEvent) {
                return;
            }
            this._isHandlingScrollEvent = true;
            this.originalEditor.setScrollLeft(e.scrollLeft);
            this.originalEditor.setScrollTop(e.scrollTop);
            this._isHandlingScrollEvent = false;
        };
        DiffEditorWidget.prototype._doLayout = function () {
            var splitPoint = this._strategy.layout();
            this._originalDomNode.style.width = splitPoint + 'px';
            this._originalDomNode.style.left = '0px';
            this._modifiedDomNode.style.width = (this._width - splitPoint) + 'px';
            this._modifiedDomNode.style.left = splitPoint + 'px';
            this._overviewDomElement.style.top = '0px';
            this._overviewDomElement.style.width = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px';
            this._overviewDomElement.style.left = (this._width - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH) + 'px';
            this._overviewViewportDomElement.style.width = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px';
            this._overviewViewportDomElement.style.height = '30px';
            this.originalEditor.layout({ width: splitPoint, height: this._height });
            this.modifiedEditor.layout({ width: this._width - splitPoint - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH, height: this._height });
            if (this._originalOverviewRuler || this._modifiedOverviewRuler) {
                this._layoutOverviewRulers();
            }
            this._layoutOverviewViewport();
        };
        DiffEditorWidget.prototype._layoutOverviewViewport = function () {
            var layout = this._computeOverviewViewport();
            if (!layout) {
                DomUtils.StyleMutator.setTop(this._overviewViewportDomElement, 0);
                DomUtils.StyleMutator.setHeight(this._overviewViewportDomElement, 0);
            }
            else {
                DomUtils.StyleMutator.setTop(this._overviewViewportDomElement, layout.top);
                DomUtils.StyleMutator.setHeight(this._overviewViewportDomElement, layout.height);
            }
        };
        DiffEditorWidget.prototype._computeOverviewViewport = function () {
            var layoutInfo = this.modifiedEditor.getLayoutInfo();
            if (!layoutInfo) {
                return null;
            }
            var scrollTop = this.modifiedEditor.getScrollTop();
            var scrollHeight = this.modifiedEditor.getScrollHeight();
            var computedAvailableSize = Math.max(0, layoutInfo.contentHeight - layoutInfo.horizontalScrollbarHeight);
            var computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * 0);
            var computedRatio = scrollHeight > 0 ? (computedRepresentableSize / scrollHeight) : 0;
            var computedSliderSize = Math.max(1, Math.floor(layoutInfo.contentHeight * computedRatio));
            var computedSliderPosition = Math.floor(scrollTop * computedRatio);
            return {
                height: computedSliderSize,
                top: computedSliderPosition
            };
        };
        DiffEditorWidget.prototype._createDataSource = function () {
            var _this = this;
            return {
                getWidth: function () {
                    return _this._width;
                },
                getHeight: function () {
                    return _this._height;
                },
                getContainerDomNode: function () {
                    return _this._containerDomElement;
                },
                relayoutEditors: function () {
                    _this._doLayout();
                },
                getOriginalEditor: function () {
                    return _this.originalEditor;
                },
                getModifiedEditor: function () {
                    return _this.modifiedEditor;
                }
            };
        };
        DiffEditorWidget.prototype._setStrategy = function (newStrategy) {
            if (this._strategy) {
                this._strategy.dispose();
            }
            this._strategy = newStrategy;
            if (this._lineChanges) {
                this._updateDecorations();
            }
            // Just do a layout, the strategy might need it
            this._measureDomElement(true);
        };
        DiffEditorWidget.prototype._getLineChangeAtOrBeforeLineNumber = function (lineNumber, startLineNumberExtractor) {
            if (this._lineChanges.length === 0 || lineNumber < startLineNumberExtractor(this._lineChanges[0])) {
                // There are no changes or `lineNumber` is before the first change
                return null;
            }
            var min = 0, max = this._lineChanges.length - 1;
            while (min < max) {
                var mid = Math.floor((min + max) / 2);
                var midStart = startLineNumberExtractor(this._lineChanges[mid]);
                var midEnd = (mid + 1 <= max ? startLineNumberExtractor(this._lineChanges[mid + 1]) : Number.MAX_VALUE);
                if (lineNumber < midStart) {
                    max = mid - 1;
                }
                else if (lineNumber >= midEnd) {
                    min = mid + 1;
                }
                else {
                    // HIT!
                    min = mid;
                    max = mid;
                }
            }
            return this._lineChanges[min];
        };
        DiffEditorWidget.prototype._getEquivalentLineForOriginalLineNumber = function (lineNumber) {
            var lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, function (lineChange) { return lineChange.originalStartLineNumber; });
            if (!lineChange) {
                return lineNumber;
            }
            var originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
            var modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
            var lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
            var lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
            var delta = lineNumber - originalEquivalentLineNumber;
            if (delta <= lineChangeOriginalLength) {
                return modifiedEquivalentLineNumber + Math.min(delta, lineChangeModifiedLength);
            }
            return modifiedEquivalentLineNumber + lineChangeModifiedLength - lineChangeOriginalLength + delta;
        };
        DiffEditorWidget.prototype._getEquivalentLineForModifiedLineNumber = function (lineNumber) {
            var lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, function (lineChange) { return lineChange.modifiedStartLineNumber; });
            if (!lineChange) {
                return lineNumber;
            }
            var originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
            var modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
            var lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
            var lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
            var delta = lineNumber - modifiedEquivalentLineNumber;
            if (delta <= lineChangeModifiedLength) {
                return originalEquivalentLineNumber + Math.min(delta, lineChangeOriginalLength);
            }
            return originalEquivalentLineNumber + lineChangeOriginalLength - lineChangeModifiedLength + delta;
        };
        DiffEditorWidget.prototype.getDiffLineInformationForOriginal = function (lineNumber) {
            if (!this._lineChanges) {
                // Cannot answer that which I don't know
                return null;
            }
            return {
                equivalentLineNumber: this._getEquivalentLineForOriginalLineNumber(lineNumber)
            };
        };
        DiffEditorWidget.prototype.getDiffLineInformationForModified = function (lineNumber) {
            if (!this._lineChanges) {
                // Cannot answer that which I don't know
                return null;
            }
            return {
                equivalentLineNumber: this._getEquivalentLineForModifiedLineNumber(lineNumber)
            };
        };
        DiffEditorWidget.ONE_OVERVIEW_WIDTH = 15;
        DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH = 30;
        DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY = 200; // ms
        DiffEditorWidget = __decorate([
            __param(2, instantiation_1.IInstantiationService)
        ], DiffEditorWidget);
        return DiffEditorWidget;
    })(EventEmitter.EventEmitter);
    exports.DiffEditorWidget = DiffEditorWidget;
    var DiffEditorWidgetStyle = (function () {
        function DiffEditorWidgetStyle(dataSource) {
            this._dataSource = dataSource;
        }
        DiffEditorWidgetStyle.prototype.getEditorsDiffDecorations = function (lineChanges, ignoreTrimWhitespace, originalWhitespaces, modifiedWhitespaces, originalEditor, modifiedEditor) {
            // Get view zones
            modifiedWhitespaces = modifiedWhitespaces.sort(function (a, b) {
                return a.afterLineNumber - b.afterLineNumber;
            });
            originalWhitespaces = originalWhitespaces.sort(function (a, b) {
                return a.afterLineNumber - b.afterLineNumber;
            });
            var zones = this._getViewZones(lineChanges, originalWhitespaces, modifiedWhitespaces, originalEditor, modifiedEditor);
            // Get decorations & overview ruler zones
            var originalDecorations = this._getOriginalEditorDecorations(lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor);
            var modifiedDecorations = this._getModifiedEditorDecorations(lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor);
            return {
                original: {
                    decorations: originalDecorations.decorations,
                    overviewZones: originalDecorations.overviewZones,
                    zones: zones.original
                },
                modified: {
                    decorations: modifiedDecorations.decorations,
                    overviewZones: modifiedDecorations.overviewZones,
                    zones: zones.modified
                }
            };
        };
        DiffEditorWidgetStyle.prototype._getViewZones = function (lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
            return null;
        };
        DiffEditorWidgetStyle.prototype._getOriginalEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            return null;
        };
        DiffEditorWidgetStyle.prototype._getModifiedEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            return null;
        };
        return DiffEditorWidgetStyle;
    })();
    var ForeignViewZonesIterator = (function () {
        function ForeignViewZonesIterator(source) {
            this._source = source;
            this._index = -1;
            this.advance();
        }
        ForeignViewZonesIterator.prototype.advance = function () {
            this._index++;
            if (this._index < this._source.length) {
                this.current = this._source[this._index];
            }
            else {
                this.current = null;
            }
        };
        return ForeignViewZonesIterator;
    })();
    var ViewZonesComputer = (function () {
        function ViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ) {
            this.lineChanges = lineChanges;
            this.originalForeignVZ = originalForeignVZ;
            this.modifiedForeignVZ = modifiedForeignVZ;
        }
        ViewZonesComputer.prototype.getViewZones = function () {
            var result = {
                original: [],
                modified: []
            };
            var i, length, lineChange;
            var stepOriginal, stepModified, stepOriginalIndex, stepModifiedIndex, lineChangeModifiedLength = 0, lineChangeOriginalLength = 0, originalEquivalentLineNumber = 0, modifiedEquivalentLineNumber = 0, originalEndEquivalentLineNumber = 0, modifiedEndEquivalentLineNumber = 0, viewZoneLineNumber = 0;
            var sortMyViewZones = function (a, b) {
                return a.afterLineNumber - b.afterLineNumber;
            };
            var addAndCombineIfPossible = function (destination, item) {
                if (item.domNode === null && destination.length > 0) {
                    var lastItem = destination[destination.length - 1];
                    if (lastItem.afterLineNumber === item.afterLineNumber && lastItem.domNode === null) {
                        lastItem.heightInLines += item.heightInLines;
                        return;
                    }
                }
                destination.push(item);
            };
            var modifiedForeignVZ = new ForeignViewZonesIterator(this.modifiedForeignVZ);
            var originalForeignVZ = new ForeignViewZonesIterator(this.originalForeignVZ);
            // In order to include foreign view zones after the last line change, the for loop will iterate once more after the end of the `lineChanges` array
            for (i = 0, length = this.lineChanges.length; i <= length; i++) {
                lineChange = (i < length ? this.lineChanges[i] : null);
                if (lineChange !== null) {
                    originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
                    modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
                    lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
                    lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
                    originalEndEquivalentLineNumber = Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber);
                    modifiedEndEquivalentLineNumber = Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber);
                }
                else {
                    // Increase to very large value to get the producing tests of foreign view zones running
                    originalEquivalentLineNumber += 10000000 + lineChangeOriginalLength;
                    modifiedEquivalentLineNumber += 10000000 + lineChangeModifiedLength;
                    originalEndEquivalentLineNumber = originalEquivalentLineNumber;
                    modifiedEndEquivalentLineNumber = modifiedEquivalentLineNumber;
                }
                // Each step produces view zones, and after producing them, we try to cancel them out, to avoid empty-empty view zone cases
                stepOriginal = [];
                stepModified = [];
                // ---------------------------- PRODUCE VIEW ZONES
                // [PRODUCE] View zone(s) in original-side due to foreign view zone(s) in modified-side
                while (modifiedForeignVZ.current && modifiedForeignVZ.current.afterLineNumber <= modifiedEndEquivalentLineNumber) {
                    if (modifiedForeignVZ.current.afterLineNumber <= modifiedEquivalentLineNumber) {
                        viewZoneLineNumber = originalEquivalentLineNumber - modifiedEquivalentLineNumber + modifiedForeignVZ.current.afterLineNumber;
                    }
                    else {
                        viewZoneLineNumber = originalEndEquivalentLineNumber;
                    }
                    stepOriginal.push({
                        afterLineNumber: viewZoneLineNumber,
                        heightInLines: modifiedForeignVZ.current.heightInLines,
                        domNode: null
                    });
                    modifiedForeignVZ.advance();
                }
                // [PRODUCE] View zone(s) in modified-side due to foreign view zone(s) in original-side
                while (originalForeignVZ.current && originalForeignVZ.current.afterLineNumber <= originalEndEquivalentLineNumber) {
                    if (originalForeignVZ.current.afterLineNumber <= originalEquivalentLineNumber) {
                        viewZoneLineNumber = modifiedEquivalentLineNumber - originalEquivalentLineNumber + originalForeignVZ.current.afterLineNumber;
                    }
                    else {
                        viewZoneLineNumber = modifiedEndEquivalentLineNumber;
                    }
                    stepModified.push({
                        afterLineNumber: viewZoneLineNumber,
                        heightInLines: originalForeignVZ.current.heightInLines,
                        domNode: null
                    });
                    originalForeignVZ.advance();
                }
                if (lineChange !== null && isChangeOrInsert(lineChange)) {
                    var r = this._produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                    if (r) {
                        stepOriginal.push(r);
                    }
                }
                if (lineChange !== null && isChangeOrDelete(lineChange)) {
                    var r = this._produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                    if (r) {
                        stepModified.push(r);
                    }
                }
                // ---------------------------- END PRODUCE VIEW ZONES
                // ---------------------------- EMIT MINIMAL VIEW ZONES
                // [CANCEL & EMIT] Try to cancel view zones out
                stepOriginalIndex = 0;
                stepModifiedIndex = 0;
                stepOriginal = stepOriginal.sort(sortMyViewZones);
                stepModified = stepModified.sort(sortMyViewZones);
                while (stepOriginalIndex < stepOriginal.length && stepModifiedIndex < stepModified.length) {
                    var original = stepOriginal[stepOriginalIndex];
                    var modified = stepModified[stepModifiedIndex];
                    var originalDelta = original.afterLineNumber - originalEquivalentLineNumber;
                    var modifiedDelta = modified.afterLineNumber - modifiedEquivalentLineNumber;
                    if (originalDelta < modifiedDelta) {
                        addAndCombineIfPossible(result.original, original);
                        stepOriginalIndex++;
                    }
                    else if (modifiedDelta < originalDelta) {
                        addAndCombineIfPossible(result.modified, modified);
                        stepModifiedIndex++;
                    }
                    else if (original.shouldNotShrink) {
                        addAndCombineIfPossible(result.original, original);
                        stepOriginalIndex++;
                    }
                    else if (modified.shouldNotShrink) {
                        addAndCombineIfPossible(result.modified, modified);
                        stepModifiedIndex++;
                    }
                    else {
                        if (original.heightInLines >= modified.heightInLines) {
                            // modified view zone gets removed
                            original.heightInLines -= modified.heightInLines;
                            stepModifiedIndex++;
                        }
                        else {
                            // original view zone gets removed
                            modified.heightInLines -= original.heightInLines;
                            stepOriginalIndex++;
                        }
                    }
                }
                // [EMIT] Remaining original view zones
                while (stepOriginalIndex < stepOriginal.length) {
                    addAndCombineIfPossible(result.original, stepOriginal[stepOriginalIndex]);
                    stepOriginalIndex++;
                }
                // [EMIT] Remaining modified view zones
                while (stepModifiedIndex < stepModified.length) {
                    addAndCombineIfPossible(result.modified, stepModified[stepModifiedIndex]);
                    stepModifiedIndex++;
                }
            }
            var ensureDomNode = function (z) {
                if (!z.domNode) {
                    z.domNode = createFakeLinesDiv();
                }
            };
            result.original.forEach(ensureDomNode);
            result.modified.forEach(ensureDomNode);
            return result;
        };
        ViewZonesComputer.prototype._produceOriginalFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            throw new Error('NotImplemented');
        };
        ViewZonesComputer.prototype._produceModifiedFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            throw new Error('NotImplemented');
        };
        return ViewZonesComputer;
    })();
    var DiffEdtorWidgetSideBySide = (function (_super) {
        __extends(DiffEdtorWidgetSideBySide, _super);
        function DiffEdtorWidgetSideBySide(dataSource, enableSplitViewResizing) {
            var _this = this;
            _super.call(this, dataSource);
            this._disableSash = (enableSplitViewResizing === false);
            this._sashRatio = null;
            this._sashPosition = null;
            this._sash = new Sash.Sash(this._dataSource.getContainerDomNode(), this);
            if (this._disableSash) {
                this._sash.disable();
            }
            this._sash.on('start', function () { return _this._onSashDragStart(); });
            this._sash.on('change', function (e) { return _this._onSashDrag(e); });
            this._sash.on('end', function () { return _this._onSashDragEnd(); });
        }
        DiffEdtorWidgetSideBySide.prototype.dispose = function () {
            this._sash.dispose();
        };
        DiffEdtorWidgetSideBySide.prototype.setEnableSplitViewResizing = function (enableSplitViewResizing) {
            var newDisableSash = (enableSplitViewResizing === false);
            if (this._disableSash !== newDisableSash) {
                this._disableSash = newDisableSash;
                if (this._disableSash) {
                    this._sash.disable();
                }
                else {
                    this._sash.enable();
                }
            }
        };
        DiffEdtorWidgetSideBySide.prototype.layout = function (sashRatio) {
            if (sashRatio === void 0) { sashRatio = this._sashRatio; }
            var w = this._dataSource.getWidth();
            var contentWidth = w - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
            var sashPosition = Math.floor((sashRatio || 0.5) * contentWidth);
            var midPoint = Math.floor(0.5 * contentWidth);
            var sashPosition = this._disableSash ? midPoint : sashPosition || midPoint;
            if (contentWidth > DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH * 2) {
                if (sashPosition < DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                    sashPosition = DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
                }
                if (sashPosition > contentWidth - DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                    sashPosition = contentWidth - DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
                }
            }
            else {
                sashPosition = midPoint;
            }
            if (this._sashPosition !== sashPosition) {
                this._sashPosition = sashPosition;
                this._sash.layout();
            }
            return this._sashPosition;
        };
        DiffEdtorWidgetSideBySide.prototype._onSashDragStart = function () {
            this._startSashPosition = this._sashPosition;
        };
        DiffEdtorWidgetSideBySide.prototype._onSashDrag = function (e) {
            var w = this._dataSource.getWidth();
            var contentWidth = w - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
            var sashPosition = this.layout((this._startSashPosition + (e.currentX - e.startX)) / contentWidth);
            this._sashRatio = sashPosition / contentWidth;
            this._dataSource.relayoutEditors();
        };
        DiffEdtorWidgetSideBySide.prototype._onSashDragEnd = function () {
            this._sash.layout();
        };
        DiffEdtorWidgetSideBySide.prototype.getVerticalSashTop = function (sash) {
            return 0;
        };
        DiffEdtorWidgetSideBySide.prototype.getVerticalSashLeft = function (sash) {
            return this._sashPosition;
        };
        DiffEdtorWidgetSideBySide.prototype.getVerticalSashHeight = function (sash) {
            return this._dataSource.getHeight();
        };
        DiffEdtorWidgetSideBySide.prototype._getViewZones = function (lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
            var c = new SideBySideViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ);
            return c.getViewZones();
        };
        DiffEdtorWidgetSideBySide.prototype._getOriginalEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            var result = {
                decorations: [],
                overviewZones: []
            }, i, length, j, lengthJ, lineChange, charChange, lineNumber, startColumn, endColumn, originalModel = originalEditor.getModel();
            for (i = 0, length = lineChanges.length; i < length; i++) {
                lineChange = lineChanges[i];
                if (isChangeOrDelete(lineChange)) {
                    result.decorations.push(createDecoration(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, Number.MAX_VALUE, 'line-delete', true));
                    if (!isChangeOrInsert(lineChange) || !lineChange.charChanges) {
                        result.decorations.push(createDecoration(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, Number.MAX_VALUE, 'char-delete', true));
                    }
                    result.overviewZones.push({
                        startLineNumber: lineChange.originalStartLineNumber,
                        endLineNumber: lineChange.originalEndLineNumber,
                        color: 'rgba(255, 0, 0, 0.4)',
                        darkColor: 'rgba(255, 0, 0, 0.4)',
                        position: EditorCommon.OverviewRulerLane.Full
                    });
                    if (lineChange.charChanges) {
                        for (j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                            charChange = lineChange.charChanges[j];
                            if (isChangeOrDelete(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (lineNumber = charChange.originalStartLineNumber; lineNumber <= charChange.originalEndLineNumber; lineNumber++) {
                                        if (lineNumber === charChange.originalStartLineNumber) {
                                            startColumn = charChange.originalStartColumn;
                                        }
                                        else {
                                            startColumn = originalModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.originalEndLineNumber) {
                                            endColumn = charChange.originalEndColumn;
                                        }
                                        else {
                                            endColumn = originalModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, 'char-delete', false));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn, 'char-delete', false));
                                }
                            }
                        }
                    }
                }
            }
            return result;
        };
        DiffEdtorWidgetSideBySide.prototype._getModifiedEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            var result = {
                decorations: [],
                overviewZones: []
            }, i, length, j, lengthJ, lineChange, charChange, lineNumber, startColumn, endColumn, modifiedModel = modifiedEditor.getModel();
            for (i = 0, length = lineChanges.length; i < length; i++) {
                lineChange = lineChanges[i];
                if (isChangeOrInsert(lineChange)) {
                    result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, Number.MAX_VALUE, 'line-insert', true));
                    if (!isChangeOrDelete(lineChange) || !lineChange.charChanges) {
                        result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, Number.MAX_VALUE, 'char-insert', true));
                    }
                    result.overviewZones.push({
                        startLineNumber: lineChange.modifiedStartLineNumber,
                        endLineNumber: lineChange.modifiedEndLineNumber,
                        color: 'rgba(155, 185, 85, 0.4)',
                        darkColor: 'rgba(155, 185, 85, 0.4)',
                        position: EditorCommon.OverviewRulerLane.Full
                    });
                    if (lineChange.charChanges) {
                        for (j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                            charChange = lineChange.charChanges[j];
                            if (isChangeOrInsert(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                        if (lineNumber === charChange.modifiedStartLineNumber) {
                                            startColumn = charChange.modifiedStartColumn;
                                        }
                                        else {
                                            startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.modifiedEndLineNumber) {
                                            endColumn = charChange.modifiedEndColumn;
                                        }
                                        else {
                                            endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, 'char-insert', false));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, 'char-insert', false));
                                }
                            }
                        }
                    }
                }
            }
            return result;
        };
        DiffEdtorWidgetSideBySide.MINIMUM_EDITOR_WIDTH = 100;
        return DiffEdtorWidgetSideBySide;
    })(DiffEditorWidgetStyle);
    var SideBySideViewZonesComputer = (function (_super) {
        __extends(SideBySideViewZonesComputer, _super);
        function SideBySideViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ) {
            _super.call(this, lineChanges, originalForeignVZ, modifiedForeignVZ);
        }
        SideBySideViewZonesComputer.prototype._produceOriginalFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            if (lineChangeModifiedLength > lineChangeOriginalLength) {
                return {
                    afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
                    heightInLines: (lineChangeModifiedLength - lineChangeOriginalLength),
                    domNode: null
                };
            }
            return null;
        };
        SideBySideViewZonesComputer.prototype._produceModifiedFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            if (lineChangeOriginalLength > lineChangeModifiedLength) {
                return {
                    afterLineNumber: Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber),
                    heightInLines: (lineChangeOriginalLength - lineChangeModifiedLength),
                    domNode: null
                };
            }
            return null;
        };
        return SideBySideViewZonesComputer;
    })(ViewZonesComputer);
    var DiffEdtorWidgetInline = (function (_super) {
        __extends(DiffEdtorWidgetInline, _super);
        function DiffEdtorWidgetInline(dataSource, enableSplitViewResizing) {
            var _this = this;
            _super.call(this, dataSource);
            this.decorationsLeft = 40;
            this.toDispose = [];
            this.toDispose.push(dataSource.getOriginalEditor().addListener2(EditorCommon.EventType.EditorLayout, function (layoutInfo) {
                if (_this.decorationsLeft !== layoutInfo.decorationsLeft) {
                    _this.decorationsLeft = layoutInfo.decorationsLeft;
                    dataSource.relayoutEditors();
                }
            }));
        }
        DiffEdtorWidgetInline.prototype.dispose = function () {
            this.toDispose = Lifecycle.disposeAll(this.toDispose);
        };
        DiffEdtorWidgetInline.prototype.setEnableSplitViewResizing = function (enableSplitViewResizing) {
            // Nothing to do..
        };
        DiffEdtorWidgetInline.prototype._getViewZones = function (lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
            var computer = new InlineViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor);
            return computer.getViewZones();
        };
        DiffEdtorWidgetInline.prototype._getOriginalEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            var result = {
                decorations: [],
                overviewZones: []
            }, i, length, lineChange;
            for (i = 0, length = lineChanges.length; i < length; i++) {
                lineChange = lineChanges[i];
                // Add overview zones in the overview ruler
                if (isChangeOrDelete(lineChange)) {
                    result.overviewZones.push({
                        startLineNumber: lineChange.originalStartLineNumber,
                        endLineNumber: lineChange.originalEndLineNumber,
                        color: 'rgba(255, 0, 0, 0.4)',
                        darkColor: 'rgba(255, 0, 0, 0.4)',
                        position: EditorCommon.OverviewRulerLane.Full
                    });
                }
            }
            return result;
        };
        DiffEdtorWidgetInline.prototype._getModifiedEditorDecorations = function (lineChanges, ignoreTrimWhitespace, originalEditor, modifiedEditor) {
            var result = {
                decorations: [],
                overviewZones: []
            }, i, length, lineChange, j, lengthJ, charChange, lineNumber, startColumn, endColumn, modifiedModel = modifiedEditor.getModel();
            for (i = 0, length = lineChanges.length; i < length; i++) {
                lineChange = lineChanges[i];
                // Add decorations & overview zones
                if (isChangeOrInsert(lineChange)) {
                    result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, Number.MAX_VALUE, 'line-insert', true));
                    result.overviewZones.push({
                        startLineNumber: lineChange.modifiedStartLineNumber,
                        endLineNumber: lineChange.modifiedEndLineNumber,
                        color: 'rgba(155, 185, 85, 0.4)',
                        darkColor: 'rgba(155, 185, 85, 0.4)',
                        position: EditorCommon.OverviewRulerLane.Full
                    });
                    if (lineChange.charChanges) {
                        for (j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                            charChange = lineChange.charChanges[j];
                            if (isChangeOrInsert(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                        if (lineNumber === charChange.modifiedStartLineNumber) {
                                            startColumn = charChange.modifiedStartColumn;
                                        }
                                        else {
                                            startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.modifiedEndLineNumber) {
                                            endColumn = charChange.modifiedEndColumn;
                                        }
                                        else {
                                            endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, 'char-insert', false));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, 'char-insert', false));
                                }
                            }
                        }
                    }
                    else {
                        result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, Number.MAX_VALUE, 'char-insert', true));
                    }
                }
            }
            return result;
        };
        DiffEdtorWidgetInline.prototype.layout = function () {
            // An editor should not be smaller than 5px
            return Math.max(5, this.decorationsLeft);
        };
        return DiffEdtorWidgetInline;
    })(DiffEditorWidgetStyle);
    var InlineViewZonesComputer = (function (_super) {
        __extends(InlineViewZonesComputer, _super);
        function InlineViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
            _super.call(this, lineChanges, originalForeignVZ, modifiedForeignVZ);
            this.originalModel = originalEditor.getModel();
            this.modifiedEditorConfiguration = modifiedEditor.getConfiguration();
            this.modifiedEditorIndentation = modifiedEditor.getIndentationOptions();
        }
        InlineViewZonesComputer.prototype._produceOriginalFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            return {
                afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
                heightInLines: lineChangeModifiedLength,
                domNode: document.createElement('div')
            };
        };
        InlineViewZonesComputer.prototype._produceModifiedFromDiff = function (lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            var decorations = [], j, lengthJ, charChange, tempDecoration;
            if (lineChange.charChanges) {
                for (j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                    charChange = lineChange.charChanges[j];
                    if (isChangeOrDelete(charChange)) {
                        tempDecoration = createDecoration(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn, 'char-delete', false);
                        tempDecoration.options.inlineClassName = tempDecoration.options.className;
                        decorations.push(tempDecoration);
                    }
                }
            }
            var html = [], lineNumber;
            for (lineNumber = lineChange.originalStartLineNumber; lineNumber <= lineChange.originalEndLineNumber; lineNumber++) {
                html = html.concat(this.renderOriginalLine(lineNumber - lineChange.originalStartLineNumber, this.originalModel, this.modifiedEditorConfiguration, this.modifiedEditorIndentation, lineNumber, decorations));
            }
            var domNode = document.createElement('div');
            domNode.className = 'view-lines line-delete';
            domNode.innerHTML = html.join('');
            return {
                shouldNotShrink: true,
                afterLineNumber: (lineChange.modifiedEndLineNumber === 0 ? lineChange.modifiedStartLineNumber : lineChange.modifiedStartLineNumber - 1),
                heightInLines: lineChangeOriginalLength,
                domNode: domNode
            };
        };
        InlineViewZonesComputer.prototype.renderOriginalLine = function (count, originalModel, config, indentation, lineNumber, decorations) {
            var lineContent = originalModel.getLineContent(lineNumber), lineTokens, parts;
            lineTokens = {
                getTokens: function () {
                    return [{ startIndex: 0, type: '' }];
                },
                getFauxIndentLength: function () {
                    return 0;
                },
                getTextLength: function () {
                    return lineContent.length;
                },
                equals: function (other) {
                    return false;
                },
                findIndexOfOffset: function (offset) {
                    return 0;
                }
            };
            parts = ViewLineParts.createLineParts(lineNumber, lineContent, lineTokens, decorations, config.renderWhitespace);
            var r = viewLineRenderer_1.renderLine({
                lineContent: lineContent,
                tabSize: indentation.tabSize,
                stopRenderingLineAfter: config.stopRenderingLineAfter,
                renderWhitespace: config.renderWhitespace,
                parts: parts.getParts()
            });
            var myResult = [];
            myResult.push('<div class="view-line');
            if (decorations.length === 0) {
                // No char changes
                myResult.push(' char-delete');
            }
            myResult.push('" style="top:');
            myResult.push(String(count * config.lineHeight));
            myResult.push('px;width:1000000px;">');
            myResult = myResult.concat(r.output);
            myResult.push('</div>');
            return myResult;
        };
        return InlineViewZonesComputer;
    })(ViewZonesComputer);
    function isChangeOrInsert(lineChange) {
        return lineChange.modifiedEndLineNumber > 0;
    }
    function isChangeOrDelete(lineChange) {
        return lineChange.originalEndLineNumber > 0;
    }
    function createDecoration(startLineNumber, startColumn, endLineNumber, endColumn, className, isWholeLine) {
        return {
            range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
            options: {
                className: className,
                isWholeLine: isWholeLine
            }
        };
    }
    function createFakeLinesDiv() {
        var r = document.createElement('div');
        r.className = 'diagonal-fill';
        return r;
    }
});
//# sourceMappingURL=diffEditorWidget.js.map