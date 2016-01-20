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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/nls', 'vs/base/browser/builder', 'vs/base/common/types', 'vs/platform/platform', 'vs/base/parts/quickopen/common/quickOpen', 'vs/base/parts/quickopen/browser/quickOpenModel', 'vs/workbench/browser/quickopen', 'vs/workbench/services/quickopen/common/quickOpenService'], function (require, exports, winjs_base_1, nls, builder_1, types, platform_1, quickOpen_1, quickOpenModel_1, quickopen_1, quickOpenService_1) {
    exports.HELP_PREFIX = '?';
    var HelpEntry = (function (_super) {
        __extends(HelpEntry, _super);
        function HelpEntry(prefix, description, quickOpenService, openOnPreview) {
            _super.call(this);
            this.prefix = prefix;
            this.description = description;
            this.quickOpenService = quickOpenService;
            this.openOnPreview = openOnPreview;
        }
        HelpEntry.prototype.getLabel = function () {
            return this.prefix;
        };
        HelpEntry.prototype.getDescription = function () {
            return this.description;
        };
        HelpEntry.prototype.getHeight = function () {
            return 22;
        };
        HelpEntry.prototype.getGroupLabel = function () {
            return this.groupLabel;
        };
        HelpEntry.prototype.setGroupLabel = function (groupLabel) {
            this.groupLabel = groupLabel;
        };
        HelpEntry.prototype.showBorder = function () {
            return this.useBorder;
        };
        HelpEntry.prototype.setShowBorder = function (showBorder) {
            this.useBorder = showBorder;
        };
        HelpEntry.prototype.render = function (tree, container, previousCleanupFn) {
            var _this = this;
            var builder = builder_1.$(container);
            builder.addClass('quick-open-entry');
            // Support border
            if (this.showBorder()) {
                builder_1.$(container).addClass('results-group-separator');
            }
            else {
                builder_1.$(container).removeClass('results-group-separator');
            }
            // Add a container for the group
            if (this.getGroupLabel()) {
                builder_1.$(container).div(function (div) {
                    div.addClass('results-group');
                    div.attr({
                        text: _this.getGroupLabel()
                    });
                });
            }
            // Prefix
            var label = builder.clone().div({
                text: this.prefix,
                'class': 'quick-open-help-entry-label'
            });
            if (!this.prefix) {
                label.text('\u2026');
            }
            // Description
            builder.span({
                text: this.description,
                'class': 'quick-open-entry-description'
            });
            return null;
        };
        HelpEntry.prototype.run = function (mode, context) {
            if (mode === quickOpen_1.Mode.OPEN || this.openOnPreview) {
                this.quickOpenService.show(this.prefix);
            }
            return false;
        };
        return HelpEntry;
    })(quickOpenModel_1.QuickOpenEntryItem);
    var HelpHandler = (function (_super) {
        __extends(HelpHandler, _super);
        function HelpHandler(quickOpenService) {
            _super.call(this);
            this.quickOpenService = quickOpenService;
        }
        HelpHandler.prototype.getResults = function (searchValue) {
            searchValue = searchValue.trim();
            var registry = platform_1.Registry.as(quickopen_1.Extensions.Quickopen);
            var handlerDescriptors = registry.getQuickOpenHandlers();
            var defaultHandlers = registry.getDefaultQuickOpenHandlers();
            if (defaultHandlers.length > 0) {
                handlerDescriptors.push.apply(handlerDescriptors, defaultHandlers);
            }
            var workbenchScoped = [];
            var editorScoped = [];
            var entry;
            for (var i = 0; i < handlerDescriptors.length; i++) {
                var handlerDescriptor = handlerDescriptors[i];
                if (handlerDescriptor.prefix !== exports.HELP_PREFIX) {
                    // Descriptor has multiple help entries
                    if (types.isArray(handlerDescriptor.helpEntries)) {
                        for (var j = 0; j < handlerDescriptor.helpEntries.length; j++) {
                            var helpEntry = handlerDescriptor.helpEntries[j];
                            if (helpEntry.prefix.indexOf(searchValue) === 0) {
                                entry = new HelpEntry(helpEntry.prefix, helpEntry.description, this.quickOpenService, searchValue.length > 0);
                                if (helpEntry.needsEditor) {
                                    editorScoped.push(entry);
                                }
                                else {
                                    workbenchScoped.push(entry);
                                }
                            }
                        }
                    }
                    else if (handlerDescriptor.prefix.indexOf(searchValue) === 0) {
                        entry = new HelpEntry(handlerDescriptor.prefix, handlerDescriptor.description, this.quickOpenService, searchValue.length > 0);
                        workbenchScoped.push(entry);
                    }
                }
            }
            // Add separator for workbench scoped handlers
            if (workbenchScoped.length > 0) {
                workbenchScoped[0].setGroupLabel(nls.localize('globalCommands', "global commands"));
            }
            // Add separator for editor scoped handlers
            if (editorScoped.length > 0) {
                editorScoped[0].setGroupLabel(nls.localize('editorCommands', "editor commands"));
                if (workbenchScoped.length > 0) {
                    editorScoped[0].setShowBorder(true);
                }
            }
            return winjs_base_1.TPromise.as(new quickOpenModel_1.QuickOpenModel(workbenchScoped.concat(editorScoped)));
        };
        HelpHandler.prototype.getAutoFocus = function (searchValue) {
            searchValue = searchValue.trim();
            return {
                autoFocusFirstEntry: searchValue.length > 0,
                autoFocusPrefixMatch: searchValue
            };
        };
        HelpHandler = __decorate([
            __param(0, quickOpenService_1.IQuickOpenService)
        ], HelpHandler);
        return HelpHandler;
    })(quickopen_1.QuickOpenHandler);
    exports.HelpHandler = HelpHandler;
});
//# sourceMappingURL=helpHandler.js.map