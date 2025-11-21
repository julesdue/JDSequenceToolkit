ADOBE PREMIERE PRO UXP API REFERENCE CHEAT SHEET
Based on the 'premierepro' module.

APPLICATION & GLOBAL ACCESS
Entry point for the API and application-wide preferences.

Application
Access: 'app' (Global)
Key Properties: project, projects, encoder, sourceMonitor, version, userGuid
Key Methods: openDocument(), quit(), isDocumentOpen(), enableQE()

AppPreference
Role: Access and modify Premiere Pro application preferences
Key Methods: getValue(), setValue()

EventManager
Role: Handles system-wide event subscriptions
Events: ProjectEvent, ProjectClosedEvent, OperationCompleteEvent

================================================================================

PROJECT MANAGEMENT
Classes related to the .prproj file structure and settings.

--- Core Project ---
Project
Role: Represents the active project
Key Properties: rootItem (Bin), activeSequence, sequences, name, path
Key Methods: save(), close(), importFiles(), createNewSequence()

OpenProjectOptions
Role: Configuration object passed when opening a project (e.g., UI behavior)

CloseProjectOptions
Role: Configuration object passed when closing (e.g., promptToSave)

--- Project Utilities & Settings ---
ProjectUtils
Role: Static helper methods for project-level operations

ProjectSettings
Role: General project settings (scratch disks, renderer)

ScratchDiskSettings
Role: Specific paths for auto-saves and preview files

IngestSettings
Role: Controls ingest behavior (copy/transcode on import)

ProjectColorSettings
Role: Manages color management (LUTs, HDR graphics white, Gamma)

================================================================================

PROJECT ITEMS (BINS & ASSETS)
Items residing in the Project Panel.

ProjectItem (Base Class)
Role: Represents any item in the Project Panel
Methods: select(), deleteBin(), moveBin(), rename()

FolderItem
Role: Represents a Bin (Folder). Can contain children.

ClipProjectItem
Role: Represents a Source Clip (footage/audio)
Methods: setOffline(), getComponents()

ProjectItemSelection
Role: Manages the list of currently selected items in the Project Panel

Media
Role: Information about the actual file on disk linked to a ClipProjectItem

FootageInterpretation
Role: Overrides for how footage is read (Frame Rate, Pixel Aspect Ratio, Alpha)

================================================================================

SEQUENCES & TIMELINE
Classes handling the timeline structure.

--- Sequence Objects ---
Sequence
Role: Represents a timeline
Key Properties: videoTracks, audioTracks, captionTracks, markers, timebase
Methods: setPlayerPosition(), exportAsMediaDirect()

SequenceSettings
Role: Configuration for the sequence (Audio Sample Rate, VR settings, Preview File Format)

SequenceEditor
Role: Interaction with the Timeline UI panel (scrolling, zooming)

SequenceUtils
Role: Helper functions for timeline manipulation

SourceMonitor
Role: Controls the Source Monitor panel (separate from the Program Monitor)

--- Tracks ---
VideoTrack
Role: A video track containing VideoClipTrackItems
Methods: insertClip(), overwriteClip(), setMuted(), setLocked()

AudioTrack
Role: An audio track containing AudioClipTrackItems

CaptionTrack
Role: A dedicated track for captions/subtitles

================================================================================

TIMELINE CLIPS (TRACK ITEMS)
Items placed onto a sequence track.

VideoClipTrackItem
Role: A video clip instance on the timeline
Properties: start, end, duration, inPoint, outPoint, components
Methods: move(), setSelected()

AudioClipTrackItem
Role: An audio clip instance on the timeline

TrackItemSelection
Role: Helper to manage currently selected clips on the timeline

================================================================================

EFFECTS, TRANSITIONS & FILTERS
Modifying the look and sound of clips.

Component
Role: Represents an effect applied to a clip (e.g., Lumetri Color, Motion)

ComponentParam
Role: A specific parameter within a component (e.g., Scale, Opacity)
Methods: getValue(), setValue(), addKeyframe()

VideoComponentChain
Role: The ordered stack of video effects on a VideoClipTrackItem

AudioComponentChain
Role: The ordered stack of audio effects on an AudioClipTrackItem

VideoFilterFactory
Role: Registry to find and create video effects by name

AudioFilterFactory
Role: Registry to find and create audio effects by name

TransitionFactory
Role: Registry to find transition effects (e.g., Cross Dissolve)

AddTransitionOptions
Role: Settings object when applying a transition (duration, alignment)

================================================================================

METADATA, MARKERS & PROPERTIES
Data attached to objects.

Properties
Role: Generic key-value store for object properties
Methods: getProperties(owner), getValue(), setValue(), hasValue()

Marker
Role: A single timeline or clip marker
Properties: name, comments, start, duration, type

Markers
Role: Collection class to manage multiple Marker objects

Metadata
Role: Handles XMP metadata packets
Methods: getMetadata(), setMetadata()

Transcript
Role: Access to the text-based editing transcript of a clip/sequence

TextSegments
Role: Specific text segments within a Transcript or CaptionTrack

================================================================================

GEOMETRY, TIME & COLOR
Core data types used throughout the API.

TickTime
Role: High-precision time object (Time in Premiere is measured in "ticks")
Properties: seconds, ticks

TimeDisplay
Role: String formatting for time (e.g., Drop-frame timecode vs Non-drop)

FrameRate
Role: Helper to calculate frame durations and conversions

Color
Role: Represents a color value (RGB/Alpha)

PointF
Role: A point with floating-point coordinates (x, y)

RectF
Role: A rectangle with floating-point dimensions (x, y, width, height)

================================================================================

KEYFRAMING
Animation classes.

Keyframe
Role: Base class for a keyframe on a parameter

PointKeyframe
Role: Specific keyframe type for spatial parameters (Motion)

================================================================================

OUTPUT
Exporting content.

EncoderManager
Role: Interface to the Adobe Media Encoder queue

Exporter
Role: Handles direct export operations from Premiere

================================================================================

UTILITIES & MISC
Helper classes.

Utils
Role: General utility functions

Guid
Role: Represents a Globally Unique Identifier

UniqueSerializeable
Role: Base class for objects that need to be serialized/saved

CompoundAction
Role: Used to group multiple API calls into a single Undo/Redo step