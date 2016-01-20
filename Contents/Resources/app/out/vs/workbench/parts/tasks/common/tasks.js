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
define(["require", "exports", 'vs/nls', 'vs/base/common/types', 'vs/base/common/uuid', 'vs/base/common/parsers', 'vs/base/common/processes', 'vs/platform/markers/common/problemMatcher'], function (require, exports, NLS, Types, UUID, parsers_1, processes_1, problemMatcher_1) {
    var Config;
    (function (Config) {
        var ShowOutput;
        (function (ShowOutput) {
            var always = 'always';
            var silent = 'silent';
            var never = 'never';
        })(ShowOutput = Config.ShowOutput || (Config.ShowOutput = {}));
    })(Config = exports.Config || (exports.Config = {}));
    (function (ShowOutput) {
        ShowOutput[ShowOutput["Always"] = 0] = "Always";
        ShowOutput[ShowOutput["Silent"] = 1] = "Silent";
        ShowOutput[ShowOutput["Never"] = 2] = "Never";
    })(exports.ShowOutput || (exports.ShowOutput = {}));
    var ShowOutput = exports.ShowOutput;
    var ShowOutput;
    (function (ShowOutput) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'always') {
                return ShowOutput.Always;
            }
            else if (value === 'silent') {
                return ShowOutput.Silent;
            }
            else if (value === 'never') {
                return ShowOutput.Never;
            }
            else {
                return undefined;
            }
        }
        ShowOutput.fromString = fromString;
    })(ShowOutput = exports.ShowOutput || (exports.ShowOutput = {}));
    var TaskParser = (function (_super) {
        __extends(TaskParser, _super);
        function TaskParser(resolver, logger, validationStatus) {
            if (validationStatus === void 0) { validationStatus = new parsers_1.ValidationStatus(); }
            _super.call(this, logger, validationStatus);
            this.resolver = resolver;
        }
        TaskParser.prototype.parse = function (json, parserSettings) {
            var _this = this;
            if (parserSettings === void 0) { parserSettings = { globals: null, emptyExecutable: false, emptyCommand: false }; }
            var id = UUID.generateUuid();
            var name = null;
            var trigger = null;
            var settings = null;
            if (this.is(json.name, Types.isString)) {
                name = json.name;
            }
            if (this.is(json.trigger, Types.isString)) {
                trigger = [json.trigger];
            }
            else if (this.is(json.trigger, Types.isStringArray)) {
                trigger = json.trigger;
            }
            if (name === null && trigger === null) {
                this.status.state = parsers_1.ValidationState.Error;
                this.log(NLS.localize('TaskParser.nameOrTrigger', 'A task must either define a name or a trigger.'));
                return null;
            }
            var executable = json.executable ? (new processes_1.ExecutableParser(this.logger, this.status)).parse(json.executable, { emptyCommand: !!parserSettings.emptyCommand }) : null;
            if (!executable && parserSettings.globals) {
                executable = parserSettings.globals;
            }
            if (executable === null && !parserSettings.emptyExecutable) {
                this.status.state = parsers_1.ValidationState.Error;
                this.log(NLS.localize('TaskParser.noExecutable', 'A task must must define a valid executable.'));
                return null;
            }
            var isWatching = false;
            var showOutput = ShowOutput.Always;
            var echoCommand = false;
            if (this.is(json.isWatching, Types.isBoolean)) {
                isWatching = json.isWatching;
            }
            var promptOnClose = true;
            if (this.is(json.promptOnClose, Types.isBoolean)) {
                promptOnClose = json.promptOnClose;
            }
            else {
                promptOnClose = !isWatching;
            }
            if (this.is(json.showOutput, Types.isString)) {
                showOutput = ShowOutput.fromString(json.showOutput) || ShowOutput.Always;
            }
            if (this.is(json.echoCommand, Types.isBoolean)) {
                echoCommand = json.echoCommand;
            }
            if (this.is(json.settings, Types.isString)) {
                settings = json.settings;
            }
            var problemMatcher = [];
            if (Types.isArray(json.problemMatcher)) {
                json.problemMatcher.forEach(function (value) {
                    var matcher = _this.parseProblemMatcher(value);
                    if (matcher) {
                        problemMatcher.push(matcher);
                    }
                });
            }
            else {
                var matcher = this.parseProblemMatcher(json.problemMatcher);
                if (matcher) {
                    problemMatcher.push(matcher);
                }
            }
            return { id: id, name: name, trigger: trigger, executable: executable, isWatching: isWatching, promptOnClose: promptOnClose, showOutput: showOutput, echoCommand: echoCommand, settings: settings, problemMatcher: problemMatcher };
        };
        TaskParser.prototype.parseProblemMatcher = function (json) {
            if (Types.isString(json)) {
                return json.length > 0 && json.charAt(0) === '$' ? this.resolver.get(json.substr(1)) : null;
            }
            else if (Types.isObject(json)) {
                return new problemMatcher_1.ProblemMatcherParser(this.resolver, this.logger, this.status).parse(json);
            }
            else {
                return null;
            }
        };
        return TaskParser;
    })(parsers_1.Parser);
    exports.TaskParser = TaskParser;
    // let tasksExtPoint = PluginsRegistry.registerExtensionPoint<Config.Task | Config.Task[]>('tasks', {
    // TODO@Dirk: provide JSON schema here
    // });
    var extensionPoint = 'tasks';
    var TaskRegistry = (function () {
        function TaskRegistry() {
            this.tasks = Object.create(null);
            /*
            tasksExtPoint.setHandler((extensions, collector) => {
                // TODO@Dirk: validate extension description here and collect errors/warnings with `collector`
                extensions.forEach(extension => {
                    let extensions = extension.value;
                    if (Types.isArray(extensions)) {
                        (<Config.Task[]>extensions).forEach(this.onTask, this);
                    } else {
                        this.onTask(extensions)
                    }
                });
            });
            */
        }
        TaskRegistry.prototype.onDescriptions = function (descriptions) {
            var _this = this;
            descriptions.forEach(function (description) {
                var extensions = description.contributes[extensionPoint];
                if (Types.isArray(extensions)) {
                    extensions.forEach(_this.onTask, _this);
                }
                else {
                    _this.onTask(extensions);
                }
            });
        };
        TaskRegistry.prototype.onTask = function (json) {
            var logger = {
                log: function (message) { console.warn(message); }
            };
            var parser = new TaskParser(problemMatcher_1.registry, logger);
            var result = parser.parse(json, { emptyExecutable: true, emptyCommand: true });
            this.add(result);
        };
        TaskRegistry.prototype.add = function (task) {
            this.tasks[task.id] = task;
        };
        TaskRegistry.prototype.get = function (id) {
            return this.tasks[id];
        };
        TaskRegistry.prototype.exists = function (id) {
            return !!this.tasks[id];
        };
        TaskRegistry.prototype.remove = function (id) {
            delete this.tasks[id];
        };
        TaskRegistry.prototype.all = function () {
            var _this = this;
            return Object.keys(this.tasks).map(function (key) { return _this.tasks[key]; });
        };
        return TaskRegistry;
    })();
    exports.TaskRegistry = TaskRegistry;
});
//# sourceMappingURL=tasks.js.map