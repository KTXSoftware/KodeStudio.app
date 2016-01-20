/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/types'], function (require, exports, winjs_base_1, types_1) {
    var DataSource = (function () {
        function DataSource(arg) {
            this.modelProvider = types_1.isFunction(arg.getModel) ? arg : { getModel: function () { return arg; } };
        }
        DataSource.prototype.getId = function (tree, element) {
            if (!element) {
                return null;
            }
            var model = this.modelProvider.getModel();
            return model === element ? '__root__' : model.dataSource.getId(element);
        };
        DataSource.prototype.hasChildren = function (tree, element) {
            var model = this.modelProvider.getModel();
            return model && model === element && model.entries.length > 0;
        };
        DataSource.prototype.getChildren = function (tree, element) {
            var model = this.modelProvider.getModel();
            return winjs_base_1.Promise.as(model === element ? model.entries : []);
        };
        DataSource.prototype.getParent = function (tree, element) {
            return winjs_base_1.Promise.as(null);
        };
        return DataSource;
    })();
    exports.DataSource = DataSource;
    var Filter = (function () {
        function Filter(modelProvider) {
            this.modelProvider = modelProvider;
        }
        Filter.prototype.isVisible = function (tree, element) {
            var model = this.modelProvider.getModel();
            if (!model.filter) {
                return true;
            }
            return model.filter.isVisible(element);
        };
        return Filter;
    })();
    exports.Filter = Filter;
    var Renderer = (function () {
        function Renderer(modelProvider) {
            this.modelProvider = modelProvider;
        }
        Renderer.prototype.getHeight = function (tree, element) {
            var model = this.modelProvider.getModel();
            return model.renderer.getHeight(element);
        };
        Renderer.prototype.getTemplateId = function (tree, element) {
            var model = this.modelProvider.getModel();
            return model.renderer.getTemplateId(element);
        };
        Renderer.prototype.renderTemplate = function (tree, templateId, container) {
            var model = this.modelProvider.getModel();
            return model.renderer.renderTemplate(templateId, container);
        };
        Renderer.prototype.renderElement = function (tree, element, templateId, templateData) {
            var model = this.modelProvider.getModel();
            model.renderer.renderElement(element, templateId, templateData);
        };
        Renderer.prototype.disposeTemplate = function (tree, templateId, templateData) {
            var model = this.modelProvider.getModel();
            model.renderer.disposeTemplate(templateId, templateData);
        };
        return Renderer;
    })();
    exports.Renderer = Renderer;
});
//# sourceMappingURL=quickOpenViewer.js.map