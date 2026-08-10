#include <chrono>
#include <map>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

#include <imgui_node_editor.h>

#define private public
#define protected public
#include "production_app.hpp"
#undef protected
#undef private

#include "game_data.hpp"
#include "link.hpp"
#include "node.hpp"
#include "pin.hpp"
#include "recipe.hpp"

#include <SDL.h>
#include <imgui.h>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>

namespace
{
const Recipe* FindRecipe(const std::string& name)
{
    for (const auto& recipe : Data::Recipes())
    {
        if (recipe->name == name)
        {
            return recipe.get();
        }
    }
    throw std::runtime_error("Recipe not found: " + name);
}

void Require(const bool condition, const std::string& message)
{
    if (!condition)
    {
        throw std::runtime_error(message);
    }
}

void RequireFraction(const FractionalNumber& actual, const long long numerator,
    const long long denominator, const std::string& label)
{
    const FractionalNumber expected(numerator, denominator);
    if (actual != expected)
    {
        throw std::runtime_error(label + ": expected " +
            std::to_string(expected.GetNumerator()) + "/" +
            std::to_string(expected.GetDenominator()) + ", got " +
            std::to_string(actual.GetNumerator()) + "/" +
            std::to_string(actual.GetDenominator()));
    }
}

CraftNode* AddCraft(ProductionApp& app, const std::string& recipe_name,
    const float x, const float y)
{
    auto id_generator = [&app]() { return app.GetNextId(); };
    auto node = std::make_unique<CraftNode>(
        app.GetNextId(), FindRecipe(recipe_name), id_generator);
    node->pos = ImVec2(x, y);
    CraftNode* result = node.get();
    app.nodes.emplace_back(std::move(node));
    return result;
}

template<typename T>
T* AddOrganizer(ProductionApp& app, const Item* item, const float x, const float y)
{
    auto id_generator = [&app]() { return app.GetNextId(); };
    auto node = std::make_unique<T>(app.GetNextId(), id_generator, item);
    node->pos = ImVec2(x, y);
    T* result = node.get();
    app.nodes.emplace_back(std::move(node));
    return result;
}

void Connect(ProductionApp& app, Pin* output, Pin* input)
{
    app.CreateLink(output, input, false);
}

void CharacterizeSimpleChainAndRoundTrip(const std::filesystem::path& fixture_path)
{
    ProductionApp app;
    CraftNode* ingot = AddCraft(app, "Iron Ingot", 20.0f, 30.0f);
    CraftNode* plate = AddCraft(app, "Iron Plate", 320.0f, 30.0f);
    Connect(app, ingot->outs.at(0).get(), plate->ins.at(0).get());

    Require(app.UpdateNodesRate(plate->ins.at(0).get(), FractionalNumber(60)),
        "simple chain propagation failed");
    RequireFraction(ingot->current_rate, 2, 1, "Iron Ingot aggregate rate");
    RequireFraction(ingot->outs.at(0)->current_rate, 60, 1, "Iron Ingot output");
    RequireFraction(plate->current_rate, 2, 1, "Iron Plate aggregate rate");
    RequireFraction(plate->outs.at(0)->current_rate, 40, 1, "Iron Plate output");

    const std::string before = app.Serialize();
    std::ifstream fixture_stream(fixture_path, std::ios::binary);
    Require(fixture_stream.good(), "golden v7 fixture could not be opened");
    std::string fixture((std::istreambuf_iterator<char>(fixture_stream)),
        std::istreambuf_iterator<char>());
    while (!fixture.empty() && (fixture.back() == '\n' || fixture.back() == '\r'))
    {
        fixture.pop_back();
    }
    Require(before == fixture, "serialized graph differs from golden v7 fixture");

    ProductionApp restored;
    ax::NodeEditor::SetCurrentEditor(restored.context);
    restored.Deserialize(before);
    ax::NodeEditor::SetCurrentEditor(nullptr);
    const std::string after = restored.Serialize();

    Require(before == after, "v7 save/load changed serialized graph semantics");
    Require(restored.nodes.size() == 2, "round-trip node count changed");
    Require(restored.links.size() == 1, "round-trip link count changed");

    std::cout << "simple-chain: ore=60/min ingot=60/min plate=40/min\n";
    std::cout << "save-round-trip: semantic equality=true bytes=" << before.size() << "\n";
    std::cout << "save-json=" << before << "\n";
}

void CharacterizeSomersloop()
{
    ProductionApp app;
    CraftNode* plate = AddCraft(app, "Iron Plate", 20.0f, 30.0f);
    plate->num_somersloop = FractionalNumber(1);
    plate->UpdateRate(FractionalNumber(1));

    RequireFraction(plate->ins.at(0)->current_rate, 30, 1,
        "Somersloop Iron Plate input");
    RequireFraction(plate->outs.at(0)->current_rate, 40, 1,
        "Somersloop Iron Plate output");
    std::cout << "somersloop: recipe=Iron Plate rate=1 input=30/min output=40/min count=1\n";
}

void CharacterizeSplitter()
{
    ProductionApp app;
    CraftNode* source = AddCraft(app, "Iron Ingot", 20.0f, 120.0f);
    const Item* ingot_item = source->outs.at(0)->item;
    CustomSplitterNode* splitter = AddOrganizer<CustomSplitterNode>(
        app, ingot_item, 250.0f, 120.0f);
    CraftNode* plate_a = AddCraft(app, "Iron Plate", 500.0f, 30.0f);
    CraftNode* plate_b = AddCraft(app, "Iron Plate", 500.0f, 210.0f);

    Connect(app, source->outs.at(0).get(), splitter->ins.at(0).get());
    Connect(app, splitter->outs.at(0).get(), plate_a->ins.at(0).get());
    Connect(app, splitter->outs.at(1).get(), plate_b->ins.at(0).get());

    Require(app.UpdateNodesRate(source->outs.at(0).get(), FractionalNumber(60)),
        "splitter propagation failed");
    RequireFraction(splitter->ins.at(0)->current_rate, 60, 1, "splitter input");
    RequireFraction(splitter->outs.at(0)->current_rate, 20, 1, "splitter output A");
    RequireFraction(splitter->outs.at(1)->current_rate, 20, 1, "splitter output B");
    RequireFraction(splitter->outs.at(2)->current_rate, 20, 1, "splitter unlinked output");

    std::cout << "splitter: input=60/min outputs=[20,20,20]/min balanced=true\n";
}

void CharacterizeMerger()
{
    ProductionApp app;
    CraftNode* source_a = AddCraft(app, "Iron Ingot", 20.0f, 30.0f);
    CraftNode* source_b = AddCraft(app, "Iron Ingot", 20.0f, 210.0f);
    const Item* ingot_item = source_a->outs.at(0)->item;
    MergerNode* merger = AddOrganizer<MergerNode>(app, ingot_item, 280.0f, 120.0f);
    CraftNode* plate = AddCraft(app, "Iron Plate", 520.0f, 120.0f);

    Connect(app, source_a->outs.at(0).get(), merger->ins.at(0).get());
    Connect(app, source_b->outs.at(0).get(), merger->ins.at(1).get());
    Connect(app, merger->outs.at(0).get(), plate->ins.at(0).get());

    Require(app.UpdateNodesRate(plate->ins.at(0).get(), FractionalNumber(60)),
        "merger propagation failed");
    RequireFraction(merger->ins.at(0)->current_rate, 20, 1, "merger input A");
    RequireFraction(merger->ins.at(1)->current_rate, 20, 1, "merger input B");
    RequireFraction(merger->ins.at(2)->current_rate, 20, 1, "merger unlinked input");
    RequireFraction(merger->outs.at(0)->current_rate, 60, 1, "merger output");

    std::cout << "merger: inputs=[20,20,20]/min output=60/min balanced=true\n";
}
}

int main(int argc, char** argv)
{
    try
    {
        if (argc != 3)
        {
            throw std::runtime_error(
                "Expected game-data path without .json suffix and v7 fixture path");
        }

        if (SDL_Init(SDL_INIT_VIDEO) != 0)
        {
            throw std::runtime_error(std::string("SDL init failed: ") + SDL_GetError());
        }
        SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
        SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
        SDL_Window* window = SDL_CreateWindow("SatisPlanner characterization",
            SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, 64, 64,
            SDL_WINDOW_OPENGL | SDL_WINDOW_HIDDEN);
        if (window == nullptr)
        {
            throw std::runtime_error(std::string("SDL window failed: ") + SDL_GetError());
        }
        SDL_GLContext gl_context = SDL_GL_CreateContext(window);
        if (gl_context == nullptr)
        {
            throw std::runtime_error(std::string("SDL GL context failed: ") + SDL_GetError());
        }

        IMGUI_CHECKVERSION();
        ImGui::CreateContext();
        Data::LoadData(std::filesystem::absolute(argv[1]).string());
        Require(Data::Version() == "1.2", "unexpected game data version");

        CharacterizeSimpleChainAndRoundTrip(std::filesystem::absolute(argv[2]));
        CharacterizeSomersloop();
        CharacterizeSplitter();
        CharacterizeMerger();

        ImGui::DestroyContext();
        SDL_GL_DeleteContext(gl_context);
        SDL_DestroyWindow(window);
        SDL_Quit();
        std::cout << "characterization: PASS\n";
        return 0;
    }
    catch (const std::exception& error)
    {
        std::cerr << "characterization: FAIL: " << error.what() << "\n";
        return 1;
    }
}
