let emitter = null;

export const setSocketEmitter = (emitFn) => {
  emitter = emitFn;
};

export const emitToGroup = (groupId, event, data) => {
  if (emitter) emitter(groupId, event, data);
};
