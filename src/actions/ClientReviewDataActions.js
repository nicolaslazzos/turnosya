import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { localDate } from '../utils';
import {
  ON_CLIENT_REVIEW_VALUE_CHANGE,
  ON_CLIENT_REVIEW_SAVED,
  ON_CLIENT_REVIEW_SAVING,
  ON_CLIENT_REVIEW_SAVE_FAIL,
  ON_CLIENT_REVIEW_VALUES_RESET,
  ON_CLIENT_REVIEW_CREATED,
  ON_CLIENT_REVIEW_DELETED,
  ON_CLIENT_REVIEW_DELETING,
  ON_CLIENT_REVIEW_DELETE_FAIL,
  ON_CLIENT_REVIEW_READING,
  ON_CLIENT_REVIEW_READ,
  ON_CLIENT_REVIEW_READ_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onClientReviewValueChange = payload => {
  return { type: ON_CLIENT_REVIEW_VALUE_CHANGE, payload };
};

export const onClientReviewCreate = ({ commerceId, rating, comment, reservationId, clientId }) => async dispatch => {
  // review del negocio al cliente
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    const review = await axios.post(`${backendUrl}/api/reviews/create/`, { clientId, comment, rating, reviewDate: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: review.data.id });
    // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back
    dispatch({ type: ON_CLIENT_REVIEW_CREATED, payload: review.data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewReadById = ({ clientId, reservationId, reviewId }) => dispatch => {
  // review del negocio al cliente
  axios.get(`${backendUrl}/api/reviews/${reviewId}/`)
    .then(response => dispatch({ type: ON_CLIENT_REVIEW_READ, payload: { ...response.data, reviewId: response.data.id } }))
    .catch(() => dispatch({ type: ON_CLIENT_REVIEW_READ_FAIL }));
};

export const onClientReviewUpdate = ({ clientId, rating, comment, reviewId }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

  axios.patch(`${backendUrl}/api/reviews/${reviewId}/`, { comment, rating, reviewDate: localDate() })
    .then(() => dispatch({ type: ON_CLIENT_REVIEW_SAVED }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL })
    });
};

export const onClientReviewDelete = ({ clientId, reservationId, reviewId, commerceId }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_DELETING });

  try {
    await axios.patch(`${backendUrl}/api/reviews/${reviewId}/`, { softDelete: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: null });
    // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

    dispatch({ type: ON_CLIENT_REVIEW_DELETED })
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_DELETE_FAIL });
  }
};

export const onClientReviewValuesReset = () => {
  return { type: ON_CLIENT_REVIEW_VALUES_RESET };
};
