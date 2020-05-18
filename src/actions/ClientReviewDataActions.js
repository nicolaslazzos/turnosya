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

export const onClientReviewValueChange = payload => {
  return { type: ON_CLIENT_REVIEW_VALUE_CHANGE, payload };
};

export const onClientReviewCreate = ({ commerceId, rating, comment, reservationId }) => async dispatch => {
  // review del cliente al negocio
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  try {
    const review = await axios.post(`${backendUrl}/api/reviews/create/`, { commerceId, comment, rating, reviewDate: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { clientReviewId: review.data.id });
    // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back
    dispatch({ type: ON_CLIENT_REVIEW_CREATED, payload: review.data.id });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
  }
};

export const onClientReviewUpdate = ({ reviewId, rating, comment }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_SAVING });

  // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back
  axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { comment, rating, reviewDate: localDate() })
    .then(() => dispatch({ type: ON_CLIENT_REVIEW_SAVED }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_CLIENT_REVIEW_SAVE_FAIL });
    });
};

export const onClientReviewDelete = ({ reservationId, reviewId }) => async dispatch => {
  dispatch({ type: ON_CLIENT_REVIEW_DELETING });

  try {
    const requests = [];

    requests.push(axios.patch(`${backendUrl}/api/reviews/update/${reviewId}/`, { softDelete: localDate() }));
    requests.push(axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { clientReviewId: null }));
    // await axios.patch(`${backendUrl}/api/profiles/update/${clientId}/`, { rating }); // esto lo puedo hacer en el create de la review en el back

    await axios.all(requests);

    dispatch({ type: ON_CLIENT_REVIEW_DELETED });
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CLIENT_REVIEW_DELETE_FAIL });
  }
};

export const onClientReviewValuesReset = () => {
  return { type: ON_CLIENT_REVIEW_VALUES_RESET };
};
