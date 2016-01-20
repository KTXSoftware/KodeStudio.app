/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/platform/platform', 'vs/nls', 'vs/languages/css/common/services/lintRules', 'vs/editor/common/modes/modesRegistry', 'vs/platform/configuration/common/configurationRegistry', 'vs/css!vs/languages/css/common/css-hover'], function (require, exports, platform, nls, lintRules, modesExtensions, ConfigurationRegistry) {
    modesExtensions.registerMode({
        id: 'less',
        extensions: ['.less'],
        aliases: ['Less', 'less'],
        mimetypes: ['text/x-less', 'text/less'],
        moduleId: 'vs/languages/less/common/less',
        ctorName: 'LESSMode'
    });
    var configurationRegistry = platform.Registry.as(ConfigurationRegistry.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'less',
        'order': 22,
        'type': 'object',
        'title': nls.localize('lessConfigurationTitle', "LESS configuration"),
        'allOf': [{
                'title': nls.localize('lessLint', "Controls LESS validation and problem severities."),
                'properties': lintRules.getConfigurationProperties('less')
            }]
    });
});
//# sourceMappingURL=less.contribution.js.map