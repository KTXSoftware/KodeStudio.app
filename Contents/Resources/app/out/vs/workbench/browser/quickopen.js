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
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/common/filters', 'vs/base/common/arrays', 'vs/base/common/strings', 'vs/base/common/types', 'vs/base/common/errors', 'vs/platform/platform', 'vs/base/parts/quickopen/common/quickOpen', 'vs/base/parts/quickopen/browser/quickOpenModel', 'vs/workbench/common/editor', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/platform/instantiation/common/descriptors'], function (require, exports, nls, winjs_base_1, filters, arrays, strings, types, errors, platform_1, quickOpen_1, quickOpenModel_1, editor_1, quickOpenService_1, descriptors_1) {
    var QuickOpenHandler = (function () {
        function QuickOpenHandler() {
        }
        /**
         * A quick open handler returns results for a given input string. The resolved promise
         * returns an instance of quick open model. It is up to the handler to keep and reuse an
         * instance of the same model across multiple calls. This helps in situations where the user is
         * narrowing down a search and the model is just filtering some items out.
         *
         * As such, returning the same model instance across multiple searches will yield best
         * results in terms of performance when many items are shown.
         */
        QuickOpenHandler.prototype.getResults = function (searchValue) {
            return winjs_base_1.TPromise.as(null);
        };
        /**
         * Extra CSS class name to add to the quick open widget to do custom styling of entries.
         */
        QuickOpenHandler.prototype.getClass = function () {
            return null;
        };
        /**
         * Indicates if the handler can run in the current environment. Return a string if the handler cannot run but has
         * a good message to show in this case.
         */
        QuickOpenHandler.prototype.canRun = function () {
            return true;
        };
        /**
         * Indicates if the handler wishes the quick open widget to automatically select the first result entry or an entry
         * based on a specific prefix match.
         */
        QuickOpenHandler.prototype.getAutoFocus = function (searchValue) {
            return {};
        };
        /**
         * Indicates to the handler that the quick open widget has been closed. Allows to free up any resources as needed.
         * The parameter canceled indicates if the quick open widget was closed with an entry being run or not.
         */
        QuickOpenHandler.prototype.onClose = function (canceled) {
            return;
        };
        /**
         * Allows to return a label that will be placed to the side of the results from this handler or null if none.
         */
        QuickOpenHandler.prototype.getGroupLabel = function () {
            return null;
        };
        /**
         * Allows to return a label that will be used when there are no results found
         */
        QuickOpenHandler.prototype.getEmptyLabel = function (searchString) {
            if (searchString.length > 0) {
                return nls.localize('noResultsMatching', "No results matching");
            }
            return nls.localize('noResultsFound2', "No results found");
        };
        return QuickOpenHandler;
    })();
    exports.QuickOpenHandler = QuickOpenHandler;
    /**
     * A lightweight descriptor of a quick open handler.
     */
    var QuickOpenHandlerDescriptor = (function (_super) {
        __extends(QuickOpenHandlerDescriptor, _super);
        function QuickOpenHandlerDescriptor(moduleId, ctorName, prefix, param, instantProgress) {
            if (instantProgress === void 0) { instantProgress = false; }
            _super.call(this, moduleId, ctorName);
            this.prefix = prefix;
            this.id = moduleId + ctorName;
            this.instantProgress = instantProgress;
            if (types.isString(param)) {
                this.description = param;
            }
            else {
                this.helpEntries = param;
            }
        }
        QuickOpenHandlerDescriptor.prototype.getId = function () {
            return this.id;
        };
        return QuickOpenHandlerDescriptor;
    })(descriptors_1.AsyncDescriptor);
    exports.QuickOpenHandlerDescriptor = QuickOpenHandlerDescriptor;
    exports.Extensions = {
        Quickopen: 'workbench.contributions.quickopen'
    };
    var QuickOpenRegistry = (function () {
        function QuickOpenRegistry() {
            this.handlers = [];
            this.defaultHandlers = [];
        }
        QuickOpenRegistry.prototype.registerQuickOpenHandler = function (descriptor) {
            this.handlers.push(descriptor);
            // sort the handlers by decreasing prefix length, such that longer
            // prefixes take priority: 'ext' vs 'ext install' - the latter should win
            this.handlers.sort(function (h1, h2) { return h2.prefix.length - h1.prefix.length; });
        };
        QuickOpenRegistry.prototype.registerDefaultQuickOpenHandler = function (descriptor) {
            this.defaultHandlers.push(descriptor);
        };
        QuickOpenRegistry.prototype.getQuickOpenHandlers = function () {
            return this.handlers.slice(0);
        };
        QuickOpenRegistry.prototype.getQuickOpenHandler = function (text) {
            return text ? arrays.first(this.handlers, function (h) { return strings.startsWith(text, h.prefix); }, null) : null;
        };
        QuickOpenRegistry.prototype.getDefaultQuickOpenHandlers = function () {
            return this.defaultHandlers;
        };
        return QuickOpenRegistry;
    })();
    platform_1.Registry.add(exports.Extensions.Quickopen, new QuickOpenRegistry());
    /**
     * A subclass of quick open entry that will open an editor with input and options when running.
     */
    var EditorQuickOpenEntry = (function (_super) {
        __extends(EditorQuickOpenEntry, _super);
        function EditorQuickOpenEntry(_editorService) {
            _super.call(this);
            this._editorService = _editorService;
        }
        Object.defineProperty(EditorQuickOpenEntry.prototype, "editorService", {
            get: function () {
                return this._editorService;
            },
            enumerable: true,
            configurable: true
        });
        EditorQuickOpenEntry.prototype.getInput = function () {
            return null;
        };
        EditorQuickOpenEntry.prototype.getOptions = function () {
            return null;
        };
        EditorQuickOpenEntry.prototype.run = function (mode, context) {
            if (mode === quickOpen_1.Mode.OPEN) {
                var event_1 = context.event;
                var sideBySide = (event_1 && (event_1.ctrlKey || event_1.metaKey || (event_1.payload && event_1.payload.originalEvent && (event_1.payload.originalEvent.ctrlKey || event_1.payload.originalEvent.metaKey))));
                var input = this.getInput();
                if (input instanceof editor_1.EditorInput) {
                    this.editorService.openEditor(input, this.getOptions(), sideBySide).done(null, errors.onUnexpectedError);
                }
                else {
                    this.editorService.openEditor(input, sideBySide).done(null, errors.onUnexpectedError);
                }
                return true;
            }
            return false;
        };
        return EditorQuickOpenEntry;
    })(quickOpenModel_1.QuickOpenEntry);
    exports.EditorQuickOpenEntry = EditorQuickOpenEntry;
    /**
     * A subclass of quick open entry group that provides access to editor input and options.
     */
    var EditorQuickOpenEntryGroup = (function (_super) {
        __extends(EditorQuickOpenEntryGroup, _super);
        function EditorQuickOpenEntryGroup() {
            _super.apply(this, arguments);
        }
        EditorQuickOpenEntryGroup.prototype.getInput = function () {
            return null;
        };
        EditorQuickOpenEntryGroup.prototype.getOptions = function () {
            return null;
        };
        return EditorQuickOpenEntryGroup;
    })(quickOpenModel_1.QuickOpenEntryGroup);
    exports.EditorQuickOpenEntryGroup = EditorQuickOpenEntryGroup;
    var CommandEntry = (function (_super) {
        __extends(CommandEntry, _super);
        function CommandEntry(quickOpenService, prefix, command, highlights) {
            _super.call(this, highlights);
            this.quickOpenService = quickOpenService;
            this.prefix = prefix;
            this.command = command;
            this.command = command;
        }
        CommandEntry.prototype.getIcon = function () {
            return this.command.icon || null;
        };
        CommandEntry.prototype.getLabel = function () {
            return this.command.aliases[0];
        };
        CommandEntry.prototype.run = function (mode, context) {
            if (mode === quickOpen_1.Mode.PREVIEW) {
                return false;
            }
            this.quickOpenService.show(this.prefix + " " + this.command.aliases[0] + " ");
            return false;
        };
        return CommandEntry;
    })(quickOpenModel_1.QuickOpenEntry);
    var CommandQuickOpenHandler = (function (_super) {
        __extends(CommandQuickOpenHandler, _super);
        function CommandQuickOpenHandler(quickOpenService, options) {
            _super.call(this);
            this.quickOpenService = quickOpenService;
            this.prefix = options.prefix;
            this.commands = options.commands.map(function (c) { return ({
                regexp: new RegExp('^(' + c.aliases.join('|') + ')\\b\\W+'),
                command: c
            }); });
            this.defaultCommand = options.defaultCommand || null;
        }
        CommandQuickOpenHandler.prototype.getResults = function (input) {
            var match;
            var command = arrays.first(this.commands, function (c) { return !!(match = input.match(c.regexp)); });
            var promise;
            if (command) {
                promise = command.command.getResults(input.substr(match[0].length));
            }
            else if (this.defaultCommand) {
                promise = this.defaultCommand.getResults(input);
            }
            else {
                promise = this.getCommands(input);
            }
            return promise.then(function (e) { return new quickOpenModel_1.QuickOpenModel(e); });
        };
        CommandQuickOpenHandler.prototype.getCommands = function (input) {
            var _this = this;
            var entries = this.commands
                .map(function (c) { return ({ command: c.command, highlights: filters.matchesFuzzy(input, c.command.aliases[0]) }); })
                .filter(function (_a) {
                var command = _a.command, highlights = _a.highlights;
                return !!highlights || command.aliases.some(function (a) { return input === a; });
            })
                .map(function (_a) {
                var command = _a.command, highlights = _a.highlights;
                return new CommandEntry(_this.quickOpenService, _this.prefix, command, highlights);
            });
            return winjs_base_1.TPromise.as(entries);
        };
        CommandQuickOpenHandler.prototype.getClass = function () {
            return null;
        };
        CommandQuickOpenHandler.prototype.canRun = function () {
            return true;
        };
        CommandQuickOpenHandler.prototype.getAutoFocus = function (input) {
            return { autoFocusFirstEntry: true };
        };
        CommandQuickOpenHandler.prototype.onClose = function (canceled) {
            return;
        };
        CommandQuickOpenHandler.prototype.getGroupLabel = function () {
            return null;
        };
        CommandQuickOpenHandler.prototype.getEmptyLabel = function (input) {
            var match;
            var command = arrays.first(this.commands, function (c) { return !!(match = input.match(c.regexp)); });
            if (!command) {
                return nls.localize('noCommands', "No commands matching");
            }
            return command.command.getEmptyLabel(input);
        };
        CommandQuickOpenHandler = __decorate([
            __param(0, quickOpenService_1.IQuickOpenService)
        ], CommandQuickOpenHandler);
        return CommandQuickOpenHandler;
    })(QuickOpenHandler);
    exports.CommandQuickOpenHandler = CommandQuickOpenHandler;
});
//# sourceMappingURL=quickopen.js.map