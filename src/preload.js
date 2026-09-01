const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("boocordApi", {
  getLauncherState: (options) => ipcRenderer.invoke("launcher:get-state", options),
  getModdingState: () => ipcRenderer.invoke("launcher:get-modding-state"),
  getLauncherWindowState: () => ipcRenderer.invoke("launcher:window-state"),
  minimizeLauncherWindow: () => ipcRenderer.invoke("launcher:window-minimize"),
  toggleLauncherMaximize: () => ipcRenderer.invoke("launcher:window-toggle-maximize"),
  beginLauncherWindowDrag: (payload) => ipcRenderer.invoke("launcher:window-begin-drag", payload),
  updateLauncherWindowDrag: () => ipcRenderer.invoke("launcher:window-update-drag"),
  endLauncherWindowDrag: () => ipcRenderer.invoke("launcher:window-end-drag"),
  closeLauncherWindow: () => ipcRenderer.invoke("launcher:window-close"),
  pickLauncherBackgroundImage: () => ipcRenderer.invoke("launcher:pick-background-image"),
  removeLauncherBackgroundImage: () => ipcRenderer.invoke("launcher:remove-background-image"),
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  selectProfileImportSource: () => ipcRenderer.invoke("dialog:select-profile-import-source"),
  selectProfileIcon: () => ipcRenderer.invoke("dialog:select-profile-icon"),
  selectLocalProjects: (payload) => ipcRenderer.invoke("dialog:select-local-projects", payload),
  getProfileImportSources: () => ipcRenderer.invoke("profiles:get-import-sources"),
  login: (options) => ipcRenderer.invoke("launcher:login", options),
  switchAccount: (options) => ipcRenderer.invoke("launcher:switch-account", options),
  logout: (options) => ipcRenderer.invoke("launcher:logout", options),
  saveSettings: (options) => ipcRenderer.invoke("launcher:save-settings", options),
  installRuntime: (options) => ipcRenderer.invoke("launcher:install", options),
  reinstallJavaRuntime: (options) => ipcRenderer.invoke("launcher:reinstall-java", options),
  launchClient: (options) => ipcRenderer.invoke("launcher:launch", options),
  stopClient: () => ipcRenderer.invoke("launcher:stop"),
  searchProjects: (payload) => ipcRenderer.invoke("modding:search", payload),
  getProjectDetails: (payload) => ipcRenderer.invoke("modding:details", payload),
  addProject: (payload) => ipcRenderer.invoke("modding:add-project", payload),
  removeProject: (payload) => ipcRenderer.invoke("modding:remove-project", payload),
  removeLocalProject: (payload) => ipcRenderer.invoke("modding:remove-local-project", payload),
  importLocalProjects: (payload) => ipcRenderer.invoke("modding:import-local-projects", payload),
  getServerStatus: () => ipcRenderer.invoke("server:get-status"),
  createProfile: (payload) => ipcRenderer.invoke("profiles:create", payload),
  renameProfile: (payload) => ipcRenderer.invoke("profiles:rename", payload),
  setProfileIcon: (payload) => ipcRenderer.invoke("profiles:set-icon", payload),
  importProfile: (payload) => ipcRenderer.invoke("profiles:import", payload),
  deleteProfile: (payload) => ipcRenderer.invoke("profiles:delete", payload),
  switchProfile: (payload) => ipcRenderer.invoke("profiles:switch", payload),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath),
  copyText: (value) => ipcRenderer.invoke("clipboard:write-text", String(value ?? "")),
  onLauncherEvent: (listener) => {
    const wrappedListener = (_event, payload) => listener(payload);
    ipcRenderer.on("launcher:event", wrappedListener);

    return () => {
      ipcRenderer.removeListener("launcher:event", wrappedListener);
    };
  },
  onLauncherWindowState: (listener) => {
    const wrappedListener = (_event, payload) => listener(payload);
    ipcRenderer.on("launcher:window-state", wrappedListener);

    return () => {
      ipcRenderer.removeListener("launcher:window-state", wrappedListener);
    };
  }
});
