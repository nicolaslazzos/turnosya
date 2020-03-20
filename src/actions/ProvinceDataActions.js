import axios from 'axios';
import { ON_PROVINCES_READ } from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onProvincesIdRead = () => onProvincesRead('id');

export const onProvincesNameRead = () => onProvincesRead('name');

const onProvincesRead = prop => {
  return dispatch => {
    axios.get(`${backendUrl}/api/provinces/`)
      .then(response => {
        const provincesList = [];

        response.data.forEach(province => {
          if (prop === 'id') {
            provincesList.push({ value: province.pk.toString(), label: province.name })
          } else {
            provincesList.push({ value: province[prop], label: province.name })
          }
        });

        dispatch({ type: ON_PROVINCES_READ, payload: provincesList });
      })
      .catch(error => console.error(error))
  };
};
