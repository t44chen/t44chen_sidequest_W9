## Project Title

## GBDA302 Week 9 Side Quest

## Authors

Tracey Chen 21057118 t44chen

---

## Description

A 2D pixel platformer where you play as a fox racing against the clock. The objective is to navigate a multi-tiered tile-based level to find a randomly spawning treasure chest. The game features a two-level progression system: clear Level 1 within 30 seconds to unlock a more challenging Level 2, where the timer is cut down to just 15 seconds. It also includes a debug screen for testing physics and game states.

---

## Setup and Interaction Instructions

Gameplay Controls:

- A or D / Left or Right Arrow: Horizontal movement
- W or Up Arrow: Jump
- Space Bar: Attack animation
- C: Continue to Level 2 (Available only on the Level 1 Win screen)
- R: Restart the game (Available only on the final Win or Lose screens)

Developer Debug Controls:

- ` (Backtick): Open or close the Debug Menu
- 1: Toggle HUD Stats (Displays FPS, player coordinates, velocity, and grounded state)
- 2: Toggle Collision Boxes (Shows p5play green/red physical hitboxes)
- 3: Toggle Player Invincible (Grants infinite time and teleports the player back to the start instead of triggering a Game Over if they fall off the map)

---

## Iteration Notes

Post-Playtest & Recent Updates:

Debug screen & Tools:

- Built a debug menu (toggled via the backtick key) inspired by lecture examples. It includes a real-time HUD text overlay to track variables (coordinates, velocity, state), a hitbox visualizer for fine-tuning platforming, and an invincibility mode for easier testing without the timer running out.

Level Progression:

- Expanded the state machine to support multiple levels (WIN_LEVEL vs WIN_GAME). Added a "Level 2" that dynamically cuts the player's time limit from 30 seconds down to 15 seconds after they successfully complete the first level, increasing the difficulty.

---

## Assets

Process & Decision Documentation

---

## References

N/A

---

## GenAI

The game was designed by Tracey Chen, but she used GenAI to write the code.

---
