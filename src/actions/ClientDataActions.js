import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { userReauthenticate } from './AuthActions';
import { localDate } from '../utils';
import {
  ON_CLIENT_DATA_VALUE_CHANGE,
  ON_USER_REGISTER,
  ON_USER_REGISTER_SUCCESS,
  ON_USER_REGISTER_FAIL,
  ON_USER_READING,
  ON_USER_READ,
  ON_USER_UPDATING,
  ON_USER_UPDATED,
  ON_USER_UPDATE_FAIL,
  ON_USER_READ_FAIL,
  ON_USER_DELETING,
  ON_USER_DELETED,
  ON_USER_DELETE_FAIL,
  ON_REAUTH_FAIL,
  ON_REAUTH_SUCCESS,
  ON_EMAIL_VERIFY_REMINDED,
  ON_REGISTER_FORM_OPEN,
  ON_WORKPLACES_READ,
  ON_USER_PASSWORD_UPDATE
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onClientDataValueChange = payload => {
  return { type: ON_CLIENT_DATA_VALUE_CHANGE, payload };
};

export const onRegisterFormOpen = () => {
  return { type: ON_REGISTER_FORM_OPEN };
};

export const onUserRegister = ({ email, password, firstName, lastName, phone, province }) => {
  return dispatch => {
    dispatch({ type: ON_USER_REGISTER });

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        axios.post(`${backendUrl}/api/profiles/create/`, {
          profileId: user.user.uid,
          firstName,
          lastName,
          email,
          phone,
          provinceId: province.provinceId ? parseInt(province.provinceId) : null
        })
          .then(() => {
            dispatch({ type: ON_USER_REGISTER_SUCCESS, payload: user });
            dispatch({ type: ON_EMAIL_VERIFY_REMINDED });
            user.user.sendEmailVerification();
          })
          .catch(error => dispatch({ type: ON_USER_REGISTER_FAIL, payload: error.message }));
      })
      .catch(error => dispatch({ type: ON_USER_REGISTER_FAIL, payload: error.message }));
  };
};

export const onUserRead = (profileId = firebase.auth().currentUser.uid) => async dispatch => {
  dispatch({ type: ON_USER_READING });

  try {
    const response = await axios.get(`${backendUrl}/api/profiles/${profileId}/`);
    dispatch({ type: ON_USER_READ, payload: response.data });
  } catch (error) {
    console.log(error)
    dispatch({ type: ON_USER_READ_FAIL });
  }
};

export const onUserUpdate = ({ firstName, lastName, phone, province, profilePicture }) => async dispatch => {
  dispatch({ type: ON_USER_UPDATING });

  const { currentUser } = firebase.auth();

  let url = null;

  try {
    if (profilePicture instanceof Blob) {
      const snapshot = await firebase
        .storage()
        .ref(`Users/${currentUser.uid}`)
        .child(`${currentUser.uid}-ProfilePicture`)
        .put(profilePicture);

      url = await snapshot.ref.getDownloadURL();
    }

    await axios.patch(`${backendUrl}/api/profiles/update/${currentUser.uid}/`, {
      firstName,
      lastName,
      phone,
      provinceId: province.provinceId ? parseInt(province.provinceId) : null,
      profilePicture: url ? url : profilePicture
    });

    dispatch({ type: ON_USER_UPDATED, payload: url || profilePicture });
  } catch (error) {
    console.log(error);
    dispatch({ type: ON_USER_UPDATE_FAIL });
  } finally {
    profilePicture.close && profilePicture.close();
  }
};

export const onUserDelete = password => { // aca se deberian recibir las reservas a cancelar
  const { currentUser } = firebase.auth();

  return dispatch => {
    dispatch({ type: ON_USER_DELETING });

    userReauthenticate(password)
      .then(async () => {
        dispatch({ type: ON_REAUTH_SUCCESS });

        try {
          await axios.delete(`${backendUrl}/api/profiles/delete/${currentUser.uid}/`);

          // aca se deberia notificar al negocio
          // const reservations = await axios.get(`${backendUrl}/api/reservations/`, { params: { clientId: currentUser.uid, startDate: localDate() } });
          // reservations.data.forEach(reservation => {
          //   requests.push(axios.patch(`${backendUrl}/api/reservations/update/${reservation.id}/`, { stateId: 'canceled', cancellationDate: localDate() }));
          // });

          await currentUser.delete();

          dispatch({ type: ON_USER_DELETED });
        } catch (error) {
          dispatch({ type: ON_USER_DELETE_FAIL });
        }
      })
      .catch(error => {
        dispatch({ type: ON_REAUTH_FAIL });
        dispatch({ type: ON_USER_DELETE_FAIL });
      });
  };
};

export const onUserWorkplacesRead = () => dispatch => {
  const profileId = firebase.auth().currentUser.uid;
  axios.get(`${backendUrl}/api/workplaces/`, { params: { profileId } }).then(response => dispatch({ type: ON_WORKPLACES_READ, payload: response.data }));
};

export const onUserPasswordUpdate = ({ password, newPassword }, navigation) => {
  const { currentUser } = firebase.auth();

  return dispatch => {
    dispatch({ type: ON_USER_UPDATING });

    userReauthenticate(password)
      .then(() => {
        currentUser
          .updatePassword(newPassword)
          .then(() => {
            dispatch({ type: ON_REAUTH_SUCCESS });
            dispatch({ type: ON_USER_PASSWORD_UPDATE });
            navigation.goBack();
          })
          .catch(error => {
            dispatch({ type: ON_USER_UPDATE_FAIL });
            dispatch({ type: ON_REAUTH_SUCCESS });
          });
      })
      .catch(error => {
        dispatch({ type: ON_REAUTH_FAIL });
        dispatch({ type: ON_USER_UPDATE_FAIL });
      });
  };
};
