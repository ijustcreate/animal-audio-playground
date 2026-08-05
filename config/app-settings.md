---
windowTitle: Museum Animal Sound Wall
headerTitle: Press And Hold To Hear The Animal
headerSubtitle: Interactive Museum Display
idleStatusMessage: Hold a button to hear the animal. Sounds can overlap.
language: en
uiMode: museum-display
wallButtonMode: single
windowWidth: 1680
windowHeight: 760
masterGain: 1
defaultAttackMs: 80
defaultReleaseMs: 520
preloadAudio: true
inputInteractionsEnabled: true
controllerMappingEnabled: true
showInputBadges: true
guessingIdleTimeoutSec: 30
guessingSuccessChimeEnabled: true
controllerVisualLayout:
  RB:
    left: 75.68
    top: -3.58
    scale: 1
  RT:
    left: 82.81
    top: 12.2
    scale: 1
  LT:
    left: 1.05
    top: 12.2
    scale: 1
  LB:
    left: 9.13
    top: -3.97
    scale: 1
  B:
    left: 121.93
    top: 41.34
    scale: 1
  'Y':
    left: 111.64
    top: 24.14
    scale: 1
  A:
    left: 111.85
    top: 58.74
    scale: 1
  X:
    left: 100.63
    top: 41.17
    scale: 1.02
  DPad Up:
    left: -21.71
    top: 15.79
    scale: 0.83
  DPad Left:
    left: -34.52
    top: 38.27
    scale: 0.81
  DPad Right:
    left: -8.44
    top: 38.89
    scale: 0.78
  DPad Down:
    left: -21.29
    top: 60.62
    scale: 0.81
  RS:
    left: 60.63
    top: 70.26
    scale: 1
  View:
    left: 28.6
    top: 25.83
    scale: 0.79
  Menu:
    left: 60
    top: 25.48
    scale: 0.83
  Xbox:
    left: 44.09
    top: 40.89
    scale: 1
  LS:
    left: 17.69
    top: 39.75
    scale: 1
inputBindings:
  - actionId: 'barn-owl:sound'
    keyboardKey: '1'
    altInputKey: L
    controllerButton: ''
  - actionId: 'barn-owl:facts'
    keyboardKey: Q
    altInputKey: ''
    controllerButton: ''
  - actionId: 'bull-elk:sound'
    keyboardKey: '2'
    altInputKey: A
    controllerButton: ''
  - actionId: 'bull-elk:facts'
    keyboardKey: W
    altInputKey: ''
    controllerButton: ''
  - actionId: 'coyote:sound'
    keyboardKey: '3'
    altInputKey: I
    controllerButton: ''
  - actionId: 'coyote:facts'
    keyboardKey: E
    altInputKey: ''
    controllerButton: ''
  - actionId: 'field-cricket:sound'
    keyboardKey: '4'
    altInputKey: W
    controllerButton: ''
  - actionId: 'field-cricket:facts'
    keyboardKey: R
    altInputKey: ''
    controllerButton: ''
  - actionId: 'mallard-duck:sound'
    keyboardKey: '5'
    altInputKey: S
    controllerButton: ''
  - actionId: 'geese:sound'
    keyboardKey: '6'
    altInputKey: K
    controllerButton: ''
  - actionId: 'american-bullfrog:sound'
    keyboardKey: '7'
    altInputKey: J
    controllerButton: ''
  - actionId: 'great-blue-heron:sound'
    keyboardKey: '8'
    altInputKey: Q
    controllerButton: ''
  - actionId: 'mallard-duck:facts'
    keyboardKey: T
    altInputKey: ''
    controllerButton: ''
  - actionId: 'geese:facts'
    keyboardKey: 'Y'
    altInputKey: ''
    controllerButton: ''
---
# App Settings

This file controls the desktop app itself.

## What these fields do

- `windowTitle`: Native desktop window title.
- `headerTitle`: Large title shown inside the app.
- `headerSubtitle`: Small label above the title.
- `idleStatusMessage`: Status text shown when nothing is being pressed.
- `windowWidth` / `windowHeight`: Preferred launch size for the desktop window.
- `uiMode`: `touchscreen` keeps the full interactive wall with language controls and the guessing game button. `museum-display` simplifies the wall into just the animal image row and one round sound button per animal.
- `wallButtonMode`: `dual` keeps separate sound and facts buttons. `single` uses one main button where a tap plays the full sound and a hold plays Creature Facts.
- `masterGain`: Global output multiplier applied across every animal.
- `defaultAttackMs`: Default fast fade-in for new animals.
- `defaultReleaseMs`: Default release fade for new animals.
- `preloadAudio`: Load all sound files at startup for lower-latency playback.
- `guessingIdleTimeoutSec`: How long the Who Made That Sound mode waits before returning to free play.
- `guessingSuccessChimeEnabled`: Turn the cheerful correct-answer chime on or off.
- `altInputKey`: Optional alternate keyboard-style trigger for PS/2-to-USB adapters and other simple exhibit switches.

## Notes

- Change values here if you want new defaults before adding more animals.
- Use the in-app Settings menu to edit and save this file from the desktop app.
