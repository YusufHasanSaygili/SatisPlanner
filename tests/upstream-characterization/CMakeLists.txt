cmake_minimum_required(VERSION 3.15)

project(satisplanner-upstream-characterization LANGUAGES C CXX)

set(UPSTREAM_ROOT "${CMAKE_CURRENT_LIST_DIR}/../..")

include("${UPSTREAM_ROOT}/cmake/opengl.cmake")
include("${UPSTREAM_ROOT}/cmake/sdl2.cmake")
include("${UPSTREAM_ROOT}/cmake/imgui.cmake")

add_executable(upstream-characterization
    characterization.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/base_app.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/building.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/fractional_number.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/game_data.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/json.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/link.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/node.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/pin.cpp
    production_app_characterized.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/recipe.cpp
    ${UPSTREAM_ROOT}/ficsit-companion/src/utils.cpp
    ${imgui_SOURCE}
)

set_property(TARGET upstream-characterization PROPERTY CXX_STANDARD 17)
target_include_directories(upstream-characterization PRIVATE
    ${UPSTREAM_ROOT}
    ${UPSTREAM_ROOT}/ficsit-companion/include
    ${imgui_INCLUDE_FOLDERS}
)
target_link_libraries(upstream-characterization PRIVATE ${OPENGL_LIBRARIES})
if(TARGET SDL2::SDL2main)
    target_link_libraries(upstream-characterization PRIVATE SDL2::SDL2main)
endif()
target_link_libraries(upstream-characterization PRIVATE SDL2::SDL2-static)

enable_testing()
add_test(
    NAME upstream-characterization
    COMMAND upstream-characterization
        "${UPSTREAM_ROOT}/assets/satisfactory"
        "${CMAKE_CURRENT_LIST_DIR}/fixtures/simple-chain-v7.fcs"
)
set_tests_properties(upstream-characterization PROPERTIES
    WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}"
)
