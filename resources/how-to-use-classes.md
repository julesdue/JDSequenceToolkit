Getting Started with the Premiere Pro UXP API

This guide provides practical instructions and code examples for using the "Modern" UXP DOM API in Adobe Premiere Pro. Unlike the legacy ExtendScript (CEP) API, these classes are accessed directly via JavaScript/TypeScript in your UXP plugin.

1. Initial Setup & Entry Point

To start using the API, you must import the premierepro module.

// Import the main module
const premierePro = require('premierepro');

// Access the main Application object
const app = premierePro.app;

// Optional: Enable Quality Engineering (QE) DOM for advanced/hidden features
app.enableQE(); 


2. Working with Projects

The Project class is your hub for file management and organization.

Accessing the Active Project

let myProject;

if (app.isDocumentOpen()) {
    myProject = app.project;
    console.log(`Active Project: ${myProject.name}`);
} else {
    console.log("No project currently open.");
}


Importing Media

Use importFiles to bring assets into the project. This is often the first step in automation.

const filePaths = [
    "/path/to/video1.mp4",
    "/path/to/music.wav"
];

// arguments: paths, suppressUI, targetBin, importAsNumberedStills
myProject.importFiles(filePaths, true, myProject.rootItem, false);


Organizing with Bins

Items in the Project Panel are ProjectItem objects. Bins are specifically FolderItems.

const rootBin = myProject.rootItem;

// Create a new bin inside the root
const newBin = rootBin.createBin("Daily Renders");

// Iterate through items in the root bin
rootBin.children.forEach(item => {
    if (item.type === premierePro.constants.PROJECT_ITEM_TYPE_CLIP) {
        console.log(`Found clip: ${item.name}`);
    }
});


3. Sequences and Timeline

The Sequence object represents the timeline. You manipulate the timeline structure through VideoTrack and AudioTrack collections.

Accessing the Active Sequence

const activeSeq = app.project.activeSequence;

if (activeSeq) {
    console.log(`Editing Sequence: ${activeSeq.name}`);
    console.log(`Resolution: ${activeSeq.frameSizeHorizontal}x${activeSeq.frameSizeVertical}`);
}


Creating a New Sequence

// Create a sequence named "My New Cut"
app.project.createNewSequence("My New Cut", "id-of-placeholder-if-needed");


Navigating Tracks

Tracks are 0-indexed.

// Get the first video track (V1)
const v1 = activeSeq.videoTracks[0];

// Get the first audio track (A1)
const a1 = activeSeq.audioTracks[0];

// Mute the audio track
a1.setMuted(true);


4. Manipulating Clips (TrackItems)

Once you have a Track object, you can add, move, or remove TrackItems (clips).

Adding a Clip to the Timeline

You need a ProjectItem (the source footage) to create a TrackItem (the clip on the timeline).

// Assuming 'sourceClip' is a ProjectItem found earlier
const timeToInsert = 0; // Ticks or Seconds depending on context implementation

// Insert clip at the beginning of V1
v1.insertClip(sourceClip, timeToInsert);


Moving a Clip

// Get the first clip on V1
const firstClip = v1.clips[0];

// Move it to the 5-second mark
// Note: You may need to use the TickTime class for precise time calculation
const newTime = 5 * 254016000000; // Simplified tick calculation example
firstClip.move(newTime);


5. Components & Effects

Effects like "Motion", "Opacity", and "Lumetri Color" are accessed as Components.

Accessing Effects

const videoClip = v1.clips[0];

// List all effects applied to this clip
videoClip.components.forEach(component => {
    console.log(`Effect Name: ${component.displayName}`);
    
    // List parameters inside the effect
    component.properties.forEach(param => {
        console.log(` - Param: ${param.displayName} = ${param.getValue()}`);
    });
});


Modifying a Parameter (e.g., Opacity or Scale)

To change a value, find the specific ComponentParam.

// Example: Find the "Motion" effect, then the "Scale" parameter
const motionEffect = videoClip.components.find(c => c.displayName === "Motion");
const scaleParam = motionEffect.properties.find(p => p.displayName === "Scale");

if (scaleParam) {
    // Set Scale to 50%
    scaleParam.setValue(50, true); // true = update UI
}


6. Handling Time (TickTime)

Premiere Pro uses an internal time format called "Ticks" to ensure frame accuracy across different frame rates.

1 second = 254,016,000,000 ticks.

When the API requests a time object, you should usually use the TickTime class helper or convert your seconds to ticks string format.

// Pseudo-code for time conversion
const TickTime = premierePro.TickTime;
const currentTime = activeSeq.getPlayerPosition(); // Returns TickTime

console.log(`Current position in seconds: ${currentTime.seconds}`);
