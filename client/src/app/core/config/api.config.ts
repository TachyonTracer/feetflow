import { environment } from '../../../environments/environment';

export const API = {
  get users() {
    return environment.api.users;
  },
  get auth() {
    return environment.api.auth;
  },
  get vehicles() {
    return environment.api.vehicles;
  },
  get trips() {
    return environment.api.trips;
  },
  get drivers() {
    return environment.api.drivers;
  },
  get maintenance() {
    return environment.api.maintenance;
  },
  get analytics() {
    return environment.api.analytics;
  },
};
