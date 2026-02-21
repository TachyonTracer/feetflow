export const environment = {
  production: true,
  siteName: 'FleetFlow',
  siteVersion: '0.0.0',
  defaultErrorTitle: 'Encountered Error!',
  defaultErrorMessage: 'Something went wrong! Please try again later',
  refreshTokenIntervalInMinutes: 5,
  privateKey: 'efr$#@)#E%*',
  apiBasePath: '',
  api: {
    auth: {
      login: '/api/Auth/login',
      signup: '/api/Auth/signup',
      refresh: '/api/Auth/refresh',
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
    vehicles: {
      base: '/api/Vehicles',
    },
    trips: {
      base: '/api/Trips',
    },
    drivers: {
      base: '/api/Drivers',
    },
    maintenance: {
      base: '/api/maintenance',
    },
    fuel: {
      base: '/api/fuel',
    },
    analytics: {
      base: '/api/analytics',
      dashboard: '/api/analytics/dashboard',
    },
  },
};
