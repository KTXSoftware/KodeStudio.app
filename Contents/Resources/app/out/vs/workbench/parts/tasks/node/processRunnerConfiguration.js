/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/nls', 'vs/base/common/objects', 'vs/base/common/platform', 'vs/base/common/types', 'vs/base/common/uuid', 'vs/base/common/parsers', 'vs/platform/markers/common/problemMatcher', 'vs/workbench/parts/tasks/common/taskSystem'], function (require, exports, nls, Objects, Platform, Types, UUID, parsers_1, problemMatcher_1, TaskSystem) {
    /**
     * Defines the problem handling strategy
     */
    var ProblemHandling = (function () {
        function ProblemHandling() {
        }
        /**
         * Cleans all problems for the owner defined in the
         * error pattern.
         */
        ProblemHandling.clean = 'cleanMatcherMatchers';
        return ProblemHandling;
    })();
    exports.ProblemHandling = ProblemHandling;
    var ShowOutput;
    (function (ShowOutput) {
        var always = 'always';
        var silent = 'silent';
        var never = 'never';
    })(ShowOutput = exports.ShowOutput || (exports.ShowOutput = {}));
    var ProblemMatcherKind;
    (function (ProblemMatcherKind) {
        ProblemMatcherKind[ProblemMatcherKind["Unknown"] = 0] = "Unknown";
        ProblemMatcherKind[ProblemMatcherKind["String"] = 1] = "String";
        ProblemMatcherKind[ProblemMatcherKind["ProblemMatcher"] = 2] = "ProblemMatcher";
        ProblemMatcherKind[ProblemMatcherKind["Array"] = 3] = "Array";
    })(ProblemMatcherKind || (ProblemMatcherKind = {}));
    var ConfigurationParser = (function () {
        function ConfigurationParser(logger) {
            this.logger = logger;
            this.validationStatus = new parsers_1.ValidationStatus();
            this.namedProblemMatchers = Object.create(null);
        }
        ConfigurationParser.prototype.log = function (value) {
            this.logger.log(value);
        };
        ConfigurationParser.prototype.run = function (fileConfig) {
            return {
                validationStatus: this.validationStatus,
                configuration: this.createTaskRunnerConfiguration(fileConfig),
                defaultBuildTaskIdentifier: this.defaultBuildTaskIdentifier,
                defaultTestTaskIdentifier: this.defaultTestTaskIdentifier
            };
        };
        ConfigurationParser.prototype.createTaskRunnerConfiguration = function (fileConfig) {
            var globals = this.createGlobals(fileConfig);
            var result = this.createBaseTaskRunnerConfiguration(fileConfig, { isMain: true, globals: globals });
            if (!this.validationStatus.isFatal()) {
                var osConfig = null;
                var osContext = { isMain: false, globals: globals };
                if (fileConfig.windows && Platform.platform === Platform.Platform.Windows) {
                    osConfig = this.createBaseTaskRunnerConfiguration(fileConfig.windows, osContext);
                }
                else if (fileConfig.osx && Platform.platform === Platform.Platform.Mac) {
                    osConfig = this.createBaseTaskRunnerConfiguration(fileConfig.osx, osContext);
                }
                else if (fileConfig.linux && Platform.platform === Platform.Platform.Linux) {
                    osConfig = this.createBaseTaskRunnerConfiguration(fileConfig.linux, osContext);
                }
                if (!this.validationStatus.isFatal()) {
                    if (osConfig) {
                        this.mergeTaskRunnerConigurations(result, osConfig);
                    }
                    if (Types.isUndefined(result.options.cwd)) {
                        result.options.cwd = '${workspaceRoot}';
                    }
                }
            }
            if (!result.command) {
                this.validationStatus.state = parsers_1.ValidationState.Fatal;
                this.log(nls.localize('ConfigurationParser.noCommand', 'Error: no valid command name provided.'));
                return null;
            }
            return result;
        };
        ConfigurationParser.prototype.createGlobals = function (fileConfig) {
            var result = this.parseGlobals(fileConfig);
            var osGlobals = null;
            if (fileConfig.windows && Platform.platform === Platform.Platform.Windows) {
                osGlobals = this.parseGlobals(fileConfig.windows);
            }
            else if (fileConfig.osx && Platform.platform === Platform.Platform.Mac) {
                osGlobals = this.parseGlobals(fileConfig.osx);
            }
            else if (fileConfig.linux && Platform.platform === Platform.Platform.Linux) {
                osGlobals = this.parseGlobals(fileConfig.linux);
            }
            if (osGlobals) {
                Objects.mixin(result, osGlobals, true);
            }
            if (Types.isUndefined(result.isShellCommand)) {
                result.isShellCommand = false;
            }
            if (Types.isUndefined(result.showOutput)) {
                result.showOutput = TaskSystem.ShowOutput.Always;
            }
            if (Types.isUndefined(result.echoCommand)) {
                result.echoCommand = false;
            }
            if (Types.isUndefined(result.suppressTaskName)) {
                result.suppressTaskName = false;
            }
            return result;
        };
        ConfigurationParser.prototype.parseGlobals = function (fileConfig) {
            var result = {};
            if (Types.isString(fileConfig.command)) {
                result.command = fileConfig.command;
            }
            if (Types.isBoolean(fileConfig.isShellCommand)) {
                result.isShellCommand = fileConfig.isShellCommand;
            }
            if (Types.isString(fileConfig.showOutput)) {
                result.showOutput = TaskSystem.ShowOutput.fromString(fileConfig.showOutput);
            }
            if (!Types.isUndefined(fileConfig.echoCommand)) {
                result.echoCommand = !!fileConfig.echoCommand;
            }
            if (!Types.isUndefined(fileConfig.suppressTaskName)) {
                result.suppressTaskName = !!fileConfig.suppressTaskName;
            }
            if (Types.isString(fileConfig.taskSelector)) {
                result.taskSelector = fileConfig.taskSelector;
            }
            return result;
        };
        ConfigurationParser.prototype.mergeTaskRunnerConigurations = function (result, osConfig) {
            if (osConfig.command) {
                result.command = osConfig.command;
            }
            if (osConfig.args) {
                result.args = result.args ? result.args.concat(osConfig.args) : osConfig.args;
            }
            if (!Types.isUndefined(osConfig.isShellCommand)) {
                result.isShellCommand = osConfig.isShellCommand;
            }
            if (osConfig.options) {
                if (Types.isString(osConfig.options.cwd)) {
                    result.options.cwd = osConfig.options.cwd;
                }
                if (osConfig.options.env) {
                    var osEnv = osConfig.options.env;
                    var env = result.options.env;
                    if (env) {
                        Object.keys(osEnv).forEach(function (key) {
                            env[key] = osEnv[key];
                        });
                    }
                    else {
                        result.options.env = osEnv;
                    }
                }
            }
            if (osConfig.tasks) {
                var taskNames = Object.create(null);
                Object.keys(result.tasks).forEach(function (key) {
                    var task = result.tasks[key];
                    taskNames[task.name] = task.id;
                });
                var osTaskNames = Object.create(null);
                Object.keys(osConfig.tasks).forEach(function (key) {
                    var task = osConfig.tasks[key];
                    osTaskNames[task.name] = task.id;
                });
                Object.keys(osTaskNames).forEach(function (taskName) {
                    var id = taskNames[taskName];
                    var osId = osTaskNames[taskName];
                    // Same name exists globally
                    if (id) {
                        delete result.tasks[id];
                    }
                    result.tasks[osId] = osConfig.tasks[osId];
                });
            }
        };
        ConfigurationParser.prototype.createBaseTaskRunnerConfiguration = function (fileConfig, context) {
            var globals = context.globals;
            var result = {
                isShellCommand: globals.isShellCommand,
                args: [],
            };
            if (Types.isString(fileConfig.command)) {
                result.command = fileConfig.command;
            }
            if (!Types.isUndefined(fileConfig.isShellCommand)) {
                result.isShellCommand = fileConfig.isShellCommand;
            }
            var argsIsValid = Types.isUndefined(fileConfig.args);
            if (Types.isStringArray(fileConfig.args)) {
                argsIsValid = true;
                result.args = fileConfig.args.slice();
            }
            if (!argsIsValid) {
                this.validationStatus.state = parsers_1.ValidationState.Fatal;
                this.log(nls.localize('ConfigurationParser.noargs', 'Error: command arguments must be an array of strings. Provided value is:\n{0}', fileConfig.args ? JSON.stringify(fileConfig.args, null, 4) : 'undefined'));
            }
            result.options = this.createCommandOptions(fileConfig.options);
            if (context.isMain) {
                this.namedProblemMatchers = this.createNamedProblemMatchers(fileConfig);
            }
            var hasGlobalMatcher = !Types.isUndefined(fileConfig.problemMatcher);
            var hasTasks = Types.isArray(fileConfig.tasks);
            if (hasTasks) {
                result.tasks = this.createTasks(fileConfig.tasks, context);
                if (hasGlobalMatcher) {
                    this.validationStatus.state = parsers_1.ValidationState.Warning;
                    this.log(nls.localize('ConfigurationParser.globalMatcher', 'Warning: global matchers and tasks can\'t be mixed. Ignoring global matchers.'));
                }
            }
            else if (context.isMain) {
                var isWatching = false;
                if (!Types.isUndefined(fileConfig.isWatching)) {
                    isWatching = !!fileConfig.isWatching;
                }
                var promptOnClose = true;
                if (!Types.isUndefined(fileConfig.promptOnClose)) {
                    promptOnClose = !!fileConfig.promptOnClose;
                }
                else {
                    promptOnClose = !isWatching;
                }
                var task = {
                    id: UUID.generateUuid(),
                    name: globals.command,
                    showOutput: globals.showOutput,
                    suppressTaskName: true,
                    isWatching: isWatching,
                    promptOnClose: promptOnClose,
                    echoCommand: globals.echoCommand,
                };
                if (hasGlobalMatcher) {
                    var problemMatchers = this.createProblemMatchers(fileConfig.problemMatcher);
                    task.problemMatchers = problemMatchers;
                }
                else {
                    task.problemMatchers = [];
                }
                // ToDo@dirkb: this is very special for the tsc watch mode. We should find
                // a exensible solution for this.
                for (var _i = 0, _a = task.problemMatchers; _i < _a.length; _i++) {
                    var matcher = _a[_i];
                    if (matcher.tscWatch) {
                        task.tscWatch = true;
                        break;
                    }
                }
                this.defaultBuildTaskIdentifier = task.id;
                result.tasks = Object.create(null);
                result.tasks[task.id] = task;
            }
            return result;
        };
        ConfigurationParser.prototype.createCommandOptions = function (fileOptions) {
            var result = {};
            if (fileOptions) {
                if (!Types.isUndefined(fileOptions.cwd)) {
                    if (Types.isString(fileOptions.cwd)) {
                        result.cwd = fileOptions.cwd;
                    }
                    else {
                        this.validationStatus.state = parsers_1.ValidationState.Warning;
                        this.log(nls.localize('ConfigurationParser.invalidCWD', 'Warning: options.cwd must be of type string. Ignoring value {0}\n', fileOptions.cwd));
                    }
                }
                if (!Types.isUndefined(fileOptions.env)) {
                    result.env = Objects.clone(fileOptions.env);
                }
            }
            return result;
        };
        ConfigurationParser.prototype.createNamedProblemMatchers = function (fileConfig) {
            var _this = this;
            var result = Object.create(null);
            if (!Types.isArray(fileConfig.declares)) {
                return result;
            }
            var values = fileConfig.declares;
            values.forEach(function (value) {
                var namedProblemMatcher = _this.createNamedProblemMatcher(value);
                if (namedProblemMatcher) {
                    result[namedProblemMatcher.name] = namedProblemMatcher;
                }
            });
            return result;
        };
        ConfigurationParser.prototype.createNamedProblemMatcher = function (value) {
            var result = (new problemMatcher_1.ProblemMatcherParser(problemMatcher_1.registry, this.logger, this.validationStatus)).parse(value);
            if (problemMatcher_1.isNamedProblemMatcher(result)) {
                return result;
            }
            else {
                this.validationStatus.state = parsers_1.ValidationState.Error;
                this.log(nls.localize('ConfigurationParser.noName', 'Error: Problem Matcher in declare scope must have a name:\n{0}\n', JSON.stringify(value, null, 4)));
                return null;
            }
        };
        ConfigurationParser.prototype.createTasks = function (tasks, context) {
            var _this = this;
            var result = Object.create(null);
            if (!tasks) {
                return result;
            }
            var defaultBuildTask = { id: null, exact: -1 };
            var defaultTestTask = { id: null, exact: -1 };
            tasks.forEach(function (externalTask) {
                var taskName = externalTask.taskName;
                if (!taskName) {
                    _this.validationStatus.state = parsers_1.ValidationState.Fatal;
                    _this.log(nls.localize('ConfigurationParser.noTaskName', 'Error: tasks must provide a taskName property. The task will be ignored.\n{0}\n', JSON.stringify(externalTask, null, 4)));
                    return;
                }
                var problemMatchers = _this.createProblemMatchers(externalTask.problemMatcher);
                var task = { id: UUID.generateUuid(), name: taskName, showOutput: context.globals.showOutput };
                if (Types.isStringArray(externalTask.args)) {
                    task.args = externalTask.args.slice();
                }
                task.isWatching = false;
                if (!Types.isUndefined(externalTask.isWatching)) {
                    task.isWatching = !!externalTask.isWatching;
                }
                task.promptOnClose = true;
                if (!Types.isUndefined(externalTask.promptOnClose)) {
                    task.promptOnClose = !!externalTask.promptOnClose;
                }
                else {
                    task.promptOnClose = !task.isWatching;
                }
                if (Types.isString(externalTask.showOutput)) {
                    task.showOutput = TaskSystem.ShowOutput.fromString(externalTask.showOutput);
                }
                if (Types.isUndefined(task.showOutput)) {
                    task.showOutput = context.globals.showOutput;
                }
                task.echoCommand = context.globals.echoCommand;
                if (!Types.isUndefined(externalTask.echoCommand)) {
                    task.echoCommand = !!externalTask.echoCommand;
                }
                task.suppressTaskName = context.globals.suppressTaskName;
                if (!Types.isUndefined(externalTask.suppressTaskName)) {
                    task.suppressTaskName = !!externalTask.suppressTaskName;
                }
                if (problemMatchers) {
                    task.problemMatchers = problemMatchers;
                }
                // ToDo@dirkb: this is very special for the tsc watch mode. We should find
                // a exensible solution for this.
                for (var _i = 0, _a = task.problemMatchers; _i < _a.length; _i++) {
                    var matcher = _a[_i];
                    if (matcher.tscWatch) {
                        task.tscWatch = true;
                        break;
                    }
                }
                result[task.id] = task;
                if (!Types.isUndefined(externalTask.isBuildCommand) && externalTask.isBuildCommand && defaultBuildTask.exact < 2) {
                    defaultBuildTask.id = task.id;
                    defaultBuildTask.exact = 2;
                }
                else if (taskName === 'build' && defaultBuildTask.exact < 2) {
                    defaultBuildTask.id = task.id;
                    defaultBuildTask.exact = 1;
                }
                if (!Types.isUndefined(externalTask.isTestCommand) && externalTask.isTestCommand && defaultTestTask.exact < 2) {
                    defaultTestTask.id = task.id;
                    defaultTestTask.exact = 2;
                }
                else if (taskName === 'test' && defaultTestTask.exact < 2) {
                    defaultTestTask.id = task.id;
                    defaultTestTask.exact = 1;
                }
            });
            if (defaultBuildTask.exact > 0) {
                this.defaultBuildTaskIdentifier = defaultBuildTask.id;
            }
            if (defaultTestTask.exact > 0) {
                this.defaultTestTaskIdentifier = defaultTestTask.id;
            }
            return result;
        };
        ConfigurationParser.prototype.createProblemMatchers = function (problemMatcher) {
            var _this = this;
            var result = [];
            if (Types.isUndefined(problemMatcher)) {
                return result;
            }
            var kind = this.getProblemMatcherKind(problemMatcher);
            if (kind === ProblemMatcherKind.Unknown) {
                this.validationStatus.state = parsers_1.ValidationState.Warning;
                this.log(nls.localize('ConfigurationParser.unknownMatcherKind', 'Warning: the defined problem matcher is unknown. Supported types are string | ProblemMatcher | (string | ProblemMatcher)[].\n{0}\n', JSON.stringify(problemMatcher, null, 4)));
                return result;
            }
            else if (kind === ProblemMatcherKind.String || kind === ProblemMatcherKind.ProblemMatcher) {
                var matcher = this.resolveProblemMatcher(problemMatcher);
                if (matcher) {
                    result.push(matcher);
                }
            }
            else if (kind === ProblemMatcherKind.Array) {
                var problemMatchers = problemMatcher;
                problemMatchers.forEach(function (problemMatcher) {
                    var matcher = _this.resolveProblemMatcher(problemMatcher);
                    if (matcher) {
                        result.push(matcher);
                    }
                });
            }
            return result;
        };
        ConfigurationParser.prototype.getProblemMatcherKind = function (value) {
            if (Types.isString(value)) {
                return ProblemMatcherKind.String;
            }
            else if (Types.isArray(value)) {
                return ProblemMatcherKind.Array;
            }
            else if (!Types.isUndefined(value)) {
                return ProblemMatcherKind.ProblemMatcher;
            }
            else {
                return ProblemMatcherKind.Unknown;
            }
        };
        ConfigurationParser.prototype.resolveProblemMatcher = function (value) {
            if (Types.isString(value)) {
                var variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    variableName = variableName.substring(1);
                    var global_1 = problemMatcher_1.registry.get(variableName);
                    if (global_1) {
                        return Objects.clone(global_1);
                    }
                    var localProblemMatcher = this.namedProblemMatchers[variableName];
                    if (localProblemMatcher) {
                        localProblemMatcher = Objects.clone(localProblemMatcher);
                        // remove the name
                        delete localProblemMatcher.name;
                        return localProblemMatcher;
                    }
                }
                this.validationStatus.state = parsers_1.ValidationState.Error;
                this.log(nls.localize('ConfigurationParser.invalidVaraibleReference', 'Error: Invalid problemMatcher reference: {0}\n', value));
                return null;
            }
            else {
                var json = value;
                return new problemMatcher_1.ProblemMatcherParser(problemMatcher_1.registry, this.logger, this.validationStatus).parse(json);
            }
            return null;
        };
        return ConfigurationParser;
    })();
    function parse(configuration, logger) {
        return (new ConfigurationParser(logger)).run(configuration);
    }
    exports.parse = parse;
});
//# sourceMappingURL=processRunnerConfiguration.js.map