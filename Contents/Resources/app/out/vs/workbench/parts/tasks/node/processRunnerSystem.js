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
define(["require", "exports", 'vs/nls', 'vs/base/common/objects', 'vs/base/common/platform', 'vs/base/common/winjs.base', 'vs/base/common/async', 'vs/base/common/severity', 'vs/base/common/strings', 'vs/base/common/eventEmitter', 'vs/base/node/processes', 'vs/workbench/parts/tasks/common/problemCollectors', 'vs/workbench/parts/tasks/common/taskSystem', './processRunnerConfiguration'], function (require, exports, nls, Objects, Platform, winjs_base_1, Async, severity_1, Strings, eventEmitter_1, processes_1, problemCollectors_1, taskSystem_1, FileConfig) {
    var ProcessRunnerSystem = (function (_super) {
        __extends(ProcessRunnerSystem, _super);
        function ProcessRunnerSystem(fileConfig, variables, markerService, modelService, telemetryService, outputService, outputChannel, clearOutput) {
            if (clearOutput === void 0) { clearOutput = true; }
            _super.call(this);
            this.fileConfig = fileConfig;
            this.variables = variables;
            this.markerService = markerService;
            this.modelService = modelService;
            this.outputChannel = outputChannel;
            this.outputService = outputService;
            this.telemetryService = telemetryService;
            this.defaultBuildTaskIdentifier = null;
            this.defaultTestTaskIdentifier = null;
            this.childProcess = null;
            this.activeTaskIdentifier = null;
            if (clearOutput) {
                this.clearOutput();
            }
            this.errorsShown = false;
            var parseResult = FileConfig.parse(fileConfig, this);
            this.validationStatus = parseResult.validationStatus;
            ;
            this.configuration = parseResult.configuration;
            this.defaultBuildTaskIdentifier = parseResult.defaultBuildTaskIdentifier;
            this.defaultTestTaskIdentifier = parseResult.defaultTestTaskIdentifier;
            if (!this.validationStatus.isOK()) {
                this.outputService.showOutput(this.outputChannel, false, true);
            }
        }
        ProcessRunnerSystem.prototype.build = function () {
            if (!this.defaultBuildTaskIdentifier) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskRunnerSystem.noBuildTask', 'No build task configured.'), 1);
            }
            return this.executeTask(this.defaultBuildTaskIdentifier, taskSystem_1.Triggers.shortcut);
        };
        ProcessRunnerSystem.prototype.rebuild = function () {
            throw new Error('Task - Rebuild: not implemented yet');
        };
        ProcessRunnerSystem.prototype.clean = function () {
            throw new Error('Task - Clean: not implemented yet');
        };
        ProcessRunnerSystem.prototype.runTest = function () {
            if (!this.defaultTestTaskIdentifier) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskRunnerSystem.noTestTask', 'No test task configured.'), 1);
            }
            return this.executeTask(this.defaultTestTaskIdentifier, taskSystem_1.Triggers.shortcut);
        };
        ProcessRunnerSystem.prototype.run = function (taskIdentifier) {
            return this.executeTask(taskIdentifier);
        };
        ProcessRunnerSystem.prototype.isActive = function () {
            return winjs_base_1.TPromise.as(!!this.childProcess);
        };
        ProcessRunnerSystem.prototype.isActiveSync = function () {
            return !!this.childProcess;
        };
        ProcessRunnerSystem.prototype.canAutoTerminate = function () {
            if (this.childProcess) {
                if (this.activeTaskIdentifier) {
                    var task = this.configuration.tasks[this.activeTaskIdentifier];
                    if (task) {
                        return !task.promptOnClose;
                    }
                }
                return false;
            }
            return true;
        };
        ProcessRunnerSystem.prototype.terminate = function () {
            if (this.childProcess) {
                return this.childProcess.terminate();
            }
            return winjs_base_1.TPromise.as({ success: true });
        };
        ProcessRunnerSystem.prototype.tasks = function () {
            var _this = this;
            var result;
            if (!this.configuration || !this.configuration.tasks) {
                result = [];
            }
            else {
                result = Object.keys(this.configuration.tasks).map(function (key) { return _this.configuration.tasks[key]; });
            }
            return winjs_base_1.TPromise.as(result);
        };
        ProcessRunnerSystem.prototype.executeTask = function (taskIdentifier, trigger) {
            var _this = this;
            if (trigger === void 0) { trigger = taskSystem_1.Triggers.command; }
            if (this.validationStatus.isFatal()) {
                throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TaskRunnerSystem.fatalError', 'The provided task configuration has validation errors. See tasks output log for details.'));
            }
            var task = this.configuration.tasks[taskIdentifier];
            if (!task) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskRunnerSystem.norebuild', 'No task to execute found.'));
            }
            var telemetryEvent = {
                trigger: trigger,
                command: 'other',
                success: true
            };
            try {
                var result = this.doExecuteTask(task, telemetryEvent);
                result.promise = result.promise.then(function (success) {
                    _this.telemetryService.publicLog(ProcessRunnerSystem.TelemetryEventName, telemetryEvent);
                    return success;
                }, function (err) {
                    telemetryEvent.success = false;
                    _this.telemetryService.publicLog(ProcessRunnerSystem.TelemetryEventName, telemetryEvent);
                    return winjs_base_1.TPromise.wrapError(err);
                });
                return result;
            }
            catch (err) {
                telemetryEvent.success = false;
                this.telemetryService.publicLog(ProcessRunnerSystem.TelemetryEventName, telemetryEvent);
                if (err instanceof taskSystem_1.TaskError) {
                    throw err;
                }
                else if (err instanceof Error) {
                    var error = err;
                    this.outputService.append(this.outputChannel, error.message);
                    throw new taskSystem_1.TaskError(severity_1.default.Error, error.message);
                }
                else {
                    this.outputService.append(this.outputChannel, err.toString());
                    throw new taskSystem_1.TaskError(severity_1.default.Error, nls.localize('TaskRunnerSystem.unknownError', 'A unknown error has occurred while executing a task. See task output log for details.'));
                }
            }
        };
        ProcessRunnerSystem.prototype.doExecuteTask = function (task, telemetryEvent) {
            var _this = this;
            var taskSummary = {};
            var configuration = this.configuration;
            if (!this.validationStatus.isOK() && !this.errorsShown) {
                this.showOutput();
                this.errorsShown = true;
            }
            else {
                this.clearOutput();
            }
            var args = this.configuration.args ? this.configuration.args.slice() : [];
            // We need to first pass the task name
            if (!task.suppressTaskName) {
                if (this.fileConfig.taskSelector) {
                    args.push(this.fileConfig.taskSelector + task.name);
                }
                else {
                    args.push(task.name);
                }
            }
            // And then additional arguments
            if (task.args) {
                args = args.concat(task.args);
            }
            args = this.resolveVariables(args);
            var command = this.resolveVariable(configuration.command);
            this.childProcess = new processes_1.LineProcess(command, args, configuration.isShellCommand, this.resolveOptions(configuration.options));
            telemetryEvent.command = this.childProcess.getSanitizedCommand();
            // we have no problem matchers defined. So show the output log
            if (task.showOutput === taskSystem_1.ShowOutput.Always || (task.showOutput === taskSystem_1.ShowOutput.Silent && task.problemMatchers.length === 0)) {
                this.showOutput();
            }
            if (task.echoCommand) {
                var prompt_1 = Platform.isWindows ? '>' : '$';
                this.log("running command" + prompt_1 + " " + command + " " + args.join(' '));
            }
            if (task.isWatching) {
                var watchingProblemMatcher = new problemCollectors_1.WatchingProblemCollector(this.resolveMatchers(task.problemMatchers), this.markerService, this.modelService);
                var toUnbind = [];
                var event_1 = { taskId: task.id, taskName: task.name, type: taskSystem_1.TaskType.Watching };
                var eventCounter = 0;
                toUnbind.push(watchingProblemMatcher.on(problemCollectors_1.ProblemCollectorEvents.WatchingBeginDetected, function () {
                    eventCounter++;
                    _this.emit(taskSystem_1.TaskSystemEvents.Active, event_1);
                }));
                toUnbind.push(watchingProblemMatcher.on(problemCollectors_1.ProblemCollectorEvents.WatchingEndDetected, function () {
                    eventCounter--;
                    _this.emit(taskSystem_1.TaskSystemEvents.Inactive, event_1);
                }));
                watchingProblemMatcher.aboutToStart();
                var delayer = null;
                this.activeTaskIdentifier = task.id;
                var promise = this.childProcess.start().then(function (success) {
                    _this.childProcessEnded();
                    watchingProblemMatcher.dispose();
                    toUnbind.forEach(function (unbind) { return unbind(); });
                    toUnbind = null;
                    for (var i = 0; i < eventCounter; i++) {
                        _this.emit(taskSystem_1.TaskSystemEvents.Inactive, event_1);
                    }
                    eventCounter = 0;
                    if (!_this.checkTerminated(task, success)) {
                        _this.log(nls.localize('TaskRunnerSystem.watchingBuildTaskFinished', '\nWatching build tasks has finished.'));
                    }
                    if (success.cmdCode && success.cmdCode === 1 && watchingProblemMatcher.numberOfMatches === 0 && task.showOutput !== taskSystem_1.ShowOutput.Never) {
                        _this.showOutput();
                    }
                    return taskSummary;
                }, function (error) {
                    _this.childProcessEnded();
                    watchingProblemMatcher.dispose();
                    toUnbind.forEach(function (unbind) { return unbind(); });
                    toUnbind = null;
                    for (var i = 0; i < eventCounter; i++) {
                        _this.emit(taskSystem_1.TaskSystemEvents.Inactive, event_1);
                    }
                    eventCounter = 0;
                    return _this.handleError(task, error);
                }, function (progress) {
                    var line = Strings.removeAnsiEscapeCodes(progress.line);
                    _this.outputService.append(_this.outputChannel, line + '\n');
                    watchingProblemMatcher.processLine(line);
                    if (delayer === null) {
                        delayer = new Async.Delayer(3000);
                    }
                    delayer.trigger(function () {
                        watchingProblemMatcher.forceDelivery();
                        return null;
                    }).then(function () {
                        delayer = null;
                    });
                });
                var result = task.tscWatch ? { restartOnFileChanges: '**/*.ts', promise: promise } : { promise: promise };
                return result;
            }
            else {
                var event_2 = { taskId: task.id, taskName: task.name, type: taskSystem_1.TaskType.SingleRun };
                this.emit(taskSystem_1.TaskSystemEvents.Active, event_2);
                var startStopProblemMatcher = new problemCollectors_1.StartStopProblemCollector(this.resolveMatchers(task.problemMatchers), this.markerService, this.modelService);
                this.activeTaskIdentifier = task.id;
                var promise = this.childProcess.start().then(function (success) {
                    _this.childProcessEnded();
                    startStopProblemMatcher.done();
                    startStopProblemMatcher.dispose();
                    _this.checkTerminated(task, success);
                    _this.emit(taskSystem_1.TaskSystemEvents.Inactive, event_2);
                    if (success.cmdCode && success.cmdCode === 1 && startStopProblemMatcher.numberOfMatches === 0 && task.showOutput !== taskSystem_1.ShowOutput.Never) {
                        _this.showOutput();
                    }
                    return taskSummary;
                }, function (error) {
                    _this.childProcessEnded();
                    startStopProblemMatcher.dispose();
                    _this.emit(taskSystem_1.TaskSystemEvents.Inactive, event_2);
                    return _this.handleError(task, error);
                }, function (progress) {
                    var line = Strings.removeAnsiEscapeCodes(progress.line);
                    _this.outputService.append(_this.outputChannel, line + '\n');
                    startStopProblemMatcher.processLine(line);
                });
                return { promise: promise };
            }
        };
        ProcessRunnerSystem.prototype.childProcessEnded = function () {
            this.childProcess = null;
            this.activeTaskIdentifier = null;
        };
        ProcessRunnerSystem.prototype.handleError = function (task, error) {
            var makeVisible = false;
            if (error.error && !error.terminated) {
                var args = this.configuration.args ? this.configuration.args.join(' ') : '';
                this.log(nls.localize('TaskRunnerSystem.childProcessError', 'Failed to launch external program {0} {1}.', this.configuration.command, args));
                this.outputService.append(this.outputChannel, error.error.message);
                makeVisible = true;
            }
            if (error.stdout) {
                this.outputService.append(this.outputChannel, error.stdout);
                makeVisible = true;
            }
            if (error.stderr) {
                this.outputService.append(this.outputChannel, error.stderr);
                makeVisible = true;
            }
            makeVisible = this.checkTerminated(task, error) || makeVisible;
            if (makeVisible) {
                this.showOutput();
            }
            return winjs_base_1.Promise.wrapError(error);
        };
        ProcessRunnerSystem.prototype.checkTerminated = function (task, data) {
            if (data.terminated) {
                this.log(nls.localize('TaskRunnerSystem.cancelRequested', '\nThe task \'{0}\' was terminated per user request.', task.name));
                return true;
            }
            return false;
        };
        ProcessRunnerSystem.prototype.resolveOptions = function (options) {
            var _this = this;
            var result = { cwd: this.resolveVariable(options.cwd) };
            if (options.env) {
                result.env = Object.create(null);
                Object.keys(options.env).forEach(function (key) {
                    result.env[key] = _this.resolveVariable(options.env[key]);
                });
            }
            return result;
        };
        ProcessRunnerSystem.prototype.resolveVariables = function (value) {
            var _this = this;
            return value.map(function (s) { return _this.resolveVariable(s); });
        };
        ProcessRunnerSystem.prototype.resolveMatchers = function (values) {
            var _this = this;
            if (values.length === 0) {
                return values;
            }
            var result = [];
            values.forEach(function (matcher) {
                if (!matcher.filePrefix) {
                    result.push(matcher);
                }
                else {
                    var copy = Objects.clone(matcher);
                    copy.filePrefix = _this.resolveVariable(copy.filePrefix);
                    result.push(copy);
                }
            });
            return result;
        };
        ProcessRunnerSystem.prototype.resolveVariable = function (value) {
            var _this = this;
            var regexp = /\$\{(.*?)\}/g;
            return value.replace(regexp, function (match, name) {
                var value = _this.variables[name];
                if (value) {
                    return value;
                }
                else {
                    return match;
                }
            });
        };
        ProcessRunnerSystem.prototype.log = function (value) {
            this.outputService.append(this.outputChannel, value + '\n');
        };
        ProcessRunnerSystem.prototype.showOutput = function () {
            this.outputService.showOutput(this.outputChannel, true, true);
        };
        ProcessRunnerSystem.prototype.clearOutput = function () {
            this.outputService.clearOutput(this.outputChannel);
        };
        ProcessRunnerSystem.TelemetryEventName = 'taskService';
        return ProcessRunnerSystem;
    })(eventEmitter_1.EventEmitter);
    exports.ProcessRunnerSystem = ProcessRunnerSystem;
});
//# sourceMappingURL=processRunnerSystem.js.map