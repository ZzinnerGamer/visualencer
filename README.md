Sure! Here’s a polished, professional **GitHub README description** for your module **Visualencer**, written in clear English and structured like a modern open-source project page.

---

# **Visualencer – Visual Scripting for FoundryVTT Sequencer**

**Visualencer** is a FoundryVTT module that introduces a **visual scripting environment** for the popular **Sequencer** module.
Instead of manually writing JavaScript macros to create animations, sounds, effects and camera moves, Visualencer allows you to design them using a **node-based editor**, similar to Unreal Engine’s Blueprint system.

The module generates fully working **Sequencer macros** based on the connected nodes, enabling fast creation of complex visual effects *without coding*.

<img width="2267" height="1014" alt="image" src="https://github.com/user-attachments/assets/66021215-c3f5-4d86-b951-cf2f6232ea5f" />


---

##  **Features**

###  **Node-Based Editor**

* Drag & drop nodes inside an infinite, pannable canvas.
* Connect nodes visually using input/output ports.
* Create nodes via right-click context menu with live search.
* No coding required – everything is visual.

### **Modular Node System**

Visualencer implements a clean parent/child node architecture:

* **Root nodes**: `animation`, `effect`, `sound`, `scrollingText`, `canvasPan`, `crosshair`
* **Child nodes** for Sequencer methods:

  * `.atLocation()`
  * `.on()`
  * `.moveTowards()`
  * `.rotateTowards()`
  * `.teleportTo()`
  * `.fadeIn() / fadeOut()`
  * `.fadeInAudio() / fadeOutAudio()`
  * `.opacity()`
  * `.tint()`
  * `.offset()`
  * `.moveSpeed()`
  * `.delay()`
  * `.repeats()`
  * `.async()`
  * `.waitUntilFinished()`
  * `.hide()`, `.show()`
  * many more…

(Almost) Every Sequencer feature is represented by a node.

### ⚙️ **Automatic Macro Generation**

Visualencer compiles your node graph into a clean, ready-to-use macro:

```js
const seq = new Sequence();
// ... generated instructions ...
await seq.play();
```

You can:

* Copy the generated code
* Or create a Macro item instantly from the UI

###  **Smooth UX**

* Middle-mouse panning
* Drag nodes freely
* Visual Bézier connections
* Automatic line redrawing on movement
---

##  **Installation**

1. Paste the Visualencer manifest URL
2. Enable the module in your World

Requires:

* **Sequencer** (active)
* **FoundryVTT V13+**

---

##  **Usage**

1. Open the **Visualencer** panel from the Token Controls sidebar.
2. Right-click to create nodes, or use the buttons above.
3. Connect them to form a visual logic chain.
4. Click **Export Macro** to generate Sequencer code.
5. Run the macro to see your effect in action.

---

## **Development Status**

Visualencer is under active development.
Upcoming features include:

* Node validation system (family compatibility)
* Multi-output graphs
* Timeline-based sequencing
* Presets and reusable node groups

Contributions and feedback are welcome!

# IMPORTANT NOTE

Wasp, the creator of Sequencer, said in the JB2A server about making this whole feature, this module will not be published on the FoundryVTT module list until Wasp himself says something about dropping this idea. Also this module will be ripped off of existence once Wasp publish his version.
