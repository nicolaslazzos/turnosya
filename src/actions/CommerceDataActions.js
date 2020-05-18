import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { userReauthenticate } from './AuthActions';
import { ROLES } from '../constants';
import { onNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import { onReservationsCancel } from './ReservationsListActions';
import { localDate } from '../utils';
import {
  ON_REGISTER_COMMERCE,
  ON_COMMERCE_PROFILE_CREATE,
  ON_COMMERCE_VALUE_CHANGE,
  ON_COMMERCE_CREATE_FAIL,
  ON_COMMERCE_READING,
  ON_COMMERCE_READ_FAIL,
  ON_COMMERCE_READ,
  ON_COMMERCE_MP_TOKEN_READ,
  ON_COMMERCE_MP_TOKEN_READING,
  ON_COMMERCE_MP_TOKEN_READ_FAIL,
  ON_COMMERCE_MP_TOKEN_SWITCHING,
  ON_COMMERCE_MP_TOKEN_SWITCHED,
  ON_COMMERCE_MP_TOKEN_SWITCH_FAIL,
  ON_COMMERCE_UPDATING,
  ON_COMMERCE_UPDATED,
  ON_COMMERCE_UPDATE_FAIL,
  ON_AREAS_READ_FOR_PICKER,
  ON_COMMERCE_CREATING,
  ON_LOCATION_VALUE_CHANGE,
  ON_LOCATION_VALUES_RESET,
  ON_CUIT_NOT_EXISTS,
  ON_CUIT_EXISTS,
  ON_COMMERCE_DELETING,
  ON_COMMERCE_DELETED,
  ON_COMMERCE_DELETE_FAIL,
  ON_REAUTH_FAIL,
  ON_REAUTH_SUCCESS,
  ON_ROLE_ASSIGNED,
  ON_CLIENT_DATA_VALUE_CHANGE,
  ON_EMPLOYEE_SELECT
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onCommerceValueChange = payload => {
  return { type: ON_COMMERCE_VALUE_CHANGE, payload };
};

export const onCommerceFormOpen = () => {
  return dispatch => {
    dispatch({ type: ON_COMMERCE_CREATING });
    dispatch({ type: ON_LOCATION_VALUE_CHANGE, payload: { address: '', city: '', provinceName: '', country: '', latitude: null, longitude: null } });
  };
};

export const onCommerceOpen = commerceId => async dispatch => {
  const profileId = firebase.auth().currentUser.uid;

  try {
    const response = await axios.get(`${backendUrl}/api/employees/`, { params: { commerceId, profileId } });

    if (response.data.length) {
      const employee = response.data[0];
      dispatch({ type: ON_ROLE_ASSIGNED, payload: { role: employee.role, employeeId: employee.id } });
      dispatch({ type: ON_EMPLOYEE_SELECT, payload: { selectedEmployeeId: employee.id } });
    }

    dispatch({ type: ON_LOCATION_VALUES_RESET });
  } catch (error) {
    console.error(error);
  }
};

export const onCommerceCreate = (commerceData, navigation) => async dispatch => {
  dispatch({ type: ON_REGISTER_COMMERCE });

  const { name, cuit, email, phone, description, area, address, city, province, latitude, longitude } = commerceData;
  const profileId = firebase.auth().currentUser.uid;

  try {
    const commerce = await axios.post(`${backendUrl}/api/commerces/create/`, {
      name,
      cuit,
      email,
      phone,
      description,
      areaId: area.areaId,
      address,
      city,
      provinceId: province.provinceId,
      latitude,
      longitude
    });

    const commerceId = commerce.data.id;

    await axios.patch(`${backendUrl}/api/profiles/update/${profileId}/`, { commerceId });

    const employee = await axios.post(`${backendUrl}/api/employees/create/`, {
      commerceId,
      profileId,
      roleId: ROLES.OWNER.roleId,
      inviteDate: localDate(),
      startDate: localDate()
    });

    dispatch({ type: ON_COMMERCE_VALUE_CHANGE, payload: { commerceId } });
    dispatch({ type: ON_ROLE_ASSIGNED, payload: { role: ROLES.OWNER, employeeId: employee.id } });
    dispatch({ type: ON_EMPLOYEE_SELECT, payload: { selectedEmployeeId: employee.id } });
    dispatch({ type: ON_COMMERCE_PROFILE_CREATE });

    navigation.navigate(`${area.areaId}`);
    navigation.navigate(`${area.areaId}Calendar`);
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_CREATE_FAIL, payload: error });
  }
};

export const onCommerceRead = (commerceId, loadingType = 'loading') => async dispatch => {
  dispatch({ type: ON_COMMERCE_READING, payload: loadingType });

  try {
    const response = await axios.get(`${backendUrl}/api/commerces/${commerceId}/`);
    const commerce = response.data;

    //province
    var { name, provinceId } = commerce.province;
    const province = { value: provinceId, label: name };

    //area
    var { name, areaId } = commerce.area;
    const area = { value: areaId, label: name };

    dispatch({ type: ON_COMMERCE_READ, payload: { ...commerce, provincesList: [province], areasList: [area] } });

    return true;
  } catch (error) {
    dispatch({ type: ON_COMMERCE_READ_FAIL });
    return false;
  }
};

onPictureUpdate = async (commerceId, picture, type) => {
  const ref = firebase
    .storage()
    .ref(`Commerces/${commerceId}`)
    .child(`${commerceId}-${type}`);

  try {
    const snapshot = await ref.put(picture);
    const url = await snapshot.ref.getDownloadURL();
    return url;
  } catch (error) {
    throw new Error(error);
  } finally {
    picture.close();
  }
};

export const onCommerceUpdate = (commerceData, navigation) => async dispatch => {
  dispatch({ type: ON_COMMERCE_UPDATING });

  const {
    name,
    description,
    address,
    city,
    province,
    profilePicture,
    headerPicture,
    commerceId,
    latitude,
    longitude
  } = commerceData;

  let profilePictureURL = null;
  let headerPictureURL = null;

  try {
    if (profilePicture instanceof Blob)
      profilePictureURL = await onPictureUpdate(commerceId, profilePicture, 'ProfilePicture');

    if (headerPicture instanceof Blob)
      headerPictureURL = await onPictureUpdate(commerceId, headerPicture, 'HeaderPicture');

    const response = await axios.patch(`${backendUrl}/api/commerces/update/${commerceId}/`, {
      name,
      description,
      address,
      city,
      provinceId: province.provinceId,
      latitude,
      longitude,
      profilePicture: profilePictureURL || profilePicture,
      headerPicture: headerPictureURL || headerPicture
    });

    dispatch({ type: ON_COMMERCE_UPDATED, payload: { profilePicture: response.data.profilePicture, headerPicture: response.data.headerPicture } });
    navigation.goBack();
  } catch (error) {
    dispatch({ type: ON_COMMERCE_UPDATE_FAIL });
  }
};

export const onAreasReadForPicker = () => dispatch => {
  axios.get(`${backendUrl}/api/commerces/areas/id/`)
    .then(response => dispatch({ type: ON_AREAS_READ_FOR_PICKER, payload: response.data }))
    .catch(error => console.error(error));
};

export const onCuitValidate = cuit => dispatch => {
  axios.get(`${backendUrl}/api/commerces/`, { params: { cuit } }).then(response => dispatch({ type: response.data.length ? ON_CUIT_EXISTS : ON_CUIT_NOT_EXISTS }));
};

export const onCommerceDelete = (password, reservationsToCancel, navigation = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_DELETING });

  userReauthenticate(password)
    .then(async () => {
      dispatch({ type: ON_REAUTH_SUCCESS });

      try {
        let requests = [];

        requests.push(axios.delete(`${backendUrl}/api/commerces/delete/${commerceId}`));
        requests = onReservationsCancel(reservationsToCancel, requests);

        await axios.all(requests);

        reservationsToCancel.forEach(res => {
          if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
        });

        dispatch({ type: ON_COMMERCE_DELETED });
        dispatch({ type: ON_CLIENT_DATA_VALUE_CHANGE, payload: { commerceId: null } });

        navigation && navigation.navigate('client');
      } catch (error) {
        dispatch({ type: ON_COMMERCE_DELETE_FAIL });
      }
    })
    .catch(error => {
      dispatch({ type: ON_REAUTH_FAIL });
      dispatch({ type: ON_COMMERCE_DELETE_FAIL });
      console.error(error);
    });
};

export const onCommerceMPagoTokenRead = commerceId => dispatch => {
  dispatch({ type: ON_COMMERCE_MP_TOKEN_READING });

  const db = firebase.firestore();

  db.collection(`Commerces/${commerceId}/MercadoPagoTokens`)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const currentToken = snapshot.docs.find(doc => doc.data().softDelete === null);
        currentToken
          ? dispatch({
            type: ON_COMMERCE_MP_TOKEN_READ,
            payload: { mPagoToken: currentToken.id, hasAnyMPagoToken: true }
          })
          : dispatch({ type: ON_COMMERCE_MP_TOKEN_READ, payload: { mPagoToken: null, hasAnyMPagoToken: true } });
      } else {
        dispatch({ type: ON_COMMERCE_MP_TOKEN_READ, payload: { mPagoToken: null, hasAnyMPagoToken: false } });
      }
    })
    .catch(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_READ_FAIL }));
};

export const onCommerceMPagoTokenEnable = commerceId => dispatch => {
  dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCHING });

  const db = firebase.firestore();

  db.collection(`Commerces/${commerceId}/MercadoPagoTokens`)
    .orderBy('softDelete', 'desc')
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const latestToken = snapshot.docs[0].id;
        db.doc(`Commerces/${commerceId}/MercadoPagoTokens/${latestToken}`)
          .update({ softDelete: null })
          .then(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCHED, payload: latestToken }))
          .catch(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCH_FAIL }));
      }
    })
    .catch(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCH_FAIL }));
};

export const onCommerceMPagoTokenDisable = commerceId => dispatch => {
  dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCHING });

  const db = firebase.firestore();

  db.collection(`Commerces/${commerceId}/MercadoPagoTokens`)
    .where('softDelete', '==', null)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const latestToken = snapshot.docs[0].id;
        db.doc(`Commerces/${commerceId}/MercadoPagoTokens/${latestToken}`)
          .update({ softDelete: new Date() })
          .then(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCHED, payload: null }))
          .catch(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCH_FAIL }));
      }
    })
    .catch(() => dispatch({ type: ON_COMMERCE_MP_TOKEN_SWITCH_FAIL }));
};
