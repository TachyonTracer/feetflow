export const environment = {
  production: true,
  siteName: 'FleetFlow',
  siteVersion: '0.0.0',
  defaultErrorTitle: 'Encountered Error!',
  defaultErrorMessage: 'Something went wrong! Please try again later',
  refreshTokenIntervalInMinutes: 5,
  privateKey: 'efr$#@)#E%*',
  apiBasePath: '', // relative path — nginx proxies /api to the backend
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
