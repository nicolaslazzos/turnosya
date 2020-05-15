import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { formatReservation } from './ReservationsListActions';
import { AREAS, NOTIFICATION_TYPES } from '../constants';
import { onCommerceNotificationSend } from './NotificationActions';
import { localDate } from '../utils';
import {
  ON_CLIENT_RESERVATIONS_READ,
  ON_CLIENT_RESERVATIONS_READING,
  ON_CLIENT_RESERVATION_CANCEL,
  ON_CLIENT_RESERVATION_CANCEL_FAIL,
  ON_CLIENT_RESERVATION_CANCELING
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onClientReservationsListRead = () => dispatch => {
  dispatch({ type: ON_CLIENT_RESERVATIONS_READING });

  const clientId = firebase.auth().currentUser.uid;

  axios.get(`${backendUrl}/api/reservations/`, { params: { clientId } })
    .then(response => dispatch({ type: ON_CLIENT_RESERVATIONS_READ, payload: response.data.map(formatReservation) }))
    .catch(error => console.error(error));
};

export const onClientReservationCancel = ({ reservationId, commerceId, navigation, notification }) => {
  axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { stateId: 'canceled', cancellationDate: localDate() })
    .then(() => {
      onCommerceNotificationSend(notification, commerceId, notification.employeeId, NOTIFICATION_TYPES.NOTIFICATION);
      dispatch({ type: ON_CLIENT_RESERVATION_CANCEL });
      navigation.goBack();
    })
    .catch(() => {
      console.error(error);
      dispatch({ type: ON_CLIENT_RESERVATION_CANCEL_FAIL });
    });
};
