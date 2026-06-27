const noOp = async () => {
  throw new Error('Base44 is no longer available. Migrate this logic to Firebase or your new API.');
};
const noOpSync = () => {
  throw new Error('Base44 is no longer available. Migrate this logic to Firebase or your new API.');
};
const entityProxy = new Proxy({}, {
  get: () => () => noOp(),
});

export const base44 = {
  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    logout: async () => {},
    redirectToLogin: () => { window.location.href = '/welcome'; },
  },
  functions: {
    invoke: noOp,
  },
  entities: entityProxy,
  integrations: entityProxy,
};
