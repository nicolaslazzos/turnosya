import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { onNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import { localDate } from '../utils';
import {
  ON_RESERVATION_VALUE_CHANGE,
  ON_RESERVATION_CREATING,
  ON_RESERVATION_CREATE,
  ON_RESERVATION_CREATE_FAIL,
  ON_NEW_RESERVATION,
  ON_NEW_SERVICE_RESERVATION,
  ON_RESERVATION_EXISTS
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onReservationValueChange = payload => ({ type: ON_RESERVATION_VALUE_CHANGE, payload });

export const onNewReservation = () => ({ type: ON_NEW_RESERVATION })

export const onNewServiceReservation = () => ({ type: ON_NEW_SERVICE_RESERVATION });

export const onClientReservationCreate = ({ commerceId, employeeId, courtId, serviceId, startDate, endDate, price }, notification) => async dispatch => {
  dispatch({ type: ON_RESERVATION_CREATING });

  const clientId = firebase.auth().currentUser.uid;

  try {
    const response = await axios.post(`${backendUrl}/api/reservations/create/`, {
      commerceId,
      clientId,
      employeeId,
      courtId,
      serviceId,
      stateId: 'reserved',
      reservationDate: localDate(),
      startDate: localDate(startDate),
      endDate: localDate(endDate),
      price: parseFloat(price)
    });

    if (response.data[ON_RESERVATION_EXISTS]) return dispatch({ type: ON_RESERVATION_EXISTS });

    notification && onNotificationSend({ notification, commerceId, employeeId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });

    dispatch({ type: ON_RESERVATION_CREATE });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_RESERVATION_CREATE_FAIL });
  }
};

export const onCommerceReservationCreate = ({ commerceId, employeeId, courtId, serviceId, clientName, clientPhone, startDate, endDate, price }, notification) => async dispatch => {
  dispatch({ type: ON_RESERVATION_CREATING });

  try {
    const response = await axios.post(`${backendUrl}/api/reservations/create/`, {
      commerceId,
      employeeId,
      courtId,
      serviceId,
      stateId: 'reserved',
      clientName,
      clientPhone,
      reservationDate: localDate(),
      startDate: localDate(startDate),
      endDate: localDate(endDate),
      price: parseFloat(price)
    });

    if (response.data[ON_RESERVATION_EXISTS]) return dispatch({ type: ON_RESERVATION_EXISTS });

    notification && onNotificationSend({ notification, commerceId, employeeId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });

    dispatch({ type: ON_RESERVATION_CREATE });
  } catch (error) {
    dispatch({ type: ON_RESERVATION_CREATE_FAIL });
  }
};