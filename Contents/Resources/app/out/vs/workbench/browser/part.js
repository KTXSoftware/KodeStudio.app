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
define(["require", "exports", 'vs/base/browser/builder', 'vs/workbench/common/component', 'vs/css!./media/part'], function (require, exports, builder_1, component_1) {
    /**
     * Parts are layed out in the workbench and have their own layout that arranges a title,
     * content and status area to show content.
     */
    var Part = (function (_super) {
        __extends(Part, _super);
        function Part(id) {
            _super.call(this, id);
        }
        /**
         * Note: Clients should not call this method, the monaco workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to create title, content and status area of the part.
         */
        Part.prototype.create = function (parent) {
            this.parent = parent;
            this.titleArea = this.createTitleArea(parent);
            this.contentArea = this.createContentArea(parent);
            this.statusArea = this.createStatusArea(parent);
            this.partLayout = new PartLayout(this.parent, this.titleArea, this.contentArea, this.statusArea);
        };
        /**
         * Returns the overall part container.
         */
        Part.prototype.getContainer = function () {
            return this.parent;
        };
        /**
         * Subclasses override to provide a title area implementation.
         */
        Part.prototype.createTitleArea = function (parent) {
            return null;
        };
        /**
         * Returns the title area container.
         */
        Part.prototype.getTitleArea = function () {
            return this.titleArea;
        };
        /**
         * Subclasses override to provide a content area implementation.
         */
        Part.prototype.createContentArea = function (parent) {
            return null;
        };
        /**
         * Returns the content area container.
         */
        Part.prototype.getContentArea = function () {
            return this.contentArea;
        };
        /**
         * Subclasses override to provide a status area implementation.
         */
        Part.prototype.createStatusArea = function (parent) {
            return null;
        };
        /**
         * Returns the status area container.
         */
        Part.prototype.getStatusArea = function () {
            return this.statusArea;
        };
        /**
         * Layout title, content and status area in the given dimension.
         */
        Part.prototype.layout = function (dimension) {
            return this.partLayout.layout(dimension);
        };
        /**
         * Returns the part layout implementation.
         */
        Part.prototype.getLayout = function () {
            return this.partLayout;
        };
        return Part;
    })(component_1.WorkbenchComponent);
    exports.Part = Part;
    var EmptyPart = (function (_super) {
        __extends(EmptyPart, _super);
        function EmptyPart(id) {
            _super.call(this, id);
        }
        return EmptyPart;
    })(Part);
    exports.EmptyPart = EmptyPart;
    var PartLayout = (function () {
        function PartLayout(container, titleArea, contentArea, statusArea) {
            this.container = container;
            this.titleArea = titleArea;
            this.contentArea = contentArea;
            this.statusArea = statusArea;
        }
        PartLayout.prototype.computeStyle = function () {
            var containerStyle = this.container.getComputedStyle();
            this.containerStyle = {
                borderLeftWidth: parseInt(containerStyle.getPropertyValue('border-left-width'), 10),
                borderRightWidth: parseInt(containerStyle.getPropertyValue('border-right-width'), 10),
                borderTopWidth: parseInt(containerStyle.getPropertyValue('border-top-width'), 10),
                borderBottomWidth: parseInt(containerStyle.getPropertyValue('border-bottom-width'), 10)
            };
            if (this.titleArea) {
                var titleStyle = this.titleArea.getComputedStyle();
                this.titleStyle = {
                    display: titleStyle.getPropertyValue('display'),
                    height: this.titleArea.getTotalSize().height
                };
            }
            if (this.statusArea) {
                var statusStyle = this.statusArea.getComputedStyle();
                this.statusStyle = {
                    display: statusStyle.getPropertyValue('display'),
                    height: this.statusArea.getTotalSize().height
                };
            }
        };
        PartLayout.prototype.layout = function (dimension) {
            if (!this.containerStyle) {
                this.computeStyle();
            }
            var width = dimension.width - (this.containerStyle.borderLeftWidth + this.containerStyle.borderRightWidth);
            var height = dimension.height - (this.containerStyle.borderTopWidth + this.containerStyle.borderBottomWidth);
            // Return the applied sizes to title, content and status
            var sizes = [];
            // Title Size: Width (Fill), Height (Variable)
            var titleSize;
            if (this.titleArea && this.titleStyle.display !== 'none') {
                titleSize = new builder_1.Dimension(width, Math.min(height, this.titleStyle.height));
            }
            else {
                titleSize = new builder_1.Dimension(0, 0);
            }
            // Status Size: Width (Fill), Height (Variable)
            var statusSize;
            if (this.statusArea && this.statusStyle.display !== 'none') {
                this.statusArea.getHTMLElement().style.height = this.statusArea.getHTMLElement().style.width = '';
                statusSize = new builder_1.Dimension(width, Math.min(height - titleSize.height, this.statusStyle.height));
            }
            else {
                statusSize = new builder_1.Dimension(0, 0);
            }
            // Content Size: Width (Fill), Height (Variable)
            var contentSize = new builder_1.Dimension(width, height - titleSize.height - statusSize.height);
            sizes.push(titleSize);
            sizes.push(contentSize);
            sizes.push(statusSize);
            // Content
            if (this.contentArea) {
                this.contentArea.size(contentSize.width, contentSize.height);
            }
            return sizes;
        };
        return PartLayout;
    })();
    exports.PartLayout = PartLayout;
});
//# sourceMappingURL=part.js.map