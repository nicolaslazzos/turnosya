import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { onCommerceNotificationSend } from './NotificationActions';
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

export const onReservationValueChange = payload => {
  return { type: ON_RESERVATION_VALUE_CHANGE, payload };
};

export const onNewReservation = () => {
  return { type: ON_NEW_RESERVATION };
};

export const onNewServiceReservation = () => {
  return { type: ON_NEW_SERVICE_RESERVATION };
};

export const onClientReservationCreate = ({ commerceId, employeeId, courtId, serviceId, clientName, clientPhone, startDate, endDate, price }, notification) => async dispatch => {
  dispatch({ type: ON_RESERVATION_CREATING });

  const clientId = firebase.auth().currentUser.uid;

  try {
    // if ((courtId && await courtReservationExists({ commerceId, courtId, startDate })) ||
    //   (employeeId && await serviceReservationExists({ commerceId, employeeId, startDate, endDate })))
    //   return dispatch({ type: ON_RESERVATION_EXISTS });

    await axios.post(`${backendUrl}/api/reservations/create/`, {
      commerceId,
      clientId,
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

    onCommerceNotificationSend(notification, commerceId, employeeId, NOTIFICATION_TYPES.NOTIFICATION);

    dispatch({ type: ON_RESERVATION_CREATE });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_RESERVATION_CREATE_FAIL });
  }
};

export const onCommerceCourtReservationCreate = ({
  commerceId,
  areaId,
  courtId,
  courtType,
  clientName,
  clientPhone,
  startDate,
  endDate,
  light,
  price
}) => async dispatch => {
  dispatch({ type: ON_RESERVATION_CREATING });

  const db = firebase.firestore();

  try {
    const stateDoc = await db.doc(`ReservationStates/reserved`).get();

    if (await courtReservationExists({ commerceId, courtId, startDate: startDate.toDate() }))
      return dispatch({ type: ON_RESERVATION_EXISTS });

    await db.collection(`Commerces/${commerceId}/Reservations`).add({
      areaId,
      clientId: null,
      courtId,
      courtType,
      clientName,
      clientPhone,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      reservationDate: new Date(),
      cancellationDate: null,
      price,
      light,
      state: { id: stateDoc.id, name: stateDoc.data().name }
    });

    dispatch({ type: ON_RESERVATION_CREATE });
  } catch (error) {
    dispatch({ type: ON_RESERVATION_CREATE_FAIL });
  }
};

export const onCommerceServiceReservationCreate = ({
  areaId,
  commerceId,
  serviceId,
  employeeId,
  clientName,
  clientPhone,
  startDate,
  endDate,
  price,
  notification
}) => async dispatch => {
  dispatch({ type: ON_RESERVATION_CREATING });

  const db = firebase.firestore();

  try {
    const stateDoc = await db.doc(`ReservationStates/reserved`).get();

    if (await serviceReservationExists({
      commerceId,
      employeeId,
      startDate: startDate.toDate(),
      endDate: endDate.toDate()
    }))
      return dispatch({ type: ON_RESERVATION_EXISTS });

    await db.collection(`Commerces/${commerceId}/Reservations`).add({
      areaId,
      serviceId,
      employeeId,
      clientId: null,
      clientName,
      clientPhone,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      reservationDate: new Date(),
      cancellationDate: null,
      price,
      state: { id: stateDoc.id, name: stateDoc.data().name }
    });

    if (notification)
      onCommerceNotificationSend(notification, commerceId, employeeId, NOTIFICATION_TYPES.NOTIFICATION);

    dispatch({ type: ON_RESERVATION_CREATE });
  } catch (error) {
    dispatch({ type: ON_RESERVATION_CREATE_FAIL });
  }
};