import { AppConfigService } from '../../services/app-config.service';

export const API = {
  get users() {
    return {
      getAll: AppConfigService.staticAppConfig?.api.UsersController.getAll.apiPath || '/api/users',
      getById:
        AppConfigService.staticAppConfig?.api.UsersController.getById.apiPath || '/api/users/{id}',
      create: AppConfigService.staticAppConfig?.api.UsersController.create.apiPath || '/api/users',
      update:
        AppConfigService.staticAppConfig?.api.UsersController.update.apiPath || '/api/users/{id}',
      delete:
        AppConfigService.staticAppConfig?.api.UsersController.delete.apiPath || '/api/users/{id}',
    };
  },
  get auth() {
    return {
      login: AppConfigService.staticAppConfig?.api.AuthController.login.apiPath || '/api/login',
      getAccessToken:
        AppConfigService.staticAppConfig?.api.AuthController.getAccessToken.apiPath ||
        '/api/get_access_token',
      resetPassword:
        AppConfigService.staticAppConfig?.api.AuthController.resetPassword.apiPath ||
        '/api/custom/public/accounts/reset_password',
    };
  },
};
