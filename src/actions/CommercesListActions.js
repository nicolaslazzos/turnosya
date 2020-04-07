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

  axios.get(`${backendUrl}/api/commerces?areaId=${areaId || ''}&provinceId=${provinceId || ''}&contains=${contains || ''}`)
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

export const onFavoriteCommerceDelete = commerceId => {
  const db = firebase.firestore();
  const { currentUser } = firebase.auth();

  return dispatch => {
    db.doc(`Profiles/${currentUser.uid}/FavoriteCommerces/${commerceId}`)
      .delete()
      .then(() => dispatch({ type: ON_FAVORITE_COMMERCE_DELETED, payload: commerceId }))
      .catch(error => console.error(error));
  };
};

export const onFavoriteCommerceRegister = commerceId => {
  const db = firebase.firestore();
  const { currentUser } = firebase.auth();

  return dispatch => {
    db.doc(`Profiles/${currentUser.uid}/FavoriteCommerces/${commerceId}`)
      .set({})
      .then(() => dispatch({ type: ON_FAVORITE_COMMERCE_ADDED, payload: commerceId }))
      .catch(error => console.error(error));
  };
};

export const onFavoriteCommercesRead = () => {
  const db = firebase.firestore();
  const { currentUser } = firebase.auth();

  return dispatch => {
    db.collection(`Profiles/${currentUser.uid}/FavoriteCommerces`)
      .get()
      .then(snapshot => {
        const favoriteCommerces = [];
        snapshot.forEach(doc => favoriteCommerces.push(doc.id));
        dispatch({
          type: ON_COMMERCES_LIST_VALUE_CHANGE,
          payload: { favoriteCommerces }
        });
      });
  };
};

export const onOnlyFavoriteCommercesRead = () => dispatch => {
  dispatch({ type: ON_ONLY_FAVORITE_COMMERCES_READING });

  const db = firebase.firestore();
  const { currentUser } = firebase.auth();

  return db.collection(`Profiles/${currentUser.uid}/FavoriteCommerces`).onSnapshot(snapshot => {
    const favoriteCommerces = [];
    const onlyFavoriteCommerces = [];
    let processedItems = 0;

    if (snapshot.empty) {
      return dispatch({
        type: ON_ONLY_FAVORITE_COMMERCES_READ,
        payload: { favoriteCommerces, onlyFavoriteCommerces }
      });
    }

    snapshot.forEach(doc => {
      db.doc(`Commerces/${doc.id}`)
        .get()
        .then(commerce => {
          if (commerce.data().softDelete == null) {
            const { profilePicture, name, area, address, province, city } = commerce.data();

            onlyFavoriteCommerces.push({
              profilePicture,
              name,
              address,
              city,
              provinceName: province.name,
              areaName: area.name,
              objectID: commerce.id
            });

            favoriteCommerces.push(doc.id);
          }

          processedItems++;

          if (processedItems === snapshot.size) {
            dispatch({
              type: ON_ONLY_FAVORITE_COMMERCES_READ,
              payload: { favoriteCommerces, onlyFavoriteCommerces }
            });
          }
        });
    });
  });
};
