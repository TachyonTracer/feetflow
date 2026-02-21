import { environment } from '../../../environments/environment';

export const API = {
  get users() {
    return environment.api.users;
  },
  get auth() {
    return environment.api.auth;
  },
};
