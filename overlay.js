const elements = {
  card: document.getElementById("statusCard"),
  lockButton: document.getElementById("lockButton"),
  discordValue: document.getElementById("overlayDiscordValue"),
  discordFill: document.getElementById("overlayDiscordFill"),
  phonesValue: document.getElementById("overlayPhonesValue"),
  phonesFill: document.getElementById("overlayPhonesFill"),
  micValue: document.getElementById("overlayMicValue"),
  trackLabel: document.getElementById("overlayTrackLabel"),
  trackTitle: document.getElementById("overlayTrackTitle"),
  trackDetail: document.getElementById("overlayTrackDetail")
};

function setPercent(valueElement, fillElement, percent) {
  const hasValue = Number.isFinite(Number(percent));
  const value = hasValue ? Math.max(0, Math.min(100, Math.round(Number(percent)))) : 0;
  valueElement.textContent = hasValue ? `${value}%` : "--%";
  fillElement.style.width = `${value}%`;
}

function render(state = {}) {
  setPercent(elements.discordValue, elements.discordFill, state.discordPercent);
  setPercent(elements.phonesValue, elements.phonesFill, state.phonesPercent);

  const micMuted = state.micMuted === true;
  const micLive = state.micMuted === false;
  elements.micValue.textContent = micMuted ? "MUTE" : (micLive ? "LIVE" : "---");
  elements.card.classList.toggle("is-mic-muted", micMuted);
  elements.card.classList.toggle("is-mic-live", micLive);
  elements.card.classList.toggle("is-locked", Boolean(state.locked));

  elements.lockButton.textContent = state.locked ? "🔒" : "🔓";
  elements.lockButton.title = state.locked ? "Desbloquear posição" : "Bloquear posição";
  elements.lockButton.setAttribute("aria-label", elements.lockButton.title);
  elements.trackLabel.textContent = state.trackLabel || "Media";
  elements.trackTitle.textContent = state.trackTitle || "Nenhuma música detetada";
  elements.trackDetail.textContent = state.trackDetail || "Usa Play/Next na Hercules";
}

elements.lockButton.addEventListener("click", () => window.statusOverlay.toggleLock());
window.statusOverlay.onState(render);
