import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { localDate } from '../utils';
import {
  ON_SERVICE_VALUE_CHANGE,
  ON_FORM_OPEN,
  ON_SERVICE_CREATE,
  ON_SERVICES_READING,
  ON_SERVICES_READ,
  ON_SERVICE_FORM_SUBMIT,
  ON_SERVICE_DELETE,
  ON_SERVICE_UPDATE,
  ON_SERVICE_EXISTS
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onServiceValueChange = payload => {
  return { type: ON_SERVICE_VALUE_CHANGE, payload };
};

export const onFormOpen = () => {
  return { type: ON_FORM_OPEN };
};

export const onServiceCreate = ({ name, duration, price, description, commerceId, employeesIds }, navigation) => dispatch => {
  dispatch({ type: ON_SERVICE_FORM_SUBMIT });

  axios.post(`${backendUrl}/api/services/create/`, { commerceId, name, description, duration, price, employeesIds })
    .then(() => {
      // dispatch({ type: ON_SERVICE_EXISTS });
      dispatch({ type: ON_SERVICE_CREATE });
      navigation.goBack();
    });
};

export const onServicesRead = ({ commerceId, employeeId }) => dispatch => {
  dispatch({ type: ON_SERVICES_READING });

  axios.get(`${backendUrl}/api/services/`, { params: { commerceId, employeeId } })
    .then(response => dispatch({ type: ON_SERVICES_READ, payload: response.data }))
    .catch(error => console.error(error));
};

export const onServiceDelete = ({ id, commerceId }) => dispatch => {
  axios.patch(`${backendUrl}/api/services/update/${id}/`, { softDelete: localDate() })
    .then(() => dispatch({ type: ON_SERVICE_DELETE }))
    .catch(error => console.log(error));
};

export const onServiceUpdate = ({ id, name, duration, price, description, employeesIds, commerceId }, navigation) => dispatch => {
  dispatch({ type: ON_SERVICE_FORM_SUBMIT });

  axios.patch(`${backendUrl}/api/services/update/${id}/`, {
    name,
    description,
    duration,
    price,
    employeesIds
  })
    .then(() => {
      // dispatch({ type: ON_SERVICE_EXISTS });
      dispatch({ type: ON_SERVICE_UPDATE });
      navigation.goBack();
    })
    .catch(error => console.error(error));
};

export const onServiceOfferingUpdate = ({ id, employeesIds, commerceId }) => {
  axios.patch(`${backendUrl}/api/services/update/${id}/`, { employeesIds });
}
