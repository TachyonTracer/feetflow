export const environment = {
  production: false,
  siteName: 'FleetFlow',
  siteVersion: '0.0.0',
  defaultErrorTitle: 'Encountered Error!',
  defaultErrorMessage: 'Something went wrong! Please try again later',
  refreshTokenIntervalInMinutes: 5,
  privateKey: 'efr$#@)#E%*',
  apiBasePath: 'http://localhost:5180',
  api: {
    auth: {
      login: '/api/auth/login',
      signup: '/api/auth/signup',
      getAccessToken: '/api/get_access_token',
      resetPassword: '/api/custom/public/accounts/reset_password',
    },
    users: {
      getAll: '/api/users',
      getById: '/api/users',
      create: '/api/users',
      update: '/api/users',
      delete: '/api/users',
    },
  },
};
