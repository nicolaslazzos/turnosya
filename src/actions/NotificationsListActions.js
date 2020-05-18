import axios from 'axios';
import moment from 'moment';
import { localDate } from '../utils';
import {
  ON_NOTIFICATIONS_READ,
  ON_NOTIFICATIONS_READING,
  ON_NOTIFICATION_DELETED
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onNotificationsRead = ({ profileId, commerceId, employeeId }) => dispatch => {
  dispatch({ type: ON_NOTIFICATIONS_READING });

  axios.get(`${backendUrl}/api/notifications/`, { params: { profileId, commerceId, employeeId } })
    .then(response => dispatch({ type: ON_NOTIFICATIONS_READ, payload: response.data.map(notification => ({ ...notification, date: moment(notification.date) })) }))
    .catch(error => console.error(error));
};

export const onNotificationDelete = notificationId => dispatch => {
  axios.patch(`${backendUrl}/api/notifications/update/${notificationId}/`, { softDelete: localDate() })
    .then(() => dispatch({ type: ON_NOTIFICATION_DELETED }))
    .catch(error => console.error(error));
};

export const onSetNotificationsRead = notifications => {
  const requests = [];

  notifications.forEach(notification => {
    if (!notification.read) requests.push(axios.patch(`${backendUrl}/api/notifications/update/${notification.id}/`, { read: true }));
  });

  axios.all(requests).then().catch(error => console.error(error));
};