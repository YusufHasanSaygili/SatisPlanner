# Using the Planner

## Library, canvas and inspector

- Search the left library, then click or drag an entry to create one physical instance.
- Connect a solid output to the same solid input with a conveyor; fluids require a pipeline.
- Open **Logistics** to add a Conveyor Splitter (one input, up to three outputs) or Conveyor Merger
  (up to three inputs, one output). The first concrete connection binds its material; mixed materials
  are rejected.
- Select a node or connection to edit it in the right inspector.
- Use Undo/Redo, Copy/Paste, Duplicate, Auto layout, Group and the minimap toolbar for larger plans.
- `Alt+D` focuses the next diagnostic; `Alt+S` focuses the next Somersloop-enabled machine.

Every machine is independent. A change to one Constructor does not change another Constructor with
the same recipe. Clock range is 1–250%; higher clocks require Power Shards. Constructor supports one
Somersloop, Assembler/Foundry/Refinery two, and Manufacturer four. Somersloops amplify output and
increase power; the inspector shows the exact potential output and total MW.

Graph cards show rates without opening the inspector. Resource outputs show extraction per minute;
machine inputs show actual/required and machine outputs show actual/maximum per minute. Splitter and
Merger cards show conserved live input/output throughput.

## Bottlenecks

Connection results distinguish requested, required, capacity, actual and lost rates. A capacity
warning names the minimum tier that can carry the requested rate. The canonical Coal example shows
1,200/min requested through Conveyor Mk.5: 780/min actual and 420/min lost. Select Mk.6 to clear it.
Pipeline Mk.1 and Mk.2 are modeled separately from conveyors.

## Profiles and language

The inspector exposes the Satisfactory 1.2 recipe, power and Space Elevator multipliers plus resource
randomization/purity metadata and world seed. UI language and imported game-data locale are stored
independently in every plan. Provenance points to the official 1.2 profile source.
