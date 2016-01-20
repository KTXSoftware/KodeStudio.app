/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/nls', 'vs/platform/platform', 'vs/editor/common/modes/modesRegistry', 'vs/platform/configuration/common/configurationRegistry', 'vs/languages/css/common/services/lintRules', 'vs/css!vs/languages/css/common/css-hover'], function (require, exports, nls, Platform, modesExtensions, ConfigurationRegistry, lintRules) {
    modesExtensions.registerMode({
        id: 'css',
        extensions: ['.css'],
        aliases: ['CSS', 'css'],
        mimetypes: ['text/css'],
        moduleId: 'vs/languages/css/common/css',
        ctorName: 'CSSMode'
    });
    var configurationRegistry = Platform.Registry.as(ConfigurationRegistry.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'css',
        'order': 20,
        'title': nls.localize('cssConfigurationTitle', "CSS configuration"),
        'allOf': [{
                'title': nls.localize('lint', "Controls CSS validation and problem severities."),
                'properties': lintRules.getConfigurationProperties('css')
            }]
    });
});
//# sourceMappingURL=css.contribution.js.map