package;

/**
 * Adds stub for missing nodejs functions to allow haxe-checkstyle to compile:
 * - stderr
 * - stdout
 *
 * Original: https://github.com/HaxeFoundation/hxnodejs/blob/master/src/Sys.hx
 */
import js.node.ChildProcess;
import js.Node.process;

@:dce
// @:coreApi
class Sys {
	/******* STUB *******/
	public static function stderr():haxe.io.Output {
		return null;
	}

	public static function stdout():haxe.io.Output {
		return null;
	}

	/******* STUB *******/
	public static inline function print(v:Dynamic):Void {
		process.stdout.write(v);
	}

	public static inline function println(v:Dynamic):Void {
		process.stdout.write(v);
		process.stdout.write("\n");
	}

	public static inline function args():Array<String> {
		return process.argv.slice(2);
	}

	public static inline function getEnv(s:String):String {
		return process.env[s];
	}

	public static inline function putEnv(s:String, v:String):Void {
		process.env[s] = v;
	}

	public static function environment():Map<String, String> {
		var m = new Map();
		for (key in process.env.keys())
			m[key] = process.env[key];
		return m;
	}

	public inline static function setTimeLocale(loc:String):Bool {
		return false;
	}

	public inline static function getCwd():String {
		return process.cwd();
	}

	public static inline function setCwd(s:String):Void {
		process.chdir(s);
	}

	public static function systemName():String {
		return switch (process.platform) {
			case "darwin": "Mac";
			case "freebsd": "BSD";
			case "linux": "Linux";
			case "win32": "Windows";
			case other: other; // throw?
		}
	}

	public static inline function command(cmd:String, ?args:Array<String>):Int {
		if (args == null)
			return ChildProcess.spawnSync(cmd, {stdio: "inherit"}).status;
		else
			return ChildProcess.spawnSync(cmd, args, {stdio: "inherit"}).status;
	}

	public static inline function exit(code:Int):Void {
		process.exit(code);
	}

	public static inline function time():Float {
		return (cast Date).now() / 1000;
	}

	public static inline function cpuTime():Float {
		return process.uptime();
	}

	#if (haxe_ver >= 3.3)
	@:deprecated("Use programPath instead")
	#end
	public static inline function executablePath():String {
		return process.argv[0];
	}

	#if (haxe_ver >= 3.3)
	public static inline function programPath():String {
		return js.Node.__filename;
	}
	#end
	/**
		The following are not (yet) implemented.

		static function sleep(seconds:Float):Void;
		static function getChar(echo:Bool):Int;
		static function stdin():haxe.io.Input;
		static function stdout():haxe.io.Output;
		static function stderr():haxe.io.Output;
	 */
}
