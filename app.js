const STORAGE_KEY = "hercules-mapper-state-v1";
const DEFAULT_BACKGROUND_IMAGE = "assets/mixxx/hercules_mappa.png";
const TOPDOWN_ALIGNMENT_VERSION = 3;

const LEGACY_MIXXX_SCHEMA_CONTROLS = [
  { id: "mixxx_01", name: "Mixxx 01", type: "button", x: 15.41, y: 39.51, size: 10.93, w: 10.93, h: 9.65, shape: "rect" },
  { id: "mixxx_02", name: "Mixxx 02", type: "button", x: 15.56, y: 20.98, size: 3.68, w: 3.68, h: 2.83, shape: "rect" },
  { id: "mixxx_03", name: "Mixxx 03", type: "knob", x: 15.51, y: 28.57, size: 6.18, w: 4.57, h: 6.18, shape: "knob" },
  { id: "mixxx_04", name: "Mixxx 04", type: "button", x: 29.32, y: 30.76, size: 29.09, w: 12.92, h: 29.09, shape: "rect" },
  { id: "mixxx_05", name: "Mixxx 05", type: "knob", x: 39.46, y: 20.59, size: 6.18, w: 4.57, h: 6.18, shape: "knob" },
  { id: "mixxx_06", name: "Mixxx 06", type: "button", x: 46.72, y: 20.98, size: 3.98, w: 3.98, h: 2.83, shape: "rect" },
  { id: "mixxx_07", name: "Mixxx 07", type: "button", x: 50.20, y: 28.70, size: 3.98, w: 3.98, h: 2.83, shape: "rect" },
  { id: "mixxx_08", name: "Mixxx 08", type: "button", x: 53.78, y: 20.98, size: 3.98, w: 3.98, h: 2.83, shape: "rect" },
  { id: "mixxx_09", name: "Mixxx 09", type: "knob", x: 59.44, y: 20.59, size: 6.18, w: 4.57, h: 6.18, shape: "knob" },
  { id: "mixxx_10", name: "Mixxx 10", type: "knob", x: 59.44, y: 31.02, size: 6.18, w: 4.57, h: 6.18, shape: "knob" },
  { id: "mixxx_11", name: "Mixxx 11", type: "button", x: 70.87, y: 30.76, size: 29.09, w: 12.92, h: 29.09, shape: "rect" },
  { id: "mixxx_12", name: "Mixxx 12", type: "button", x: 73.96, y: 42.86, size: 3.98, w: 3.98, h: 2.83, shape: "rect" },
  { id: "mixxx_13", name: "Mixxx 13", type: "button", x: 84.69, y: 31.92, size: 24.84, w: 10.44, h: 24.84, shape: "rect" },
  { id: "mixxx_14", name: "Mixxx 14", type: "button", x: 86.48, y: 83.91, size: 3.68, w: 3.68, h: 2.83, shape: "rect" },
  { id: "mixxx_15", name: "Mixxx 15", type: "button", x: 77.83, y: 83.91, size: 3.68, w: 3.68, h: 2.83, shape: "rect" },
  { id: "mixxx_16", name: "Mixxx 16", type: "jog", x: 74.06, y: 63.58, size: 30.63, w: 18.89, h: 30.63, shape: "jog" },
  { id: "mixxx_17", name: "Mixxx 17", type: "fader", x: 58.85, y: 64.09, size: 21.62, w: 5.47, h: 21.62, shape: "slider-v" },
  { id: "mixxx_18", name: "Mixxx 18", type: "fader", x: 50.80, y: 80.18, size: 21.67, w: 21.67, h: 8.37, shape: "slider-h" },
  { id: "mixxx_19", name: "Mixxx 19", type: "fader", x: 39.56, y: 64.09, size: 21.62, w: 5.47, h: 21.62, shape: "slider-v" },
  { id: "mixxx_20", name: "Mixxx 20", type: "button", x: 39.76, y: 48.52, size: 5.96, w: 5.96, h: 3.73, shape: "rect" },
  { id: "mixxx_21", name: "Mixxx 21", type: "button", x: 29.32, y: 43.24, size: 12.92, w: 12.92, h: 3.73, shape: "rect" }
];

const MIXXX_IMAGE_WIDTH = 1006;
const MIXXX_IMAGE_HEIGHT = 777;

function pctX(px) {
  return Number(((Number(px) / MIXXX_IMAGE_WIDTH) * 100).toFixed(2));
}

function pctY(py) {
  return Number(((Number(py) / MIXXX_IMAGE_HEIGHT) * 100).toFixed(2));
}

function presetControl({ id, name, type, x, y, w, h, shape }) {
  const widthPct = pctX(w);
  const heightPct = pctY(h);
  return {
    id,
    name,
    type,
    x: pctX(x),
    y: pctY(y),
    size: Number(Math.max(widthPct, heightPct).toFixed(2)),
    w: widthPct,
    h: heightPct,
    shape
  };
}

function btn(id, name, x, y, w = 40, h = 22) {
  return presetControl({ id, name, type: "button", x, y, w, h, shape: "rect" });
}

function knob(id, name, x, y, w = 46, h = 48) {
  return presetControl({ id, name, type: "knob", x, y, w, h, shape: "knob" });
}

function jog(id, name, x, y, w = 190, h = 238) {
  return presetControl({ id, name, type: "jog", x, y, w, h, shape: "jog" });
}

function faderV(id, name, x, y, w = 55, h = 168) {
  return presetControl({ id, name, type: "fader", x, y, w, h, shape: "slider-v" });
}

function faderH(id, name, x, y, w = 218, h = 65) {
  return presetControl({ id, name, type: "fader", x, y, w, h, shape: "slider-h" });
}

function createFullMixxxControls() {
  return [
    btn("master_tempo_a", "Master Tempo A", 156, 163, 42, 22),
    knob("pitch_a", "Pitch A", 156, 222, 46, 48),
    btn("pitchbend_minus_a", "Pitch Bend - A", 123, 278, 42, 22),
    btn("pitchbend_plus_a", "Pitch Bend + A", 183, 278, 42, 22),
    btn("sync_a", "Sync A", 146, 329, 47, 25),

    btn("shift_a", "Shift A", 294, 161, 53, 26),
    btn("fx1_a", "A 1", 259, 214, 44, 25),
    btn("fx2_a", "A 2", 322, 214, 44, 25),
    btn("fx3_a", "A 3", 259, 271, 44, 25),
    btn("fx4_a", "A 4", 322, 271, 44, 25),
    btn("prev_a", "Prev A", 260, 329, 40, 22),
    btn("next_a", "Next A", 323, 329, 40, 22),

    knob("eq_top_left", "Treble A", 397, 160, 46, 48),
    knob("eq_mid_left", "Medium A", 397, 241, 46, 48),
    knob("eq_low_left", "Bass A", 397, 320, 46, 48),
    btn("scratch", "Scratch", 470, 163, 40, 22),
    btn("automix", "Automix", 541, 163, 40, 22),
    btn("browse_up", "Browse +", 505, 223, 40, 22),
    btn("folder", "Folder", 470, 273, 40, 22),
    btn("files", "Files", 541, 273, 40, 22),
    btn("browse_down", "Browse -", 505, 320, 40, 22),
    btn("listen_a", "Listen A", 399, 377, 44, 26),
    btn("load_a", "Load A", 470, 377, 52, 26),
    btn("load_b", "Load B", 541, 377, 52, 26),
    btn("listen_b", "Listen B", 598, 377, 44, 26),
    knob("eq_top_right", "Treble B", 598, 160, 46, 48),
    knob("eq_mid_right", "Medium B", 598, 241, 46, 48),
    knob("eq_low_right", "Bass B", 598, 320, 46, 48),

    faderV("channel_fader_a", "Fader A", 398, 498, 55, 168),
    faderV("channel_fader_b", "Fader B", 592, 498, 55, 168),
    faderH("crossfader", "Crossfader", 511, 623, 218, 65),

    jog("jog_a", "Jog A", 261, 494, 190, 238),
    btn("cue_a", "Cue A", 136, 652, 48, 28),
    btn("play_a", "Play A", 223, 652, 48, 28),

    btn("shift_b", "Shift B", 713, 161, 53, 26),
    btn("fx1_b", "B 1", 680, 214, 44, 25),
    btn("fx2_b", "B 2", 743, 214, 44, 25),
    btn("fx3_b", "B 3", 680, 271, 44, 25),
    btn("fx4_b", "B 4", 743, 271, 44, 25),
    btn("prev_b", "Prev B", 680, 329, 40, 22),
    btn("next_b", "Next B", 743, 329, 40, 22),

    btn("master_tempo_b", "Master Tempo B", 852, 163, 42, 22),
    knob("pitch_b", "Pitch B", 852, 222, 46, 48),
    btn("pitchbend_minus_b", "Pitch Bend - B", 815, 278, 42, 22),
    btn("pitchbend_plus_b", "Pitch Bend + B", 891, 278, 42, 22),
    btn("sync_b", "Sync B", 852, 329, 47, 25),

    jog("jog_b", "Jog B", 745, 494, 190, 238),
    btn("cue_b", "Cue B", 783, 652, 48, 28),
    btn("play_b", "Play B", 870, 652, 48, 28)
  ];
}

const MIXXX_SCHEMA_CONTROLS = createFullMixxxControls();
const MIDI_CC_CONTROL_MAP = new Map([
  [0x30, "jog_a"],
  [0x31, "jog_b"],
  [0x32, "pitch_a"],
  [0x33, "pitch_b"],
  [0x34, "channel_fader_a"],
  [0x35, "eq_top_left"],
  [0x36, "eq_mid_left"],
  [0x37, "eq_low_left"],
  [0x38, "crossfader"],
  [0x39, "channel_fader_b"],
  [0x3A, "eq_top_right"],
  [0x3B, "eq_mid_right"],
  [0x3C, "eq_low_right"]
]);
const MIDI_NOTE_CONTROL_MAP = new Map([
  // Hercules DJ Control MP3 e2, MIDI input commands 1–46.
  // Source: Hercules official user manual, section 6 (MIDI mode).
  [0x01, "fx1_a"],
  [0x02, "fx2_a"],
  [0x03, "fx3_a"],
  [0x04, "fx4_a"],
  [0x09, "shift_a"],
  [0x0A, "pitchbend_minus_a"],
  [0x0B, "pitchbend_plus_a"],
  [0x0C, "prev_a"],
  [0x0D, "next_a"],
  [0x0E, "cue_a"],
  [0x0F, "play_a"],
  [0x10, "listen_a"],
  [0x11, "load_a"],
  [0x12, "sync_a"],
  [0x13, "master_tempo_a"],
  [0x15, "fx1_b"],
  [0x16, "fx2_b"],
  [0x17, "fx3_b"],
  [0x18, "fx4_b"],
  [0x1D, "shift_b"],
  [0x1E, "pitchbend_minus_b"],
  [0x1F, "pitchbend_plus_b"],
  [0x20, "prev_b"],
  [0x21, "next_b"],
  [0x22, "cue_b"],
  [0x23, "play_b"],
  [0x24, "listen_b"],
  [0x25, "load_b"],
  [0x26, "sync_b"],
  [0x27, "master_tempo_b"],
  [0x29, "browse_up"],
  [0x2A, "browse_down"],
  [0x2B, "files"],
  [0x2C, "folder"],
  [0x2D, "scratch"],
  [0x2E, "automix"]
]);
const VOICE_PRESET_OPTIONS = ["Normal", "Grave", "Aguda", "Robo", "Radio", "Eco"];

const DEFAULT_CONTROLS = [
  { id: "pitch_a", name: "Pitch A", type: "knob", x: 24.4, y: 29.4, size: 3.8 },
  { id: "pitchbend_minus_a", name: "Pitch Bend - A", type: "button", x: 22.6, y: 35.1, size: 2.1 },
  { id: "pitchbend_plus_a", name: "Pitch Bend + A", type: "button", x: 26.1, y: 35.1, size: 2.1 },
  { id: "sync_a", name: "Sync A", type: "button", x: 24.4, y: 39.3, size: 2.2 },
  { id: "shift_a", name: "Shift A", type: "button", x: 33.6, y: 28.8, size: 2.3 },
  { id: "fx1_a", name: "A 1", type: "button", x: 31.6, y: 32.7, size: 2.0 },
  { id: "fx2_a", name: "A 2", type: "button", x: 35.4, y: 32.7, size: 2.0 },
  { id: "fx3_a", name: "A 3", type: "button", x: 31.6, y: 36.0, size: 2.0 },
  { id: "fx4_a", name: "A 4", type: "button", x: 35.4, y: 36.0, size: 2.0 },
  { id: "fx5_a", name: "A 5", type: "button", x: 31.6, y: 39.1, size: 2.0 },
  { id: "fx6_a", name: "A 6", type: "button", x: 35.4, y: 39.1, size: 2.0 },
  { id: "prev_a", name: "Prev A", type: "button", x: 32.6, y: 43.6, size: 2.4 },
  { id: "next_a", name: "Next A", type: "button", x: 36.3, y: 43.6, size: 2.4 },
  { id: "jog_a", name: "Jog A", type: "jog", x: 25.4, y: 68.1, size: 11.2 },
  { id: "cue_a", name: "Cue A", type: "button", x: 17.8, y: 86.6, size: 2.8 },
  { id: "play_a", name: "Play A", type: "button", x: 25.1, y: 86.7, size: 2.8 },

  { id: "eq_top_left", name: "Knob TL", type: "knob", x: 45.3, y: 28.5, size: 3.0 },
  { id: "eq_mid_left", name: "Knob ML", type: "knob", x: 46.8, y: 34.1, size: 3.0 },
  { id: "eq_low_left", name: "Knob BL", type: "knob", x: 46.0, y: 41.2, size: 3.0 },
  { id: "scratch", name: "Scratch", type: "button", x: 53.2, y: 30.8, size: 2.4 },
  { id: "automix", name: "Automix", type: "button", x: 57.1, y: 30.8, size: 2.4 },
  { id: "browse_up", name: "Browse +", type: "button", x: 54.9, y: 34.9, size: 2.4 },
  { id: "browse_down", name: "Browse -", type: "button", x: 54.9, y: 39.7, size: 2.4 },
  { id: "load_a", name: "Load A", type: "button", x: 51.5, y: 45.2, size: 2.8 },
  { id: "load_b", name: "Load B", type: "button", x: 57.4, y: 45.2, size: 2.8 },
  { id: "channel_fader_a", name: "Fader A", type: "fader", x: 45.5, y: 58.2, size: 6.0 },
  { id: "channel_fader_b", name: "Fader B", type: "fader", x: 64.2, y: 56.3, size: 6.0 },
  { id: "crossfader", name: "Crossfader", type: "fader", x: 55.2, y: 78.1, size: 8.0 },

  { id: "eq_top_right", name: "Knob TR", type: "knob", x: 63.0, y: 28.5, size: 3.0 },
  { id: "eq_mid_right", name: "Knob MR", type: "knob", x: 61.9, y: 34.1, size: 3.0 },
  { id: "eq_low_right", name: "Knob BR", type: "knob", x: 62.7, y: 41.2, size: 3.0 },
  { id: "shift_b", name: "Shift B", type: "button", x: 70.8, y: 28.8, size: 2.3 },
  { id: "fx1_b", name: "B 1", type: "button", x: 68.6, y: 32.7, size: 2.0 },
  { id: "fx2_b", name: "B 2", type: "button", x: 72.3, y: 32.7, size: 2.0 },
  { id: "fx3_b", name: "B 3", type: "button", x: 68.6, y: 36.0, size: 2.0 },
  { id: "fx4_b", name: "B 4", type: "button", x: 72.3, y: 36.0, size: 2.0 },
  { id: "fx5_b", name: "B 5", type: "button", x: 68.6, y: 39.1, size: 2.0 },
  { id: "fx6_b", name: "B 6", type: "button", x: 72.3, y: 39.1, size: 2.0 },
  { id: "prev_b", name: "Prev B", type: "button", x: 69.6, y: 43.6, size: 2.4 },
  { id: "next_b", name: "Next B", type: "button", x: 73.2, y: 43.6, size: 2.4 },
  { id: "pitch_b", name: "Pitch B", type: "knob", x: 83.0, y: 29.1, size: 3.8 },
  { id: "pitchbend_minus_b", name: "Pitch Bend - B", type: "button", x: 81.0, y: 35.4, size: 2.1 },
  { id: "pitchbend_plus_b", name: "Pitch Bend + B", type: "button", x: 84.8, y: 35.4, size: 2.1 },
  { id: "sync_b", name: "Sync B", type: "button", x: 83.0, y: 39.5, size: 2.2 },
  { id: "jog_b", name: "Jog B", type: "jog", x: 76.6, y: 68.1, size: 11.0 },
  { id: "cue_b", name: "Cue B", type: "button", x: 76.1, y: 86.5, size: 2.8 },
  { id: "play_b", name: "Play B", type: "button", x: 83.5, y: 86.6, size: 2.8 }
];

const elements = {
  workspaceLayout: document.getElementById("workspaceLayout"),
  navButtons: Array.from(document.querySelectorAll("[data-nav-target]")),
  futurePanel: document.getElementById("futurePanel"),
  futurePanelTitle: document.getElementById("futurePanelTitle"),
  futurePanelDescription: document.getElementById("futurePanelDescription"),
  statusMidi: document.getElementById("statusMidi"),
  statusMidiValue: document.getElementById("statusMidiValue"),
  statusCable: document.getElementById("statusCable"),
  statusCableValue: document.getElementById("statusCableValue"),
  statusPhones: document.getElementById("statusPhones"),
  statusPhonesValue: document.getElementById("statusPhonesValue"),
  statusDiscord: document.getElementById("statusDiscord"),
  statusDiscordValue: document.getElementById("statusDiscordValue"),
  audioOverviewMidi: document.getElementById("audioOverviewMidi"),
  audioOverviewCable: document.getElementById("audioOverviewCable"),
  audioOverviewVolume: document.getElementById("audioOverviewVolume"),
  audioOverviewPhones: document.getElementById("audioOverviewPhones"),
  audioOverviewDiscord: document.getElementById("audioOverviewDiscord"),
  imageInput: document.getElementById("imageInput"),
  importInput: document.getElementById("importInput"),
  toggleLayoutBtn: document.getElementById("toggleLayoutBtn"),
  toggleLabelsBtn: document.getElementById("toggleLabelsBtn"),
  calibrateBtn: document.getElementById("calibrateBtn"),
  calPrevBtn: document.getElementById("calPrevBtn"),
  calNextBtn: document.getElementById("calNextBtn"),
  addControlBtn: document.getElementById("addControlBtn"),
  resetMappingsBtn: document.getElementById("resetMappingsBtn"),
  resetLayoutBtn: document.getElementById("resetLayoutBtn"),
  exportBtn: document.getElementById("exportBtn"),
  stageWrapper: document.getElementById("stageWrapper"),
  controllerImage: document.getElementById("controllerImage"),
  placeholder: document.getElementById("placeholder"),
  overlay: document.getElementById("overlay"),
  stageStatus: document.getElementById("stageStatus"),
  refreshAudioDevicesBtn: document.getElementById("refreshAudioDevicesBtn"),
  audioSourceSelect: document.getElementById("audioSourceSelect"),
  audioTargetSelect: document.getElementById("audioTargetSelect"),
  personalVolumeRange: document.getElementById("personalVolumeRange"),
  personalVolumeValue: document.getElementById("personalVolumeValue"),
  setCableDefaultBtn: document.getElementById("setCableDefaultBtn"),
  enableCableListenBtn: document.getElementById("enableCableListenBtn"),
  disableCableListenBtn: document.getElementById("disableCableListenBtn"),
  routeDiscordPrivateBtn: document.getElementById("routeDiscordPrivateBtn"),
  clearDiscordPrivateBtn: document.getElementById("clearDiscordPrivateBtn"),
  startAudioRouterBtn: document.getElementById("startAudioRouterBtn"),
  stopAudioRouterBtn: document.getElementById("stopAudioRouterBtn"),
  audioRouterStatus: document.getElementById("audioRouterStatus"),
  emptySelection: document.getElementById("emptySelection"),
  controlForm: document.getElementById("controlForm"),
  controlId: document.getElementById("controlId"),
  controlName: document.getElementById("controlName"),
  controlType: document.getElementById("controlType"),
  controlX: document.getElementById("controlX"),
  controlY: document.getElementById("controlY"),
  controlSize: document.getElementById("controlSize"),
  controlSizeValue: document.getElementById("controlSizeValue"),
  actionType: document.getElementById("actionType"),
  actionValueRow: document.getElementById("actionValueRow"),
  actionValue: document.getElementById("actionValue"),
  appTargetRow: document.getElementById("appTargetRow"),
  appTargetSelect: document.getElementById("appTargetSelect"),
  refreshAppsBtn: document.getElementById("refreshAppsBtn"),
  personalOutputRow: document.getElementById("personalOutputRow"),
  personalOutputTargetSelect: document.getElementById("personalOutputTargetSelect"),
  personalOutputHint: document.getElementById("personalOutputHint"),
  voicePresetRow: document.getElementById("voicePresetRow"),
  voicePresetSelect: document.getElementById("voicePresetSelect"),
  appTargetHint: document.getElementById("appTargetHint"),
  actionNotes: document.getElementById("actionNotes"),
  midiBinding: document.getElementById("midiBinding"),
  midiLearnBtn: document.getElementById("midiLearnBtn"),
  midiLearnHint: document.getElementById("midiLearnHint"),
  deleteControlBtn: document.getElementById("deleteControlBtn"),
  controlList: document.getElementById("controlList"),
  searchInput: document.getElementById("searchInput"),
  jsonPreview: document.getElementById("jsonPreview"),
  controlItemTemplate: document.getElementById("controlItemTemplate")
};

const initialState = loadState();
let state = {
  controls: initialState.controls,
  selectedId: initialState.selectedId || null,
  layoutMode: initialState.layoutMode || false,
  labelMode: initialState.labelMode || "auto",
  photoMeta: initialState.photoMeta || null,
  calibrationMode: Boolean(initialState.calibrationMode),
  calibrationIndex: Number.isFinite(initialState.calibrationIndex) ? initialState.calibrationIndex : 0,
  audioRouting: normalizeAudioRouting(initialState.audioRouting)
};

const runtime = {
  openApps: [],
  openAppsLoaded: false,
  openAppsLoading: false,
  openAppsError: "",
  midiAccess: null,
  midiConnected: false,
  midiInputsBound: new Map(),
  midiReconnectTimer: null,
  appVolumeDispatch: new Map(),
  appVolumeErrorCache: new Map(),
  relativeAppVolumeState: new Map(),
  audioDevices: [],
  audioDevicesLoading: false,
  audioDevicesError: "",
  audioRouterRunning: false,
  audioRouterBusy: false,
  cableListenBusy: false,
  discordRoutingBusy: false,
  personalVolumeDispatch: null,
  personalVolumeReading: false,
  statusOverlayDispatch: { pending: null, queued: false },
  buttonActionCooldown: new Map(),
  midiLearnControlId: null,
  lastMidiControlId: null,
  midiActivityTimer: null,
  activeVoicePreset: "Normal",
  liveStatus: {
    discordVolume: null,
    micMuted: null,
    trackLabel: "Media",
    trackTitle: "Nenhuma música detetada",
    trackDetail: "Usa Play/Next na Hercules"
  }
};

let dragState = null;
let activeView = "mapper";

initialize();

function initialize() {
  migrateToTopDownPresetIfNeeded();
  if (restorePlayADiscordMuteShortcut()) saveState();
  applyPhotoMeta();
  applyDefaultImageIfNeeded();
  bindEvents();
  setActiveView("mapper");
  renderAll();
  void refreshOpenApps({ silent: true });
  void initializeAudioRouter();
  void initializeMidiRuntime();
  void refreshLiveDiscordStatus();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { controls: cloneDefaults() };
    }
    const parsed = JSON.parse(raw);
    const controls = Array.isArray(parsed.controls) && parsed.controls.length
      ? parsed.controls.map(normalizeControl)
      : cloneDefaults();
    return {
      controls,
      selectedId: parsed.selectedId || null,
      layoutMode: Boolean(parsed.layoutMode),
      labelMode: normalizeLabelMode(parsed.labelMode, parsed.showLabels),
      photoMeta: parsed.photoMeta || null,
      calibrationMode: Boolean(parsed.calibrationMode),
      calibrationIndex: Number.isFinite(parsed.calibrationIndex) ? parsed.calibrationIndex : 0,
      audioRouting: parsed.audioRouting || null
    };
  } catch (error) {
    console.warn("Falha ao ler estado guardado:", error);
    return { controls: cloneDefaults() };
  }
}

function normalizeLabelMode(labelMode, legacyShowLabels) {
  if (labelMode === "auto" || labelMode === "on" || labelMode === "off") {
    return labelMode;
  }
  if (typeof legacyShowLabels === "boolean") {
    return legacyShowLabels ? "auto" : "off";
  }
  return "auto";
}

function normalizeAudioRouting(config) {
  const volume = clampNumber(config?.personalVolume, 0, 1, 0.75);
  return {
    sourceId: String(config?.sourceId || ""),
    targetId: String(config?.targetId || ""),
    personalVolume: volume,
    discordPrivateRoute: Boolean(config?.discordPrivateRoute)
  };
}

function cloneDefaults() {
  return MIXXX_SCHEMA_CONTROLS.map((control) => ({
    ...control,
    action: defaultAction()
  }));
}

function migrateToTopDownPresetIfNeeded() {
  const currentVersion = state.photoMeta?.alignmentVersion || 0;
  if (currentVersion >= TOPDOWN_ALIGNMENT_VERSION) return;

  const actionById = new Map(state.controls.map((control) => [control.id, control.action || defaultAction()]));
  const presetIds = new Set(MIXXX_SCHEMA_CONTROLS.map((control) => control.id));
  const legacySchemaIds = new Set(LEGACY_MIXXX_SCHEMA_CONTROLS.map((control) => control.id));
  const legacyDefaultIds = new Set(DEFAULT_CONTROLS.map((control) => control.id));
  const customControls = state.controls.filter(
    (control) => !presetIds.has(control.id) && !legacySchemaIds.has(control.id) && !legacyDefaultIds.has(control.id)
  );

  const remappedDefaults = MIXXX_SCHEMA_CONTROLS.map((base) => ({
    ...base,
    action: actionById.get(base.id) || defaultAction()
  }));

  state.controls = [...remappedDefaults, ...customControls];
  state.photoMeta = {
    ...(state.photoMeta || {}),
    alignmentVersion: TOPDOWN_ALIGNMENT_VERSION
  };
}

function restorePlayADiscordMuteShortcut() {
  const playA = state.controls.find((control) => control.id === "play_a");
  if (playA?.action?.type !== "discord_mute_toggle") return false;

  // O mute que o utilizador quer é o do microfone no próprio Discord. Mantém
  // o atalho configurado no Discord e apenas acelera o envio no processo nativo.
  playA.action = { ...playA.action, type: "hotkey", value: "A+S+C+O" };
  return true;
}

function mapControlToTopDown(control) {
  const mapped = mapPointOldToTopDown(control.x, control.y);
  const sizeScale = control.type === "jog" ? 1.0 : control.type === "knob" ? 0.92 : 0.86;
  return {
    ...control,
    x: mapped.x,
    y: mapped.y,
    size: clampNumber((control.size || 3) * sizeScale, 1, 12, control.size || 3)
  };
}

function mapPointOldToTopDown(x, y) {
  const nx = x / 100;
  const ny = y / 100;
  const denom = 1 + 0.34 * ny;
  const tx = (1.52 * nx + 0.18 * ny - 0.29) / denom;
  const ty = (1.22 * ny - 0.05) / denom;
  return {
    x: clampNumber(tx * 100, 0, 100, x),
    y: clampNumber(ty * 100, 0, 100, y)
  };
}

function normalizeControl(control, index) {
  const parsedW = Number(control.w);
  const parsedH = Number(control.h);
  return {
    id: String(control.id || `control_${index + 1}`),
    name: String(control.name || `Controlo ${index + 1}`),
    type: ["button", "knob", "fader", "jog"].includes(control.type) ? control.type : "button",
    x: clampNumber(control.x, 0, 100, 50),
    y: clampNumber(control.y, 0, 100, 50),
    size: clampNumber(control.size, 1, 12, 3),
    w: Number.isFinite(parsedW) ? clampNumber(parsedW, 0.5, 100, parsedW) : undefined,
    h: Number.isFinite(parsedH) ? clampNumber(parsedH, 0.5, 100, parsedH) : undefined,
    shape: typeof control.shape === "string" ? control.shape : undefined,
    action: {
      type: String(control.action?.type || "none"),
      value: String(control.action?.value || ""),
      notes: String(control.action?.notes || ""),
      midi: String(control.action?.midi || "")
    }
  };
}

function defaultAction() {
  return { type: "none", value: "", notes: "", midi: "" };
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isRelativeAppVolumeControl(control) {
  return Boolean(control && (control.type === "jog" || /^pitch_[ab]$/.test(control.id)));
}

function isAppVolumeCapableControl(control) {
  return Boolean(
    control && (
      control.id === "channel_fader_a" ||
      control.id === "channel_fader_b" ||
      isRelativeAppVolumeControl(control)
    )
  );
}

function isDesktopBridgeAvailable() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.listOpenApps === "function");
}

function canSetAppVolume() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.setAppVolume === "function");
}

function canGetAppVolume() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.getAppVolume === "function");
}

function canUseAudioRouter() {
  return Boolean(
    window.electronDesktop &&
    typeof window.electronDesktop.listAudioDevices === "function"
  );
}

function canSetPersonalOutputVolume() {
  return Boolean(
    window.electronDesktop &&
    typeof window.electronDesktop.setPersonalOutputVolume === "function"
  );
}

function canGetPersonalOutputVolume() {
  return Boolean(
    window.electronDesktop &&
    typeof window.electronDesktop.getPersonalOutputVolume === "function"
  );
}

function canManageCableListen() {
  return Boolean(
    window.electronDesktop &&
    typeof window.electronDesktop.getCableListenStatus === "function" &&
    typeof window.electronDesktop.setCableListen === "function"
  );
}

function canSetDefaultAudioDevice() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.setDefaultAudioDevice === "function");
}

function canRouteAppsToAudioDevices() {
  return Boolean(
    window.electronDesktop &&
    typeof window.electronDesktop.routeAppToAudioDevice === "function" &&
    typeof window.electronDesktop.clearAppAudioRoute === "function"
  );
}

function canSendMediaPlayPause() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.mediaPlayPause === "function");
}

function canSendMediaPrev() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.mediaPrev === "function");
}

function canSendMediaNext() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.mediaNext === "function");
}

function canSendHotkey() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.sendHotkey === "function");
}

function canToggleDiscordMute() {
  return Boolean(window.electronDesktop && typeof window.electronDesktop.toggleDiscordMute === "function");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isVirtualCableDevice(device) {
  return /vb-audio|cable in|cable output|virtual cable/i.test(String(device?.name || ""));
}

function isCableInputDevice(device) {
  return /^cable (input|in)\b|vb-audio cable input/i.test(String(device?.name || ""));
}

function shortDeviceName(name, fallback = "A confirmar") {
  const value = String(name || "").trim();
  if (!value) return fallback;
  if (/corsair/i.test(value)) return "Corsair";
  if (/cable (input|in)\b|vb-audio/i.test(value)) return "CABLE";
  return value.length > 20 ? `${value.slice(0, 19)}…` : value;
}

function setReadOnlyStatus(pill, valueElement, value, stateName = "neutral") {
  if (pill) pill.dataset.state = stateName;
  if (valueElement) valueElement.textContent = value;
}

function renderStatusOverview() {
  const source = runtime.audioDevices.find((device) => device.id === state.audioRouting.sourceId);
  const target = runtime.audioDevices.find((device) => device.id === state.audioRouting.targetId);
  const sourceIsCable = isCableInputDevice(source);
  const midiInput = Array.from(runtime.midiInputsBound.values())[0];
  const midiReady = Boolean(runtime.midiConnected && runtime.midiInputsBound.size);
  const phonesReady = Boolean(target);
  const discordPrivate = Boolean(state.audioRouting.discordPrivateRoute && target);
  const midiValue = midiReady ? "Ligado" : "A detetar";
  const cableValue = sourceIsCable ? "100%" : "A confirmar";
  const phonesValue = shortDeviceName(target?.name);
  const discordValue = discordPrivate ? shortDeviceName(target?.name, "Privado") : "A confirmar";

  setReadOnlyStatus(elements.statusMidi, elements.statusMidiValue, midiValue, midiReady ? "ok" : "warning");
  setReadOnlyStatus(elements.statusCable, elements.statusCableValue, cableValue, sourceIsCable ? "ok" : "warning");
  setReadOnlyStatus(elements.statusPhones, elements.statusPhonesValue, phonesValue, phonesReady ? "ok" : "warning");
  setReadOnlyStatus(elements.statusDiscord, elements.statusDiscordValue, discordValue, discordPrivate ? "ok" : "warning");

  if (elements.audioOverviewMidi) {
    elements.audioOverviewMidi.textContent = midiReady
      ? (midiInput?.name || "Controladora ligada")
      : "A detetar controladora";
  }
  if (elements.audioOverviewCable) {
    elements.audioOverviewCable.textContent = sourceIsCable
      ? `${shortDeviceName(source?.name, "CABLE")} · 100%`
      : "CABLE por confirmar";
  }
  if (elements.audioOverviewVolume) {
    elements.audioOverviewVolume.textContent = `${Math.round(state.audioRouting.personalVolume * 100)}% só para si`;
  }
  if (elements.audioOverviewPhones) {
    elements.audioOverviewPhones.textContent = target?.name || "Escolha os phones";
  }
  if (elements.audioOverviewDiscord) {
    elements.audioOverviewDiscord.textContent = discordPrivate
      ? `${shortDeviceName(target?.name)} · fora da partilha`
      : "Rota privada por confirmar";
  }

  renderLiveStatusCard();
}

function renderLiveStatusCard() {
  const discordPercent = Number.isFinite(runtime.liveStatus.discordVolume)
    ? Math.round(runtime.liveStatus.discordVolume * 100)
    : null;
  const phonesPercent = Math.round(state.audioRouting.personalVolume * 100);
  publishLiveStatusOverlay({
    discordPercent,
    phonesPercent,
    micMuted: runtime.liveStatus.micMuted,
    trackLabel: runtime.liveStatus.trackLabel,
    trackTitle: runtime.liveStatus.trackTitle,
    trackDetail: runtime.liveStatus.trackDetail
  });
}

function publishLiveStatusOverlay(status) {
  if (!window.electronDesktop) return;

  const dispatch = runtime.statusOverlayDispatch;
  dispatch.pending = status;
  if (dispatch.queued) return;
  dispatch.queued = true;

  requestAnimationFrame(() => {
    dispatch.queued = false;
    const latest = dispatch.pending;
    dispatch.pending = null;
    if (!latest) return;

    if (typeof window.electronDesktop.pushStatusOverlay === "function") {
      window.electronDesktop.pushStatusOverlay(latest);
      return;
    }

    if (typeof window.electronDesktop.updateStatusOverlay === "function") {
      void window.electronDesktop.updateStatusOverlay(latest);
    }
  });
}

function showLiveStatusCard(update = {}) {
  Object.assign(runtime.liveStatus, update);
  renderLiveStatusCard();
}

async function refreshLiveDiscordStatus() {
  if (!canGetAppVolume()) return;
  try {
    const result = await window.electronDesktop.getAppVolume("Discord");
    if (result?.ok && Number.isFinite(Number(result.volume))) {
      runtime.liveStatus.discordVolume = Number(result.volume);
      renderLiveStatusCard();
    }
  } catch {
    // O cartão continua disponível com o último valor conhecido.
  }
}

function isDiscordProcessName(processName) {
  return String(processName || "").trim().replace(/\.exe$/i, "").toLowerCase() === "discord";
}

function isDiscordMicMuteHotkey(keys) {
  return String(keys || "").replace(/\s+/g, "").toUpperCase() === "A+S+C+O";
}

function showMediaControlStatus(actionType) {
  const next = {
    media_play_pause: { trackLabel: "Media", trackTitle: "Play / Pause", trackDetail: "Comando enviado pela Hercules" },
    media_prev: { trackLabel: "Previous", trackTitle: "Faixa anterior", trackDetail: "Comando enviado pela Hercules" },
    media_next: { trackLabel: "Next", trackTitle: "Faixa seguinte", trackDetail: "Comando enviado pela Hercules" }
  };
  showLiveStatusCard(next[actionType] || {});
}

function setActiveView(view) {
  const nextView = ["mapper", "audio", "macros", "profiles"].includes(view) ? view : "mapper";
  activeView = nextView;
  document.body.dataset.view = nextView;

  for (const button of elements.navButtons) {
    const selected = button.dataset.navTarget === nextView;
    button.classList.toggle("active", selected);
    if (selected) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  const futureContent = {
    macros: {
      title: "Macros",
      description: "O editor de macros será construído numa fase própria: passos ordenados, pequenos atrasos e teste seguro, sem alterar a rota de áudio atual."
    },
    profiles: {
      title: "Perfis",
      description: "Os perfis serão adicionados numa fase própria com cópia de segurança, duplicação e importação/exportação dos mapeamentos."
    }
  };
  const future = futureContent[nextView];
  if (elements.futurePanel) elements.futurePanel.classList.toggle("hidden", !future);
  if (future && elements.futurePanelTitle && elements.futurePanelDescription) {
    elements.futurePanelTitle.textContent = future.title;
    elements.futurePanelDescription.textContent = future.description;
  }

  renderStatusOverview();
}

function findPreferredAudioDeviceId(pattern, fallbackId = "", allowPhysicalFallback = true) {
  if (fallbackId && runtime.audioDevices.some((device) => device.id === fallbackId)) {
    return fallbackId;
  }
  const match = runtime.audioDevices.find((device) => pattern.test(device.name));
  if (match) return match.id;
  if (!allowPhysicalFallback) return "";
  const defaultPhysical = runtime.audioDevices.find((device) => device.isDefault && !isVirtualCableDevice(device));
  return defaultPhysical?.id || runtime.audioDevices[0]?.id || "";
}

function setAudioRouterStatus(message, { running = false } = {}) {
  if (!elements.audioRouterStatus) return;
  elements.audioRouterStatus.textContent = message;
  elements.audioRouterStatus.classList.toggle("is-running", Boolean(running));
}

function renderAudioRouter() {
  const available = canUseAudioRouter();
  const devices = runtime.audioDevices;
  const sourceId = state.audioRouting.sourceId;
  const targetId = state.audioRouting.targetId;
  const volumePercent = Math.round(state.audioRouting.personalVolume * 100);

  if (elements.audioSourceSelect) {
    const options = ['<option value="">Seleciona CABLE Input...</option>'];
    for (const device of devices) {
      const suffix = device.isDefault ? " (predefinido)" : "";
      options.push(`<option value="${escapeHtml(device.id)}">${escapeHtml(device.name)}${suffix}</option>`);
    }
    elements.audioSourceSelect.innerHTML = options.join("");
    elements.audioSourceSelect.value = devices.some((device) => device.id === sourceId) ? sourceId : "";
    elements.audioSourceSelect.disabled = !available || runtime.audioRouterBusy;
  }

  if (elements.audioTargetSelect) {
    const options = ['<option value="">Seleciona os auscultadores...</option>'];
    for (const device of devices) {
      const suffix = device.isDefault ? " (predefinido)" : "";
      options.push(`<option value="${escapeHtml(device.id)}">${escapeHtml(device.name)}${suffix}</option>`);
    }
    elements.audioTargetSelect.innerHTML = options.join("");
    elements.audioTargetSelect.value = devices.some((device) => device.id === targetId) ? targetId : "";
    elements.audioTargetSelect.disabled = !available || runtime.audioRouterBusy;
  }

  if (elements.personalVolumeRange) {
    elements.personalVolumeRange.value = String(volumePercent);
    elements.personalVolumeRange.disabled = !canSetPersonalOutputVolume() || !targetId || runtime.audioRouterBusy;
  }
  if (elements.personalVolumeValue) {
    elements.personalVolumeValue.textContent = `${volumePercent}%`;
  }
  if (elements.refreshAudioDevicesBtn) {
    elements.refreshAudioDevicesBtn.disabled = !available || runtime.audioDevicesLoading || runtime.audioRouterBusy;
    elements.refreshAudioDevicesBtn.textContent = runtime.audioDevicesLoading ? "A atualizar..." : "Atualizar";
  }
  if (elements.startAudioRouterBtn) {
    elements.startAudioRouterBtn.disabled = !canSetPersonalOutputVolume() || !targetId || runtime.audioRouterBusy;
    elements.startAudioRouterBtn.textContent = runtime.audioRouterBusy ? "A aplicar..." : "Aplicar volume nos auscultadores";
  }
  if (elements.setCableDefaultBtn) {
    elements.setCableDefaultBtn.disabled = !canSetDefaultAudioDevice() || runtime.audioRouterBusy || !sourceId;
  }
  if (elements.enableCableListenBtn) {
    elements.enableCableListenBtn.disabled = !canManageCableListen() || runtime.cableListenBusy || !targetId;
    elements.enableCableListenBtn.textContent = runtime.cableListenBusy ? "A aplicar no Windows..." : "Escutar CABLE nos phones";
  }
  if (elements.disableCableListenBtn) {
    elements.disableCableListenBtn.disabled = !canManageCableListen() || runtime.cableListenBusy;
  }
  if (elements.routeDiscordPrivateBtn) {
    elements.routeDiscordPrivateBtn.disabled = !canRouteAppsToAudioDevices() || runtime.discordRoutingBusy || !targetId;
    elements.routeDiscordPrivateBtn.textContent = runtime.discordRoutingBusy ? "A aplicar ao Discord..." : "Discord -> auscultadores privados";
  }
  if (elements.clearDiscordPrivateBtn) {
    elements.clearDiscordPrivateBtn.disabled = !canRouteAppsToAudioDevices() || runtime.discordRoutingBusy;
  }
  if (elements.stopAudioRouterBtn) {
    elements.stopAudioRouterBtn.hidden = true;
  }
  renderStatusOverview();
}

async function initializeAudioRouter() {
  if (!canUseAudioRouter()) {
    setAudioRouterStatus("O router de áudio está disponível apenas no executável desktop.");
    renderAudioRouter();
    return;
  }

  await refreshAudioDevices({ silent: true });
  // Remove qualquer rota antiga da nossa app. A cópia estável é feita pelo
  // próprio Windows em CABLE Output > Propriedades > Ouvir.
  try {
    await window.electronDesktop.stopAudioRouter?.();
  } catch {
    // Se não existir uma rota antiga, não há nada a limpar.
  }
  runtime.audioRouterRunning = false;
  setAudioRouterStatus("Modo estável: o Windows encaminha CABLE Output para os Corsair; a app controla só o volume pessoal.");
  await syncPersonalCableVolume({ silent: true });
  if (state.audioRouting.discordPrivateRoute && state.audioRouting.targetId && canRouteAppsToAudioDevices()) {
    void routeDiscordPrivately({ silent: true });
  }
  renderAudioRouter();
}

async function refreshAudioDevices({ silent = false } = {}) {
  if (!canUseAudioRouter() || runtime.audioDevicesLoading) return;
  runtime.audioDevicesLoading = true;
  runtime.audioDevicesError = "";
  renderAudioRouter();

  try {
    const result = await window.electronDesktop.listAudioDevices();
    if (!result?.ok) {
      throw new Error(String(result?.error || "Falha ao listar dispositivos de áudio."));
    }
    runtime.audioDevices = Array.isArray(result.devices)
      ? result.devices.map((device) => ({
        id: String(device?.Id ?? device?.id ?? ""),
        name: String(device?.Name ?? device?.name ?? ""),
        isDefault: Boolean(device?.IsDefault ?? device?.isDefault)
      })).filter((device) => device.id && device.name)
      : [];
    state.audioRouting.sourceId = findPreferredAudioDeviceId(/^cable input\b/i, state.audioRouting.sourceId, false) ||
      findPreferredAudioDeviceId(/^cable in\b/i, state.audioRouting.sourceId, false);
    state.audioRouting.targetId = findPreferredAudioDeviceId(/corsair|headset earphone|headphones/i, state.audioRouting.targetId);
    saveState();
    setAudioRouterStatus("Modo estável: ative ‘Ouvir este dispositivo’ em CABLE Output e escolha os Corsair. A app só ajusta os auscultadores.");
    if (!silent) showToast(`Dispositivos de áudio: ${runtime.audioDevices.length}`);
  } catch (error) {
    runtime.audioDevices = [];
    runtime.audioDevicesError = String(error?.message || error || "Falha ao listar dispositivos de áudio.");
    setAudioRouterStatus(`Falha ao listar dispositivos: ${runtime.audioDevicesError}`);
    if (!silent) window.alert(runtime.audioDevicesError);
  } finally {
    runtime.audioDevicesLoading = false;
    renderAudioRouter();
    renderActionConfigurator(getSelectedControl());
  }
}

function renderPersonalOutputOptions() {
  if (!elements.personalOutputTargetSelect || !elements.personalOutputHint) return;
  const select = elements.personalOutputTargetSelect;
  const physicalDevices = runtime.audioDevices.filter((device) => !isVirtualCableDevice(device));
  const selectedId = state.audioRouting.targetId;

  if (!physicalDevices.length) {
    select.innerHTML = '<option value="">A carregar auscultadores...</option>';
    select.disabled = true;
    elements.personalOutputHint.textContent = "Atualiza primeiro os dispositivos na secção Áudio independente.";
    return;
  }

  const options = ['<option value="">Seleciona os teus phones...</option>'];
  for (const device of physicalDevices) {
    const suffix = /corsair|headset|headphones/i.test(device.name) ? " — meus phones" : "";
    options.push(`<option value="${escapeHtml(device.id)}">${escapeHtml(device.name)}${suffix}</option>`);
  }
  select.innerHTML = options.join("");
  select.value = physicalDevices.some((device) => device.id === selectedId) ? selectedId : "";
  select.disabled = false;

  const selected = physicalDevices.find((device) => device.id === select.value);
  elements.personalOutputHint.textContent = selected
    ? `Este controlo baixa o CABLE antes de chegar a ${selected.name}. O Discord e a partilha CABLE não mudam.`
    : "Seleciona os teus phones para controlar o CABLE que ouves sem mexer no Discord.";
}

function onPersonalOutputSelected() {
  const targetId = elements.personalOutputTargetSelect?.value || "";
  if (!targetId) return;
  state.audioRouting.targetId = targetId;
  saveState();
  renderAudioRouter();
  renderActionConfigurator(getSelectedControl());
  const name = runtime.audioDevices.find((device) => device.id === targetId)?.name || "auscultadores";
  setAudioRouterStatus(`Os controlos pessoais vão ajustar ${name}; a partilha CABLE permanece a 100%.`);
  void syncPersonalCableVolume({ silent: true });
  showToast(`Phones selecionados: ${name}`);
}

function onAudioRoutingSelectionChanged() {
  state.audioRouting.sourceId = elements.audioSourceSelect?.value || "";
  state.audioRouting.targetId = elements.audioTargetSelect?.value || "";
  saveState();
  renderStatusOverview();
  void syncPersonalCableVolume({ silent: true });
  setAudioRouterStatus("Dispositivos guardados. Confirme no Windows: CABLE Output → Propriedades → Ouvir → Corsair.");
}

async function syncPersonalCableVolume({ silent = false } = {}) {
  const targetId = state.audioRouting.targetId;
  if (!targetId || !canGetPersonalOutputVolume() || runtime.personalVolumeReading) return false;

  runtime.personalVolumeReading = true;
  try {
    const result = await window.electronDesktop.getPersonalOutputVolume(targetId);
    if (!result?.ok || !Number.isFinite(Number(result.volume))) {
      if (!silent) {
        setAudioRouterStatus(String(result?.error || "Não foi possível ler o volume CABLE dos phones."));
      }
      return false;
    }

    const realVolume = result.muted ? 0 : clampNumber(result.volume, 0, 1, state.audioRouting.personalVolume);
    if (Math.abs(realVolume - state.audioRouting.personalVolume) > 0.0001) {
      state.audioRouting.personalVolume = realVolume;
      saveState();
    }
    renderAudioRouter();
    return true;
  } catch (error) {
    if (!silent) {
      setAudioRouterStatus(`Não foi possível ler o volume CABLE dos phones: ${String(error?.message || error)}`);
    }
    return false;
  } finally {
    runtime.personalVolumeReading = false;
  }
}

function onPersonalVolumeInput() {
  const percent = clampNumber(elements.personalVolumeRange?.value, 0, 100, 75);
  state.audioRouting.personalVolume = percent / 100;
  saveState();
  renderAudioRouter();
  queuePersonalVolumeUpdate(state.audioRouting.personalVolume);
  showLiveStatusCard();
}

function changePersonalVolumeBy(amount) {
  const nextVolume = clampNumber(state.audioRouting.personalVolume + amount, 0, 1, state.audioRouting.personalVolume);
  if (nextVolume === state.audioRouting.personalVolume) {
    showToast(nextVolume >= 1 ? "Os phones já estão no máximo." : "Os phones já estão sem som.");
    return;
  }

  state.audioRouting.personalVolume = nextVolume;
  if (elements.personalVolumeRange) elements.personalVolumeRange.value = String(Math.round(nextVolume * 100));
  if (elements.personalVolumeValue) elements.personalVolumeValue.textContent = `${Math.round(nextVolume * 100)}%`;
  saveState();
  renderAudioRouter();
  queuePersonalVolumeUpdate(nextVolume);
  showLiveStatusCard();
  showToast(`Volume dos phones: ${Math.round(nextVolume * 100)}%`);
}

function queuePersonalVolumeUpdate(volume) {
  if (!canSetPersonalOutputVolume() || !state.audioRouting.targetId) return;
  let dispatch = runtime.personalVolumeDispatch;
  if (!dispatch) {
    dispatch = {
      targetId: state.audioRouting.targetId,
      latestVolume: volume,
      timer: null,
      inFlight: false
    };
    runtime.personalVolumeDispatch = dispatch;
  } else {
    dispatch.targetId = state.audioRouting.targetId;
    dispatch.latestVolume = volume;
  }

  if (dispatch.timer || dispatch.inFlight) return;
  dispatch.timer = setTimeout(() => {
    dispatch.timer = null;
    void flushPersonalVolumeUpdate();
  }, 8);
}

async function flushPersonalVolumeUpdate() {
  const dispatch = runtime.personalVolumeDispatch;
  if (!dispatch || dispatch.inFlight || !dispatch.targetId) return;

  const targetId = dispatch.targetId;
  const volume = dispatch.latestVolume;
  dispatch.inFlight = true;
  try {
    const result = await window.electronDesktop.setPersonalOutputVolume(targetId, volume);
    if (result?.ok) {
      state.audioRouting.personalVolume = clampNumber(result.volume, 0, 1, volume);
      saveState();
      renderAudioRouter();
      const targetName = result.targetName || "auscultadores";
      setAudioRouterStatus(`Volume CABLE aplicado para ${targetName}. O Discord mantém o volume dele e a partilha fica a 100%.`);
    } else {
      setAudioRouterStatus(`Não foi possível ajustar os auscultadores: ${String(result?.error || "erro desconhecido")}`);
      void syncPersonalCableVolume({ silent: true });
      renderAudioRouter();
    }
  } catch (error) {
    setAudioRouterStatus(`Não foi possível ajustar os auscultadores: ${String(error?.message || error)}`);
    void syncPersonalCableVolume({ silent: true });
    renderAudioRouter();
  } finally {
    dispatch.inFlight = false;
    if (runtime.personalVolumeDispatch !== dispatch) return;

    if (dispatch.targetId !== targetId || dispatch.latestVolume !== volume) {
      dispatch.timer = setTimeout(() => {
        dispatch.timer = null;
        void flushPersonalVolumeUpdate();
      }, 0);
    } else {
      runtime.personalVolumeDispatch = null;
    }
  }
}

async function startAudioRouter() {
  const target = state.audioRouting.targetId;
  if (!target) {
    window.alert("Escolha primeiro os seus auscultadores.");
    return;
  }

  runtime.audioRouterBusy = true;
  renderAudioRouter();
  setAudioRouterStatus("A aplicar o volume apenas nos auscultadores...");
  try {
    const result = await window.electronDesktop.setPersonalOutputVolume(target, state.audioRouting.personalVolume);
    if (!result?.ok) throw new Error(String(result?.error || "Não foi possível ajustar os auscultadores."));
    state.audioRouting.personalVolume = clampNumber(result.volume, 0, 1, state.audioRouting.personalVolume);
    saveState();
    setAudioRouterStatus(`Volume aplicado em ${result.targetName || "auscultadores"}. O Windows mantém a rota estável e a partilha CABLE a 100%.`);
    showToast("Volume pessoal aplicado.");
  } catch (error) {
    setAudioRouterStatus(`Não foi possível ajustar: ${String(error?.message || error)}`);
  } finally {
    runtime.audioRouterBusy = false;
    renderAudioRouter();
  }
}

async function setCableAsDefaultOutput() {
  const source = state.audioRouting.sourceId;
  const sourceDevice = runtime.audioDevices.find((device) => device.id === source);
  if (!source || !sourceDevice) {
    window.alert("Escolha CABLE Input como fonte da transmissão primeiro.");
    return;
  }
  if (!/^cable input\b/i.test(sourceDevice.name)) {
    window.alert("Para esta configuração escolha CABLE Input (VB-Audio Virtual Cable), não um dispositivo físico.");
    return;
  }

  runtime.audioRouterBusy = true;
  renderAudioRouter();
  try {
    const result = await window.electronDesktop.setDefaultAudioDevice(source);
    if (!result?.ok) throw new Error(String(result?.error || "Não foi possível alterar a saída predefinida."));
    await refreshAudioDevices({ silent: true });
    setAudioRouterStatus("CABLE Input é agora a saída geral. Mantenha o Discord definido diretamente nos auscultadores.", { running: runtime.audioRouterRunning });
    showToast("CABLE Input definido como saída geral.");
  } catch (error) {
    setAudioRouterStatus(`Não foi possível definir a saída geral: ${String(error?.message || error)}`, { running: runtime.audioRouterRunning });
  } finally {
    runtime.audioRouterBusy = false;
    renderAudioRouter();
  }
}

async function setCableListen(enabled) {
  const target = state.audioRouting.targetId;
  if (enabled && !target) {
    window.alert("Escolha primeiro os seus phones / Corsair.");
    return;
  }

  runtime.cableListenBusy = true;
  renderAudioRouter();
  setAudioRouterStatus(enabled
    ? "O Windows vai pedir autorização para escutar CABLE Output nos phones..."
    : "O Windows vai pedir autorização para parar de escutar CABLE Output...");
  try {
    const result = await window.electronDesktop.setCableListen(enabled, target);
    if (!result?.ok) throw new Error(String(result?.error || "O Windows não aplicou a alteração."));

    if (enabled) {
      const targetName = result.targetName || runtime.audioDevices.find((device) => device.id === target)?.name || "os seus phones";
      setAudioRouterStatus(`A escutar CABLE Output em ${targetName}. A partilha mantém-se a 100%.`, { running: true });
      showToast("CABLE está a tocar nos phones.");
    } else {
      setAudioRouterStatus("CABLE Output deixou de tocar nos phones. A partilha CABLE continua disponível.");
      showToast("CABLE deixou de ser escutado.");
    }
  } catch (error) {
    const message = String(error?.message || error);
    setAudioRouterStatus(`Não foi possível alterar “Ouvir este dispositivo”: ${message}`);
    window.alert(`O Windows não aplicou a alteração. Confirma a janela de autorização e tenta de novo.\n\n${message}`);
  } finally {
    runtime.cableListenBusy = false;
    renderAudioRouter();
  }
}

async function routeDiscordPrivately({ silent = false } = {}) {
  const target = state.audioRouting.targetId;
  if (!target) {
    if (!silent) window.alert("Escolha primeiro os auscultadores pessoais.");
    return false;
  }

  runtime.discordRoutingBusy = true;
  renderAudioRouter();
  try {
    const result = await window.electronDesktop.routeAppToAudioDevice("Discord", target);
    if (!result?.ok) throw new Error(String(result?.error || "Nao foi possivel aplicar a rota do Discord."));
    state.audioRouting.discordPrivateRoute = true;
    saveState();
    const destination = runtime.audioDevices.find((device) => device.id === target)?.name || "auscultadores";
    setAudioRouterStatus(`Discord privado: sai diretamente em ${destination} e fica fora da transmissao.`, { running: runtime.audioRouterRunning });
    if (!silent) showToast("Discord enviado para os auscultadores.");
    return true;
  } catch (error) {
    state.audioRouting.discordPrivateRoute = false;
    saveState();
    if (!silent) {
      window.alert(`Nao foi possivel aplicar a rota do Discord: ${String(error?.message || error)}`);
    }
    return false;
  } finally {
    runtime.discordRoutingBusy = false;
    renderAudioRouter();
  }
}

async function clearDiscordPrivateRoute() {
  runtime.discordRoutingBusy = true;
  renderAudioRouter();
  try {
    const result = await window.electronDesktop.clearAppAudioRoute("Discord");
    if (!result?.ok) throw new Error(String(result?.error || "Nao foi possivel remover a rota do Discord."));
    state.audioRouting.discordPrivateRoute = false;
    saveState();
    setAudioRouterStatus("O Discord volta a seguir a saida geral do Windows.", { running: runtime.audioRouterRunning });
    showToast("Rota privada do Discord removida.");
  } catch (error) {
    window.alert(`Nao foi possivel remover a rota do Discord: ${String(error?.message || error)}`);
  } finally {
    runtime.discordRoutingBusy = false;
    renderAudioRouter();
  }
}

async function stopAudioRouter() {
  setAudioRouterStatus("A rota antiga está desativada. Use ‘Ouvir este dispositivo’ no Windows para a monitorização estável.");
}

async function initializeMidiRuntime() {
  if (!("requestMIDIAccess" in navigator)) {
    console.warn("Web MIDI nao suportado neste runtime.");
    return;
  }

  try {
    const access = runtime.midiAccess || await navigator.requestMIDIAccess({ sysex: false });
    runtime.midiAccess = access;
    const inputCount = bindMidiInputs();
    runtime.midiConnected = inputCount > 0;
    access.onstatechange = () => {
      const nextInputCount = bindMidiInputs();
      runtime.midiConnected = nextInputCount > 0;
      if (nextInputCount > 0) {
        stopMidiReconnectRetry();
      } else {
        startMidiReconnectRetry();
      }
      renderStatusOverview();
    };
    if (inputCount > 0) {
      stopMidiReconnectRetry();
    } else {
      startMidiReconnectRetry();
    }
    renderStatusOverview();
    console.log("MIDI pronto:", Array.from(access.inputs.values()).map((i) => i.name));
  } catch (error) {
    runtime.midiConnected = false;
    startMidiReconnectRetry();
    renderStatusOverview();
    console.warn("Falha ao iniciar Web MIDI:", error);
  }
}

function stopMidiReconnectRetry() {
  if (!runtime.midiReconnectTimer) return;
  clearInterval(runtime.midiReconnectTimer);
  runtime.midiReconnectTimer = null;
}

function startMidiReconnectRetry() {
  if (runtime.midiReconnectTimer) return;
  runtime.midiReconnectTimer = setInterval(() => {
    if (!runtime.midiAccess) {
      void initializeMidiRuntime();
      return;
    }
    const inputCount = bindMidiInputs();
    runtime.midiConnected = inputCount > 0;
    if (inputCount > 0) stopMidiReconnectRetry();
    renderStatusOverview();
  }, 1500);
}

function bindMidiInputs() {
  const access = runtime.midiAccess;
  if (!access) return 0;

  const activeIds = new Set();
  for (const input of access.inputs.values()) {
    if (!input || !input.id) continue;
    activeIds.add(input.id);
    const boundInput = runtime.midiInputsBound.get(input.id);
    if (boundInput === input) continue;
    if (boundInput) boundInput.onmidimessage = null;
    input.onmidimessage = onMidiMessage;
    runtime.midiInputsBound.set(input.id, input);
    console.log("MIDI input ligado:", input.name || input.id);
  }

  for (const [id, input] of runtime.midiInputsBound) {
    if (activeIds.has(id)) continue;
    input.onmidimessage = null;
    runtime.midiInputsBound.delete(id);
  }
  renderStatusOverview();
  return runtime.midiInputsBound.size;
}

function normalizeFaderMidiToUnit(rawValue) {
  const value = clampNumber(rawValue, 0, 127, 0);
  // A zona morta anterior equivalia a cerca de 15% do curso MIDI e podia
  // fazer os faders A/B chegarem ao mute demasiado cedo. Mantemos só o
  // mínimo necessário para o zero físico do controlador.
  const lowerDeadZone = 1;
  const upperDeadZone = 3;
  const min = lowerDeadZone;
  const max = 127 - upperDeadZone;

  if (value <= min) return 0;
  if (value >= max) return 1;

  return clampNumber((value - min) / (max - min), 0, 1, 0);
}

function getMidiCcFromBinding(binding) {
  const match = String(binding || "").match(/\bcc\s*[:#]?\s*(\d{1,3})\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value >= 0 && value <= 127 ? value : null;
}

function getMidiNoteFromBinding(binding) {
  const match = String(binding || "").match(/\bnote\s*[:#]?\s*(\d{1,3})\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value >= 0 && value <= 127 ? value : null;
}

function findControlIdForMidiCc(midiNo) {
  const learnedControl = state.controls.find((control) => getMidiCcFromBinding(control.action?.midi) === midiNo);
  return learnedControl?.id || MIDI_CC_CONTROL_MAP.get(midiNo) || null;
}

function findControlIdForMidiNote(midiNo) {
  const learnedControl = state.controls.find((control) => getMidiNoteFromBinding(control.action?.midi) === midiNo);
  return learnedControl?.id || MIDI_NOTE_CONTROL_MAP.get(midiNo) || null;
}

function getRelativeMidiSteps(rawValue) {
  const value = clampNumber(rawValue, 0, 127, 0);
  if (value === 0 || value === 64) return 0;
  return value <= 63 ? value : -(128 - value);
}

function recordMidiActivity(controlId) {
  const control = state.controls.find((item) => item.id === controlId);
  if (!control) return;

  const changed = runtime.lastMidiControlId !== controlId;
  runtime.lastMidiControlId = controlId;
  if (changed) renderStageStatus();

  if (runtime.midiActivityTimer) clearTimeout(runtime.midiActivityTimer);
  runtime.midiActivityTimer = setTimeout(() => {
    runtime.lastMidiControlId = null;
    runtime.midiActivityTimer = null;
    renderStageStatus();
  }, 1800);
}

function renderMidiLearnUi(control = getSelectedControl()) {
  if (!elements.midiLearnBtn || !elements.midiLearnHint) return;
  const isLearning = Boolean(runtime.midiLearnControlId);
  const learningControl = state.controls.find((item) => item.id === runtime.midiLearnControlId);
  elements.midiLearnBtn.disabled = !control;
  elements.midiLearnBtn.textContent = isLearning ? "A aguardar movimento…" : "Detetar controlo";

  if (isLearning && learningControl) {
    elements.midiLearnHint.textContent = `Agora carrega ou mexe em ${learningControl.name} na mesa.`;
  } else if (control) {
    const ccBinding = getMidiCcFromBinding(control.action?.midi);
    const noteBinding = getMidiNoteFromBinding(control.action?.midi);
    const bindingText = ccBinding !== null ? `CC ${ccBinding}` : noteBinding !== null ? `Nota ${noteBinding}` : "";
    elements.midiLearnHint.textContent = bindingText
      ? `MIDI associado: ${bindingText}. Podes voltar a detetar se quiseres mudar.`
      : "Carrega aqui e mexe no controlo físico que queres usar.";
  } else {
    elements.midiLearnHint.textContent = "Seleciona um controlo e carrega aqui; depois roda o knob físico.";
  }
}

function startMidiLearn() {
  const control = getSelectedControl();
  if (!control) {
    window.alert("Seleciona primeiro o knob ou fader no desenho da mesa.");
    return;
  }
  runtime.midiLearnControlId = control.id;
  renderMidiLearnUi(control);
  showToast(`Carrega ou mexe agora ${control.name} na mesa para o detetar.`);
}

function onMidiMessage(event) {
  const data = event?.data;
  if (!data || data.length < 3) return;

  const status = data[0] & 0xF0;
  const midiNo = data[1];
  const rawValue = data[2];

  const learnControlId = runtime.midiLearnControlId;
  const isButtonPress = status === 0x90 && rawValue > 0;
  const isContinuousControl = status === 0xB0;
  if (learnControlId && (isButtonPress || isContinuousControl)) {
    const learnControl = state.controls.find((item) => item.id === learnControlId);
    runtime.midiLearnControlId = null;
    if (learnControl) {
      const binding = isButtonPress ? `note ${midiNo}` : `cc ${midiNo}`;
      learnControl.action = { ...learnControl.action, midi: binding };
      if (learnControl.id === state.selectedId && elements.midiBinding) {
        elements.midiBinding.value = binding;
      }
      saveState();
      renderMidiLearnUi(learnControl);
      renderControlList();
      renderJsonPreview();
      showToast(`${learnControl.name} associado a ${isButtonPress ? "Nota" : "CC"} ${midiNo}.`);
    }
    return;
  }

  if (status === 0xB0) {
    const controlId = findControlIdForMidiCc(midiNo);
    if (!controlId) return;

    const control = state.controls.find((item) => item.id === controlId);
    if (!control) return;
    recordMidiActivity(controlId);

    const normalized = normalizeFaderMidiToUnit(rawValue);
    const action = control.action || defaultAction();
    if (action.type === "app_volume") {
      const processName = String(action.value || "").trim();
      if (!processName || !canSetAppVolume()) return;
      if (isRelativeAppVolumeControl(control)) {
        queueRelativeAppVolumeUpdate(controlId, processName, rawValue);
      } else {
        if (isDiscordProcessName(processName)) {
          showLiveStatusCard({ discordVolume: normalized });
        }
        queueAppVolumeUpdate(controlId, processName, normalized);
      }
      return;
    }

    if (action.type === "personal_volume_relative") {
      const steps = getRelativeMidiSteps(rawValue);
      if (steps) changePersonalVolumeBy(steps * 0.02);
      return;
    }

    if (action.type === "personal_volume") {
      state.audioRouting.personalVolume = normalized;
      if (elements.personalVolumeRange) elements.personalVolumeRange.value = String(Math.round(normalized * 100));
      if (elements.personalVolumeValue) elements.personalVolumeValue.textContent = `${Math.round(normalized * 100)}%`;
      saveState();
      queuePersonalVolumeUpdate(normalized);
      showLiveStatusCard();
    }
    return;
  }

  if (status === 0x90) {
    if (rawValue <= 0) return; // note-off
    const controlId = findControlIdForMidiNote(midiNo);
    if (!controlId) return;
    recordMidiActivity(controlId);
    void handleMappedButtonPress(controlId);
  }
}

function queueAppVolumeUpdate(controlId, processName, volume) {
  const key = controlId;
  const current = runtime.appVolumeDispatch.get(key) || {};
  current.processName = processName;
  current.volume = volume;
  if (isDiscordProcessName(processName)) {
    showLiveStatusCard({ discordVolume: volume });
  }
  if (current.timer) {
    clearTimeout(current.timer);
  }
  current.timer = setTimeout(() => {
    current.timer = null;
    void flushAppVolumeUpdate(key);
  }, 30);
  runtime.appVolumeDispatch.set(key, current);
}

async function flushAppVolumeUpdate(controlId) {
  const item = runtime.appVolumeDispatch.get(controlId);
  if (!item || typeof item.volume !== "number" || !item.processName) return;

  const processName = item.processName;
  const volume = item.volume;

  const result = await window.electronDesktop.setAppVolume(processName, volume);
  if (result?.ok) {
    runtime.appVolumeErrorCache.delete(controlId);
    if (isDiscordProcessName(processName)) {
      showLiveStatusCard({ discordVolume: Number.isFinite(Number(result.volume)) ? Number(result.volume) : volume });
    }
    return;
  }

  const errorText = String(result?.error || "Falha ao ajustar volume da app.");
  const last = runtime.appVolumeErrorCache.get(controlId);
  const now = Date.now();
  if (!last || last.errorText !== errorText || now - last.at > 2000) {
    runtime.appVolumeErrorCache.set(controlId, { errorText, at: now });
    showToast(`Volume app falhou (${processName}): ${errorText}`);
  }
}

// O Jog/Pitch envia valores relativos (1..63 para um lado e 127..64 para o
// outro). Trata-los como a posicao de um fader fazia o volume saltar logo
// entre 0% e 100%. Cada mensagem passa agora a ser apenas um pequeno passo.
const RELATIVE_APP_VOLUME_STEP = 0.005;
const RELATIVE_APP_VOLUME_MAX_STEPS = 4;

function queueRelativeAppVolumeUpdate(controlId, processName, rawValue) {
  if (!canGetAppVolume()) return;

  const rawSteps = getRelativeMidiSteps(rawValue);
  if (!rawSteps) return;

  const steps = Math.sign(rawSteps) * Math.min(Math.abs(rawSteps), RELATIVE_APP_VOLUME_MAX_STEPS);
  const entry = runtime.relativeAppVolumeState.get(controlId) || {
    processName,
    volume: null,
    pendingDelta: 0,
    running: false
  };

  // If the user changes the target app, obtain its current level again before
  // applying the next turn of the wheel.
  if (entry.processName !== processName) {
    entry.processName = processName;
    entry.volume = null;
    entry.pendingDelta = 0;
  }

  entry.pendingDelta = clampNumber(entry.pendingDelta + (steps * RELATIVE_APP_VOLUME_STEP), -0.5, 0.5, 0);
  runtime.relativeAppVolumeState.set(controlId, entry);
  if (isDiscordProcessName(processName)) {
    const knownVolume = Number.isFinite(entry.volume) ? entry.volume : runtime.liveStatus.discordVolume;
    if (Number.isFinite(knownVolume)) {
      showLiveStatusCard({ discordVolume: clampNumber(knownVolume + entry.pendingDelta, 0, 1, knownVolume) });
    }
  }
  if (!entry.running) {
    void flushRelativeAppVolumeUpdate(controlId);
  }
}

async function flushRelativeAppVolumeUpdate(controlId) {
  const entry = runtime.relativeAppVolumeState.get(controlId);
  if (!entry || entry.running || !entry.processName) return;

  entry.running = true;
  try {
    while (Math.abs(entry.pendingDelta) > 0.00001) {
      const delta = entry.pendingDelta;
      entry.pendingDelta = 0;

      if (!Number.isFinite(entry.volume)) {
        const current = await window.electronDesktop.getAppVolume(entry.processName);
        if (!current?.ok || !Number.isFinite(Number(current.volume))) {
          showAppVolumeError(controlId, entry.processName, current?.error || "Nao foi possivel ler o volume atual.");
          return;
        }
        entry.volume = Number(current.volume);
      }

      const nextVolume = clampNumber(entry.volume + delta, 0, 1, entry.volume);
      if (Math.abs(nextVolume - entry.volume) < 0.00001) continue;

      const result = await window.electronDesktop.setAppVolume(entry.processName, nextVolume);
      if (!result?.ok) {
        showAppVolumeError(controlId, entry.processName, result?.error || "Falha ao ajustar volume da app.");
        return;
      }

      entry.volume = Number.isFinite(Number(result.volume)) ? Number(result.volume) : nextVolume;
      runtime.appVolumeErrorCache.delete(controlId);
      if (isDiscordProcessName(entry.processName)) {
        showLiveStatusCard({ discordVolume: entry.volume });
      }
    }
  } finally {
    entry.running = false;
    if (Math.abs(entry.pendingDelta) > 0.00001) {
      void flushRelativeAppVolumeUpdate(controlId);
    }
  }
}

function showAppVolumeError(controlId, processName, error) {
  const errorText = String(error || "Falha ao ajustar volume da app.");
  const last = runtime.appVolumeErrorCache.get(controlId);
  const now = Date.now();
  if (!last || last.errorText !== errorText || now - last.at > 2000) {
    runtime.appVolumeErrorCache.set(controlId, { errorText, at: now });
    showToast(`Volume app falhou (${processName}): ${errorText}`);
  }
}

async function handleMappedButtonPress(controlId) {
  const control = state.controls.find((item) => item.id === controlId);
  if (!control) return;

  const action = control.action || defaultAction();
  if (!action.type || action.type === "none") return;

  const now = Date.now();
  const lastAt = Number(runtime.buttonActionCooldown.get(controlId) || 0);
  if (now - lastAt < 180) {
    return;
  }
  runtime.buttonActionCooldown.set(controlId, now);

  let result = null;
  if (action.type === "personal_volume_up") {
    changePersonalVolumeBy(0.05);
    return;
  } else if (action.type === "personal_volume_down") {
    changePersonalVolumeBy(-0.05);
    return;
  } else if (action.type === "media_play_pause") {
    if (!canSendMediaPlayPause()) return;
    result = await window.electronDesktop.mediaPlayPause();
  } else if (action.type === "discord_mute_toggle") {
    if (!canToggleDiscordMute()) return;
    result = await window.electronDesktop.toggleDiscordMute();
  } else if (action.type === "media_prev") {
    if (!canSendMediaPrev()) return;
    result = await window.electronDesktop.mediaPrev();
  } else if (action.type === "media_next") {
    if (!canSendMediaNext()) return;
    result = await window.electronDesktop.mediaNext();
  } else if (action.type === "hotkey") {
    const keys = String(action.value || "").trim();
    if (!keys) return;
    if (!canSendHotkey()) return;
    result = await window.electronDesktop.sendHotkey(keys);
  } else if (action.type === "voice_preset") {
    const preset = String(action.value || "").trim() || "Normal";
    runtime.activeVoicePreset = VOICE_PRESET_OPTIONS.includes(preset) ? preset : "Normal";
    renderActionConfigurator(getSelectedControl());
    renderStageStatus();
    showToast(`Preset de voz: ${runtime.activeVoicePreset}`);
    return;
  } else {
    return;
  }

  if (!result?.ok) {
    const errorText = String(result?.error || "Falha ao enviar comando multimédia.");
    showToast(errorText);
  } else if (action.type === "discord_mute_toggle") {
    showToast(result.muted ? "Discord em mute." : "Discord com som.");
  } else if (action.type === "hotkey" && isDiscordMicMuteHotkey(action.value)) {
    const nextMuted = runtime.liveStatus.micMuted === null ? true : !runtime.liveStatus.micMuted;
    showLiveStatusCard({ micMuted: nextMuted });
  } else if (["media_play_pause", "media_prev", "media_next"].includes(action.type)) {
    showMediaControlStatus(action.type);
  }
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.navTarget));
  });

  elements.imageInput.addEventListener("change", onImageSelected);
  elements.importInput.addEventListener("change", onImportJson);

  elements.toggleLayoutBtn.addEventListener("click", () => {
    state.layoutMode = !state.layoutMode;
    if (state.layoutMode) {
      state.calibrationMode = false;
    }
    saveState();
    renderCalibrationUi();
    renderOverlay();
    renderStageStatus();
    renderUiToggles();
  });

  elements.toggleLabelsBtn.addEventListener("click", () => {
    state.labelMode = nextLabelMode(state.labelMode);
    saveState();
    renderOverlay();
    renderStageStatus();
    renderUiToggles();
  });

  elements.calibrateBtn?.addEventListener("click", toggleCalibrationMode);
  elements.calPrevBtn?.addEventListener("click", () => moveCalibrationIndex(-1));
  elements.calNextBtn?.addEventListener("click", () => moveCalibrationIndex(1));
  elements.refreshAppsBtn?.addEventListener("click", () => {
    void refreshOpenApps({ silent: false, force: true });
  });
  elements.appTargetSelect?.addEventListener("change", onAppTargetSelected);
  elements.personalOutputTargetSelect?.addEventListener("change", onPersonalOutputSelected);
  elements.voicePresetSelect?.addEventListener("change", onVoicePresetSelected);
  elements.refreshAudioDevicesBtn?.addEventListener("click", () => {
    void refreshAudioDevices({ silent: false });
  });
  elements.audioSourceSelect?.addEventListener("change", onAudioRoutingSelectionChanged);
  elements.audioTargetSelect?.addEventListener("change", onAudioRoutingSelectionChanged);
  elements.personalVolumeRange?.addEventListener("input", onPersonalVolumeInput);
  elements.routeDiscordPrivateBtn?.addEventListener("click", () => {
    void routeDiscordPrivately();
  });
  elements.clearDiscordPrivateBtn?.addEventListener("click", () => {
    void clearDiscordPrivateRoute();
  });
  elements.setCableDefaultBtn?.addEventListener("click", () => {
    void setCableAsDefaultOutput();
  });
  elements.enableCableListenBtn?.addEventListener("click", () => {
    void setCableListen(true);
  });
  elements.disableCableListenBtn?.addEventListener("click", () => {
    void setCableListen(false);
  });
  elements.startAudioRouterBtn?.addEventListener("click", () => {
    void startAudioRouter();
  });
  elements.stopAudioRouterBtn?.addEventListener("click", () => {
    void stopAudioRouter();
  });
  elements.midiLearnBtn?.addEventListener("click", startMidiLearn);

  elements.addControlBtn.addEventListener("click", addControl);
  elements.resetMappingsBtn.addEventListener("click", resetMappings);
  elements.resetLayoutBtn.addEventListener("click", resetLayout);
  elements.exportBtn.addEventListener("click", exportJson);
  elements.searchInput.addEventListener("input", renderControlList);
  elements.deleteControlBtn.addEventListener("click", deleteSelectedControl);

  const formFields = [
    elements.controlName,
    elements.controlType,
    elements.controlX,
    elements.controlY,
    elements.controlSize,
    elements.actionType,
    elements.actionValue,
    elements.actionNotes,
    elements.midiBinding
  ];

  formFields.forEach((field) => {
    field.addEventListener("input", onFormChange);
    field.addEventListener("change", onFormChange);
  });

  window.addEventListener("pointermove", onGlobalPointerMove);
  window.addEventListener("pointerup", onGlobalPointerUp);
  window.addEventListener("pointercancel", onGlobalPointerUp);
  window.addEventListener("keydown", onKeyDown);
  elements.overlay.addEventListener("pointerdown", onOverlayPointerDown);
}

function renderAll() {
  renderAudioRouter();
  renderStatusOverview();
  renderUiToggles();
  renderCalibrationUi();
  renderOverlay();
  renderStageStatus();
  renderSelectionPanel();
  renderControlList();
  renderJsonPreview();
}

function renderUiToggles() {
  elements.toggleLayoutBtn.textContent = `Modo layout: ${state.layoutMode ? "ON" : "OFF"}`;
  elements.toggleLabelsBtn.textContent = `Etiquetas: ${formatLabelMode(state.labelMode)}`;
  elements.toggleLayoutBtn.style.borderColor = state.layoutMode ? "rgba(40, 199, 164, 0.85)" : "";
}

function nextLabelMode(current) {
  if (current === "auto") return "on";
  if (current === "on") return "off";
  return "auto";
}

function formatLabelMode(mode) {
  if (mode === "on") return "ON";
  if (mode === "off") return "OFF";
  return "Auto";
}

function formatOpenAppOption(appItem) {
  const processName = String(appItem?.processName || "").trim();
  const title = String(appItem?.windowTitle || "").trim();
  if (!processName && !title) return "";
  if (!title) return processName;
  return `${processName} - ${title}`;
}

function renderAppTargetOptions(selectedValue = "") {
  if (!elements.appTargetSelect) return;

  const options = ['<option value="">Seleciona uma app aberta...</option>'];
  for (const appItem of runtime.openApps) {
    const processName = String(appItem.processName || "").trim();
    if (!processName) continue;
    const label = formatOpenAppOption(appItem)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const value = processName
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    options.push(`<option value="${value}">${label}</option>`);
  }
  elements.appTargetSelect.innerHTML = options.join("");
  elements.appTargetSelect.value = runtime.openApps.some((item) => item.processName === selectedValue) ? selectedValue : "";
}

function renderVoicePresetOptions(selectedValue = "") {
  if (!elements.voicePresetSelect) return;

  const current = selectedValue && VOICE_PRESET_OPTIONS.includes(selectedValue)
    ? selectedValue
    : runtime.activeVoicePreset;

  if (!VOICE_PRESET_OPTIONS.includes(current)) {
    elements.voicePresetSelect.value = VOICE_PRESET_OPTIONS[0];
    return;
  }

  elements.voicePresetSelect.value = current;
}

async function refreshOpenApps({ silent = false, force = false } = {}) {
  if (!isDesktopBridgeAvailable()) {
    runtime.openApps = [];
    runtime.openAppsLoaded = false;
    runtime.openAppsError = "Disponivel apenas no EXE desktop.";
    renderActionConfigurator(getSelectedControl());
    return;
  }

  if (runtime.openAppsLoading) return;
  if (runtime.openAppsLoaded && !force) {
    renderActionConfigurator(getSelectedControl());
    return;
  }

  runtime.openAppsLoading = true;
  runtime.openAppsError = "";
  if (elements.refreshAppsBtn) {
    elements.refreshAppsBtn.disabled = true;
    elements.refreshAppsBtn.textContent = "A atualizar...";
  }

  try {
    const result = await window.electronDesktop.listOpenApps();
    if (!result?.ok) {
      runtime.openApps = [];
      runtime.openAppsLoaded = false;
      runtime.openAppsError = String(result?.error || "Falha ao listar apps.");
    } else {
      runtime.openApps = Array.isArray(result.apps) ? result.apps : [];
      runtime.openAppsLoaded = true;
      runtime.openAppsError = "";
      if (!silent) {
        showToast(`Apps abertas: ${runtime.openApps.length}`);
      }
    }
  } catch (error) {
    runtime.openApps = [];
    runtime.openAppsLoaded = false;
    runtime.openAppsError = String(error?.message || error || "Falha ao listar apps.");
    if (!silent) {
      window.alert(`Nao foi possivel listar apps abertas.\n${runtime.openAppsError}`);
    }
  } finally {
    runtime.openAppsLoading = false;
    if (elements.refreshAppsBtn) {
      elements.refreshAppsBtn.disabled = false;
      elements.refreshAppsBtn.textContent = "Atualizar apps";
    }
    renderActionConfigurator(getSelectedControl());
  }
}

function renderActionConfigurator(control) {
  if (!elements.actionType) return;

  const actionType = elements.actionType.value || "none";
  const isAppVolume = actionType === "app_volume";
  const isPersonalVolume = actionType === "personal_volume" || actionType === "personal_volume_relative" || actionType === "personal_volume_up" || actionType === "personal_volume_down";
  const isMediaTransport = actionType === "media_play_pause" || actionType === "media_prev" || actionType === "media_next";
  const isDiscordMute = actionType === "discord_mute_toggle";
  const isVoicePreset = actionType === "voice_preset";
  const hidesGenericValue = isAppVolume || isPersonalVolume || isMediaTransport || isDiscordMute || isVoicePreset;
  const canUseAppVolume = isAppVolumeCapableControl(control);

  if (elements.actionValueRow) {
    elements.actionValueRow.classList.toggle("hidden", hidesGenericValue);
  }
  if (elements.appTargetRow) {
    elements.appTargetRow.classList.toggle("hidden", !isAppVolume);
  }
  if (elements.personalOutputRow) {
    elements.personalOutputRow.classList.toggle("hidden", !isPersonalVolume);
  }
  if (isPersonalVolume) {
    renderPersonalOutputOptions();
  }
  if (elements.voicePresetRow) {
    elements.voicePresetRow.classList.toggle("hidden", !isVoicePreset);
  }
  renderMidiLearnUi(control);
  if (isVoicePreset) {
    renderVoicePresetOptions(control?.action?.value || runtime.activeVoicePreset);
  }

  if (!elements.appTargetHint) return;

  if (!control) {
    elements.appTargetHint.textContent = "";
    return;
  }

  if (!isAppVolume) {
    if (isPersonalVolume) {
      elements.appTargetHint.textContent = actionType === "personal_volume" || actionType === "personal_volume_relative"
        ? `${control.name}: roda/move este controlo para ajustar apenas os seus phones. Use “Detetar knob / fader” para o ligar à mesa.`
        : `${control.name}: esta ação é para botões; altera os seus phones 5% por toque.`;
      return;
    }
    if (isPersonalVolume) {
      const side = control.id === "channel_fader_a" ? "Fader A" : "Fader B";
      elements.appTargetHint.textContent = canUseAppVolume
        ? `${side}: controla apenas o volume dos seus auscultadores. A transmissão mantém-se a 100%.`
        : "Esta função deve ser atribuída ao Fader A ou B.";
    } else if (canUseAppVolume) {
      const side = control.id === "channel_fader_a" ? "Fader A" : "Fader B";
      elements.appTargetHint.textContent = `${side}: escolhe "Windows: Volume de app" para selecionar uma app aberta.`;
    } else if (isMediaTransport) {
      elements.appTargetHint.textContent = "Comando multimédia global do Windows (YouTube/Spotify quando ativos).";
    } else if (isDiscordMute) {
      elements.appTargetHint.textContent = "Alterna o mute da sessão Discord diretamente, sem enviar um atalho ao Discord.";
    } else if (isVoicePreset) {
      elements.appTargetHint.textContent = `Preset de voz ativo: ${runtime.activeVoicePreset}`;
    } else {
      elements.appTargetHint.textContent = "Usa isto no Fader A/B para escolher a app cujo volume queres controlar.";
    }
    return;
  }

  if (!canUseAppVolume) {
    elements.appTargetHint.textContent = "Esta funcao pode ser usada nos faders, Jog A/B e Pitch A/B.";
  } else if (runtime.openAppsError) {
    elements.appTargetHint.textContent = `Falha a listar apps: ${runtime.openAppsError}`;
  } else if (!runtime.openAppsLoaded) {
    elements.appTargetHint.textContent = "A carregar apps abertas...";
  } else if (!runtime.openApps.length) {
    elements.appTargetHint.textContent = "Nao encontrei apps com janela aberta. Abre a app e clica em Atualizar apps.";
  } else {
    if (isRelativeAppVolumeControl(control)) {
      elements.appTargetHint.textContent = `${control.name}: roda para baixar/subir a app em passos pequenos, sem saltar para o limite.`;
    } else {
      const side = control.id === "channel_fader_a" ? "Fader A" : "Fader B";
      elements.appTargetHint.textContent = `${side}: seleciona a app aberta cujo som queres controlar.`;
    }
  }

  renderAppTargetOptions(control.action?.value || "");

  if (!runtime.openAppsLoaded && !runtime.openAppsLoading) {
    void refreshOpenApps({ silent: true });
  }
}

function onAppTargetSelected() {
  const control = getSelectedControl();
  if (!control) return;

  if (elements.actionType.value !== "app_volume") {
    elements.actionType.value = "app_volume";
  }
  const selectedProcess = elements.appTargetSelect?.value || "";
  elements.actionValue.value = selectedProcess;
  onFormChange();
}

function onVoicePresetSelected() {
  const control = getSelectedControl();
  if (!control) return;

  if (elements.actionType.value !== "voice_preset") {
    elements.actionType.value = "voice_preset";
  }
  const preset = elements.voicePresetSelect?.value || "Normal";
  elements.actionValue.value = preset;
  onFormChange();
}

function getCalibrationControls() {
  return state.controls.filter((control) => !control.id.startsWith("custom_"));
}

function clampCalibrationIndex() {
  const list = getCalibrationControls();
  if (!list.length) {
    state.calibrationIndex = 0;
    return;
  }
  state.calibrationIndex = Math.min(list.length - 1, Math.max(0, Number(state.calibrationIndex) || 0));
}

function getCalibrationTarget() {
  const list = getCalibrationControls();
  if (!list.length) return null;
  clampCalibrationIndex();
  return list[state.calibrationIndex] || null;
}

function syncCalibrationIndexToSelected() {
  const list = getCalibrationControls();
  const idx = list.findIndex((control) => control.id === state.selectedId);
  if (idx >= 0) {
    state.calibrationIndex = idx;
  }
}

function toggleCalibrationMode() {
  state.calibrationMode = !state.calibrationMode;
  if (state.calibrationMode) {
    state.layoutMode = false;
    if (!state.selectedId) {
      state.selectedId = getCalibrationControls()[0]?.id || null;
    }
    syncCalibrationIndexToSelected();
    const target = getCalibrationTarget();
    if (target) state.selectedId = target.id;
    showToast("Calibracao exata ativa: clica no botao real da imagem.");
  } else {
    showToast("Calibracao exata desativada.");
  }
  saveState();
  renderAll();
}

function moveCalibrationIndex(delta) {
  const list = getCalibrationControls();
  if (!list.length) return;
  clampCalibrationIndex();
  state.calibrationIndex = Math.min(list.length - 1, Math.max(0, state.calibrationIndex + delta));
  const target = getCalibrationTarget();
  if (target) {
    state.selectedId = target.id;
  }
  saveState();
  renderAll();
}

function placeSelectedControlAtPointer(event, autoAdvance = false) {
  const control = getSelectedControl();
  if (!control) return;
  const rect = elements.overlay.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  control.x = clampNumber(x, 0, 100, control.x);
  control.y = clampNumber(y, 0, 100, control.y);

  saveState();
  renderOverlay();
  renderStageStatus();
  renderSelectionPanel();
  renderControlList();
  renderJsonPreview();

  if (autoAdvance) {
    moveCalibrationIndex(1);
  }
}

function onOverlayPointerDown(event) {
  if (!state.calibrationMode) return;
  if (dragState) return;

  event.preventDefault();
  event.stopPropagation();

  const target = getCalibrationTarget();
  if (target && state.selectedId !== target.id) {
    state.selectedId = target.id;
  }

  placeSelectedControlAtPointer(event, true);
}

function renderCalibrationUi() {
  const target = getCalibrationTarget();
  const list = getCalibrationControls();
  const total = list.length;
  const index = Math.min(total, (state.calibrationIndex || 0) + 1);

  if (elements.calibrateBtn) {
    elements.calibrateBtn.textContent = `Calibracao exata: ${state.calibrationMode ? "ON" : "OFF"}`;
    elements.calibrateBtn.classList.toggle("active-mode", state.calibrationMode);
  }
  if (elements.calPrevBtn) {
    elements.calPrevBtn.disabled = !state.calibrationMode || !total || state.calibrationIndex <= 0;
  }
  if (elements.calNextBtn) {
    elements.calNextBtn.disabled = !state.calibrationMode || !total || state.calibrationIndex >= total - 1;
    elements.calNextBtn.textContent = state.calibrationMode ? `Seguinte (${index}/${Math.max(total, 1)})` : "Seguinte";
  }
  if (elements.calPrevBtn && state.calibrationMode) {
    elements.calPrevBtn.textContent = `Anterior (${index}/${Math.max(total, 1)})`;
  } else if (elements.calPrevBtn) {
    elements.calPrevBtn.textContent = "Anterior";
  }
}

function renderOverlay() {
  elements.overlay.dataset.hasPhoto = String(isPhotoLoaded());
  elements.overlay.dataset.layoutMode = String(state.layoutMode);
  elements.overlay.classList.toggle("calibrating", state.calibrationMode);
  const calibrationTarget = state.calibrationMode ? getCalibrationTarget() : null;
  elements.overlay.innerHTML = "";
  for (const control of state.controls) {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "hotspot";
    hotspot.dataset.id = control.id;
    hotspot.dataset.type = control.type;
    hotspot.dataset.assigned = String(control.action?.type && control.action.type !== "none");
    hotspot.dataset.labelMode = state.labelMode;
    hotspot.dataset.layoutMode = String(state.layoutMode);
    const visual = getControlVisual(control);
    hotspot.dataset.shape = visual.shape;
    if (control.id === state.selectedId) {
      hotspot.classList.add("selected");
    }
    if (calibrationTarget?.id === control.id) {
      hotspot.classList.add("calibration-target");
    } else if (state.calibrationMode) {
      hotspot.classList.add("calibration-dim");
    }

    const dimensions = hotspotDimensions(control, visual);
    hotspot.style.left = `${control.x}%`;
    hotspot.style.top = `${control.y}%`;
    hotspot.style.width = `${dimensions.width}%`;
    hotspot.style.height = `${dimensions.height}%`;
    hotspot.style.transform = "translate(-50%, -50%)";

    if (control.type !== "jog") {
      hotspot.textContent = "";
    }

    const label = document.createElement("span");
    label.className = "hotspot-label";
    label.textContent = control.name;
    hotspot.appendChild(label);

    hotspot.addEventListener("click", (event) => {
      if (state.calibrationMode && calibrationTarget && calibrationTarget.id !== control.id) {
        event.preventDefault();
        return;
      }
      selectControl(control.id);
    });
    hotspot.addEventListener("pointerdown", (event) => onHotspotPointerDown(event, control.id));

    elements.overlay.appendChild(hotspot);
  }
}

function hotspotDimensions(control, visual) {
  if (visual?.width && visual?.height) {
    return { width: visual.width, height: visual.height };
  }
  const base = clampNumber(control.size, 1, 12, 3);
  if (control.type === "fader") {
    return { width: base * 0.85, height: base * 2.2 };
  }
  if (control.type === "jog") {
    return { width: base, height: base };
  }
  return { width: base, height: base };
}

function getControlVisual(control) {
  const base = clampNumber(control.size, 1, 12, 3);
  const id = control.id;

  if (control.w || control.h || control.shape) {
    return {
      shape: control.shape || "rect",
      width: clampNumber(control.w, 0.5, 100, base),
      height: clampNumber(control.h, 0.5, 100, base)
    };
  }

  if (control.type === "jog" || /^jog_/.test(id)) {
    return { shape: "jog", width: base, height: base };
  }

  if (/^channel_fader_/.test(id)) {
    return { shape: "slider-v", width: Math.max(1.9, base * 0.52), height: Math.max(8.4, base * 1.55) };
  }

  if (id === "crossfader") {
    return { shape: "slider-h", width: Math.max(9.2, base * 1.15), height: 2.0 };
  }

  if (control.type === "fader") {
    return { shape: "slider-v", width: Math.max(1.8, base * 0.55), height: Math.max(7.8, base * 1.5) };
  }

  if (control.type === "knob" || /^pitch_/.test(id) || /^eq_/.test(id)) {
    return { shape: "knob", width: base, height: base };
  }

  if (/^(cue|play)_[ab]$/.test(id)) {
    return { shape: "rect", width: Math.max(4.0, base * 1.5), height: Math.max(2.4, base * 0.88) };
  }

  if (/^load_[ab]$/.test(id)) {
    return { shape: "rect", width: Math.max(4.3, base * 1.7), height: Math.max(1.9, base * 0.75) };
  }

  if (/^(pitchbend_minus|pitchbend_plus)_[ab]$/.test(id)) {
    return { shape: "rect", width: Math.max(3.1, base * 1.75), height: 1.45 };
  }

  if (/^(prev|next)_[ab]$/.test(id)) {
    return { shape: "rect", width: Math.max(3.0, base * 1.35), height: 1.8 };
  }

  if (/^(sync|shift)_[ab]$/.test(id)) {
    return { shape: "rect", width: Math.max(3.2, base * 1.45), height: 1.75 };
  }

  if (/^fx[1-6]_[ab]$/.test(id)) {
    return { shape: "rect", width: 2.5, height: 1.65 };
  }

  if (/^(scratch|automix|browse_up|browse_down)$/.test(id)) {
    return { shape: "rect", width: 3.5, height: 1.8 };
  }

  if (control.type === "button") {
    return { shape: "rect", width: Math.max(2.6, base * 1.15), height: Math.max(1.8, base * 0.75) };
  }

  return { shape: "circle", width: base, height: base };
}

function selectControl(id) {
  state.selectedId = id;
  syncCalibrationIndexToSelected();
  saveState();
  renderCalibrationUi();
  renderOverlay();
  renderStageStatus();
  renderSelectionPanel();
  renderControlList();
  renderJsonPreview();
}

function getSelectedControl() {
  return state.controls.find((control) => control.id === state.selectedId) || null;
}

function renderSelectionPanel() {
  const control = getSelectedControl();
  const hasSelection = Boolean(control);
  elements.emptySelection.classList.toggle("hidden", hasSelection);
  elements.controlForm.classList.toggle("hidden", !hasSelection);

  if (!control) {
    renderActionConfigurator(null);
    return;
  }

  elements.controlId.value = control.id;
  elements.controlName.value = control.name;
  elements.controlType.value = control.type;
  elements.controlX.value = control.x.toFixed(1);
  elements.controlY.value = control.y.toFixed(1);
  elements.controlSize.value = String(clampNumber(control.size, 1, 12, 3));
  elements.controlSizeValue.textContent = `${Number(control.size).toFixed(1)}%`;
  elements.actionType.value = control.action?.type || "none";
  elements.actionValue.value = control.action?.value || "";
  elements.actionNotes.value = control.action?.notes || "";
  elements.midiBinding.value = control.action?.midi || "";
  renderActionConfigurator(control);
}

function onFormChange() {
  const control = getSelectedControl();
  if (!control) return;

  control.name = elements.controlName.value.trim() || control.name;
  control.type = elements.controlType.value;
  control.x = clampNumber(elements.controlX.value, 0, 100, control.x);
  control.y = clampNumber(elements.controlY.value, 0, 100, control.y);
  control.size = clampNumber(elements.controlSize.value, 1, 12, control.size);
  const actionType = elements.actionType.value;
  let actionValue = elements.actionValue.value.trim();
  if (actionType === "voice_preset") {
    actionValue = (elements.voicePresetSelect?.value || "Normal").trim();
    elements.actionValue.value = actionValue;
  }
  control.action = {
    type: actionType,
    value: actionValue,
    notes: elements.actionNotes.value.trim(),
    midi: elements.midiBinding.value.trim()
  };

  elements.controlSizeValue.textContent = `${Number(control.size).toFixed(1)}%`;

  saveState();
  renderActionConfigurator(control);
  renderOverlay();
  renderStageStatus();
  renderControlList();
  renderJsonPreview();
}

function renderControlList() {
  const filter = elements.searchInput.value.trim().toLowerCase();
  elements.controlList.innerHTML = "";

  const controls = state.controls.filter((control) => {
    if (!filter) return true;
    const haystack = `${control.name} ${control.id} ${control.action?.type || ""} ${control.action?.value || ""}`.toLowerCase();
    return haystack.includes(filter);
  });

  for (const control of controls) {
    const item = elements.controlItemTemplate.content.firstElementChild.cloneNode(true);
    item.dataset.id = control.id;
    item.classList.toggle("active", control.id === state.selectedId);
    item.classList.toggle("assigned", control.action?.type && control.action.type !== "none");

    item.querySelector(".control-item-name").textContent = control.name;
    item.querySelector(".control-item-meta").textContent = formatControlMeta(control);

    item.addEventListener("click", () => selectControl(control.id));
    elements.controlList.appendChild(item);
  }
}

function formatControlMeta(control) {
  const assigned = control.action?.type && control.action.type !== "none"
    ? `${control.action.type}${control.action.value ? `: ${control.action.value}` : ""}`
    : "sem função";
  return `${control.type} • ${assigned}`;
}

function renderJsonPreview() {
  const payload = {
    device: "Hercules DJ Control MP3 e2",
    layoutMode: state.layoutMode,
    labelMode: state.labelMode,
    photoMeta: state.photoMeta,
    controls: state.controls
  };
  elements.jsonPreview.textContent = JSON.stringify(payload, null, 2);
}

function renderStageStatus() {
  if (!elements.stageStatus) return;
  const total = state.controls.length;
  const assigned = state.controls.filter((control) => control.action?.type && control.action.type !== "none").length;
  const selected = getSelectedControl();
  const photoText = isPhotoLoaded() ? "Foto carregada" : "Sem foto";
  const selectedText = selected ? ` | Selecionado: ${selected.name}` : "";
  const midiControl = state.controls.find((control) => control.id === runtime.lastMidiControlId);
  const midiActivityText = midiControl ? ` | MIDI: ${midiControl.name}` : "";
  const voicePresetText = runtime.activeVoicePreset ? ` | Voz: ${runtime.activeVoicePreset}` : "";
  let calibrationText = "";
  if (state.calibrationMode) {
    const list = getCalibrationControls();
    const target = getCalibrationTarget();
    if (target) {
      calibrationText = ` | Calibracao ${state.calibrationIndex + 1}/${list.length}: clica em ${target.name}`;
    }
  }
  elements.stageStatus.textContent = `${photoText} | ${total} controlos | ${assigned} mapeados${selectedText}${midiActivityText}${voicePresetText}${calibrationText}`;
}

function addControl() {
  const stamp = Date.now().toString(36).slice(-6);
  const next = {
    id: `custom_${stamp}`,
    name: "Novo controlo",
    type: "button",
    x: 50,
    y: 50,
    size: 3,
    action: defaultAction()
  };
  state.controls.push(next);
  state.selectedId = next.id;
  saveState();
  renderAll();
}

function deleteSelectedControl() {
  const selected = getSelectedControl();
  if (!selected) return;
  const confirmed = window.confirm(`Apagar "${selected.name}"?`);
  if (!confirmed) return;

  state.controls = state.controls.filter((control) => control.id !== selected.id);
  state.selectedId = state.controls[0]?.id || null;
  saveState();
  renderAll();
}

function resetMappings() {
  const confirmed = window.confirm("Limpar todas as funções atribuídas?");
  if (!confirmed) return;
  for (const control of state.controls) {
    control.action = defaultAction();
  }
  saveState();
  renderAll();
  showToast("Funções limpas.");
}

function resetLayout() {
  const confirmed = window.confirm("Resetar layout para o preset inicial da MP3 e2?");
  if (!confirmed) return;

  const existingActions = new Map(state.controls.map((control) => [control.id, control.action || defaultAction()]));
  const presetIds = new Set(MIXXX_SCHEMA_CONTROLS.map((control) => control.id));
  const legacySchemaIds = new Set(LEGACY_MIXXX_SCHEMA_CONTROLS.map((control) => control.id));
  const legacyDefaultIds = new Set(DEFAULT_CONTROLS.map((control) => control.id));
  const customControls = state.controls.filter(
    (control) => !presetIds.has(control.id) && !legacySchemaIds.has(control.id) && !legacyDefaultIds.has(control.id)
  );

  state.controls = MIXXX_SCHEMA_CONTROLS.map((control) => ({
    ...control,
    action: existingActions.get(control.id) || defaultAction()
  }));
  state.controls.push(...customControls);

  if (!state.controls.some((control) => control.id === state.selectedId)) {
    state.selectedId = state.controls[0]?.id || null;
  }

  saveState();
  renderAll();
  showToast("Layout reposto.");
}

function onHotspotPointerDown(event, controlId) {
  if (!state.layoutMode) return;
  const target = event.currentTarget;
  event.preventDefault();
  selectControl(controlId);
  dragState = {
    controlId,
    pointerId: event.pointerId
  };
  target.classList.add("dragging");
  target.setPointerCapture?.(event.pointerId);
}

function onGlobalPointerMove(event) {
  if (!dragState) return;
  const control = state.controls.find((item) => item.id === dragState.controlId);
  if (!control) return;

  const rect = elements.overlay.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  control.x = clampNumber(x, 0, 100, control.x);
  control.y = clampNumber(y, 0, 100, control.y);

  saveState();
  renderOverlay();
  renderStageStatus();
  renderSelectionPanel();
  renderControlList();
  renderJsonPreview();
}

function onGlobalPointerUp(event) {
  if (!dragState) return;
  if (dragState.pointerId !== undefined && event.pointerId !== undefined && dragState.pointerId !== event.pointerId) {
    return;
  }
  dragState = null;
  renderOverlay();
  renderStageStatus();
}

function onKeyDown(event) {
  const control = getSelectedControl();
  if (!control || !state.layoutMode) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

  let changed = false;
  const step = event.shiftKey ? 1 : 0.25;
  if (event.key === "ArrowLeft") {
    control.x = clampNumber(control.x - step, 0, 100, control.x);
    changed = true;
  }
  if (event.key === "ArrowRight") {
    control.x = clampNumber(control.x + step, 0, 100, control.x);
    changed = true;
  }
  if (event.key === "ArrowUp") {
    control.y = clampNumber(control.y - step, 0, 100, control.y);
    changed = true;
  }
  if (event.key === "ArrowDown") {
    control.y = clampNumber(control.y + step, 0, 100, control.y);
    changed = true;
  }
  if (event.key === "[") {
    control.size = clampNumber(control.size - 0.2, 1, 12, control.size);
    changed = true;
  }
  if (event.key === "]") {
    control.size = clampNumber(control.size + 0.2, 1, 12, control.size);
    changed = true;
  }

  if (changed) {
    event.preventDefault();
    saveState();
    renderOverlay();
    renderStageStatus();
    renderSelectionPanel();
    renderControlList();
    renderJsonPreview();
  }
}

function onImageSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const src = typeof reader.result === "string" ? reader.result : "";
    elements.controllerImage.src = src;
    elements.controllerImage.style.display = "block";
    elements.placeholder.style.display = "none";
    renderOverlay();
    renderStageStatus();
  };
  reader.readAsDataURL(file);

  const tempImage = new Image();
  tempImage.onload = () => {
    state.photoMeta = {
      name: file.name,
      width: tempImage.naturalWidth,
      height: tempImage.naturalHeight,
      updatedAt: new Date().toISOString()
    };
    elements.stageWrapper.style.aspectRatio = `${tempImage.naturalWidth} / ${tempImage.naturalHeight}`;
    saveState();
    renderJsonPreview();
    renderStageStatus();
  };
  tempImage.src = URL.createObjectURL(file);
  tempImage.onloadend = () => URL.revokeObjectURL(tempImage.src);
}

function applyDefaultImageIfNeeded() {
  elements.controllerImage.src = DEFAULT_BACKGROUND_IMAGE;
  elements.controllerImage.style.display = "block";
  elements.placeholder.style.display = "none";

  const img = new Image();
  img.onload = () => {
    state.photoMeta = {
      ...(state.photoMeta || {}),
      name: "hercules_mappa.png",
      width: img.naturalWidth,
      height: img.naturalHeight,
      updatedAt: new Date().toISOString(),
      builtIn: true,
      alignmentVersion: TOPDOWN_ALIGNMENT_VERSION
    };
    elements.stageWrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    saveState();
    renderJsonPreview();
    renderStageStatus();
  };
  img.src = DEFAULT_BACKGROUND_IMAGE;
}

function applyPhotoMeta() {
  if (state.photoMeta?.width && state.photoMeta?.height) {
    elements.stageWrapper.style.aspectRatio = `${state.photoMeta.width} / ${state.photoMeta.height}`;
  }
}

function isPhotoLoaded() {
  return Boolean(elements.controllerImage && elements.controllerImage.getAttribute("src"));
}

function exportJson() {
  const payload = {
    device: "Hercules DJ Control MP3 e2",
    exportedAt: new Date().toISOString(),
    photoMeta: state.photoMeta,
    audioRouting: state.audioRouting,
    controls: state.controls
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hercules-mp3e2-map.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("JSON exportado.");
}

function onImportJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!Array.isArray(parsed.controls)) {
        throw new Error("Ficheiro sem array controls");
      }

      state.controls = parsed.controls.map(normalizeControl);
      state.photoMeta = parsed.photoMeta || state.photoMeta || null;
      state.audioRouting = normalizeAudioRouting(parsed.audioRouting || state.audioRouting);
      state.selectedId = state.controls[0]?.id || null;
      applyPhotoMeta();
      saveState();
      renderAll();
      renderStageStatus();
      showToast("JSON importado.");
    } catch (error) {
      console.error(error);
      window.alert("JSON inválido.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function saveState() {
  const payload = {
    controls: state.controls,
    selectedId: state.selectedId,
    layoutMode: state.layoutMode,
    labelMode: state.labelMode,
    calibrationMode: state.calibrationMode,
    calibrationIndex: state.calibrationIndex,
    showLabels: state.labelMode !== "off",
    photoMeta: state.photoMeta,
    audioRouting: state.audioRouting
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}
