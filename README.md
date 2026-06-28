# Data-hoarding

A p5.js interactive installation about digital residue, data hoarding, and the illusion of deletion.

Direct link redirect：https://liangcang-al.github.io/data-hoarding-p5/

## Project Description

This project visualizes different types of digital information as physical-like materials on screen.  
Chat history, project files, and screenshots are transformed into different interactive visual systems.

The viewer can enter different scenes and attempt to erase, cut, or disturb the data.  
However, the data keeps returning, accumulating, falling, and leaving traces.

The work reflects how digital deletion often feels incomplete:  
even when we delete files, messages, screenshots, or old projects, their backups, residues, and emotional weight may still remain.

## Scenes

### 1. Home / Digital Rain Navigation

The homepage uses a dark digital rain interface.  
Falling binary data creates a sense of endless information flow.  
The viewer can choose between three data categories:

- Chat History
- Project Files
- Screenshot

### 2. Chat History / Letter Wheat Field

Chat history is represented as a field of letter-based wheat.  
The viewer can drag the mouse to cut mature wheat.  
After being cut, the wheat ears fall and pile up on the ground.

Interaction:

- Drag mouse: cut ripe wheat
- Back button: return to homepage

### 3. Project Files / Letter Waterway

Project files are represented as falling letters from the word `PROJECT`.  
Letters continuously fall and accumulate at the bottom of the screen.  
The viewer can erase part of the accumulated letters with the mouse, but new letters keep falling.

Interaction:

- Mouse press / drag: erase settled letters
- R: reset
- Space: pause / resume
- Back button: return to homepage

### 4. Screenshot / Screenshot Rain

Screenshots are represented as rain-like particles and file-name fragments.  
Screenshot names fall and dissolve into a foggy visual field, suggesting image cache, backup traces, and repeated storage.

Interaction:

- Mouse movement creates a mist-like clearing effect
- Back button: return to homepage

## Technical Information

Built with:

- p5.js
- HTML
- CSS
- JavaScript

File structure:

```text
.
├── index.html
├── style.css
└── sketch.js
