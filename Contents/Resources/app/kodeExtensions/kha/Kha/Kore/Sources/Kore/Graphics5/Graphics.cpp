
#ifndef OPENGL_1_X

#include "pch.h"

#include "Graphics.h"

#include <limits>

using namespace Kore;

namespace {
	int samples = 1;
}

int Graphics5::antialiasingSamples() {
	return ::samples;
}

void Graphics5::setAntialiasingSamples(int samples) {
	::samples = samples;
}

bool Graphics5::fullscreen = false;

// void Graphics5::setVertexBuffer(VertexBuffer& vertexBuffer) {
//	VertexBuffer* vertexBuffers[1] = {&vertexBuffer};
//	setVertexBuffers(vertexBuffers, 1);
//}

#endif
