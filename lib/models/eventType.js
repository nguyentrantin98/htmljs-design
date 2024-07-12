/**
 * Defines a class containing static properties for different HTML event types.
 * Each property corresponds to an HTML event name, with descriptions provided
 * for each type of event.
 */
export default class EventType {
    /**
     * UIEvent: The loading of a resource has been aborted.
     * @static
     */
    static Abort = "abort";

    /**
     * Event: The associated document has started printing or the print preview has been closed.
     * @static
     */
    static AfterPrint = "afterprint";

    /**
     * AnimationEvent: A CSS animation has completed.
     * @static
     */
    static AnimationEnd = "animationend";

    /**
     * AnimationEvent: A CSS animation is repeated.
     * @static
     */
    static AnimationIteration = "animationiteration";

    /**
     * AnimationEvent: A CSS animation has started.
     * @static
     */
    static AnimationStart = "animationstart";

    /**
     * Event: The associated document is about to be printed or previewed for printing.
     * @static
     */
    static BeforePrint = "beforeprint";

    /**
     * BeforeUnloadEvent: The beforeunload event is fired when the window, the document and its resources are about to be unloaded.
     * @static
     */
    static BeforeUnload = "beforeunload";

    /**
     * IndexedDB: An open connection to a database is blocking a versionchange transaction on the same database.
     * @static
     */
    static Blocked = "blocked";

    /**
     * FocusEvent: An element has lost focus (does not bubble).
     * @static
     */
    static Blur = "blur";

    /**
     * Event: The resources listed in the manifest have been downloaded, and the application is now cached.
     * @static
     */
    static Cached = "cached";

    /**
     * Event: The user agent can play the media, but estimates that not enough data has been loaded to play the media up to its end without having to stop for further buffering of content.
     * @static
     */
    static CanPlay = "canplay";

    /**
     * Event: The user agent can play the media, and estimates that enough data has been loaded to play the media up to its end without having to stop for further buffering of content.
     * @static
     */
    static CanPlayThrough = "canplaythrough";

    /**
     * Event: An element loses focus and its value changed since gaining focus.
     * @static
     */
    static Change = "change";

    /**
     * Event: The user agent is checking for an update, or attempting to download the cache manifest for the first time.
     * @static
     */
    static Checking = "checking";

    /**
     * MouseEvent: A pointing device button has been pressed and released on an element.
     * @static
     */
    static Click = "click";

    /**
     * Event: A WebSocket connection has been closed.
     * @static
     */
    static Close = "close";

    /**
     * IndexedDB: The complete handler is executed when a transaction successfully completed.
     * @static
     */
    static Complete = "complete";

    /**
     * CompositionEvent: The composition of a passage of text has been completed or canceled.
     * @static
     */
    static CompositionEnd = "compositionend";

    /**
     * CompositionEvent: The composition of a passage of text is prepared (similar to keydown for a keyboard input, but works with other inputs such as speech recognition).
     * @static
     */
    static CompositionStart = "compositionstart";

    /**
     * CompositionEvent: A character is added to a passage of text being composed.
     * @static
     */
    static CompositionUpdate = "compositionupdate";

    /**
     * MouseEvent: The right button of the mouse is clicked (before the context menu is displayed).
     * @static
     */
    static ContextMenu = "contextmenu";

    /**
     * ClipboardEvent: The text selection has been added to the clipboard.
     * @static
     */
    static Copy = "copy";

    /**
     * ClipboardEvent: The text selection has been removed from the document and added to the clipboard.
     * @static
     */
    static Cut = "cut";

    /**
     * MouseEvent: A pointing device button is clicked twice on an element.
     * @static
     */
    static DblClick = "dblclick";

    /**
     * DeviceLightEvent: Fresh data is available from a light sensor.
     * @static
     */
    static DeviceLight = "devicelight";

    /**
     * DeviceMotionEvent: Fresh data is available from a motion sensor.
     * @static
     */
    static DeviceMotion = "devicemotion";

    /**
 * DeviceOrientationEvent: Fresh data is available from an orientation sensor.
 * @static
 */
    static DeviceOrientation = "deviceorientation";

    /**
     * DeviceProximityEvent: Fresh data is available from a proximity sensor (indicates an approximated distance between the device and a nearby object).
     * @static
     */
    static DeviceProximity = "deviceproximity";

    /**
     * Event: The dischargingTime attribute has been updated.
     * @static
     */
    static DischargingTimeChange = "dischargingtimechange";

    /**
     * Event: The document has finished loading (but not its dependent resources).
     * @static
     */
    static DOMContentLoaded = "domcontentloaded";

    /**
     * Event: The user agent has found an update and is fetching it, or is downloading the resources listed by the cache manifest for the first time.
     * @static
     */
    static Downloading = "downloading";

    /**
     * DragEvent: An element or text selection is being dragged (every 350ms).
     * @static
     */
    static Drag = "drag";

    /**
     * DragEvent: A drag operation is being ended (by releasing a mouse button or hitting the escape key).
     * @static
     */
    static DragEnd = "dragend";

    /**
     * DragEvent: A dragged element or text selection enters a valid drop target.
     * @static
     */
    static DragEnter = "dragenter";

    /**
     * DragEvent: A dragged element or text selection leaves a valid drop target.
     * @static
     */
    static DragLeave = "dragleave";

    /**
     * DragEvent: An element or text selection is being dragged over a valid drop target (every 350ms).
     * @static
     */
    static DragOver = "dragover";

    /**
     * DragEvent: The user starts dragging an element or text selection.
     * @static
     */
    static DragStart = "dragstart";

    /**
     * DragEvent: An element is dropped on a valid drop target.
     * @static
     */
    static Drop = "drop";

    /**
     * Event: The duration attribute has been updated.
     * @static
     */
    static DurationChange = "durationchange";

    /**
     * Event: The media has become empty; for example, this event is sent if the media has already been loaded (or partially loaded), and the load() method is called to reload it.
     * @static
     */
    static Emptied = "emptied";

    /**
     * Event: Playback has stopped because the end of the media was reached.
     * @static
     */
    static Ended = "ended";

    /**
     * Event: An error occurred during the loading of an event.
     * @static
     */
    static Error = "error";

    /**
     * FocusEvent: An element has received focus (does not bubble).
     * @static
     */
    static Focus = "focus";

    /**
     * FocusEvent: An element is about to receive focus (bubbles).
     * @static
     */
    static FocusIn = "focusin";

    /**
     * FocusEvent: An element is about to lose focus (bubbles).
     * @static
     */
    static FocusOut = "focusout";

    /**
     * Event: An element was turned to fullscreen mode or back to normal mode.
     * @static
     */
    static FullScreenChange = "fullscreenchange";

    /**
     * Event: It was impossible to switch to fullscreen mode for technical reasons or because the permission was denied.
     * @static
     */
    static FullScreenError = "fullscreenerror";

    /**
     * GamepadEvent: A gamepad has been connected.
     * @static
     */
    static GamepadConnected = "gamepadconnected";

    /**
     * GamepadEvent: A gamepad has been disconnected.
     * @static
     */
    static GamepadDisconnected = "gamepaddisconnected";

    /**
     * HashChangeEvent: The fragment identifier of the URL has changed (the part of the URL after the #).
     * @static
     */
    static HashChange = "hashchange";

    /**
     * Event: The value of an element changes or the content of an element with the attribute contenteditable is modified.
     * @static
     */
    static Input = "input";

    /**
     * Event: A submittable element has been checked and doesn't satisfy its constraints.
     * @static
     */
    static Invalid = "invalid";

    /**
     * KeyboardEvent: A key is pressed down.
     * @static
     */
    static KeyDown = "keydown";

    /**
     * KeyboardEvent: A key is pressed down and that key normally produces a character value (use input instead).
     * @static
     */
    static KeyPress = "keypress";

    /**
     * KeyboardEvent: A key is released.
     * @static
     */
    static KeyUp = "keyup";

    /**
     * Event: The level attribute has been updated.
     * @static
     */
    static LevelChange = "levelchange";

    /**
     * UIEvent: A resource and its dependent resources have finished loading.
     * @static
     */
    static Load = "load";

    /**
     * Event: The first frame of the media has finished loading.
     * @static
     */
    static LoadedData = "loadeddata";

    /**
     * Event: The metadata has been loaded.
     * @static
     */
    static LoadedMetaData = "loadedmetadata";

    /**
     * ProgressEvent: Progress has stopped (after "error", "abort" or "load" have been dispatched).
     * @static
     */
    static LoadEnd = "loadend";

    /**
     * ProgressEvent: Progress has begun.
     * @static
     */
    static LoadStart = "loadstart";

    /**
     * MessageEvent: A message is received through a WebSocket.
     * @static
     */
    static Message = "message";

    /**
     * MouseEvent: A pointing device button (usually a mouse) is pressed on an element.
     * @static
     */
    static MouseDown = "mousedown";

    /**
     * MouseEvent: A pointing device is moved onto the element that has the listener attached.
     * @static
     */
    static MouseEnter = "mouseenter";

    /**
     * MouseEvent: A pointing device is moved off the element that has the listener attached.
     * @static
     */
    static MouseLeave = "mouseleave";

    /**
     * MouseEvent: A pointing device is moved over an element.
     * @static
     */
    static MouseMove = "mousemove";

    /**
     * MouseEvent: A pointing device is moved off the element that has the listener attached or off one of its children.
     * @static
     */
    static MouseOut = "mouseout";

    /**
     * MouseEvent: A pointing device is moved onto the element that has the listener attached or onto one of its children.
     * @static
     */
    static MouseOver = "mouseover";

    /**
     * MouseEvent: A pointing device button is released over an element.
     * @static
     */
    static MouseUp = "mouseup";

    /**
     * Event: The manifest hadn't changed.
     * @static
     */
    static NoUpdate = "noupdate";

    /**
     * Event: The manifest was found to have become a 404 or 410 page, so the application cache is being deleted.
     * @static
     */
    static Obsolete = "obsolete";

    /**
     * Event: The browser has lost access to the network.
     * @static
     */
    static Offline = "offline";

    /**
     * Event: The browser has gained access to the network (but particular websites might be unreachable).
     * @static
     */
    static Online = "online";

    /**
     * Event: A WebSocket connection has been established.
     * @static
     */
    static Open = "open";

    /**
     * Event: The orientation of the device (portrait/landscape) has changed.
     * @static
     */
    static OrientationChange = "orientationchange";

    /**
     * PageTransitionEvent: A session history entry is being traversed from.
     * @static
     */
    static PageHide = "pagehide";

    /**
     * PageTransitionEvent: A session history entry is being traversed to.
     * @static
     */
    static PageShow = "pageshow";

    /**
     * ClipboardEvent: Data has been transferred from the system clipboard to the document.
     * @static
     */
    static Paste = "paste";

    /**
     * Event: Playback has been paused.
     * @static
     */
    static Pause = "pause";

    /**
     * Event: The pointer was locked or released.
     * @static
     */
    static PointerLockChange = "pointerlockchange";

    /**
     * Event: It was impossible to lock the pointer for technical reasons or because the permission was denied.
     * @static
     */
    static PointerLockError = "pointerlockerror";

    /**
     * Event: Playback has begun.
     * @static
     */
    static Play = "play";

    /**
     * Event: Playback is ready to start after having been paused or delayed due to lack of data.
     * @static
     */
    static Playing = "playing";

    /**
     * PopStateEvent: A session history entry is being navigated to (in certain cases).
     * @static
     */
    static PopState = "popstate";

    /**
     * ProgressEvent: In progress.
     * @static
     */
    static Progress = "progress";

    /**
     * Event: The playback rate has changed.
     * @static
     */
    static RateChange = "ratechange";

    /**
     * Event: The readyState attribute of a document has changed.
     * @static
     */
    static ReadyStateChange = "readystatechange";

    /**
     * TimeEvent: A SMIL animation element is repeated.
     * @static
     */
    static RepeatEvent = "repeatevent";

    /**
     * Event: A form is reset.
     * @static
     */
    static Reset = "reset";

    /**
     * UIEvent: The document view has been resized.
     * @static
     */
    static Resize = "resize";

    /**
     * UIEvent: The document view or an element has been scrolled.
     * @static
     */
    static Scroll = "scroll";

    /**
     * Event: A seek operation completed.
     * @static
     */
    static Seeked = "seeked";

    /**
     * Event: A seek operation began.
     * @static
     */
    static Seeking = "seeking";

    /**
     * UIEvent: Some text is being selected.
     * @static
     */
    static Select = "select";

    /**
     * MouseEvent: A context menu event was fired on/bubbled to an element that has a context menu attribute.
     * @static
     */
    static Show = "show";

    /**
     * Event: The user agent is trying to fetch media data, but data is unexpectedly not forthcoming.
     * @static
     */
    static Stalled = "stalled";

    /**
     * StorageEvent: A storage area (localStorage or sessionStorage) has changed.
     * @static
     */
    static Storage = "storage";

    /**
     * Event: A form is submitted.
     * @static
     */
    static Submit = "submit";

    /**
     * Event: A request successfully completed.
     * @static
     */
    static Success = "success";

    /**
     * Event: Media data loading has been suspended.
     * @static
     */
    static Suspend = "suspend";

    /**
     * SVGEvent: Page loading has been stopped before the SVG was loaded.
     * @static
     */
    static SVGAbort = "svgabort";

    /**
     * SVGEvent: An error has occurred before the SVG was loaded.
     * @static
     */
    static SVGError = "svgerror";

    /**
     * SVGEvent: An SVG document has been loaded and parsed.
     * @static
     */
    static SVGLoad = "svgload";

    /**
     * SVGEvent: An SVG document is being resized.
     * @static
     */
    static SVGResize = "svgresize";

    /**
     * SVGEvent: An SVG document is being scrolled.
     * @static
     */
    static SVGScroll = "svgscroll";

    /**
     * SVGEvent: An SVG document has been removed from a window or frame.
     * @static
     */
    static SVGUnload = "svgunload";

    /**
     * SVGZoomEvent: An SVG document is being zoomed.
     * @static
     */
    static SVGZoom = "svgzoom";

    /**
     * ProgressEvent: A request timed out.
     * @static
     */
    static Timeout = "timeout";

    /**
     * Event: The time indicated by the currentTime attribute has been updated.
     * @static
     */
    static TimeUpdate = "timeupdate";

    /**
     * TouchEvent: A touch point has been disrupted in an implementation-specific manner (too many touch points for example).
     * @static
     */
    static TouchCancel = "touchcancel";

    /**
     * TouchEvent: A touch point is removed from the touch surface.
     * @static
     */
    static TouchEnd = "touchend";

    /**
     * TouchEvent: A touch point is moved onto the interactive area of an element.
     * @static
     */
    static TouchEnter = "touchenter";

    /**
     * TouchEvent: A touch point is moved off the interactive area of an element.
     * @static
     */
    static TouchLeave = "touchleave";

    /**
     * TouchEvent: A touch point is moved along the touch surface.
     * @static
     */
    static TouchMove = "touchmove";

    /**
     * TouchEvent: A touch point is placed on the touch surface.
     * @static
     */
    static TouchStart = "touchstart";

    /**
     * TransitionEvent: A CSS transition has completed.
     * @static
     */
    static TransitionEnd = "transitionend";

    /**
     * UIEvent: The document or a dependent resource is being unloaded.
     * @static
     */
    static Unload = "unload";

    /**
     * Event: The resources listed in the manifest have been newly redownloaded, and the script can use swapCache() to switch to the new cache.
     * @static
     */
    static UpdateReady = "updateready";

    /**
     * IndexedDB: An attempt was made to open a database with a version number higher than its current version. A versionchange transaction has been created.
     * @static
     */
    static UpgradeNeeded = "upgradeneeded";

    /**
     * SensorEvent: Fresh data is available from a proximity sensor (indicates whether the nearby object is near the device or not).
     * @static
     */
    static UserProximity = "userproximity";

    /**
     * Event: A versionchange transaction completed.
     * @static
     */
    static VersionChange = "versionchange";

    /**
     * Event: The content of a tab has become visible or has been hidden.
     * @static
     */
    static VisibilityChange = "visibilitychange";

    /**
     * Event: The volume has changed.
     * @static
     */
    static VolumeChange = "volumechange";

    /**
     * Event: Playback has stopped because of a temporary lack of data.
     * @static
     */
    static Waiting = "waiting";

    /**
     * WheelEvent: A wheel button of a pointing device is rotated in any direction.
     * @static
     */
    static Wheel = "wheel";

    /**
     * WheelEvent: A wheel button of a pointing device is rotated in any direction.
     * @static
     */
    static OnSave = "onsave";
}
