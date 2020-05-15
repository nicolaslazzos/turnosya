import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { localDate } from '../utils';
import {
  ON_COMMERCE_REVIEW_VALUE_CHANGE,
  ON_COMMERCE_REVIEW_SAVED,
  ON_COMMERCE_REVIEW_SAVING,
  ON_COMMERCE_REVIEW_SAVE_FAIL,
  ON_COMMERCE_REVIEW_VALUES_RESET,
  ON_COMMERCE_REVIEW_CREATED,
  ON_COMMERCE_REVIEW_DELETED,
  ON_COMMERCE_REVIEW_DELETING,
  ON_COMMERCE_REVIEW_DELETE_FAIL,
  ON_COMMERCE_REVIEW_READ,
  ON_COMMERCE_REVIEW_READING,
  ON_COMMERCE_REVIEW_READ_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onCommerceReviewValueChange = payload => {
  return { type: ON_COMMERCE_REVIEW_VALUE_CHANGE, payload };
};

export const onCommerceReviewCreate = ({ clientId, rating, comment, reservationId }) => async dispatch => {
  // review del cliente al negocio
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  try {
    const review = await axios.post(`${backendUrl}/api/reviews/create/`, { clientId, rating, comment, reviewDate: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: review.data.id });
    // await axios.patch(`${backendUrl}/api/commerces/update/${commerceId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

    dispatch({ type: ON_COMMERCE_REVIEW_CREATED, payload: review.data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL });
  }
};

export const onCommerceReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  // await axios.patch(`${backendUrl}/api/commerces/update/${commerceId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

  axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { rating, comment, reviewDate: localDate() })
    .then(() => dispatch({ type: ON_COMMERCE_REVIEW_SAVED }))
    .catch(() => {
      console.error(error);
      dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL })
    });
};

export const onCommerceReviewDelete = ({ reservationId, reviewId }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_DELETING });

  try {
    await axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { softDelete: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: null });
    // await axios.patch(`${backendUrl}/api/commerces/update/${commerceId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

    dispatch({ type: ON_COMMERCE_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_DELETE_FAIL });
  }
};

export const onCommerceReviewValuesReset = () => {
  return { type: ON_COMMERCE_REVIEW_VALUES_RESET };
};
