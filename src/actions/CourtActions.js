import firebase from 'firebase/app';
import 'firebase/firestore';
import moment from 'moment';
import axios from 'axios';
import { onReservationsCancel } from './ReservationsListActions';
import { onClientNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import {
  ON_COURT_VALUE_CHANGE,
  ON_COURT_FORM_OPEN,
  ON_COURT_CREATE,
  ON_COURT_FORM_SUBMIT,
  ON_COURT_EXISTS,
  ON_COURT_READING,
  ON_COURT_READ,
  ON_COURT_DELETE,
  ON_COURT_UPDATE,
  COMMERCE_COURT_TYPES_READ,
  COMMERCE_COURT_TYPES_READING,
  COMMERCE_COURT_TYPES_READ_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onCourtValueChange = payload => {
  return { type: ON_COURT_VALUE_CHANGE, payload };
};

export const onCourtFormOpen = () => {
  return { type: ON_COURT_FORM_OPEN };
};

export const onCourtAndGroundTypesRead = () => async dispatch => {
  try {
    const courtTypes = await axios.get(`${backendUrl}/api/court-types/id/`);
    const groundTypes = await axios.get(`${backendUrl}/api/ground-types/id/`);
    dispatch({ type: ON_COURT_VALUE_CHANGE, payload: { courts: courtTypes.data, grounds: groundTypes.data } });
  } catch (error) {
    console.error(error);
  }
};

export const onCourtCreate = ({ name, description, courtTypeId, groundTypeId, price, lightPrice, lightHour, disabledFrom, disabledTo, commerceId }, navigation) => dispatch => {
  dispatch({ type: ON_COURT_FORM_SUBMIT });

  axios.post(`${backendUrl}/api/courts/create/`, {
    commerceId,
    name,
    description,
    courtTypeId,
    groundTypeId,
    price,
    lightPrice,
    lightHour,
    disabledFrom: disabledFrom ? disabledFrom.toDate() : null,
    disabledTo: disabledTo ? disabledTo.toDate() : null
  })
    .then(() => {
      // dispatch({ type: ON_COURT_EXISTS });
      dispatch({ type: ON_COURT_CREATE });
      navigation.goBack();
    })
    .catch(error => console.error(error));
};

export const isCourtDisabledOnSlot = (court, slot) => {
  // esta no es una action pero la clavé acá porque la uso en varios componentes
  // y no me parecía ponerla en utils, de última vermos donde ubicarla
  const { disabledTo, disabledFrom } = court;
  const { startDate, endDate } = slot;

  if (disabledFrom) {
    return (
      ((!disabledTo || disabledTo >= endDate) && disabledFrom < endDate) ||
      (disabledTo && disabledTo < endDate && disabledTo > startDate)
    );
  }

  return false;
};

const formatCourt = doc => {
  return {
    ...doc.data(),
    id: doc.id,
    disabledFrom: doc.data().disabledFrom ? moment(doc.data().disabledFrom.toDate()) : null,
    disabledTo: doc.data().disabledTo ? moment(doc.data().disabledTo.toDate()) : null
  };
};

export const onCourtsRead = commerceId => dispatch => {
  dispatch({ type: ON_COURT_READING });

  axios.get(`${backendUrl}/api/courts/${prop}`, { params: { commerceId } })
    .then(response => dispatch({ type: ON_COURT_READ, payload: response.data })) // formatCourt(doc))
    .catch(error => console.error(error));
};

export const onCourtDelete = ({ id, commerceId, reservationsToCancel }) => async dispatch => {
  try {
    axios.patch(`${backendUrl}/api/courts/update/${id}/`, { softDelete: new Date() });

    // reservations cancel
    // await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    // reservationsToCancel.forEach(res => {
    //   if (res.clientId)
    //     onClientNotificationSend(res.notification, res.clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
    // });

    dispatch({ type: ON_COURT_DELETE });
  } catch (error) {
    console.error(error);
  }
};

export const onCourtUpdate = (courtData, navigation) => async dispatch => {
  dispatch({ type: ON_COURT_FORM_SUBMIT });

  const {
    id,
    name,
    description,
    courtTypeId,
    groundTypeId,
    price,
    lightPrice,
    lightHour,
    disabledFrom,
    disabledTo,
    commerceId,
    reservationsToCancel
  } = courtData;

  try {
    // dispatch({ type: ON_COURT_EXISTS });

    axios.patch(`${backendUrl}/api/courts/update/${id}/`, {
      name,
      description,
      courtTypeId,
      groundTypeId,
      price,
      lightPrice,
      lightHour,
      disabledFrom: disabledFrom ? disabledFrom.toDate() : null,
      disabledTo: disabledTo ? disabledTo.toDate() : null
    });

    // reservations cancel
    // await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    // reservationsToCancel.forEach(res => {
    //   if (res.clientId)
    //     onClientNotificationSend(res.notification, res.clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
    // });

    dispatch({ type: ON_COURT_UPDATE });
    navigation.goBack();
  } catch (error) {
    console.error(error);
  }
};

export const onCommerceCourtTypesRead = (commerceId, loadingType = 'loading') => {
  const db = firebase.firestore();

  return dispatch => {
    dispatch({ type: COMMERCE_COURT_TYPES_READING, payload: loadingType });

    db.collection(`Commerces/${commerceId}/Courts`)
      .where('softDelete', '==', null)
      .get()
      .then(snapshot => {
        const courtTypes = [];

        snapshot.forEach(doc => {
          if (!courtTypes.includes(doc.data().court)) {
            courtTypes.push(doc.data().court);
          }
        });

        db.collection('CourtType')
          .get()
          .then(snapshot => {
            const courtTypesList = [];

            snapshot.forEach(doc => {
              if (courtTypes.includes(doc.id)) {
                courtTypesList.push({ name: doc.id, image: doc.data().image });
              }
            });

            dispatch({
              type: COMMERCE_COURT_TYPES_READ,
              payload: courtTypesList
            });
          })
          .catch(error => dispatch({ type: COMMERCE_COURT_TYPES_READ_FAIL }));
      })
      .catch(error => dispatch({ type: COMMERCE_COURT_TYPES_READ_FAIL }));
  };
};

export const onCommerceCourtsReadByType = ({ commerceId, courtType }) => dispatch => {
  dispatch({ type: ON_COURT_READING, payload: 'loading' });

  const db = firebase.firestore();

  return (
    db
      .collection(`Commerces/${commerceId}/Courts`)
      .where('softDelete', '==', null)
      .where('court', '==', courtType)
      .orderBy('name', 'asc')
      .onSnapshot(snapshot => {
        const courts = [];
        snapshot.forEach(doc => courts.push(formatCourt(doc)));
        dispatch({ type: ON_COURT_READ, payload: courts });
      })
  );
};
