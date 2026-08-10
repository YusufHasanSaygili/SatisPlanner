// Test-only translation unit: compile the untouched upstream implementation
// with its internal API visible to the executable characterization harness.
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <functional>
#include <map>
#include <memory>
#include <optional>
#include <queue>
#include <stdexcept>
#include <string>
#include <string_view>
#include <unordered_set>
#include <vector>

#include <imgui.h>
#include <imgui_node_editor.h>

#define private public
#define protected public
#include "ficsit-companion/src/production_app.cpp"
#undef protected
#undef private
