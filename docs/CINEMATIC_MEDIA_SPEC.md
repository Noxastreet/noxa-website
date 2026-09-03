# NOXA Cinematic Media Spec

P2 keeps the site fast and cinematic without heavy 3D or decorative UI effects.

## Hero clip

Use when original NOXA footage is available.

- 8–12 second seamless loop
- 16:9 master, 1920×1080 minimum
- night car/moto meet, real people and real vehicles
- slow camera movement; no fake HUD, speedometer or neon overlays
- muted; no audio dependency
- H.264 MP4 plus WebM when practical
- target delivery size: 3–5 MB desktop
- separate compressed poster image
- mobile crop must keep the main subject away from the left text area

## Culture clip

- 6–10 seconds
- group movement: cars or motorcycles leaving a meet / driving together
- large road/environment presence
- no racing competition or dangerous driving framing
- target delivery size: 2–4 MB

## Photography

Priority order:

1. original NOXA meet photography
2. photos supplied by partner communities with permission
3. licensed commercial-use photography as temporary fallback

Required groups:

- JDM / modified cars
- motorcycles
- real meets and people
- night drives
- mountain/coastal drives
- track days
- workshops / automotive businesses

## Visual treatment

- deep blacks
- restrained red accent
- natural headlights and tail lights
- mild contrast / desaturation
- subtle grain only
- no random red lines, fake map graphics, fake UI or excessive glow

## Performance rules

- poster/fallback must work when video is unavailable
- respect `prefers-reduced-motion`
- no autoplay audio
- no WebGL requirement
- do not block page interaction while media loads

Until original NOXA media exists, the production layout uses licensed/static fallbacks and the same cinematic framing.
