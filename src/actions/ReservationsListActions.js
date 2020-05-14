import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import moment from 'moment';
import { onClientNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import store from '../reducers';
import { localDate } from '../utils';
import {
  ON_COMMERCE_RESERVATIONS_READ,
  ON_COMMERCE_RESERVATIONS_READING,
  ON_COMMERCE_RESERVATIONS_READ_FAIL,
  ON_RESERVATIONS_LIST_VALUE_CHANGE,
  ON_COMMERCE_RESERVATION_CANCELING,
  ON_COMMERCE_RESERVATION_CANCELED,
  ON_COMMERCE_RESERVATION_CANCEL_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onReservationsListValueChange = payload => {
  return {
    type: ON_RESERVATIONS_LIST_VALUE_CHANGE,
    payload
  };
};

export const formatReservation = res => {
  return {
    ...res,
    startDate: moment(res.startDate),
    endDate: moment(res.endDate),
    reservationDate: moment(res.reservationDate),
  };
};

export const onCommerceReservationsRead = ({ commerceId, employeeId, clientId, courtTypeId, startDate, endDate }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATIONS_READING });

  axios.get(`${backendUrl}/api/reservations/`, {
    params: {
      commerceId,
      employeeId,
      clientId,
      courtTypeId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_RESERVATIONS_READ, payload: { reservations: response.data.map(formatReservation) } }))
    .catch(error => console.error(error));
}

export const onCommercePaymentRefund = ({ commerceId, mPagoToken, paymentId }) => async () => {
  const db = firebase.firestore();

  const doc = await db.doc(`Commerces/${commerceId}/Payments/${paymentId}`).get();

  if (doc.data().method !== 'Efectivo')
    fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds?access_token=${mPagoToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (res.status === 200 || res.status === 201) {
        db.doc(`Commerces/${commerceId}/Payments/${paymentId}`).update({ refundDate: new Date() });
      }
    });
};

export const onCommerceReservationCancel = ({ commerceId, reservationId, clientId, navigation, notification }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATION_CANCELING });

  axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { stateId: 'canceled', cancellationDate: localDate() })
    .then(() => {
      // notification && onClientNotificationSend(notification, clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
      
      dispatch({ type: ON_COMMERCE_RESERVATION_CANCELED });
      navigation.goBack();
    })
    .catch(error => {
      dispatch({ type: ON_COMMERCE_RESERVATION_CANCEL_FAIL });
      console.error(error);
    });
};

export const onNextReservationsRead = ({ commerceId, startDate, endDate, employeeId, courtId }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATIONS_READING });

  const db = firebase.firestore();

  let query = db
    .collection(`Commerces/${commerceId}/Reservations`)
    .where('cancellationDate', '==', null)
    .where('endDate', '>', startDate.toDate());

  if (employeeId) query = query.where('employeeId', '==', employeeId);

  if (courtId) query = query.where('courtId', '==', courtId);

  query
    .orderBy('endDate')
    .get()
    .then(snapshot => {

      const nextReservations = [];

      if (snapshot.empty) {
        return dispatch({
          type: ON_COMMERCE_RESERVATIONS_READ,
          payload: { nextReservations }
        });
      }

      snapshot.forEach(doc => {
        if (!endDate || (endDate && endDate > moment(doc.data().startDate.toDate())))
          nextReservations.push({
            id: doc.id,
            paymentId: doc.data().paymentId,
            clientId: doc.data().clientId,
            startDate: moment(doc.data().startDate.toDate()),
            endDate: moment(doc.data().endDate.toDate())
          });
      });

      dispatch({
        type: ON_COMMERCE_RESERVATIONS_READ,
        payload: { nextReservations }
      });
    })
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_COMMERCE_RESERVATIONS_READ_FAIL, payload: error })
    });
};

export const onReservationsCancel = async (db, batch, commerceId, reservations) => {

  // reservations cancel
  if (reservations.length) {
    const mPagoToken = store.getState().commerceData.mPagoToken;

    try {
      const state = await db.doc(`ReservationStates/canceled`).get();
      const updateObj = {
        cancellationDate: new Date(),
        state: { id: state.id, name: state.data().name }
      };

      reservations.forEach(res => {
        const commerceResRef = db.doc(`Commerces/${commerceId}/Reservations/${res.id}`);
        batch.update(commerceResRef, updateObj);

        if (res.clientId) {
          const clientResRef = db.doc(`Profiles/${res.clientId}/Reservations/${res.id}`);
          batch.update(clientResRef, updateObj);
        }

        if (res.paymentId) onCommercePaymentRefund({ commerceId, paymentId: res.paymentId, mPagoToken })();
      });
    } catch (error) {
      console.error(error);
    }
  }
};
