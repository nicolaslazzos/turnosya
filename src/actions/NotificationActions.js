import firebase from 'firebase/app';
import 'firebase/firestore';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { Toast } from '../components/common';

const onCommerceNotificationTokensRead = async commerceId => {
  const db = firebase.firestore();
  const tokens = [];
  try {
    const querySnapshot = await db.collection(`Commerces/${commerceId}/NotificationTokens`).get();
    querySnapshot.forEach(doc => tokens.push(doc.id));
    return tokens;
  } catch (error) {
    console.error(error);
  }
};

const onEmployeeNotificationTokensRead = async (commerceId, employeeId) => {
  const db = firebase.firestore();
  const employeeTokens = [];
  try {
    const querySnapshot = await db
      .collection(`Commerces/${commerceId}/NotificationTokens`)
      .where('employeeId', '==', employeeId)
      .get();
    querySnapshot.forEach(doc => employeeTokens.push(doc.id));
    return employeeTokens;
  } catch (error) {
    console.error(error);
  }
};

const onClientNotificationTokensRead = async  clientId => {
  const db = firebase.firestore();
  const tokens = [];
  try {
    const querySnapshot = await  db.collection(`Profiles/${clientId}/NotificationTokens`).get();
    querySnapshot.forEach(doc => tokens.push(doc.id));

    return tokens;
  } catch (error) {
    console.error(error);
  }
};

export const onCommerceNotificationSend = async (notification, commerceId, employeeId, clientId) => {
  if (employeeId) {
    const tokens = await onEmployeeNotificationTokensRead(commerceId, employeeId);
    const collectionRef = `Commerces/${commerceId}/Notifications`;
    sendPushNotification({ ...notification, tokens, collectionRef, sentBy: clientId });
  } else {
    const tokens = await onCommerceNotificationTokensRead(commerceId);
    const collectionRef = `Commerces/${commerceId}/Notifications`;
    sendPushNotification({ ...notification, tokens, collectionRef, sentBy: clientId });
  }
};

export const onClientNotificationSend = async (notification, clientId, commerceId) => {
  const tokens = await onClientNotificationTokensRead(clientId);
  const collectionRef = `Profiles/${clientId}/Notifications`;
  sendPushNotification({ ...notification, tokens, collectionRef, sentBy: commerceId });
};

const sendPushNotification = ({ title, body, tokens, collectionRef, sentBy }) => {
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
        const data = response.status;
      });

      const db = firebase.firestore();
      db.collection(collectionRef).add({ title, body, date: new Date(), softDelete: null, sentBy });
    }
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
      const { currentUser } = firebase.auth();
      const db = firebase.firestore();
      const batch = db.batch();

      // Se guarda el deviceToken en la colección del cliente
      const clientPushNotificationRef = db.doc(`Profiles/${currentUser.uid}/NotificationTokens/${deviceToken}`);
      batch.set(clientPushNotificationRef, {});

      const userDoc = await db.doc(`Profiles/${currentUser.uid}`).get();
      const { commerceId } = userDoc.data();

      if (commerceId) {
        // Se guarda el deviceToken del dueño en un negocio
        const ownerSnapshot = await db
          .collection(`Commerces/${commerceId}/Employees/`)
          .where('softDelete', '==', null)
          .where('profileId', '==', currentUser.uid)
          .get();

        const ownerTokenRef = db.doc(`Commerces/${commerceId}/NotificationTokens/${deviceToken}`);
        ownerSnapshot.forEach(owner => batch.set(ownerTokenRef, { employeeId: owner.id }));
      }

      // Se guarda el deviceToken en las colecciónes de los comercios donde es empleado (con el id del employee)
      const workplacesSnapshot = await db
        .collection(`Profiles/${currentUser.uid}/Workplaces`)
        .where('softDelete', '==', null)
        .get();

      for (const workplace of workplacesSnapshot.docs) {
        const { commerceId: workplaceId } = workplace.data();

        const employeeSnapshot = await db
          .collection(`Commerces/${workplaceId}/Employees/`)
          .where('softDelete', '==', null)
          .where('profileId', '==', currentUser.uid)
          .get();

        const employeeTokenRef = db.doc(`Commerces/${workplaceId}/NotificationTokens/${deviceToken}`);
        employeeSnapshot.forEach(employee => batch.set(employeeTokenRef, { employeeId: employee.id }));
      }

      await batch.commit();
    }
  } catch (error) {
    console.error(error);
  }
};

export const onNotificationTokenDelete = async (commerceId, workplaces) => {
  try {
    const deviceToken = await getDeviceToken();

    if (deviceToken.length > 2) {
      const { currentUser } = firebase.auth();
      const db = firebase.firestore();
      const batch = db.batch();

      // Se elimina el deviceToken en la colección del cliente
      const clientPushNotificationRef = db.doc(`Profiles/${currentUser.uid}/NotificationTokens/${deviceToken}`);

      batch.delete(clientPushNotificationRef);

      if (commerceId) {
        // Se elimina el deviceToken en la colección del comercio donde es dueño
        const commercePushNotificationRef = db.doc(`Commerces/${commerceId}/NotificationTokens/${deviceToken}`);

        batch.delete(commercePushNotificationRef);
      }

      // Se elimina el deviceToken en las colecciónes de los comercios donde es empleado
      workplaces.forEach(workplace => {
        const workplacePushNotificationRef = db.doc(
          `Commerces/${workplace.commerceId}/NotificationTokens/${deviceToken}`
        );

        batch.delete(workplacePushNotificationRef);
      });

      batch.commit();
    }
  } catch (error) {
    console.error(error);
  }
};