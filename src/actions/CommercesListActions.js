import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import getEnvVars from '../../environment';
import {
  ON_FAVORITE_COMMERCE_ADDED,
  ON_FAVORITE_COMMERCE_DELETED,
  ON_ONLY_FAVORITE_COMMERCES_READ,
  ON_ONLY_FAVORITE_COMMERCES_READING,
  ON_AREAS_READING,
  ON_AREAS_SEARCH_READ,
  ON_COMMERCES_LIST_VALUE_CHANGE,
  ON_COMMERCES_LIST_READ,
  ON_COMMERCES_LIST_READ_FAIL,
  ON_COMMERCES_LIST_READING
} from './types';

const { backendUrl } = getEnvVars();

export const onCommercesListValueChange = payload => ({
  type: ON_COMMERCES_LIST_VALUE_CHANGE,
  payload
});

export const onCommercesRead = ({ areaId, provinceId, contains }) => dispatch => {
  dispatch({ type: ON_COMMERCES_LIST_READING });

  axios.get(`${backendUrl}/api/commerces/`, { params: { areaId: areaId || '', provinceId: provinceId || '', contains: contains || '' } })
    .then(response => dispatch({ type: ON_COMMERCES_LIST_READ, payload: response.data }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_COMMERCES_LIST_READ_FAIL });
    });
}

export const onAreasRead = () => dispatch => {
  dispatch({ type: ON_AREAS_READING });

  axios.get(`${backendUrl}/api/areas/`)
    .then(response => dispatch({ type: ON_AREAS_SEARCH_READ, payload: { areas: response.data } }))
    .catch(error => console.error(error));
};

export const onFavoriteCommerceDelete = favoriteId => dispatch => {
  axios.delete(`${backendUrl}/api/favorites/delete/${favoriteId}/`)
    .then(() => dispatch({ type: ON_FAVORITE_COMMERCE_DELETED, payload: favoriteId }))
    .catch(error => console.error(error));
};

export const onFavoriteCommerceRegister = commerceId => dispatch => {
  const { currentUser } = firebase.auth();

  axios.post(`${backendUrl}/api/favorites/create/`, { commerceId, profileId: currentUser.uid })
    .then(response => dispatch({ type: ON_FAVORITE_COMMERCE_ADDED, payload: response.data }))
    .catch(error => console.error(error));
};

export const onFavoriteCommercesRead = () => dispatch => {
  const { currentUser } = firebase.auth();

  axios.get(`${backendUrl}/api/favorites/id/`, {
    params: { profileId: currentUser.uid }
  })
    .then(response => dispatch({ type: ON_COMMERCES_LIST_VALUE_CHANGE, payload: { favoriteCommerces: response.data } }))
    .catch(error => console.error(error));
};

export const onOnlyFavoriteCommercesRead = () => dispatch => {
  dispatch({ type: ON_ONLY_FAVORITE_COMMERCES_READING });

  const { currentUser } = firebase.auth();

  axios.get(`${backendUrl}/api/favorites/`, { params: { profileId: currentUser.uid } })
    .then(response => dispatch({ type: ON_ONLY_FAVORITE_COMMERCES_READ, payload: { onlyFavoriteCommerces: response.data } }))
    .catch(error => console.error(error));
};
