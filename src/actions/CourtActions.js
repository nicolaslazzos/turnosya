import moment from 'moment';
import axios from 'axios';
import { onNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import { localDate } from '../utils';
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
    price: parseFloat(price),
    lightPrice: parseFloat(lightPrice),
    lightHour,
    disabledFrom: disabledFrom ? localDate(disabledFrom) : null,
    disabledTo: disabledTo ? localDate(disabledTo) : null
  })
    .then(response => {
      if (response.data[ON_COURT_EXISTS]) return dispatch({ type: ON_COURT_EXISTS });

      dispatch({ type: ON_COURT_CREATE });
      navigation.goBack();
    })
    .catch(error => console.error(error));
};

export const isCourtDisabledOnSlot = (court, slot) => {
  // esta no es una action pero la clavé acá porque la uso en varios componentes y no me parecía ponerla en utils, de última vermos donde ubicarla
  const { disabledTo, disabledFrom } = court;
  const { startDate, endDate } = slot;

  if (disabledFrom) return (((!disabledTo || disabledTo >= endDate) && disabledFrom < endDate) || (disabledTo && disabledTo < endDate && disabledTo > startDate));
  return false;
};

const formatCourt = court => {
  return {
    ...court,
    disabledFrom: court.disabledFrom ? moment(court.disabledFrom) : null,
    disabledTo: court.disabledTo ? moment(court.disabledTo) : null
  };
};

export const onCourtsRead = ({ commerceId, courtTypeId }) => dispatch => {
  dispatch({ type: ON_COURT_READING });

  axios.get(`${backendUrl}/api/courts/`, { params: { commerceId, courtTypeId: courtTypeId || null } })
    .then(response => dispatch({ type: ON_COURT_READ, payload: response.data.map(formatCourt) }))
    .catch(error => console.error(error));
};

export const onCourtDelete = ({ courtId, reservationsToCancel }) => async dispatch => {
  try {
    axios.delete(`${backendUrl}/api/courts/delete/${courtId}/`, { params: { reservationsToCancel: reservationsToCancel.map(res => res.id).toString() } });

    reservationsToCancel.forEach(res => {
      if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
    });

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
    reservationsToCancel
  } = courtData;

  try {
    const response = await axios.patch(`${backendUrl}/api/courts/update/${id}/`, {
      name,
      description,
      courtTypeId,
      groundTypeId,
      price: parseFloat(price),
      lightPrice: parseFloat(lightPrice),
      lightHour,
      disabledFrom: disabledFrom ? localDate(disabledFrom) : null,
      disabledTo: disabledTo ? localDate(disabledTo) : null,
      reservationsToCancel: reservationsToCancel.map(res => res.id)
    });

    if (response.data[ON_COURT_EXISTS]) return dispatch({ type: ON_COURT_EXISTS });

    reservationsToCancel.forEach(res => {
      if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
    });

    dispatch({ type: ON_COURT_UPDATE });
    navigation.goBack();
  } catch (error) {
    console.log(error);
  }
};

export const onCommerceCourtTypesRead = (commerceId, loadingType = 'loading') => dispatch => {
  dispatch({ type: COMMERCE_COURT_TYPES_READING, payload: loadingType });

  axios.get(`${backendUrl}/api/court-types/`, { params: { commerceId } })
    .then(response => dispatch({ type: COMMERCE_COURT_TYPES_READ, payload: response.data }))
    .catch(error => {
      console.error(error);
      dispatch({ type: COMMERCE_COURT_TYPES_READ_FAIL })
    });
};