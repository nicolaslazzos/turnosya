import axios from 'axios';
import { ON_ROLES_READ } from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onRolesRead = () => dispatch => {
  axios.get(`${backendUrl}/api/employees/roles/id/`).then(response => dispatch({ type: ON_ROLES_READ, payload: response.data })).catch(error => console.error(errror));
};
