/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/nls', 'vs/base/common/event', 'vs/platform/platform', 'vs/base/common/objects', 'vs/base/common/strings', 'vs/platform/plugins/common/pluginsRegistry', 'vs/platform/jsonschemas/common/jsonContributionRegistry'], function (require, exports, nls, event_1, platform, objects, strings, pluginsRegistry_1, JSONContributionRegistry) {
    exports.Extensions = {
        Configuration: 'base.contributions.configuration'
    };
    var ConfigurationRegistry = (function () {
        function ConfigurationRegistry() {
            this.configurationContributors = [];
            this.hasJSONContributions = false;
            this._onDidRegisterConfiguration = new event_1.Emitter();
        }
        Object.defineProperty(ConfigurationRegistry.prototype, "onDidRegisterConfiguration", {
            get: function () {
                return this._onDidRegisterConfiguration.event;
            },
            enumerable: true,
            configurable: true
        });
        ConfigurationRegistry.prototype.registerConfiguration = function (configuration) {
            this.configurationContributors.push(configuration);
            this.registerJSONConfiguration(configuration);
            this._onDidRegisterConfiguration.fire(this);
        };
        ConfigurationRegistry.prototype.getConfigurations = function () {
            return this.configurationContributors.slice(0);
        };
        ConfigurationRegistry.prototype.registerJSONConfiguration = function (configuration) {
            var schemaId = strings.format('local://schemas/settings/{0}', configuration.id);
            var schema = objects.clone(configuration);
            schema.id = schemaId;
            var contributionRegistry = platform.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
            contributionRegistry.registerSchema(schemaId, schema);
            contributionRegistry.addSchemaFileAssociation('inmemory://defaults/settings.json', schemaId);
            contributionRegistry.addSchemaFileAssociation('%APP_SETTINGS_HOME%/settings.json', schemaId);
            contributionRegistry.addSchemaFileAssociation('/.vscode/settings.json', schemaId);
        };
        return ConfigurationRegistry;
    })();
    var configurationRegistry = new ConfigurationRegistry();
    platform.Registry.add(exports.Extensions.Configuration, configurationRegistry);
    var configurationExtPoint = pluginsRegistry_1.PluginsRegistry.registerExtensionPoint('configuration', {
        description: nls.localize('vscode.extension.contributes.configuration', 'Contributes configuration settings.'),
        type: 'object',
        default: { title: '', properties: {} },
        properties: {
            title: {
                description: nls.localize('vscode.extension.contributes.configuration.title', 'A summary of the settings. This label will be used in the settings file as separating comment.'),
                type: 'string'
            },
            properties: {
                description: nls.localize('vscode.extension.contributes.configuration.properties', 'Description of the configuration properties.'),
                type: 'object',
                additionalProperties: {
                    $ref: 'http://json-schema.org/draft-04/schema#'
                }
            }
        }
    });
    configurationExtPoint.setHandler(function (extensions) {
        for (var i = 0; i < extensions.length; i++) {
            var configuration = extensions[i].value;
            var collector = extensions[i].collector;
            if (configuration.type && configuration.type !== 'object') {
                collector.warn(nls.localize('invalid.type', "if set, 'configuration.type' must be set to 'object"));
            }
            else {
                configuration.type = 'object';
            }
            if (configuration.title && (typeof configuration.title !== 'string')) {
                collector.error(nls.localize('invalid.title', "'configuration.title' must be a string"));
            }
            if (configuration.properties && (typeof configuration.properties !== 'object')) {
                collector.error(nls.localize('invalid.properties', "'configuration.properties' must be an object"));
                return;
            }
            var clonedConfiguration = objects.clone(configuration);
            clonedConfiguration.id = extensions[i].description.id;
            configurationRegistry.registerConfiguration(clonedConfiguration);
        }
    });
});
//# sourceMappingURL=configurationRegistry.js.map