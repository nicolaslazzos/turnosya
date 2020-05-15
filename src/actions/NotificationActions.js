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

const onCommerceNotificationTokensRead = async commerceId => {
  try {
    const tokens = await axios.get(`${backendUrl}/api/notifications/tokens/`, { params: { commerceId } });
    return tokens.data.map(token => token.id);
  } catch (error) {
    console.error(error);
  }
};

const onEmployeeNotificationTokensRead = async employeeId => {
  try {
    const tokens = await axios.get(`${backendUrl}/api/notifications/tokens/`, { params: { employeeId } });
    return tokens.data.map(token => token.id);
  } catch (error) {
    console.error(error);
  }
};

const onClientNotificationTokensRead = async profileId => {
  try {
    const tokens = await axios.get(`${backendUrl}/api/notifications/tokens/`, { params: { profileId } });
    return tokens.data.map(token => token.id);
  } catch (error) {
    console.error(error);
  }
};

export const onCommerceNotificationSend = async (notification, commerceId, employeeId, notificationTypeId) => {
  if (employeeId) {
    const tokens = await onEmployeeNotificationTokensRead(employeeId);
    sendPushNotification({ ...notification, tokens, commerceId, employeeId, notificationTypeId });
  } else {
    const tokens = await onCommerceNotificationTokensRead(commerceId);
    sendPushNotification({ ...notification, tokens, commerceId, notificationTypeId });
  }
};

export const onClientNotificationSend = async (notification, profileId, notificationTypeId) => {
  const tokens = await onClientNotificationTokensRead(profileId);
  sendPushNotification({ ...notification, tokens, profileId, notificationTypeId, metadata });
};

const sendPushNotification = ({ title, body, tokens, profileId, commerceId, employeeId, notificationTypeId }) => {
  try {
    if (Array.isArray(tokens) && tokens.length) {
      tokens.forEach(async token => {
        const message = {
          to: token,
          sound: 'default',
          title,
          body,
          _displayInForeground: true
        };

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
    }

    axios.post(`${backendUrl}/api/notifications/create/`, {
      commerceId,
      profileId,
      employeeId,
      notificationTypeId,
      title,
      body,
      date: localDate()
    });
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

export const onEmploymentInvitationConfirm = (notification, accepted) => async dispatch => {
  const db = firebase.firestore();
  const clientId = firebase.auth().currentUser.uid;

  try {
    let commerceNotification = {
      title: `Invitación de Empleo ${accepted ? 'aceptada' : 'rechazada'}`,
      body: `La invitación de empleo que usted envió ha sido ${accepted ? 'aceptada' : 'rechazada'}`
    };

    await db
      .doc(`Profiles/${clientId}/Notifications/${notification.id}`)
      .update({ ...(accepted ? { acceptanceDate: new Date() } : { rejectionDate: new Date() }) });

    await axios.post(`${backendUrl}/api/notifications/update/${notification.id}/`, { ...(accepted ? { acceptanceDate: localDate() } : { rejectionDate: localDate() }) })

    // onCommerceNotificationSend(commerceNotification, notification.sentBy, clientId, notification.employeeId, NOTIFICATION_TYPES.NOTIFICATION);
  } catch (e) {
    console.error(e);
  }
};

export const onEmploymentInvitationCancel = ({ employeeId, commerceId, profileId }) => async dispatch => {
  const db = firebase.firestore();

  try {
    const employeeRef = db.doc(`Commerces/${commerceId}/Employees/${employeeId}`);
    const notificationsSnapshot = await db
      .collection(`Profiles/${profileId}/Notifications`)
      .where('employeeId', '==', employeeId)
      .get();

    if (!notificationsSnapshot.empty) {
      const notificationId = notificationsSnapshot.docs[0].id;
      const notificationRef = db.doc(`Profiles/${profileId}/Notifications/${notificationId}`);

      const batch = db.batch();

      batch.update(employeeRef, { softDelete: new Date() });
      batch.update(notificationRef, { softDelete: new Date() });

      await batch.commit();
    }
  } catch (e) {
    console.error(e);
  }
};
