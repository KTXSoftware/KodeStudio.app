/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/nls', 'vs/base/common/strings', 'vs/base/common/processes', 'vs/base/node/processes'], function (require, exports, nls, Strings, processes_1, processes_2) {
    var build = 'build';
    var test = 'test';
    var RegexpTaskMatcher = (function () {
        function RegexpTaskMatcher(regExp) {
            this.regexp = regExp;
        }
        RegexpTaskMatcher.prototype.init = function () {
        };
        RegexpTaskMatcher.prototype.match = function (tasks, line) {
            var matches = this.regexp.exec(line);
            if (matches && matches.length > 0) {
                tasks.push(matches[1]);
            }
        };
        return RegexpTaskMatcher;
    })();
    var GruntTaskMatcher = (function () {
        function GruntTaskMatcher() {
        }
        GruntTaskMatcher.prototype.init = function () {
            this.tasksStart = false;
            this.tasksEnd = false;
            this.descriptionOffset = null;
        };
        GruntTaskMatcher.prototype.match = function (tasks, line) {
            // grunt lists tasks as follows (description is wrapped into a new line if too long):
            // ...
            // Available tasks
            //         uglify  Minify files with UglifyJS. *
            //         jshint  Validate files with JSHint. *
            //           test  Alias for "jshint", "qunit" tasks.
            //        default  Alias for "jshint", "qunit", "concat", "uglify" tasks.
            //           long  Alias for "eslint", "qunit", "browserify", "sass",
            //                 "autoprefixer", "uglify", tasks.
            //
            // Tasks run in the order specified
            if (!this.tasksStart && !this.tasksEnd) {
                if (line.indexOf('Available tasks') == 0) {
                    this.tasksStart = true;
                }
            }
            else if (this.tasksStart && !this.tasksEnd) {
                if (line.indexOf('Tasks run in the order specified') == 0) {
                    this.tasksEnd = true;
                }
                else {
                    if (this.descriptionOffset === null) {
                        this.descriptionOffset = line.match(/\S  \S/).index + 1;
                    }
                    var taskName = line.substr(0, this.descriptionOffset).trim();
                    if (taskName.length > 0) {
                        tasks.push(taskName);
                    }
                }
            }
        };
        return GruntTaskMatcher;
    })();
    var ProcessRunnerDetector = (function () {
        function ProcessRunnerDetector(fileService, contextService, variables, config) {
            if (config === void 0) { config = null; }
            this.fileService = fileService;
            this.contextService = contextService;
            this.variables = variables;
            this.taskConfiguration = config;
            this._stderr = [];
        }
        ProcessRunnerDetector.supports = function (runner) {
            return ProcessRunnerDetector.SupportedRunners[runner];
        };
        ProcessRunnerDetector.detectorConfig = function (runner) {
            return ProcessRunnerDetector.TaskMatchers[runner];
        };
        Object.defineProperty(ProcessRunnerDetector.prototype, "stderr", {
            get: function () {
                return this._stderr;
            },
            enumerable: true,
            configurable: true
        });
        ProcessRunnerDetector.prototype.detect = function (list) {
            var _this = this;
            if (list === void 0) { list = false; }
            if (this.taskConfiguration && this.taskConfiguration.command && ProcessRunnerDetector.supports(this.taskConfiguration.command)) {
                var config = ProcessRunnerDetector.detectorConfig(this.taskConfiguration.command);
                var args = (this.taskConfiguration.args || []).concat(config.arg);
                var options = this.taskConfiguration.options ? processes_1.resolveCommandOptions(this.taskConfiguration.options, this.variables) : { cwd: this.variables.workspaceRoot };
                var isShellCommand = !!this.taskConfiguration.isShellCommand;
                return this.runDetection(new processes_2.LineProcess(this.taskConfiguration.command, this.variables.resolve(args), isShellCommand, options), this.taskConfiguration.command, isShellCommand, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }
            else {
                return this.tryDetectGulp(list).then(function (value) {
                    if (value) {
                        return value;
                    }
                    return _this.tryDetectJake(list).then(function (value) {
                        if (value) {
                            return value;
                        }
                        return _this.tryDetectGrunt(list).then(function (value) {
                            if (value) {
                                return value;
                            }
                            return { config: null, stderr: _this.stderr };
                        });
                    });
                });
            }
        };
        ProcessRunnerDetector.prototype.tryDetectGulp = function (list) {
            var _this = this;
            return this.fileService.resolveFile(this.contextService.toResource('gulpfile.js')).then(function (stat) {
                var config = ProcessRunnerDetector.detectorConfig('gulp');
                var process = new processes_2.LineProcess('gulp', [config.arg, '--no-color'], true, { cwd: _this.variables.workspaceRoot });
                return _this.runDetection(process, 'gulp', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }, function (err) {
                return null;
            });
        };
        ProcessRunnerDetector.prototype.tryDetectGrunt = function (list) {
            var _this = this;
            return this.fileService.resolveFile(this.contextService.toResource('Gruntfile.js')).then(function (stat) {
                var config = ProcessRunnerDetector.detectorConfig('grunt');
                var process = new processes_2.LineProcess('grunt', [config.arg, '--no-color'], true, { cwd: _this.variables.workspaceRoot });
                return _this.runDetection(process, 'grunt', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }, function (err) {
                return null;
            });
        };
        ProcessRunnerDetector.prototype.tryDetectJake = function (list) {
            var _this = this;
            return this.fileService.resolveFile(this.contextService.toResource('Jakefile')).then(function (stat) {
                var config = ProcessRunnerDetector.detectorConfig('jake');
                var process = new processes_2.LineProcess('jake', [config.arg], true, { cwd: _this.variables.workspaceRoot });
                return _this.runDetection(process, 'jake', true, config.matcher, ProcessRunnerDetector.DefaultProblemMatchers, list);
            }, function (err) {
                return null;
            });
        };
        ProcessRunnerDetector.prototype.runDetection = function (process, command, isShellCommand, matcher, problemMatchers, list) {
            var _this = this;
            var tasks = [];
            matcher.init();
            return process.start().then(function (success) {
                if (tasks.length === 0) {
                    if (success.cmdCode !== 0) {
                        if (command === 'gulp') {
                            _this._stderr.push(nls.localize('TaskSystemDetector.noGulpTasks', 'Running gulp --tasks-simple didn\'t list any tasks. Did you run npm install?'));
                        }
                        else if (command === 'jake') {
                            _this._stderr.push(nls.localize('TaskSystemDetector.noJakeTasks', 'Running jake --tasks didn\'t list any tasks. Did you run npm install?'));
                        }
                    }
                    return { config: null, stderr: _this._stderr };
                }
                var result = {
                    version: ProcessRunnerDetector.Version,
                    command: command,
                    isShellCommand: isShellCommand
                };
                // Hack. We need to remove this.
                if (command === 'gulp') {
                    result.args = ['--no-color'];
                }
                result.tasks = _this.createTaskDescriptions(tasks, problemMatchers, list);
                return { config: result, stderr: _this._stderr };
            }, function (err) {
                var error = err.error;
                if (error.code === 'ENOENT') {
                    if (command === 'gulp') {
                        _this._stderr.push(nls.localize('TaskSystemDetector.noGulpProgram', 'Gulp is not installed on your system. Run npm install -g gulp to install it.'));
                    }
                    else if (command === 'jake') {
                        _this._stderr.push(nls.localize('TaskSystemDetector.noJakeProgram', 'Jake is not installed on your system. Run npm install -g jake to install it.'));
                    }
                    else if (command === 'grunt') {
                        _this._stderr.push(nls.localize('TaskSystemDetector.noGruntProgram', 'Grunt is not installed on your system. Run npm install -g grunt to install it.'));
                    }
                }
                else {
                    _this._stderr.push(nls.localize('TaskSystemDetector.noProgram', 'Program {0} was not found. Message is {1}', command, error.message));
                }
                return { config: null, stderr: _this._stderr };
            }, function (progress) {
                if (progress.source === processes_1.Source.stderr) {
                    _this._stderr.push(progress.line);
                    return;
                }
                var line = Strings.removeAnsiEscapeCodes(progress.line);
                var matches = matcher.match(tasks, line);
                if (matches && matches.length > 0) {
                    tasks.push(matches[1]);
                }
            });
        };
        ProcessRunnerDetector.prototype.createTaskDescriptions = function (tasks, problemMatchers, list) {
            var _this = this;
            var taskConfigs = [];
            if (list) {
                tasks.forEach(function (task) {
                    taskConfigs.push({
                        taskName: task,
                        args: [],
                        isWatching: false
                    });
                });
            }
            else {
                var taskInfos = {
                    build: { index: -1, exact: -1 },
                    test: { index: -1, exact: -1 }
                };
                tasks.forEach(function (task, index) {
                    _this.testBuild(taskInfos.build, task, index);
                    _this.testTest(taskInfos.test, task, index);
                });
                if (taskInfos.build.index !== -1) {
                    taskConfigs.push({
                        taskName: tasks[taskInfos.build.index],
                        args: [],
                        isBuildCommand: true,
                        isWatching: false,
                        problemMatcher: problemMatchers
                    });
                }
                if (taskInfos.test.index !== -1) {
                    taskConfigs.push({
                        taskName: tasks[taskInfos.test.index],
                        args: [],
                        isTestCommand: true
                    });
                }
            }
            return taskConfigs;
        };
        ProcessRunnerDetector.prototype.testBuild = function (taskInfo, taskName, index) {
            if (taskName === build) {
                taskInfo.index = index;
                taskInfo.exact = 3;
            }
            else if ((Strings.startsWith(taskName, build) || Strings.endsWith(taskName, build)) && taskInfo.exact < 3) {
                taskInfo.index = index;
                taskInfo.exact = 2;
            }
            else if (taskName.indexOf(build) !== -1 && taskInfo.exact < 2) {
                taskInfo.index = index;
                taskInfo.exact = 1;
            }
        };
        ProcessRunnerDetector.prototype.testTest = function (taskInfo, taskName, index) {
            if (taskName === test) {
                taskInfo.index = index;
                taskInfo.exact = 3;
            }
            else if ((Strings.startsWith(taskName, test) || Strings.endsWith(taskName, test)) && taskInfo.exact < 3) {
                taskInfo.index = index;
                taskInfo.exact = 2;
            }
            else if (taskName.indexOf(test) !== -1 && taskInfo.exact < 2) {
                taskInfo.index = index;
                taskInfo.exact = 1;
            }
        };
        ProcessRunnerDetector.Version = '0.1.0';
        ProcessRunnerDetector.SupportedRunners = {
            'gulp': true,
            'jake': true,
            'grunt': true
        };
        ProcessRunnerDetector.TaskMatchers = {
            'gulp': { matcher: new RegexpTaskMatcher(/^(.*)$/), arg: '--tasks-simple' },
            'jake': { matcher: new RegexpTaskMatcher(/^jake\s+([^\s]+)\s/), arg: '--tasks' },
            'grunt': { matcher: new GruntTaskMatcher(), arg: '--help' },
        };
        ProcessRunnerDetector.DefaultProblemMatchers = ['$lessCompile', '$tsc', '$jshint'];
        return ProcessRunnerDetector;
    })();
    exports.ProcessRunnerDetector = ProcessRunnerDetector;
});
//# sourceMappingURL=processRunnerDetector.js.map