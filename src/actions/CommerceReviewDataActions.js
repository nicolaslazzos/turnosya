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

export const onCommerceReviewValueChange = payload => ({ type: ON_COMMERCE_REVIEW_VALUE_CHANGE, payload });

export const onCommerceReviewCreate = ({ clientId, rating, comment, reservationId }) => async dispatch => {
  // review del cliente al negocio
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  try {
    const client = await axios.get(`${backendUrl}/api/profiles/${clientId}/`);

    const requests = [];

    requests.push(axios.post(`${backendUrl}/api/reviews/create/`, { clientId, comment, rating, reviewDate: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, {
      ratingTotal: client.data.ratingTotal + rating,
      ratingCount: client.data.ratingCount + 1
    }));

    let responses = await axios.all(requests);

    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: responses[0].data.id });

    dispatch({ type: ON_COMMERCE_REVIEW_CREATED, payload: responses[0].data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL });
  }
};

export const onCommerceReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_SAVING });

  try {
    const review = await axios.get(`${backendUrl}/api/reviews/${reviewId}/`);
    const client = await axios.get(`${backendUrl}/api/profiles/${review.data.clientId}/`);

    const requests = [];

    requests.push(axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { comment, rating, reviewDate: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/profiles/update/${review.data.clientId}/`, { ratingTotal: client.data.ratingTotal - review.data.rating + rating }));

    await axios.all(requests);

    dispatch({ type: ON_COMMERCE_REVIEW_SAVED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_SAVE_FAIL });
  }
};

export const onCommerceReviewDelete = ({ reservationId, reviewId }) => async dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEW_DELETING });

  try {
    const review = await axios.get(`${backendUrl}/api/reviews/${reviewId}/`);
    const client = await axios.get(`${backendUrl}/api/commerces/${review.data.clientId}/`);

    const requests = [];

    requests.push(axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { softDelete: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { commerceReviewId: null }));
    requests.push(axios.patch(`${backendUrl}/api/profiles/update/${review.data.clientId}/`, {
      ratingTotal: client.data.ratingTotal - review.data.rating,
      ratingCount: client.data.ratingCount - 1
    }));

    await axios.all(requests);

    dispatch({ type: ON_COMMERCE_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_COMMERCE_REVIEW_DELETE_FAIL });
  }
};

export const onCommerceReviewValuesReset = () => ({ type: ON_COMMERCE_REVIEW_VALUES_RESET });
