import { AppConfigService } from '../../services/app-config.service';

export const API = {
  get users() {
    return {
      getAll: AppConfigService.staticAppConfig?.api.UsersController.getAll.apiPath,
      getById: AppConfigService.staticAppConfig?.api.UsersController.getById.apiPath,
      create: AppConfigService.staticAppConfig?.api.UsersController.create.apiPath,
      update: AppConfigService.staticAppConfig?.api.UsersController.update.apiPath,
      delete: AppConfigService.staticAppConfig?.api.UsersController.delete.apiPath,
    };
  },
  get auth() {
    return {
      login: AppConfigService.staticAppConfig?.api.AuthController.login.apiPath,
      signup: AppConfigService.staticAppConfig?.api.AuthController.signup.apiPath,
      getAccessToken: AppConfigService.staticAppConfig?.api.AuthController.getAccessToken.apiPath,
      resetPassword: AppConfigService.staticAppConfig?.api.AuthController.resetPassword.apiPath,
    };
  },
};
