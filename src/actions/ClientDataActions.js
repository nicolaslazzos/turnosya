import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { userReauthenticate } from './AuthActions';
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
  console.log(province)
  return dispatch => {
    dispatch({ type: ON_USER_REGISTER });

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        axios.post(`${backendUrl}/api/profiles/`, {
          clientId: user.user.uid,
          firstName,
          lastName,
          email,
          phone,
          provinceId: parseInt(province.provinceId),
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

export const onUserRead = (clientId = firebase.auth().currentUser.uid) => async dispatch => {
  dispatch({ type: ON_USER_READING });

  try {
    const profile = await axios.get(`${backendUrl}/api/profiles/${clientId}/`);
    let province = null;

    if (profile.data.provinceId) {
      province = await axios.get(`${backendUrl}/api/provinces/${profile.data.provinceId}/`);
      province = { name: province.data.name, provinceId: province.data.pk };
    }

    dispatch({
      type: ON_USER_READ,
      payload: { ...profile.data, province }
    });
  } catch (error) {
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

    await firebase
      .firestore()
      .doc(`Profiles/${currentUser.uid}`)
      .update({
        firstName,
        lastName,
        phone,
        province,
        profilePicture: url ? url : profilePicture
      });

    dispatch({ type: ON_USER_UPDATED, payload: url ? url : profilePicture });
  } catch (error) {
    dispatch({ type: ON_USER_UPDATE_FAIL });
  } finally {
    profilePicture.close && profilePicture.close();
  }
};

export const onUserDelete = password => {
  const { currentUser } = firebase.auth();
  const db = firebase.firestore();
  const batch = db.batch();

  return dispatch => {
    dispatch({ type: ON_USER_DELETING });

    userReauthenticate(password)
      .then(async () => {
        dispatch({ type: ON_REAUTH_SUCCESS });

        try {
          const userRef = db.doc(`Profiles/${currentUser.uid}`);

          batch.update(userRef, { softDelete: new Date() });

          const workplaces = await db
            .collection(`Profiles/${currentUser.uid}/Workplaces`)
            .where('softDelete', '==', null)
            .get();

          for await (const workplace of workplaces.docs) {
            const employees = await db
              .collection(`Commerces/${workplace.data().commerceId}/Employees`)
              .where('softDelete', '==', null)
              .where('profileId', '==', currentUser.uid)
              .get();

            employees.forEach(employee => {
              batch.update(employee.ref, { softDelete: new Date() });
            });
          }

          await batch.commit();
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
  const db = firebase.firestore();
  const clientId = firebase.auth().currentUser.uid;

  let workplaces = [];
  db.collection(`Profiles/${clientId}/Workplaces`)
    .where('softDelete', '==', null)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => workplaces.push({ commerceId: doc.data().commerceId, name: doc.data().name }));
      dispatch({ type: ON_WORKPLACES_READ, payload: workplaces });
    });
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
