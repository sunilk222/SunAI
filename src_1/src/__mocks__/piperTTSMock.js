const mockSession = {
  predict: jest.fn().mockResolvedValue(new Blob(["fake-audio"], { type: "audio/wav" })),
  ready: true,
  waitReady: Promise.resolve(),
};

module.exports = {
  TtsSession: {
    create: jest.fn().mockResolvedValue(mockSession),
    WASM_LOCATIONS: {},
    _instance: null,
  },
  predict: jest.fn().mockResolvedValue(new Blob(["fake"], { type: "audio/wav" })),
  voices: jest.fn().mockResolvedValue({}),
  stored: jest.fn().mockResolvedValue([]),
  download: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  flush: jest.fn().mockResolvedValue(undefined),
};
