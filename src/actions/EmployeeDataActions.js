import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { onClientNotificationSend } from './NotificationActions';
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

export const onEmployeeValueChange = payload => ({
  type: ON_EMPLOYEE_VALUE_CHANGE,
  payload
});

export const onEmployeeValuesReset = () => ({ type: ON_EMPLOYEE_VALUES_RESET });

export const onEmployeeInvite = (employeeData, navigation) => dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  const { commerceId, commerceName, role, visible, profileId } = employeeData;

  axios.post(`${backendUrl}/api/employees/create`, {
    commerceId,
    profileId,
    roleId: role.roleId,
    visible,
    inviteDate: localDate(),
  })
    .then(response => {
      const notification = {
        title: 'Invitación de Empleo',
        body: `Usted ha sido invitado como empleado del negocio ${commerceName}. Seleccione si desea aceptar o rechazar la invitación!`
      };

      // onClientNotificationSend(notification, profileId, commerceId, NOTIFICATION_TYPES.EMPLOYMENT_INVITE, { employeeId: response.data.id });

      dispatch({ type: ON_EMPLOYEE_CREATED });
      navigation.goBack();
    })
    .catch(() => dispatch({ type: ON_EMPLOYEE_SAVE_FAIL }));
};

export const onEmployeeCreate = ({ employeeId, profileId }) => async dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  axios.patch(`${backendUrl}/api/employees/update/${employeeId}/`, { startDate: localDate() })
    .then(() => {
      dispatch({ type: ON_EMPLOYEE_CREATED });
      if (profileId === firebase.auth().currentUser.uid) onUserWorkplacesRead()(dispatch);
    })
    .catch(error => dispatch({ type: ON_EMPLOYEE_SAVE_FAIL }));

  // const tokens = await db.collection(`Profiles/${profileId}/NotificationTokens`).get();

  // if (!tokens.empty) tokens.forEach(token =>
  //   batch.set(db.doc(`Commerces/${commerceId}/NotificationTokens/${token.id}`), { employeeId })
  // );
};

export const onEmployeeUpdate = ({ employeeId, role, visible }, navigation) => dispatch => {
  dispatch({ type: ON_EMPLOYEE_SAVING });

  axios.patch(`${backendUrl}/api/employees/update/${employeeId}`, { roleId: role.roleId, visible })
    .then(() => {
      dispatch({ type: ON_EMPLOYEE_UPDATED });
      navigation.goBack();
    })
    .catch(error => dispatch({ type: ON_EMPLOYEE_SAVE_FAIL }));
};

export const onEmployeeDelete = ({ employeeId, commerceId, profileId, reservationsToCancel }) => async dispatch => {
  const db = firebase.firestore();

  try {
    await axios.delete(`${backendUrl}/api/employees/delete/${employeeId}`);

    // const tokens = await db
    //   .collection(`Commerces/${commerceId}/NotificationTokens`)
    //   .where('employeeId', '==', employeeId)
    //   .get();

    // if (!workplaces.empty) {
    //   reservationsToCancel && await onReservationsCancel(db, batch, commerceId, reservationsToCancel);
    // }

    // if (!tokens.empty) tokens.forEach(token => batch.delete(token.ref));

    // reservationsToCancel && reservationsToCancel.forEach(res => {
    //   if (res.clientId)
    //     onClientNotificationSend(res.notification, res.clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
    // });

    dispatch({ type: ON_EMPLOYEE_DELETED });
  } catch (error) {
    console.error(error);
  }
};

export const onEmployeeInfoUpdate = email => dispatch => {
  dispatch({ type: ON_USER_SEARCHING });

  searchUserByEmail(email).then(snapshot => {
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      dispatch({
        type: ON_USER_SEARCH_SUCCESS,
        payload: {
          ...doc.data(),
          profileId: doc.id
        }
      });
    }
  });
};

export const onUserByEmailSearch = (email, commerceId) => dispatch => {
  dispatch({ type: ON_USER_SEARCHING });

  searchUserByEmail(email).then(response => {
    if (response.data) {
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
