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
define(["require", "exports", 'vs/nls', 'vs/base/common/paths', 'vs/base/common/labels', 'vs/workbench/common/editor/iframeEditorInput', 'vs/workbench/parts/markdown/common/markdownEditorModel', 'vs/platform/instantiation/common/instantiation', 'vs/platform/workspace/common/workspace'], function (require, exports, nls, paths, labels, iframeEditorInput_1, markdownEditorModel_1, instantiation_1, workspace_1) {
    /**
     * An editor input to show a rendered version of a markdown file.
     */
    var MarkdownEditorInput = (function (_super) {
        __extends(MarkdownEditorInput, _super);
        function MarkdownEditorInput(resource, label, description, instantiationService, contextService) {
            _super.call(this, resource, label || nls.localize('preview', "Preview '{0}'", paths.basename(resource.fsPath)), description || labels.getPathLabel(paths.dirname(resource.fsPath), contextService));
            this.instantiationService = instantiationService;
            this.contextService = contextService;
        }
        MarkdownEditorInput.prototype.createNew = function (resource) {
            return this.instantiationService.createInstance(MarkdownEditorInput, resource, void 0, void 0);
        };
        MarkdownEditorInput.prototype.getId = function () {
            return MarkdownEditorInput.ID;
        };
        MarkdownEditorInput.prototype.createModel = function () {
            return this.instantiationService.createInstance(markdownEditorModel_1.MarkdownEditorModel, this.getResource());
        };
        MarkdownEditorInput.prototype.matches = function (otherInput) {
            if (!(otherInput instanceof MarkdownEditorInput)) {
                return false;
            }
            return _super.prototype.matches.call(this, otherInput);
        };
        MarkdownEditorInput.ID = 'vs.markdown';
        MarkdownEditorInput = __decorate([
            __param(3, instantiation_1.IInstantiationService),
            __param(4, workspace_1.IWorkspaceContextService)
        ], MarkdownEditorInput);
        return MarkdownEditorInput;
    })(iframeEditorInput_1.IFrameEditorInput);
    exports.MarkdownEditorInput = MarkdownEditorInput;
});
//# sourceMappingURL=markdownEditorInput.js.map