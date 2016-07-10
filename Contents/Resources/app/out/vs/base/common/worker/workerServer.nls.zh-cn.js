/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
define("vs/base/common/worker/workerServer.nls.zh-cn", {
	"vs/base/common/errors": [
		"{0}。错误代码: {1}",
		"权限被拒绝 (HTTP {0})",
		"权限被拒绝",
		"{0} (HTTP {1}: {2})",
		"{0} (HTTP {1})",
		"未知连接错误 ({0})",
		"出现未知连接错误。您的 Internet 连接已断开，或者您连接的服务器已脱机。",
		"{0}: {1}",
		"出现未知错误。有关详细信息，请参阅日志。",
		"发生了系统错误({0})",
		"出现未知错误。有关详细信息，请参阅日志。",
		"{0} 个(共 {1} 个错误)",
		"出现未知错误。有关详细信息，请参阅日志。",
		"未实施",
		"非法参数: {0}",
		"非法参数",
		"非法状态: {0}",
		"非法状态",
		"无法加载需要的文件。您的 Internet 连接已断开，或者您连接的服务器已脱机。请刷新浏览器并重试。",
		"未能加载所需文件。请重启应用程序重试。详细信息: {0}",
	],
	"vs/base/common/severity": [
		"错误",
		"警告",
		"信息",
	],
	"vs/editor/common/config/defaultConfig": [
		"编辑器内容",
	],
	"vs/editor/common/model/textModelWithTokens": [
		"标记输入时模式失败。",
	],
	"vs/editor/common/modes/modesRegistry": [
		"纯文本",
	],
	"vs/editor/common/modes/supports/suggestSupport": [
		"启用基于字的建议。",
	],
	"vs/editor/common/services/modeServiceImpl": [
		"有助于语言声明。",
		"语言 ID。",
		"语言的别名。",
		"与语言关联的文件扩展名。",
		"与语言关联的文件名。",
		"与语言关联的文件名 glob 模式。",
		"与语言关联的 Mime 类型。",
		"与语言文件的第一行匹配的正则表达式。",
		"包含语言配置选项的文件的相对路径。",
		"“contributes.{0}”的值为空",
		"属性“{0}”是必需的，其类型必须是“字符串”",
		"属性“{0}”可以省略，其类型必须是 \"string[]\"",
		"属性“{0}”可以省略，其类型必须是 \"string[]\"",
		"属性“{0}”可以省略，其类型必须是“字符串”",
		"属性“{0}”可以省略，其类型必须是“字符串”",
		"属性“{0}”可以省略，其类型必须是 \"string[]\"",
		"属性“{0}”可以省略，其类型必须是 \"string[]\"",
		"无效的“contributes.{0}”。应为数组。",
	],
	"vs/platform/configuration/common/configurationRegistry": [
		"用于配置字符串。",
		"设置摘要。此标签将在设置文件中用作分隔注释。",
		"配置属性的描述。",
		"如果进行设置，\"configuration.type\" 必须设置为对象",
		"configuration.title 必须是字符串",
		"configuration.properties 必须是对象",
	],
	"vs/platform/extensions/common/abstractExtensionService": [
		"无法激活扩展”{1}“。原因：未知依赖关系”{0}“。",
		"无法激活扩展”{1}“。原因: 无法激活依赖关系”{0}“。",
		"无法激活扩展”{0}“。原因: 依赖关系多于 10 级(最可能是依赖关系循环)。",
		"激活扩展“{0}”失败: {1}。",
	],
	"vs/platform/extensions/common/extensionsRegistry": [
		"已获得空扩展说明",
		"属性“{0}”是必需的，其类型必须是“字符串”",
		"属性“{0}”是必需的，其类型必须是“字符串”",
		"属性“{0}”是必需的，其类型必须是“字符串”",
		"属性“{0}”为必需且其类型必须为 \"object\"",
		"属性“{0}”是必需的，其类型必须是“字符串”",
		"属性“{0}”可以省略或其类型必须是 \"string[]\"",
		"属性“{0}”可以省略或其类型必须是 \"string[]\"",
		"必须同时指定或同时省略属性”{0}“和”{1}“",
		"属性“{0}”可以省略，或者其类型必须是“字符串”",
		"应在扩展文件夹({1})中包含 \"main\" ({0})。这可能会使扩展不可移植。",
		"必须同时指定或同时省略属性”{0}“和”{1}“",
		"VS Code 库中使用的扩展的显示名称。",
		"VS Code 库用于对扩展进行分类的类别。",
		"VS Code 商城使用的横幅。",
		"VS Code 商城页标题上的横幅颜色。",
		"横幅中使用的字体颜色主题。",
		"VS Code 扩展的发布服务器。",
		"VS Code 扩展的激活事件。",
		"其他扩展的依赖关系。扩展的标识符始终是 ${publisher}.${name}。例如: vscode.csharp。",
		"包作为 VS Code 扩展发布前执行的脚本。",
		"由此包表示的 VS Code 扩展的所有贡献。",
	],
	"vs/platform/jsonschemas/common/jsonContributionRegistry": [
		"使用架构描述 JSON 文件。参见 json-schema.org 了解详细信息。",
		"架构的唯一标识符。",
		"验证此文档的架构",
		"元素的描述性标题",
		"元素的详细描述。用于悬停菜单和建议。",
		"默认值。由建议使用。",
		"一个可以除尽当前值的数 (即，没有余数)",
		"最大数值，默认包含。",
		"使最大的属性成为专有属性。",
		"最小数值，默认包含。",
		"使最小的属性成为专有属性。",
		"字符串的最大长度。",
		"字符串的最小长度。",
		"匹配字符串的正则表达式。不是隐含固定的。",
		"对于数组，仅适用于项目被设置为一个数组。如果是一个架构，则在项目数组指定项目后，由此架构进行验证。如果为 false，则其他项目将导致验证失败。",
		"用于数组。可以是一个用于验证每个元素的架构，或按顺序验证每个项目的架构数组(第一个架构将验证第一个元素，第二个架构将验证第二个元素，依此类推)。",
		"一个数组内可以包含的项目的最大数量。包含。",
		"一个数组内可以包含的项目的最小数量。包含。",
		"数组中所有项目是否必须唯一。默认为 false。",
		"一个对象可以拥有的属性的最大数量。包含。",
		"一个对象可以拥有的属性的最小数量。包含。",
		"字符串的数组，列出了此对象需要的所有属性的名称。",
		"架构或布尔。如果是架构，则将用于验证与 \"properties\" 或 \"patternProperties\" 不匹配的所有属性。如果是 false，则与两者均不匹配的任何属性都将导致此架构失败。",
		"不用于验证。将你希望使用 $ref 内嵌引用的子架构放在此处",
		"属性名称与每个属性架构的映射。",
		"属性名称的正则表达式与架构的映射，用于匹配属性。",
		"属性名称到属性名称数组或架构的映射。属性名称数组意味着键中的属性名称取决于对象中存在的数组的属性，从而保证名称有效。如果该值是一个架构，则该架构仅应用于该对象(如果键中的属性存在于对象上)。",
		"一组有效的文字值",
		"一个基本架构类型(数字、整数、null、数组、对象、布尔值、字符串)的字符串或一个指定这些类型子集的字符串的数组。",
		"描述值应采用的格式。",
		"架构的数组，全部都必须匹配。",
		"架构的数组，必须至少有一个匹配。",
		"架构的数组，正好有一个必须匹配。",
		"必须不能匹配的架构。",
	]
});