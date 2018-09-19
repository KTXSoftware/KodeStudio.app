#include "pch.h"

#include <Kore/Display.h>
#include <Kore/Graphics4/Graphics.h>
#include <Kore/Window.h>

using namespace Kore;

namespace {
	Window window;
}

Window* Window::get(int window) {
	if (window > 0) {
		return nullptr;
	}
	return &::window;
}

int Window::count() {
	return 1;
}

int Window::x() {
	return 0;
}

int Window::y() {
	return 0;
}

int glWidth();

int Window::width() {
	return glWidth();
}

int glHeight();

int Window::height() {
	return glHeight();
}

void Window::resize(int width, int height) {
	
}

void Window::move(int x, int y) {
	
}

void Window::changeFramebuffer(FramebufferOptions* frame) {
	Graphics4::_changeFramebuffer(0, frame);
}

void Window::changeWindowFeatures(int features) {
	
}

void Window::changeWindowMode(WindowMode mode) {
	
}

void Window::destroy(Window* window) {
	
}

void Window::show() {
	
}

void Window::hide() {
	
}

void Window::setTitle(const char* title) {
	
}

Kore::Window* Kore::Window::create(WindowOptions* win, FramebufferOptions* frame) {
	return nullptr;
}

WindowData::WindowData() {}

Window::Window() {}

void Window::setResizeCallback(void (*value)(int x, int y, void* data), void* data) {
	
}

void Window::setPpiChangedCallback(void(*callback)(int ppi, void* data), void* data) {
	
}

WindowMode Window::mode() {
	return WindowModeFullscreen;
}
