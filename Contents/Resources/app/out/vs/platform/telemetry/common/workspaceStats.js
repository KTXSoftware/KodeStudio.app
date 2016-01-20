/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/errors', 'vs/platform/files/common/files', 'vs/platform/telemetry/common/telemetry', 'vs/platform/workspace/common/workspace'], function (require, exports, winjs, errors, files_1, telemetry_1, workspace_1) {
    var WorkspaceStats = (function () {
        function WorkspaceStats(fileService, contextService, telemetryService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
        }
        WorkspaceStats.prototype.searchArray = function (arr, regEx) {
            return arr.some(function (v) { return v.search(regEx) > -1; });
        };
        WorkspaceStats.prototype.getWorkspaceTags = function () {
            var _this = this;
            var tags = Object.create(null);
            var workspace = this.contextService.getWorkspace();
            if (workspace && this.fileService) {
                return this.fileService.resolveFile(workspace.resource).then(function (stats) {
                    var names = stats.children.map(function (c) { return c.name; });
                    tags['workspace.empty'] = false;
                    tags['workspace.language.cs'] = _this.searchArray(names, /^.+\.cs$/i);
                    tags['workspace.language.js'] = _this.searchArray(names, /^.+\.js$/i);
                    tags['workspace.language.ts'] = _this.searchArray(names, /^.+\.ts$/i);
                    tags['workspace.language.php'] = _this.searchArray(names, /^.+\.php$/i);
                    tags['workspace.language.python'] = _this.searchArray(names, /^.+\.py$/i);
                    tags['workspace.language.vb'] = _this.searchArray(names, /^.+\.vb$/i);
                    tags['workspace.language.aspx'] = _this.searchArray(names, /^.+\.aspx$/i);
                    tags['workspace.grunt'] = _this.searchArray(names, /^gruntfile\.js$/i);
                    tags['workspace.gulp'] = _this.searchArray(names, /^gulpfile\.js$/i);
                    tags['workspace.jake'] = _this.searchArray(names, /^jakefile\.js$/i);
                    tags['workspace.tsconfig'] = _this.searchArray(names, /^tsconfig\.json$/i);
                    tags['workspace.jsconfig'] = _this.searchArray(names, /^jsconfig\.json$/i);
                    tags['workspace.config.xml'] = _this.searchArray(names, /^config\.xml/i);
                    tags['workspace.vsc.extension'] = _this.searchArray(names, /^vsc-extension-quickstart\.md/i);
                    tags['workspace.ASP5'] = _this.searchArray(names, /^project\.json$/i) && tags['workspace.language.cs'];
                    tags['workspace.sln'] = _this.searchArray(names, /^.+\.sln$|^.+\.csproj$/i);
                    tags['workspace.unity'] = _this.searchArray(names, /^Assets$/i) && _this.searchArray(names, /^Library$/i) && _this.searchArray(names, /^ProjectSettings/i);
                    tags['workspace.npm'] = _this.searchArray(names, /^package\.json$|^node_modules$/i);
                    tags['workspace.bower'] = _this.searchArray(names, /^bower\.json$|^bower_components$/i);
                    tags['workspace.yeoman.code'] = _this.searchArray(names, /^vscodequickstart\.md$/i);
                    tags['workspace.yeoman.code.ext'] = _this.searchArray(names, /^vsc-extension-quickstart\.md$/i);
                    var mainActivity = _this.searchArray(names, /^MainActivity\.cs$/i) || _this.searchArray(names, /^MainActivity\.fs$/i);
                    var appDelegate = _this.searchArray(names, /^AppDelegate\.cs$/i) || _this.searchArray(names, /^AppDelegate\.fs$/i);
                    var androidManifest = _this.searchArray(names, /^AndroidManifest\.xml$/i);
                    var platforms = _this.searchArray(names, /^platforms$/i);
                    var plugins = _this.searchArray(names, /^plugins$/i);
                    var www = _this.searchArray(names, /^www$/i);
                    var properties = _this.searchArray(names, /^Properties/i);
                    var resources = _this.searchArray(names, /^Resources/i);
                    var jni = _this.searchArray(names, /^JNI/i);
                    if (tags['workspace.config.xml'] &&
                        !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                        if (platforms && plugins && www) {
                            tags['workspace.cordova.high'] = true;
                        }
                        else {
                            tags['workspace.cordova.low'] = true;
                        }
                    }
                    if (mainActivity && properties && resources) {
                        tags['workspace.xamarin.android'] = true;
                    }
                    if (appDelegate && resources) {
                        tags['workspace.xamarin.ios'] = true;
                    }
                    if (androidManifest && jni) {
                        tags['workspace.android.cpp'] = true;
                    }
                    return tags;
                }, function (error) { errors.onUnexpectedError(error); return null; });
            }
            else {
                tags['workspace.empty'] = true;
                return winjs.TPromise.as(tags);
            }
        };
        WorkspaceStats.prototype.reportWorkspaceTags = function () {
            var _this = this;
            this.getWorkspaceTags().then(function (tags) {
                _this.telemetryService.publicLog('workspce.tags', tags);
            }, function (error) { return errors.onUnexpectedError(error); });
        };
        WorkspaceStats = __decorate([
            __param(0, files_1.IFileService),
            __param(1, workspace_1.IWorkspaceContextService),
            __param(2, telemetry_1.ITelemetryService)
        ], WorkspaceStats);
        return WorkspaceStats;
    })();
    exports.WorkspaceStats = WorkspaceStats;
});
//# sourceMappingURL=workspaceStats.js.map