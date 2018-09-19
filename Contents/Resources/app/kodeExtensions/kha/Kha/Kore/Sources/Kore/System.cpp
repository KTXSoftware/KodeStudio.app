#include "pch.h"

#include "System.h"

#include <Kore/Window.h>
#include <Kore/Math/Random.h>

#include <assert.h>
#include <limits>
#include <string.h>

#if !defined(KORE_HTML5) && !defined(KORE_ANDROID) && !defined(KORE_WINDOWS) && !defined(KORE_CONSOLE)
double Kore::System::time() {
	return timestamp() / frequency();
}
#endif

namespace {
	namespace callbacks {
		void (*callback)() = nullptr;
		void (*foregroundCallback)() = nullptr;
		void (*backgroundCallback)() = nullptr;
		void (*pauseCallback)() = nullptr;
		void (*resumeCallback)() = nullptr;
		void (*shutdownCallback)() = nullptr;
		void (*orientationCallback)(Kore::Orientation) = nullptr;
		void (*dropFilesCallback)(wchar_t*) = nullptr;
		char* (*cutCallback)() = nullptr;
		char* (*copyCallback)() = nullptr;
		void (*pasteCallback)(char*) = nullptr;
	}
}

#if defined(KORE_IOS) || defined(KORE_MACOS)
extern "C" {
	bool withAutoreleasepool(bool (*f)());
}
#endif

/*void Kore::System::init(const char* name, int width, int height, int samplesPerPixel) {
	Kore::System::setName(name);
	Kore::System::setup();
	Kore::WindowOptions options;
	options.title = name;
	options.width = width;
	options.height = height;
	options.x = 100;
	options.y = 100;
	options.targetDisplay = -1;
	options.mode = Kore::WindowModeWindow;
	options.rendererOptions.depthBufferBits = 16;
	options.rendererOptions.stencilBufferBits = 8;
	options.rendererOptions.textureFormat = 0;
	options.rendererOptions.antialiasing = samplesPerPixel;
	Kore::System::initWindow(options);
}*/

void Kore::System::setCallback(void (*value)()) {
	callbacks::callback = value;
}

void Kore::System::setForegroundCallback(void (*value)()) {
	callbacks::foregroundCallback = value;
}

void Kore::System::setResumeCallback(void (*value)()) {
	callbacks::resumeCallback = value;
}

void Kore::System::setPauseCallback(void (*value)()) {
	callbacks::pauseCallback = value;
}

void Kore::System::setBackgroundCallback(void (*value)()) {
	callbacks::backgroundCallback = value;
}

void Kore::System::setShutdownCallback(void (*value)()) {
	callbacks::shutdownCallback = value;
}

void Kore::System::setOrientationCallback(void (*value)(Orientation)) {
	callbacks::orientationCallback = value;
}

void Kore::System::setDropFilesCallback(void (*value)(wchar_t*)) {
	callbacks::dropFilesCallback = value;
}

void Kore::System::setCutCallback(char* (*value)()) {
	callbacks::cutCallback = value;
}

void Kore::System::setCopyCallback(char* (*value)()) {
	callbacks::copyCallback = value;
}

void Kore::System::setPasteCallback(void (*value)(char*)) {
	callbacks::pasteCallback = value;
}

void Kore::System::_callback() {
	if (callbacks::callback != nullptr) {
		callbacks::callback();
	}
}

void Kore::System::_foregroundCallback() {
	if (callbacks::foregroundCallback != nullptr) {
		callbacks::foregroundCallback();
	}
}

void Kore::System::_resumeCallback() {
	if (callbacks::resumeCallback != nullptr) {
		callbacks::resumeCallback();
	}
}

void Kore::System::_pauseCallback() {
	if (callbacks::pauseCallback != nullptr) {
		callbacks::pauseCallback();
	}
}

void Kore::System::_backgroundCallback() {
	if (callbacks::backgroundCallback != nullptr) {
		callbacks::backgroundCallback();
	}
}

void Kore::System::_shutdownCallback() {
	if (callbacks::shutdownCallback != nullptr) {
		callbacks::shutdownCallback();
	}
}

void Kore::System::_orientationCallback(Orientation orientation) {
	if (callbacks::orientationCallback != nullptr) {
		callbacks::orientationCallback(orientation);
	}
}

void Kore::System::_dropFilesCallback(wchar_t* filePath) {
	if (callbacks::dropFilesCallback != nullptr) {
		callbacks::dropFilesCallback(filePath);
	}
}

char* Kore::System::_cutCallback() {
	if (callbacks::cutCallback != nullptr) {
		return callbacks::cutCallback();
	}
	return nullptr;
}

char* Kore::System::_copyCallback() {
	if (callbacks::copyCallback != nullptr) {
		return callbacks::copyCallback();
	}
	return nullptr;
}

void Kore::System::_pasteCallback(char* value) {
	if (callbacks::pasteCallback != nullptr) {
		callbacks::pasteCallback(value);
	}
}

namespace {
	namespace appstate {
		bool running = false;
		bool showWindowFlag = true;
		char name[1024] = {"KoreApplication"};
	}
}
/*
void Kore::System::setShowWindowFlag(bool value) {
	appstate::showWindowFlag = value;
}

bool Kore::System::hasShowWindowFlag() {
	return appstate::showWindowFlag;
}

void Kore::System::setName(const char* value) {
	strcpy(appstate::name, value);
}
*/
const char* Kore::System::name() {
	return appstate::name;
}

#ifdef KORE_METAL
void shutdownMetalCompute();
#endif

void Kore::System::stop() {
	appstate::running = false;

	// TODO (DK) destroy graphics + windows, but afaik Application::~Application() was never called, so it's the same behavior now as well

	// for (int windowIndex = 0; windowIndex < sizeof(windowIds) / sizeof(int); ++windowIndex) {
	//	Graphics::destroy(windowIndex);
	//}
	
#ifdef KORE_METAL
	shutdownMetalCompute();
#endif
}

bool Kore::System::frame() {
	_callback();
	handleMessages();
	return appstate::running;
}

void Kore::System::start() {
	appstate::running = true;

#if !defined(KORE_HTML5) && !defined(KORE_TIZEN) && !defined(KORE_XBOX_ONE)
	// if (Graphics::hasWindow()) Graphics::swapBuffers();

#if defined(KORE_IOS) || defined(KORE_MACOS)
	while (withAutoreleasepool(Kore::System::frame)) {
#else
	while (frame()) {
#endif
	}
	_shutdown();
#endif
}

/*
int Kore::System::simpleSetup(int argc, char* argv[], int width, int height, int antialiasing, WindowMode mode, const char* title, bool showWindow) {
	System::setup();

	WindowOptions windowOptions;
	windowOptions.title = "";
	windowOptions.mode = mode;
	windowOptions.width = width;
	windowOptions.height = height;
	windowOptions.rendererOptions.antialiasing = antialiasing;

	Kore::Random::init(static_cast<int>(Kore::System::timestamp() % std::numeric_limits<int>::max()));
	System::setName(title);
	System::setShowWindowFlag(showWindow);
	return System::initWindow(windowOptions);
}
*/

int Kore::System::windowWidth(int window) {
	assert(window < Window::count());
	return Window::get(window)->width();
}

int Kore::System::windowHeight(int window) {
	assert(window < Window::count());
	return Window::get(window)->height();
}
