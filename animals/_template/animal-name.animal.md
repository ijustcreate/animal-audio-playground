---
id: "animal-name"
sortOrder: 99
displayName: "Animal Name"
tagline: ""
accentColor: "#8fdccc"
imageFile: "animal-name.image.jpg"
aboutFile: "animal-name.about.md"
videoFile: ""
videoUrl: ""
enabled: true
cropPosition: "50% 50%"
guestRecorderEnabled: true
guestRecorderLabel: "Copy This Sound"
audioClips:
  - id: "sound"
    kind: "sound"
    visible: true
    label: "Animal Sounds"
    file: "audio/animal-name-call.mp3"
    performerName: "Field recording"
    summary: "Primary animal sound effect."
    gain: 1.0
    attackMs: 80
    releaseMs: 520
    startAtSec: 0.0
    endAtSec: 0.0
    loopWhileHeld: true
  - id: "facts"
    kind: "facts"
    visible: false
    label: "Creature Facts"
    file: "audio/animal-name-creature-facts.mp3"
    performerName: "Museum Guest"
    summary: "Spoken museum facts for this animal."
    gain: 1.0
    attackMs: 40
    releaseMs: 650
    startAtSec: 0.0
    endAtSec: 0.0
    loopWhileHeld: false
---
# Animal Entry Template

Use this file to define one animal card in the museum-ready desktop app.

## Naming Convention

- `animal-name.animal.md`: main config for the animal
- `animal-name.about.md`: science facts and narration script
- `animal-name.image.jpg`: square image source for the wall
- `audio/animal-name-call.mp3`: main animal sound
- `audio/animal-name-creature-facts.mp3`: spoken facts track
- `video/animal-name-hero.mp4`: optional local hero video for the more info window
- `videoUrl`: optional YouTube link for the more info window

## Notes

- Hide a button by setting `visible: false`.
- The guest recorder button is controlled by `guestRecorderEnabled`.
- Imported audio and video files are copied into this folder and renamed to match the project structure.
