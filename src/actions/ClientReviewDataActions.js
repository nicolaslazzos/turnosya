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
  ON_CLIENT_REVIEW_DELETE_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

// review del cliente al negocio

export const onClientReviewValueChange = payload => ({ type: ON_CLIENT_REVIEW_VALUE_CHANGE, payload });

export const onClientReviewCreate = ({ commerceId, rating, comment, reservationId }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    const response = await axios.post(`${backendUrl}/api/reviews/create/`, { reservationId, commerceId, comment, rating, reviewDate: localDate() });
    dispatch({ type: ON_CLIENT_REVIEW_CREATED, payload: response.data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    await axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { comment, rating, reviewDate: localDate() });
    dispatch({ type: ON_CLIENT_REVIEW_SAVED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewDelete = reviewId => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_DELETING });

  try {
    await axios.delete(`${backendUrl}/api/reviews/delete/${reviewId}/`);
    dispatch({ type: ON_CLIENT_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_DELETE_FAIL });
  }
};

export const onClientReviewValuesReset = () => ({ type: ON_CLIENT_REVIEW_VALUES_RESET });
