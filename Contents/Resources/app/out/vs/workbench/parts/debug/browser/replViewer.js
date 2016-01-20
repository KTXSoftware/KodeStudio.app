/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/common/strings', 'vs/base/common/uri', 'vs/base/common/platform', 'vs/base/browser/ui/actionbar/actionbar', 'vs/base/browser/dom', 'vs/base/common/errors', 'vs/base/common/severity', 'vs/base/browser/mouseEvent', 'vs/workbench/parts/debug/common/debug', 'vs/workbench/parts/debug/common/debugModel', 'vs/workbench/parts/debug/browser/debugViewer', 'vs/workbench/parts/debug/electron-browser/debugActions', 'vs/workbench/services/editor/common/editorService', 'vs/platform/workspace/common/workspace'], function (require, exports, nls, winjs_base_1, strings, uri_1, platform_1, actionbar, dom, errors, severity_1, mouse, debug, model, debugviewer, dbgactions, editorService_1, workspace_1) {
    var $ = dom.emmet;
    function getExpressionClassName() {
        return platform_1.isMacintosh ? '.expression.mac' : '.expression.win-linux';
    }
    var ReplExpressionsDataSource = (function () {
        function ReplExpressionsDataSource(debugService) {
            this.debugService = debugService;
            // noop
        }
        ReplExpressionsDataSource.prototype.getId = function (tree, element) {
            return element.getId();
        };
        ReplExpressionsDataSource.prototype.hasChildren = function (tree, element) {
            return element instanceof model.Model || element.reference > 0 || (element instanceof model.KeyValueOutputElement && element.getChildren().length > 0);
        };
        ReplExpressionsDataSource.prototype.getChildren = function (tree, element) {
            if (element instanceof model.Model) {
                return winjs_base_1.Promise.as(element.getReplElements());
            }
            if (element instanceof model.KeyValueOutputElement) {
                return winjs_base_1.Promise.as(element.getChildren());
            }
            if (element instanceof model.ValueOutputElement) {
                return winjs_base_1.Promise.as(null);
            }
            return element.getChildren(this.debugService);
        };
        ReplExpressionsDataSource.prototype.getParent = function (tree, element) {
            return winjs_base_1.Promise.as(null);
        };
        return ReplExpressionsDataSource;
    })();
    exports.ReplExpressionsDataSource = ReplExpressionsDataSource;
    var ReplExpressionsRenderer = (function () {
        function ReplExpressionsRenderer(debugService, editorService, contextService) {
            this.debugService = debugService;
            this.editorService = editorService;
            this.contextService = contextService;
            // noop
        }
        ReplExpressionsRenderer.prototype.getHeight = function (tree, element) {
            return this.getHeightForString(element.value) + (element instanceof model.Expression ? this.getHeightForString(element.name) : 0);
        };
        ReplExpressionsRenderer.prototype.getHeightForString = function (s) {
            if (!s || !s.length || this.width <= 0 || this.characterWidth <= 0) {
                return 18;
            }
            var realLength = 0;
            for (var i = 0; i < s.length; i++) {
                realLength += strings.isFullWidthCharacter(s.charCodeAt(i)) ? 2 : 1;
            }
            return 18 * Math.ceil(realLength * this.characterWidth / this.width);
        };
        ReplExpressionsRenderer.prototype.setWidth = function (fullWidth, characterWidth) {
            this.width = fullWidth;
            this.characterWidth = characterWidth;
        };
        ReplExpressionsRenderer.prototype.getTemplateId = function (tree, element) {
            if (element instanceof model.Variable) {
                return ReplExpressionsRenderer.VARIABLE_TEMPLATE_ID;
            }
            if (element instanceof model.Expression) {
                return ReplExpressionsRenderer.INPUT_OUTPUT_PAIR_TEMPLATE_ID;
            }
            if (element instanceof model.ValueOutputElement) {
                return ReplExpressionsRenderer.VALUE_OUTPUT_TEMPLATE_ID;
            }
            if (element instanceof model.KeyValueOutputElement) {
                return ReplExpressionsRenderer.KEY_VALUE_OUTPUT_TEMPLATE_ID;
            }
            return null;
        };
        ReplExpressionsRenderer.prototype.renderTemplate = function (tree, templateId, container) {
            if (templateId === ReplExpressionsRenderer.VARIABLE_TEMPLATE_ID) {
                var data = Object.create(null);
                data.expression = dom.append(container, $(getExpressionClassName()));
                data.name = dom.append(data.expression, $('span.name'));
                data.value = dom.append(data.expression, $('span.value'));
                return data;
            }
            if (templateId === ReplExpressionsRenderer.INPUT_OUTPUT_PAIR_TEMPLATE_ID) {
                var data = Object.create(null);
                dom.addClass(container, 'input-output-pair');
                data.input = dom.append(container, $('.input' + getExpressionClassName()));
                data.output = dom.append(container, $('.output' + getExpressionClassName()));
                data.value = dom.append(data.output, $('span.value'));
                data.annotation = dom.append(data.output, $('span'));
                return data;
            }
            if (templateId === ReplExpressionsRenderer.VALUE_OUTPUT_TEMPLATE_ID) {
                var data = Object.create(null);
                dom.addClass(container, 'output');
                var expression = dom.append(container, $('.output' + getExpressionClassName()));
                data.container = container;
                data.counter = dom.append(expression, $('div.counter'));
                data.value = dom.append(expression, $('span.value'));
                return data;
            }
            if (templateId === ReplExpressionsRenderer.KEY_VALUE_OUTPUT_TEMPLATE_ID) {
                var data = Object.create(null);
                dom.addClass(container, 'output');
                data.container = container;
                data.expression = dom.append(container, $('.output' + getExpressionClassName()));
                data.key = dom.append(data.expression, $('span.name'));
                data.value = dom.append(data.expression, $('span.value'));
                data.annotation = dom.append(data.expression, $('span'));
                return data;
            }
        };
        ReplExpressionsRenderer.prototype.renderElement = function (tree, element, templateId, templateData) {
            if (templateId === ReplExpressionsRenderer.VARIABLE_TEMPLATE_ID) {
                debugviewer.renderVariable(tree, element, templateData, this.debugService.getState() === debug.State.Inactive, false);
            }
            else if (templateId === ReplExpressionsRenderer.INPUT_OUTPUT_PAIR_TEMPLATE_ID) {
                this.renderInputOutputPair(tree, element, templateData);
            }
            else if (templateId === ReplExpressionsRenderer.VALUE_OUTPUT_TEMPLATE_ID) {
                this.renderOutputValue(element, templateData);
            }
            else if (templateId === ReplExpressionsRenderer.KEY_VALUE_OUTPUT_TEMPLATE_ID) {
                this.renderOutputKeyValue(tree, element, templateData);
            }
        };
        ReplExpressionsRenderer.prototype.renderInputOutputPair = function (tree, expression, templateData) {
            templateData.input.textContent = expression.name;
            debugviewer.renderExpressionValue(expression, this.debugService.getState() === debug.State.Inactive, templateData.value);
            if (expression.reference > 0) {
                templateData.annotation.className = 'annotation octicon octicon-info';
                templateData.annotation.title = nls.localize('stateCapture', "Object state is captured from first evaluation");
            }
        };
        ReplExpressionsRenderer.prototype.renderOutputValue = function (output, templateData) {
            // counter
            if (output.counter > 1) {
                templateData.counter.textContent = String(output.counter);
                templateData.counter.className = (output.severity === severity_1.default.Warning) ? 'counter warn' : (output.severity === severity_1.default.Error) ? 'counter error' : 'counter info';
            }
            else {
                templateData.counter.textContent = '';
                templateData.counter.className = 'counter';
            }
            // group
            if (output.grouped) {
                dom.addClass(templateData.container, 'grouped');
            }
            else {
                dom.removeClass(templateData.container, 'grouped');
            }
            // value
            dom.clearNode(templateData.value);
            var result = this.handleANSIOutput(output.value);
            if (typeof result === 'string') {
                templateData.value.textContent = result;
            }
            else {
                templateData.value.appendChild(result);
            }
            templateData.value.className = (output.severity === severity_1.default.Warning) ? 'warn' : (output.severity === severity_1.default.Error) ? 'error' : 'info';
        };
        ReplExpressionsRenderer.prototype.handleANSIOutput = function (text) {
            var tokensContainer;
            var currentToken;
            var buffer = '';
            for (var i = 0, len = text.length; i < len; i++) {
                // start of ANSI escape sequence (see http://ascii-table.com/ansi-escape-sequences.php)
                if (text.charCodeAt(i) === 27) {
                    var index = i;
                    var chr = (++index < len ? text.charAt(index) : null);
                    if (chr && chr === '[') {
                        var code = null;
                        chr = (++index < len ? text.charAt(index) : null);
                        if (chr && chr >= '0' && chr <= '9') {
                            code = chr;
                            chr = (++index < len ? text.charAt(index) : null);
                        }
                        if (chr && chr >= '0' && chr <= '9') {
                            code += chr;
                            chr = (++index < len ? text.charAt(index) : null);
                        }
                        if (code === null) {
                            code = '0';
                        }
                        if (chr === 'm') {
                            // only respect text-foreground ranges and ignore the values for "black" & "white" because those
                            // only make sense in combination with text-background ranges which we currently not support
                            var parsedMode = parseInt(code, 10);
                            var token = document.createElement('span');
                            if ((parsedMode >= 30 && parsedMode <= 37) || (parsedMode >= 90 && parsedMode <= 97)) {
                                token.className = 'code' + parsedMode;
                            }
                            else if (parsedMode === 1) {
                                token.className = 'code-bold';
                            }
                            // we need a tokens container now
                            if (!tokensContainer) {
                                tokensContainer = document.createElement('span');
                            }
                            // flush text buffer if we have any
                            if (buffer) {
                                this.insert(this.handleLinks(buffer), currentToken || tokensContainer);
                                buffer = '';
                            }
                            currentToken = token;
                            tokensContainer.appendChild(token);
                            i = index;
                        }
                    }
                }
                else {
                    buffer += text[i];
                }
            }
            // flush remaining text buffer if we have any
            if (buffer) {
                var res = this.handleLinks(buffer);
                if (typeof res !== 'string' || currentToken) {
                    if (!tokensContainer) {
                        tokensContainer = document.createElement('span');
                    }
                    this.insert(res, currentToken || tokensContainer);
                }
            }
            return tokensContainer || buffer;
        };
        ReplExpressionsRenderer.prototype.insert = function (arg, target) {
            if (typeof arg === 'string') {
                target.textContent = arg;
            }
            else {
                target.appendChild(arg);
            }
        };
        ReplExpressionsRenderer.prototype.handleLinks = function (text) {
            var _this = this;
            var linkContainer;
            for (var _i = 0, _a = ReplExpressionsRenderer.FILE_LOCATION_PATTERNS; _i < _a.length; _i++) {
                var pattern = _a[_i];
                pattern.lastIndex = 0; // the holy grail of software development
                var match = pattern.exec(text);
                var resource = match && uri_1.default.file(match[1]);
                if (resource) {
                    linkContainer = document.createElement('span');
                    var textBeforeLink = text.substr(0, match.index);
                    if (textBeforeLink) {
                        var span = document.createElement('span');
                        span.textContent = textBeforeLink;
                        linkContainer.appendChild(span);
                    }
                    var link = document.createElement('a');
                    link.textContent = text.substr(match.index, match[0].length);
                    link.title = platform_1.isMacintosh ? nls.localize('fileLinkMac', "Click to follow (Cmd + click opens to the side)") : nls.localize('fileLink', "Click to follow (Ctrl + click opens to the side)");
                    linkContainer.appendChild(link);
                    link.onclick = function (e) { return _this.onLinkClick(new mouse.StandardMouseEvent(e), resource, Number(match[3]), Number(match[4])); };
                    var textAfterLink = text.substr(match.index + match[0].length);
                    if (textAfterLink) {
                        var span = document.createElement('span');
                        span.textContent = textAfterLink;
                        linkContainer.appendChild(span);
                    }
                    break; // support one link per line for now
                }
            }
            return linkContainer || text;
        };
        ReplExpressionsRenderer.prototype.onLinkClick = function (event, resource, line, column) {
            var selection = window.getSelection();
            if (selection.type === 'Range') {
                return; // do not navigate when user is selecting
            }
            event.preventDefault();
            this.editorService.openEditor({
                resource: resource,
                options: {
                    selection: {
                        startLineNumber: line,
                        startColumn: column
                    }
                }
            }, event.ctrlKey || event.metaKey).done(null, errors.onUnexpectedError);
        };
        ReplExpressionsRenderer.prototype.renderOutputKeyValue = function (tree, output, templateData) {
            // key
            if (output.key) {
                templateData.key.textContent = output.key + ":";
            }
            else {
                templateData.key.textContent = '';
            }
            // value
            debugviewer.renderExpressionValue(output.value, false, templateData.value);
            // annotation if any
            if (output.annotation) {
                templateData.annotation.className = 'annotation octicon octicon-info';
                templateData.annotation.title = output.annotation;
            }
            else {
                templateData.annotation.className = '';
                templateData.annotation.title = '';
            }
            // group
            if (output.grouped) {
                dom.addClass(templateData.container, 'grouped');
            }
            else {
                dom.removeClass(templateData.container, 'grouped');
            }
        };
        ReplExpressionsRenderer.prototype.disposeTemplate = function (tree, templateId, templateData) {
            // noop
        };
        ReplExpressionsRenderer.VARIABLE_TEMPLATE_ID = 'variable';
        ReplExpressionsRenderer.INPUT_OUTPUT_PAIR_TEMPLATE_ID = 'inputOutputPair';
        ReplExpressionsRenderer.VALUE_OUTPUT_TEMPLATE_ID = 'outputValue';
        ReplExpressionsRenderer.KEY_VALUE_OUTPUT_TEMPLATE_ID = 'outputKeyValue';
        ReplExpressionsRenderer.FILE_LOCATION_PATTERNS = [
            // group 0: the full thing :)
            // group 1: absolute path
            // group 2: drive letter on windows with trailing backslash or leading slash on mac/linux
            // group 3: line number
            // group 4: column number
            // eg: at Context.<anonymous> (c:\Users\someone\Desktop\mocha-runner\test\test.js:26:11)
            /((\/|[a-zA-Z]:\\)[^\(\)<>\'\"\[\]]+):(\d+):(\d+)/
        ];
        ReplExpressionsRenderer = __decorate([
            __param(0, debug.IDebugService),
            __param(1, editorService_1.IWorkbenchEditorService),
            __param(2, workspace_1.IWorkspaceContextService)
        ], ReplExpressionsRenderer);
        return ReplExpressionsRenderer;
    })();
    exports.ReplExpressionsRenderer = ReplExpressionsRenderer;
    var ReplExpressionsActionProvider = (function () {
        function ReplExpressionsActionProvider(instantiationService) {
            this.instantiationService = instantiationService;
            // noop
        }
        ReplExpressionsActionProvider.prototype.hasActions = function (tree, element) {
            return false;
        };
        ReplExpressionsActionProvider.prototype.getActions = function (tree, element) {
            return winjs_base_1.Promise.as([]);
        };
        ReplExpressionsActionProvider.prototype.hasSecondaryActions = function (tree, element) {
            return true;
        };
        ReplExpressionsActionProvider.prototype.getSecondaryActions = function (tree, element) {
            var actions = [];
            if (element instanceof model.Variable || element instanceof model.Expression) {
                actions.push(this.instantiationService.createInstance(dbgactions.AddToWatchExpressionsAction, dbgactions.AddToWatchExpressionsAction.ID, dbgactions.AddToWatchExpressionsAction.LABEL, element));
                actions.push(new actionbar.Separator());
                if (element.reference === 0) {
                    actions.push(this.instantiationService.createInstance(dbgactions.CopyValueAction, dbgactions.CopyValueAction.ID, dbgactions.CopyValueAction.LABEL, element.value));
                }
            }
            else if (element instanceof model.OutputElement) {
                actions.push(this.instantiationService.createInstance(dbgactions.CopyValueAction, dbgactions.CopyValueAction.ID, dbgactions.CopyValueAction.LABEL, element.value));
            }
            actions.push(this.instantiationService.createInstance(dbgactions.ClearReplAction));
            return winjs_base_1.Promise.as(actions);
        };
        ReplExpressionsActionProvider.prototype.getActionItem = function (tree, element, action) {
            return null;
        };
        return ReplExpressionsActionProvider;
    })();
    exports.ReplExpressionsActionProvider = ReplExpressionsActionProvider;
    var ReplExpressionsController = (function (_super) {
        __extends(ReplExpressionsController, _super);
        function ReplExpressionsController(debugService, contextMenuService, actionProvider, replInput, focusOnContextMenu) {
            if (focusOnContextMenu === void 0) { focusOnContextMenu = true; }
            _super.call(this, debugService, contextMenuService, actionProvider, focusOnContextMenu);
            this.replInput = replInput;
            this.lastSelectedString = null;
        }
        /* protected */ ReplExpressionsController.prototype.onLeftClick = function (tree, element, eventish, origin) {
            if (origin === void 0) { origin = 'mouse'; }
            var mouseEvent = eventish;
            // input and output are one element in the tree => we only expand if the user clicked on the output.
            if ((element.reference > 0 || (element instanceof model.KeyValueOutputElement && element.getChildren().length > 0)) && mouseEvent.target.className.indexOf('input expression') === -1) {
                _super.prototype.onLeftClick.call(this, tree, element, eventish, origin);
                tree.clearFocus();
                tree.deselect(element);
            }
            var selection = window.getSelection();
            if (selection.type !== 'Range' || this.lastSelectedString === selection.toString()) {
                // only focus the input if the user is not currently selecting.
                this.replInput.focus();
            }
            this.lastSelectedString = selection.toString();
            return true;
        };
        return ReplExpressionsController;
    })(debugviewer.BaseDebugController);
    exports.ReplExpressionsController = ReplExpressionsController;
});
//# sourceMappingURL=replViewer.js.map