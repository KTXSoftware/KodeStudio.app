/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
define(["require", "exports", 'vs/nls', 'vs/base/common/lifecycle', 'vs/base/common/winjs.base', 'vs/base/browser/dom', 'vs/base/common/severity', 'vs/base/common/errors', 'vs/base/parts/quickopen/common/quickOpen', 'vs/base/common/dates', 'vs/base/common/filters', 'vs/workbench/browser/quickopen', 'vs/workbench/parts/extensions/common/extensions', 'vs/workbench/parts/extensions/electron-browser/extensionsActions', 'vs/platform/message/common/message', 'vs/platform/telemetry/common/telemetry', 'vs/platform/instantiation/common/instantiation', 'vs/workbench/services/workspace/common/contextService', 'vs/base/browser/ui/highlightedlabel/highlightedLabel', 'vs/base/common/actions', 'semver', 'vs/base/browser/ui/actionbar/actionbar', 'electron', 'vs/css!./media/extensions'], function (require, exports, nls, lifecycle_1, winjs_base_1, dom, severity_1, errors_1, quickOpen_1, dates_1, filters_1, quickopen_1, extensions_1, extensionsActions_1, message_1, telemetry_1, instantiation_1, contextService_1, highlightedLabel_1, actions_1, semver, actionbar_1, electron_1) {
    var $ = dom.emmet;
    var InstallLabel = nls.localize('install', "Install Extension");
    var UpdateLabel = nls.localize('update', "Update Extension");
    (function (ExtensionState) {
        ExtensionState[ExtensionState["Uninstalled"] = 0] = "Uninstalled";
        ExtensionState[ExtensionState["Installed"] = 1] = "Installed";
        ExtensionState[ExtensionState["Outdated"] = 2] = "Outdated";
    })(exports.ExtensionState || (exports.ExtensionState = {}));
    var ExtensionState = exports.ExtensionState;
    function getHighlights(input, extension) {
        var name = filters_1.matchesContiguousSubString(input, extension.name) || [];
        var displayName = filters_1.matchesContiguousSubString(input, extension.displayName) || [];
        var description = filters_1.matchesContiguousSubString(input, extension.description) || [];
        if (!name.length && !displayName.length && !description.length) {
            return null;
        }
        return { name: name, displayName: displayName, description: description };
    }
    function extensionEquals(one, other) {
        return one.publisher === other.publisher && one.name === other.name;
    }
    function extensionEntryCompare(one, other) {
        var oneName = one.extension.displayName || one.extension.name;
        var otherName = other.extension.displayName || other.extension.name;
        return oneName.localeCompare(otherName);
    }
    var OpenInGalleryAction = (function (_super) {
        __extends(OpenInGalleryAction, _super);
        function OpenInGalleryAction(promptToInstall, messageService, contextService, instantiationService) {
            _super.call(this, 'extensions.open-in-gallery', 'Readme', '', true);
            this.promptToInstall = promptToInstall;
            this.messageService = messageService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
        }
        OpenInGalleryAction.prototype.run = function (extension) {
            var _this = this;
            var url = this.contextService.getConfiguration().env.extensionsGallery.itemUrl + "/" + extension.publisher + "." + extension.name;
            electron_1.shell.openExternal(url);
            if (!this.promptToInstall) {
                return winjs_base_1.TPromise.as(null);
            }
            var hideMessage = this.messageService.show(severity_1.default.Info, {
                message: nls.localize('installPrompt', "Would you like to install '{0}'?", extension.displayName),
                actions: [
                    new actions_1.Action('cancelaction', nls.localize('cancel', 'Cancel')),
                    new actions_1.Action('installNow', nls.localize('installNow', 'Install Now'), null, true, function () {
                        hideMessage();
                        var hideInstallMessage = _this.messageService.show(severity_1.default.Info, nls.localize('nowInstalling', "'{0}' is being installed...", extension.displayName));
                        var action = _this.instantiationService.createInstance(extensionsActions_1.InstallAction, '');
                        return action.run(extension).then(function (r) {
                            hideInstallMessage();
                            return winjs_base_1.TPromise.as(r);
                        }, function (e) {
                            hideInstallMessage();
                            return winjs_base_1.TPromise.wrapError(e);
                        });
                    })
                ]
            });
            return winjs_base_1.TPromise.as(null);
        };
        OpenInGalleryAction = __decorate([
            __param(1, message_1.IMessageService),
            __param(2, contextService_1.IWorkspaceContextService),
            __param(3, instantiation_1.IInstantiationService)
        ], OpenInGalleryAction);
        return OpenInGalleryAction;
    })(actions_1.Action);
    var InstallRunner = (function () {
        function InstallRunner(instantiationService) {
            this.instantiationService = instantiationService;
        }
        InstallRunner.prototype.run = function (entry, mode, context) {
            if (mode === quickOpen_1.Mode.PREVIEW) {
                return false;
            }
            if (entry.state === ExtensionState.Installed) {
                return false;
            }
            if (!this.action) {
                this.action = this.instantiationService.createInstance(extensionsActions_1.InstallAction, InstallLabel);
            }
            this.action.run(entry.extension).done(null, errors_1.onUnexpectedError);
            return true;
        };
        InstallRunner = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], InstallRunner);
        return InstallRunner;
    })();
    var Renderer = (function () {
        function Renderer(instantiationService, extensionsService) {
            this.instantiationService = instantiationService;
            this.extensionsService = extensionsService;
        }
        Renderer.prototype.getHeight = function (entry) {
            return 48;
        };
        Renderer.prototype.getTemplateId = function (entry) {
            return 'extension';
        };
        Renderer.prototype.renderTemplate = function (templateId, container) {
            var root = dom.append(container, $('.extension'));
            var firstRow = dom.append(root, $('.row'));
            var secondRow = dom.append(root, $('.row'));
            var published = dom.append(firstRow, $('.published'));
            var since = dom.append(published, $('span.since'));
            var author = dom.append(published, $('span.author'));
            return {
                root: root,
                author: author,
                since: since,
                displayName: new highlightedLabel_1.HighlightedLabel(dom.append(firstRow, $('span.name'))),
                version: dom.append(firstRow, $('span.version')),
                actionbar: new actionbar_1.ActionBar(dom.append(secondRow, $('.actions'))),
                description: new highlightedLabel_1.HighlightedLabel(dom.append(secondRow, $('span.description'))),
                disposables: []
            };
        };
        Renderer.prototype.renderElement = function (entry, templateId, data) {
            var _this = this;
            var extension = entry.extension;
            var date = extension.galleryInformation ? extension.galleryInformation.date : null;
            var publisher = extension.galleryInformation ? extension.galleryInformation.publisherDisplayName : extension.publisher;
            var actionOptions = { icon: true, label: false };
            var updateActions = function () {
                data.actionbar.clear();
                if (entry.extension.galleryInformation) {
                    data.actionbar.push(_this.instantiationService.createInstance(OpenInGalleryAction, entry.state !== ExtensionState.Installed), { label: true, icon: false });
                }
                switch (entry.state) {
                    case ExtensionState.Uninstalled:
                        if (entry.extension.galleryInformation) {
                            data.actionbar.push(_this.instantiationService.createInstance(extensionsActions_1.InstallAction, InstallLabel), actionOptions);
                        }
                        break;
                    case ExtensionState.Installed:
                        data.actionbar.push(_this.instantiationService.createInstance(extensionsActions_1.UninstallAction), actionOptions);
                        break;
                    case ExtensionState.Outdated:
                        data.actionbar.push(_this.instantiationService.createInstance(extensionsActions_1.UninstallAction), actionOptions);
                        data.actionbar.push(_this.instantiationService.createInstance(extensionsActions_1.InstallAction, UpdateLabel), actionOptions);
                        break;
                }
            };
            var onExtensionStateChange = function (e, state) {
                if (extensionEquals(e, extension)) {
                    entry.state = state;
                    updateActions();
                }
            };
            data.actionbar.context = extension;
            updateActions();
            data.disposables = lifecycle_1.disposeAll(data.disposables);
            data.disposables.push(this.extensionsService.onDidInstallExtension(function (e) { return onExtensionStateChange(e, ExtensionState.Installed); }));
            data.disposables.push(this.extensionsService.onDidUninstallExtension(function (e) { return onExtensionStateChange(e, ExtensionState.Uninstalled); }));
            data.displayName.set(extension.displayName, entry.highlights.displayName);
            data.displayName.element.title = extension.name;
            data.version.textContent = extension.version;
            data.since.textContent = date ? dates_1.since(new Date(date)) : '';
            data.author.textContent = publisher;
            data.description.set(extension.description, entry.highlights.description);
            data.description.element.title = extension.description;
        };
        Renderer.prototype.disposeTemplate = function (templateId, data) {
            data.displayName.dispose();
            data.description.dispose();
            data.disposables = lifecycle_1.disposeAll(data.disposables);
        };
        Renderer = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, extensions_1.IExtensionsService)
        ], Renderer);
        return Renderer;
    })();
    var DataSource = (function () {
        function DataSource() {
        }
        DataSource.prototype.getId = function (entry) {
            var extension = entry.extension;
            if (extension.galleryInformation) {
                return extension.galleryInformation.id + "-" + extension.version;
            }
            return "local@" + extension.publisher + "." + extension.name + "-" + extension.version + "@" + (extension.path || '');
        };
        DataSource.prototype.getLabel = function (entry) {
            return entry.extension.name;
        };
        return DataSource;
    })();
    var LocalExtensionsModel = (function () {
        function LocalExtensionsModel(extensions, instantiationService) {
            this.extensions = extensions;
            this.dataSource = new DataSource();
            this.runner = { run: function () { return false; } };
            this.renderer = instantiationService.createInstance(Renderer);
            this.entries = [];
        }
        Object.defineProperty(LocalExtensionsModel.prototype, "input", {
            set: function (input) {
                this.entries = this.extensions
                    .map(function (extension) { return ({ extension: extension, highlights: getHighlights(input, extension) }); })
                    .filter(function (_a) {
                    var highlights = _a.highlights;
                    return !!highlights;
                })
                    .map(function (_a) {
                    var extension = _a.extension, highlights = _a.highlights;
                    return ({
                        extension: extension,
                        highlights: highlights,
                        state: ExtensionState.Installed
                    });
                })
                    .sort(extensionEntryCompare);
            },
            enumerable: true,
            configurable: true
        });
        LocalExtensionsModel = __decorate([
            __param(1, instantiation_1.IInstantiationService)
        ], LocalExtensionsModel);
        return LocalExtensionsModel;
    })();
    var LocalExtensionsHandler = (function (_super) {
        __extends(LocalExtensionsHandler, _super);
        function LocalExtensionsHandler(instantiationService, extensionsService) {
            _super.call(this);
            this.instantiationService = instantiationService;
            this.extensionsService = extensionsService;
            this.modelPromise = null;
        }
        LocalExtensionsHandler.prototype.getResults = function (input) {
            var _this = this;
            if (!this.modelPromise) {
                this.modelPromise = this.extensionsService.getInstalled()
                    .then(function (extensions) { return _this.instantiationService.createInstance(LocalExtensionsModel, extensions); });
            }
            return this.modelPromise.then(function (model) {
                model.input = input;
                return model;
            });
        };
        LocalExtensionsHandler.prototype.getEmptyLabel = function (input) {
            return nls.localize('noExtensionsInstalled', "No extensions found");
        };
        LocalExtensionsHandler.prototype.getAutoFocus = function (searchValue) {
            return { autoFocusFirstEntry: true };
        };
        LocalExtensionsHandler.prototype.onClose = function (canceled) {
            this.modelPromise = null;
        };
        LocalExtensionsHandler = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, extensions_1.IExtensionsService)
        ], LocalExtensionsHandler);
        return LocalExtensionsHandler;
    })(quickopen_1.QuickOpenHandler);
    exports.LocalExtensionsHandler = LocalExtensionsHandler;
    var GalleryExtensionsModel = (function () {
        function GalleryExtensionsModel(galleryExtensions, localExtensions, instantiationService) {
            this.galleryExtensions = galleryExtensions;
            this.localExtensions = localExtensions;
            this.dataSource = new DataSource();
            this.renderer = instantiationService.createInstance(Renderer);
            this.runner = instantiationService.createInstance(InstallRunner);
            this.entries = [];
        }
        Object.defineProperty(GalleryExtensionsModel.prototype, "input", {
            set: function (input) {
                var _this = this;
                this.entries = this.galleryExtensions
                    .map(function (extension) { return ({ extension: extension, highlights: getHighlights(input, extension) }); })
                    .filter(function (_a) {
                    var highlights = _a.highlights;
                    return !!highlights;
                })
                    .map(function (_a) {
                    var extension = _a.extension, highlights = _a.highlights;
                    var local = _this.localExtensions.filter(function (local) { return extensionEquals(local, extension); })[0];
                    return {
                        extension: extension,
                        highlights: highlights,
                        state: local
                            ? (local.version === extension.version ? ExtensionState.Installed : ExtensionState.Outdated)
                            : ExtensionState.Uninstalled
                    };
                })
                    .sort(extensionEntryCompare);
            },
            enumerable: true,
            configurable: true
        });
        GalleryExtensionsModel = __decorate([
            __param(2, instantiation_1.IInstantiationService)
        ], GalleryExtensionsModel);
        return GalleryExtensionsModel;
    })();
    var GalleryExtensionsHandler = (function (_super) {
        __extends(GalleryExtensionsHandler, _super);
        function GalleryExtensionsHandler(instantiationService, extensionsService, galleryService, telemetryService) {
            _super.call(this);
            this.instantiationService = instantiationService;
            this.extensionsService = extensionsService;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
        }
        GalleryExtensionsHandler.prototype.getResults = function (input) {
            var _this = this;
            if (!this.modelPromise) {
                this.telemetryService.publicLog('extensionGallery:open');
                this.modelPromise = winjs_base_1.TPromise.join([this.galleryService.query(), this.extensionsService.getInstalled()])
                    .then(function (result) { return _this.instantiationService.createInstance(GalleryExtensionsModel, result[0], result[1]); });
            }
            return this.modelPromise.then(function (model) {
                model.input = input;
                return model;
            });
        };
        GalleryExtensionsHandler.prototype.onClose = function (canceled) {
            this.modelPromise = null;
        };
        GalleryExtensionsHandler.prototype.getEmptyLabel = function (input) {
            return nls.localize('noExtensionsToInstall', "No extensions found");
        };
        GalleryExtensionsHandler.prototype.getAutoFocus = function (searchValue) {
            return { autoFocusFirstEntry: true };
        };
        GalleryExtensionsHandler = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, extensions_1.IExtensionsService),
            __param(2, extensions_1.IGalleryService),
            __param(3, telemetry_1.ITelemetryService)
        ], GalleryExtensionsHandler);
        return GalleryExtensionsHandler;
    })(quickopen_1.QuickOpenHandler);
    exports.GalleryExtensionsHandler = GalleryExtensionsHandler;
    var OutdatedExtensionsModel = (function () {
        function OutdatedExtensionsModel(galleryExtensions, localExtensions, instantiationService) {
            this.galleryExtensions = galleryExtensions;
            this.localExtensions = localExtensions;
            this.dataSource = new DataSource();
            this.renderer = instantiationService.createInstance(Renderer);
            this.runner = instantiationService.createInstance(InstallRunner);
            this.entries = [];
        }
        Object.defineProperty(OutdatedExtensionsModel.prototype, "input", {
            set: function (input) {
                var _this = this;
                this.entries = this.galleryExtensions
                    .map(function (extension) { return ({ extension: extension, highlights: getHighlights(input, extension) }); })
                    .filter(function (_a) {
                    var extension = _a.extension, highlights = _a.highlights;
                    var local = _this.localExtensions.filter(function (local) { return extensionEquals(local, extension); })[0];
                    return local && semver.lt(local.version, extension.version) && !!highlights;
                })
                    .map(function (_a) {
                    var extension = _a.extension, highlights = _a.highlights;
                    return ({
                        extension: extension,
                        highlights: highlights,
                        state: ExtensionState.Outdated
                    });
                })
                    .sort(extensionEntryCompare);
            },
            enumerable: true,
            configurable: true
        });
        OutdatedExtensionsModel = __decorate([
            __param(2, instantiation_1.IInstantiationService)
        ], OutdatedExtensionsModel);
        return OutdatedExtensionsModel;
    })();
    var OutdatedExtensionsHandler = (function (_super) {
        __extends(OutdatedExtensionsHandler, _super);
        function OutdatedExtensionsHandler(instantiationService, extensionsService, galleryService, telemetryService) {
            _super.call(this);
            this.instantiationService = instantiationService;
            this.extensionsService = extensionsService;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
        }
        OutdatedExtensionsHandler.prototype.getResults = function (input) {
            var _this = this;
            if (!this.modelPromise) {
                this.telemetryService.publicLog('extensionGallery:open');
                this.modelPromise = winjs_base_1.TPromise.join([this.galleryService.query(), this.extensionsService.getInstalled()])
                    .then(function (result) { return _this.instantiationService.createInstance(OutdatedExtensionsModel, result[0], result[1]); });
            }
            return this.modelPromise.then(function (model) {
                model.input = input;
                return model;
            });
        };
        OutdatedExtensionsHandler.prototype.onClose = function (canceled) {
            this.modelPromise = null;
        };
        OutdatedExtensionsHandler.prototype.getEmptyLabel = function (input) {
            return nls.localize('noOutdatedExtensions', "No outdated extensions found");
        };
        OutdatedExtensionsHandler.prototype.getAutoFocus = function (searchValue) {
            return { autoFocusFirstEntry: true };
        };
        OutdatedExtensionsHandler = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, extensions_1.IExtensionsService),
            __param(2, extensions_1.IGalleryService),
            __param(3, telemetry_1.ITelemetryService)
        ], OutdatedExtensionsHandler);
        return OutdatedExtensionsHandler;
    })(quickopen_1.QuickOpenHandler);
    exports.OutdatedExtensionsHandler = OutdatedExtensionsHandler;
});
//# sourceMappingURL=extensionsQuickOpen.js.map