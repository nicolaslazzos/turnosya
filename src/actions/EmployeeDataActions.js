import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { onNotificationSend } from './NotificationActions';
import { onUserWorkplacesRead } from './ClientDataActions';
import { NOTIFICATION_TYPES } from '../constants';
import { onReservationsCancel } from './ReservationsListActions';
import { localDate } from '../utils';
import {
  ON_EMPLOYEE_VALUE_CHANGE,
  ON_EMPLOYEE_VALUES_RESET,
  ON_USER_SEARCHING,
  ON_USER_SEARCH_SUCCESS,
  ON_USER_SEARCH_FAIL,
  ON_EMPLOYEE_SAVING,
  ON_EMPLOYEE_CREATED,
  ON_EMPLOYEE_SAVE_FAIL,
  ON_EMPLOYEE_DELETED,
  ON_EMPLOYEE_UPDATED
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onEmployeeValueChange = payload => ({ type: ON_EMPLOYEE_VALUE_CHANGE, payload });

export const onEmployeeValuesReset = () => ({ type: ON_EMPLOYEE_VALUES_RESET });

export const onEmployeeInvite = ({ commerceId, commerceName, roleId, visible, profileId }, navigation) => dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  axios.post(`${backendUrl}/api/employees/create/`, {
    commerceId,
    profileId,
    roleId,
    visible,
    inviteDate: localDate(),
  })
    .then(response => {
      const notification = {
        title: 'Invitación de Empleo',
        body: `Usted ha sido invitado como empleado del negocio ${commerceName}. Seleccione si desea aceptar o rechazar la invitación!`
      };

      onNotificationSend({ notification, profileId, employeeId: response.data.id, notificationTypeId: NOTIFICATION_TYPES.INVITE });

      dispatch({ type: ON_EMPLOYEE_CREATED });
      navigation.goBack();
    })
    .catch(error => {
      dispatch({ type: ON_EMPLOYEE_SAVE_FAIL });
      console.error(error);
    });
};

export const onEmployeeCreate = ({ employeeId, profileId }) => dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  axios.patch(`${backendUrl}/api/employees/update/${employeeId}/`, { startDate: localDate() })
    .then(() => {
      dispatch({ type: ON_EMPLOYEE_CREATED });
      if (profileId === firebase.auth().currentUser.uid) onUserWorkplacesRead()(dispatch);
    })
    .catch(error => dispatch({ type: ON_EMPLOYEE_SAVE_FAIL }));
};

export const onEmployeeUpdate = ({ employeeId, roleId, visible }, navigation) => dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  axios.patch(`${backendUrl}/api/employees/update/${employeeId}`, { roleId, visible })
    .then(() => {
      dispatch({ type: ON_EMPLOYEE_UPDATED });
      navigation.goBack();
    })
    .catch(error => dispatch({ type: ON_EMPLOYEE_SAVE_FAIL }));
};

export const onEmployeeDelete = ({ employeeId, reservationsToCancel }) => async dispatch => {
  try {
    let requests = [];

    requests.push(axios.delete(`${backendUrl}/api/employees/delete/${employeeId}`));
    requests = onReservationsCancel(reservationsToCancel, requests);

    await axios.all(requests);

    reservationsToCancel && reservationsToCancel.forEach(res => {
      if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
    });

    dispatch({ type: ON_EMPLOYEE_DELETED });
  } catch (error) {
    console.error(error);
  }
};

export const onUserByEmailSearch = (email, commerceId) => dispatch => {
  dispatch({ type: ON_USER_SEARCHING });

  searchUserByEmail(email).then(response => {
    if (!response.data.length) {
      dispatch({ type: ON_USER_SEARCH_FAIL, payload: 'No se encontró ningún usuario' });
    } else {
      const profile = response.data[0];

      if (profile.commerceId === commerceId)
        dispatch({ type: ON_USER_SEARCH_FAIL, payload: 'El dueño no puede ser empleado' });
      else
        dispatch({ type: ON_USER_SEARCH_SUCCESS, payload: profile });
    }
  });
};

const searchUserByEmail = email => axios.get(`${backendUrl}/api/profiles/`, { params: { email } });
