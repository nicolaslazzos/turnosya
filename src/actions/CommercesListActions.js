import firebase from 'firebase/app';
import 'firebase/firestore';
import {
  ON_AREAS_READING,
  ON_AREAS_SEARCH_READ,
  ON_COMMERCE_SEARCHING
} from './types';

export const commerceSearching = isSearching => {
  return { type: ON_COMMERCE_SEARCHING, payload: isSearching };
};

export const areasRead = () => {
  const db = firebase.firestore();

  return dispatch => {
    dispatch({ type: ON_AREAS_READING });
    db.collection('Areas')
      .where('softDelete', '==', null)
      .orderBy('name', 'asc')
      .onSnapshot(snapShot => {
        const areas = [];
        snapShot.forEach(doc => areas.push({ ...doc.data(), id: doc.id }));
        dispatch({ type: ON_AREAS_SEARCH_READ, payload: areas });
      });
  };
};
