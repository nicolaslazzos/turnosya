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
  ON_COMMERCE_REVIEW_DELETE_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

// review del cliente al negocio

export const onCommerceReviewValueChange = payload => ({ type: ON_COMMERCE_REVIEW_VALUE_CHANGE, payload });

export const onCommerceReviewCreate = ({ clientId, rating, comment, reservationId }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  try {
    const response =  await axios.post(`${backendUrl}/api/reviews/create/`, { reservationId, clientId, comment, rating, reviewDate: localDate() });
    dispatch({ type: ON_COMMERCE_REVIEW_CREATED, payload: response.data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL });
  }
};

export const onCommerceReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  try {
    await axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { comment, rating, reviewDate: localDate() });
    dispatch({ type: ON_COMMERCE_REVIEW_SAVED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL });
  }
};

export const onCommerceReviewDelete = reviewId => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_DELETING });

  try {
    await axios.delete(`${backendUrl}/api/reviews/delete/${reviewId}/`);
    dispatch({ type: ON_COMMERCE_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_DELETE_FAIL });
  }
};

export const onCommerceReviewValuesReset = () => ({ type: ON_COMMERCE_REVIEW_VALUES_RESET });
