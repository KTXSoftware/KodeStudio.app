#pragma once

#include <objc/runtime.h>

namespace Kore {
	class ConstantBuffer5Impl {
	public:
		ConstantBuffer5Impl();
		~ConstantBuffer5Impl();
		id _buffer;
	protected:
		int lastStart;
		int lastCount;
		int mySize;
		const bool transposeMat3 = true;
		const bool transposeMat4 = true;
	};
}
