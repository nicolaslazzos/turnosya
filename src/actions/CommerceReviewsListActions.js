import firebase from 'firebase/app';
import 'firebase/firestore';
import axios from 'axios';
import { ON_COMMERCE_REVIEWS_READING, ON_COMMERCE_REVIEWS_READ, ON_COMMERCE_REVIEWS_READ_FAIL } from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

// export const onCommerceReviewsRead = (commerceId, lastVisible = null) => dispatch => {
//   dispatch({ type: ON_COMMERCE_REVIEWS_READING, payload: lastVisible ? 'refreshing' : 'loading' });

//   const db = firebase.firestore();
//   let reviews = [];

//   let query = db.collection(`Commerces/${commerceId}/Reviews`)
//     .where('softDelete', '==', null)
//     .orderBy('date', 'desc');

//   if (lastVisible) query = query.startAfter(lastVisible);

//   query
//     .limit(12)
//     .get()
//     .then(querySnapshot => {
//       querySnapshot.forEach(doc => reviews.push({ ...doc.data(), id: doc.id }));
//       dispatch({ type: ON_COMMERCE_REVIEWS_READ, payload: { reviews, firstRead: !lastVisible } });
//     })
//     .catch(() => dispatch({ type: ON_COMMERCE_REVIEWS_READ_FAIL }));
// };

export const onCommerceReviewsRead = (commerceId, lastVisible = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REVIEWS_READING, payload: lastVisible ? 'refreshing' : 'loading' });

  axios.get(`${backendUrl}/api/reviews/`, { params: { commerceId } })
    .then(response => dispatch({ type: ON_COMMERCE_REVIEWS_READ, payload: { reviews: response.data, firstRead: !lastVisible } }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_COMMERCE_REVIEWS_READ_FAIL })
    });
};