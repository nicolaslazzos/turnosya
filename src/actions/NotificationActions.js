import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { localDate } from '../utils';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { Toast } from '../components/common';
import { NOTIFICATION_TYPES } from '../constants';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onNotificationSend = async ({ notification, profileId, commerceId, employeeId, notificationTypeId }) => {
  try {
    const { title, body } = notification;

    const tokens = await axios.get(`${backendUrl}/api/notifications/tokens/`, { params: { commerceId, profileId, employeeId } });

    tokens.data.forEach(async token => {
      const message = { to: token.id, sound: 'default', title, body, _displayInForeground: true };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    });

    await axios.post(`${backendUrl}/api/notifications/create/`, { commerceId, profileId, employeeId, notificationTypeId, title, body, date: localDate() });
  } catch (error) {
    console.error(error);
  }
};

const getDeviceToken = async () => {
  // -1 (is simulator device) | 0 (permission not granted) | token value
  try {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return 0;

      return await Notifications.getExpoPushTokenAsync();
    } else {
      Toast.show({ text: 'Debe usar un dispositivo físico para el uso de notificaciones' });

      return -1;
    }
  } catch (error) {
    console.error(error);
  }
};

export const onNotificationTokenRegister = async () => {
  try {
    const deviceToken = await getDeviceToken();

    if (deviceToken.length > 2) {
      const profileId = firebase.auth().currentUser.uid;
      await axios.post(`${backendUrl}/api/notifications/tokens/create/`, { id: deviceToken, profileId });
    }
  } catch (error) {
    console.error(error);
  }
};

export const onNotificationTokenDelete = async () => {
  try {
    const deviceToken = await getDeviceToken();

    if (deviceToken.length > 2) {
      await axios.delete(`${backendUrl}/api/notifications/tokens/delete/${deviceToken}/`);
    }
  } catch (error) {
    console.error(error);
  }
};

export const onEmploymentInvitationConfirm = (notification, accepted) => async () => {
  try {
    let commerceNotification = {
      title: `Invitación de Empleo ${accepted ? 'aceptada' : 'rechazada'}`,
      body: `La invitación de empleo que usted envió ha sido ${accepted ? 'aceptada' : 'rechazada'}`
    };

    await axios.patch(`${backendUrl}/api/notifications/update/${notification.id}/`, { ...(accepted ? { acceptanceDate: localDate() } : { rejectionDate: localDate() }) });
    onNotificationSend({ notification: commerceNotification, commerceId: notification.employee.commerceId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
  } catch (error) {
    console.error(error);
  }
};

export const onEmploymentInvitationCancel = employee => async () => {
  try {
    const notifications = await axios.get(`${backendUrl}/api/notifications/`, { params: { employeeId: employee.id, profileId: employee.profileId } });

    if (notifications.data.length) {
      const requests = []
      notifications.data.forEach(notification => requests.push(axios.patch(`${backendUrl}/api/notifications/update/${notification.id}/`, { softDelete: localDate() })));
      requests.push(axios.patch(`${backendUrl}/api/employees/update/${employee.id}/`, { softDelete: localDate() }))
    }

    await axios.all(requests);
  } catch (error) {
    console.error(error);
  }
};
