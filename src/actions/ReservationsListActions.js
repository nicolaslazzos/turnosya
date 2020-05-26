import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import moment from 'moment';
import { onNotificationSend } from './NotificationActions';
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
    reservationDate: moment(res.reservationDate)
  };
};

export const onCommerceReservationsRead = ({ commerceId, employeeId, courtTypeId, startDate, endDate }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATIONS_READING });

  axios.get(`${backendUrl}/api/reservations/`, {
    params: {
      commerceId,
      employeeId,
      courtTypeId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_RESERVATIONS_READ, payload: { reservations: response.data.map(formatReservation) } }))
    .catch(error => console.error(error));
}

// ver si las dos actions de abajo se pueden abarcar con la de arriba que es igual

export const onCommerceDetailedReservationsRead = ({ commerceId, employeeId, courtTypeId, startDate, endDate }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATIONS_READING });

  axios.get(`${backendUrl}/api/reservations/`, {
    params: {
      commerceId,
      employeeId,
      courtTypeId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_RESERVATIONS_READ, payload: { detailedReservations: response.data.map(formatReservation) } }))
    .catch(error => console.error(error));
}


export const onCommerceReservationCancel = ({ reservationId, clientId, navigation, notification }) => dispatch => {
  dispatch({ type: ON_COMMERCE_RESERVATION_CANCELING });

  axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { stateId: 'canceled', cancellationDate: localDate() })
    .then(() => {
      notification && onNotificationSend({ notification, profileId: clientId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
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

  axios.get(`${backendUrl}/api/reservations/`, {
    params: {
      commerceId,
      employeeId,
      courtId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_RESERVATIONS_READ, payload: { nextReservations: response.data.map(formatReservation) } }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_COMMERCE_RESERVATIONS_READ_FAIL, payload: error });
    });
};

export const onCommercePaymentRefund = payment => async () => {
  try {
    if (payment.paymentMethod.id !== 'cash') {
      // fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds?access_token=${mPagoToken}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // }).then(res => {
      //   if (res.status === 200 || res.status === 201) {
      //     db.doc(`Commerces/${commerceId}/Payments/${paymentId}`).update({ refundDate: new Date() });
      //   }
      // });
    } else {
      axios.patch(`${backendUrl}/api/payments/update/${payment.id}/`, { refundDate: localDate() });
    }
  } catch (error) {
    console.error(error);
  }
};
