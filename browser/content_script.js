window.addEventListener("message", async (event) => {
  const { type, executeScriptId, script } = event.data;
  if (!executeScriptId) return;
  const result = await eval(script);
  window.parent.postMessage({executeScriptReturnId: executeScriptId, result}, "*");
});
