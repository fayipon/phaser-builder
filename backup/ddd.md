You are a senior software architect and full-stack engineer.

Your task is to build a complete professional system called:

Banner AI Studio

This is a web-based animated banner creation platform using:

React + Phaser.

The system allows users to:

1) Visually design animated banners
2) Use templates to quickly generate banners
3) Automatically generate banners using AI inputs
4) Export banners as JSON DSL
5) Render banners using a Phaser runtime player

This system must be structured as a scalable production-grade project.

Use modern best practices and modular architecture.

----------------------------------------------------

TECH STACK

Use:

React
Vite
Phaser
TypeScript
Zustand (state management)

Optional:

Framer Motion for UI animation
uuid for object ids

The project must run with:

npm install
npm run dev

----------------------------------------------------

PROJECT STRUCTURE

Create the following monorepo structure:

banner-ai-studio/

editor/
React banner editor

runtime/
Phaser runtime banner player

dsl/
banner DSL schema

templates/
banner templates

ai/
banner generation logic

assets/
images
icons
fonts

examples/
example banners

----------------------------------------------------

EDITOR UI

Design a professional editor interface similar to:

After Effects (simplified)
Figma
Google Web Designer

Layout:

Top toolbar

Left panel → asset library

Center → Phaser canvas preview

Right panel → properties editor

Bottom → animation timeline

Example layout:

Toolbar

Assets | Canvas | Properties

Timeline

----------------------------------------------------

EDITOR FEATURES

The editor must support:

Create banner

Add image

Add text

Add sprite animation

Add particle effects

Drag objects

Resize objects

Rotate objects

Layer ordering

Timeline animation

Preview animation

Export banner JSON

----------------------------------------------------

SUPPORTED OBJECT TYPES

image
text
sprite
particle emitter
container

----------------------------------------------------

PHASER PREVIEW ENGINE

The canvas preview must use Phaser.

Create a modular scene system.

Modules:

AssetLoader

ObjectRenderer

AnimationRunner

DragController

ParticleSystem

SpriteAnimator

Responsibilities:

load assets

render objects

sync with React state

handle drag events

play timeline animations

----------------------------------------------------

STATE MANAGEMENT

Use Zustand.

State structure:

bannerSize

objects

selectedObject

timeline

assets

layers

----------------------------------------------------

TIMELINE SYSTEM

Implement a keyframe-based animation timeline.

Example timeline:

object: slot_machine

keyframes:

time: 0
scale: 1

time: 500
scale: 1.2

time: 1000
scale: 1

Supported properties:

position
scale
rotation
opacity

Timeline should generate Phaser tween animations.

----------------------------------------------------

BANNER DSL

All banners must export as JSON DSL.

Example DSL:

{
  "size": {
    "width": 728,
    "height": 90
  },

  "assets": [
    "slot_machine.png",
    "coins.png"
  ],

  "objects": [
    {
      "id": "slot_machine",
      "type": "image",
      "asset": "slot_machine.png",
      "x": 200,
      "y": 45,
      "scale": 1
    },

    {
      "id": "jackpot_text",
      "type": "text",
      "text": "MEOW JACKPOT",
      "x": 400,
      "y": 30,
      "style": {
        "fontSize": 32,
        "color": "#FFD700"
      }
    }
  ],

  "timeline": [
    {
      "target": "slot_machine",
      "type": "scale",
      "value": 1.2,
      "duration": 500,
      "repeat": -1,
      "yoyo": true
    }
  ]
}

----------------------------------------------------

RUNTIME PLAYER

Create a lightweight Phaser runtime player.

Responsibilities:

load banner JSON

load assets

create objects

play animations

Example usage:

import { BannerPlayer } from "runtime"

new BannerPlayer({
container: "#banner",
data: bannerJson
})

----------------------------------------------------

TEMPLATE SYSTEM

Implement a banner template system.

Templates must allow placeholders.

Example placeholders:

{{game_name}}

{{jackpot_amount}}

{{bonus}}

Example template:

slot_jackpot

free_spin

big_win

----------------------------------------------------

AI BANNER GENERATOR

Add an AI banner generator module.

Input:

game_name
jackpot_amount
promotion_text
banner_size

Example input:

{
  "game_name": "PG Mahjong Ways",
  "jackpot_amount": "5000",
  "promotion_text": "WIN BIG NOW",
  "banner_size": "728x90"
}

The generator must:

select a template

populate placeholders

generate a full banner JSON

Output:

banner DSL

----------------------------------------------------

PARTICLE EFFECTS

Add particle presets:

coin rain
sparkles
confetti
jackpot explosion

Use Phaser particle emitters.

----------------------------------------------------

SPRITE ANIMATION

Support sprite sheets.

Example uses:

slot spin animation

character animation

----------------------------------------------------

BANNER SIZES

Support:

728x90
300x250
160x600
1080x1080
1920x1080

----------------------------------------------------

PERFORMANCE REQUIREMENTS

60 FPS animation

mobile compatible

GPU accelerated

Maximum objects per banner: 50

----------------------------------------------------

EXAMPLE BANNERS

Generate examples:

slot_jackpot.json

promo_banner.json

bigwin_banner.json

----------------------------------------------------

FUTURE EXTENSIONS

Design architecture so future features can be added:

AI banner generation

campaign automation

dynamic jackpot banners

video export

----------------------------------------------------

FINAL OUTPUT

Generate the full project code.

Include:

React editor

Phaser preview engine

timeline animation system

banner DSL schema

runtime banner player

template system

AI banner generator

example banners

The project must run with:

npm install
npm run dev

Do not generate pseudo code.

Generate full working production-ready code.