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

export const onClientReviewValueChange = payload => ({ type: ON_CLIENT_REVIEW_VALUE_CHANGE, payload });

export const onClientReviewCreate = ({ commerceId, rating, comment, reservationId }) => async dispatch => {
  // review del cliente al negocio
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    const commerce = await axios.get(`${backendUrl}/api/commerces/${commerceId}/`);

    const requests = [];

    requests.push(axios.post(`${backendUrl}/api/reviews/create/`, { commerceId, comment, rating, reviewDate: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/commerces/update/${commerceId}/`, {
      ratingTotal: commerce.data.ratingTotal + rating,
      ratingCount: commerce.data.ratingCount + 1
    }));

    let responses = await axios.all(requests);

    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { clientReviewId: responses[0].data.id });

    dispatch({ type: ON_CLIENT_REVIEW_CREATED, payload: responses[0].data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    const review = await axios.get(`${backendUrl}/api/reviews/${reviewId}/`);
    const commerce = await axios.get(`${backendUrl}/api/commerces/${review.data.commerceId}/`);

    const requests = [];

    requests.push(axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { comment, rating, reviewDate: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/commerces/update/${review.data.commerceId}/`, { ratingTotal: commerce.data.ratingTotal - review.data.rating + rating }));

    await axios.all(requests);

    dispatch({ type: ON_CLIENT_REVIEW_SAVED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewDelete = ({ reservationId, reviewId }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_DELETING });

  try {
    const review = await axios.get(`${backendUrl}/api/reviews/${reviewId}/`);
    const commerce = await axios.get(`${backendUrl}/api/commerces/${review.data.commerceId}/`);

    const requests = [];

    requests.push(axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { softDelete: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { clientReviewId: null }));
    requests.push(axios.patch(`${backendUrl}/api/commerces/update/${review.data.commerceId}/`, {
      ratingTotal: commerce.data.ratingTotal - review.data.rating,
      ratingCount: commerce.data.ratingCount - 1
    }));

    await axios.all(requests);

    dispatch({ type: ON_CLIENT_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_DELETE_FAIL });
  }
};

export const onClientReviewValuesReset = () => ({ type: ON_CLIENT_REVIEW_VALUES_RESET });
