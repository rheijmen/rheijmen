/**
 * Jest setup – mock alle native React Native modules.
 *
 * Bij TDD willen we de pure business-logica testen zonder
 * afhankelijk te zijn van het daadwerkelijke apparaat.
 */

// ---- React Native core mock ----
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn() },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  NativeModules: {
    BleManager: {},
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
    request: jest.fn().mockResolvedValue('granted'),
  },
  Alert: { alert: jest.fn() },
  Share: { share: jest.fn() },
}));

// ---- AsyncStorage mock ----
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

// ---- BLE Manager mock ----
jest.mock('react-native-ble-manager', () => ({
  start: jest.fn().mockResolvedValue(undefined),
  scan: jest.fn().mockResolvedValue(undefined),
  getDiscoveredPeripherals: jest.fn().mockResolvedValue([]),
  getBondedPeripherals: jest.fn().mockResolvedValue([]),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
}));

// ---- Geolocation mock ----
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn().mockReturnValue(1),
  clearWatch: jest.fn(),
}));

// ---- Firebase mock ----
jest.mock('@react-native-firebase/firestore', () => {
  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  return () => ({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  });
});

jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: { uid: 'test-user-123' },
    signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: 'test-user-123' } }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  });
});

// ---- TTS mock ----
jest.mock('react-native-tts', () => ({
  setDefaultLanguage: jest.fn().mockResolvedValue(undefined),
  setDefaultRate: jest.fn().mockResolvedValue(undefined),
  setDefaultPitch: jest.fn().mockResolvedValue(undefined),
  speak: jest.fn(),
  stop: jest.fn(),
}));

// ---- Push Notification mock ----
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  createChannel: jest.fn(),
  localNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}));

// ---- File System mock ----
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// ---- XLSX mock ----
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn().mockReturnValue({}),
    book_new: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
    encode_cell: jest.fn(({ r, c }: { r: number; c: number }) => `${String.fromCharCode(65 + c)}${r + 1}`),
  },
  write: jest.fn().mockReturnValue('base64data'),
}));

// ---- HTML to PDF mock ----
jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn().mockResolvedValue({ filePath: '/mock/documents/export.pdf' }),
}));

// ---- UUID mock (deterministic voor tests) ----
jest.mock('uuid', () => ({
  v4: jest.fn(() => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`),
}));
