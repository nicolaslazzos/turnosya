import firebase from 'firebase/app';
import 'firebase/firestore';
import {
  ON_LOGIN_VALUE_CHANGE,
  ON_LOGIN,
  ON_LOGIN_SUCCESS,
  ON_LOGIN_FAIL,
  ON_LOGOUT,
  ON_LOGOUT_SUCCESS,
  ON_LOGOUT_FINISHED,
  ON_EMAIL_VERIFY_ASKED,
  ON_EMAIL_VERIFY_REMINDED,
  ON_PASSWORD_RESET_EMAIL_SENDING,
  ON_PASSWORD_RESET_EMAIL_SENT,
  ON_PASSWORD_RESET_EMAIL_FAIL
} from './types';

import { onNotificationTokenRegister, onNotificationTokenDelete } from '../actions/NotificationActions';

export const onLoginValueChange = payload => {
  return { type: ON_LOGIN_VALUE_CHANGE, payload };
};

export const sendEmailVefification = () => {
  const { currentUser } = firebase.auth();
  currentUser.sendEmailVerification();

  return { type: ON_EMAIL_VERIFY_ASKED, payload: currentUser.email };
};

export const onLogin = ({ email, password }) => {
  return dispatch => {
    dispatch({ type: ON_LOGIN });

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(user => {
        onNotificationTokenRegister();

        dispatch({ type: ON_LOGIN_SUCCESS, payload: user });

        if (!user.user.emailVerified) dispatch({ type: ON_EMAIL_VERIFY_REMINDED });
      })
      .catch(error => dispatch({ type: ON_LOGIN_FAIL, payload: error.message }));
  };
};

export const onLogout = () => async dispatch => {
  dispatch({ type: ON_LOGOUT });

  try {
    await onNotificationTokenDelete();

    firebase
      .auth()
      .signOut()
      .then(() => dispatch({ type: ON_LOGOUT_SUCCESS }))
      .catch(() => dispatch({ type: ON_LOGIN_FAIL }));
  } catch (error) {
    return dispatch => dispatch({ type: ON_LOGIN_FAIL });
  }
};

export const onLogoutFinished = () => {
  return { type: ON_LOGOUT_FINISHED };
};

export const onEmailVerifyReminded = () => async dispatch => {
  try {
    const { currentUser } = firebase.auth();
    await currentUser.reload();

    if (!currentUser.emailVerified) dispatch({ type: ON_EMAIL_VERIFY_REMINDED });
  } catch (error) {
    console.error(error);
  }
};

export const onSendPasswordResetEmail = email => async dispatch => {
  dispatch({ type: ON_PASSWORD_RESET_EMAIL_SENDING });

  try {
    await firebase.auth().sendPasswordResetEmail(email);
    dispatch({ type: ON_PASSWORD_RESET_EMAIL_SENT });
    return true;
  } catch (error) {
    dispatch({ type: ON_PASSWORD_RESET_EMAIL_FAIL, payload: error.message });
    return false;
  }
};

export const userReauthenticate = async (password = null) => {
  try {
    const { currentUser } = firebase.auth();
    const provider = currentUser.providerData[0].providerId;
    let credential;

    if (provider == 'password') credential = await firebase.auth.EmailAuthProvider.credential(currentUser.email, password);

    return currentUser.reauthenticateWithCredential(credential);
  } catch (error) {
    console.error(error);
  }
};
