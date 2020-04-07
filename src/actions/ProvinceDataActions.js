import axios from 'axios';
import { ON_PROVINCES_READ } from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onProvincesIdRead = () => onProvincesRead('id');

export const onProvincesNameRead = () => onProvincesRead('name');

const onProvincesRead = prop => dispatch => {
  axios.get(`${backendUrl}/api/provinces/${prop}`)
    .then(response => dispatch({ type: ON_PROVINCES_READ, payload: response.data }))
    .catch(error => console.error(error));
};
