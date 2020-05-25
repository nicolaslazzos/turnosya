import firebase from 'firebase/app';
import 'firebase/firestore';
import moment from 'moment';
import axios from 'axios';
import { onReservationsCancel } from './ReservationsListActions';
import { onNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES } from '../constants';
import { localDate } from '../utils';
import {
  ON_SCHEDULE_FORM_OPEN,
  ON_SCHEDULE_VALUE_CHANGE,
  ON_SCHEDULE_CARD_VALUE_CHANGE,
  ON_SCHEDULE_CARD_DELETE,
  ON_SCHEDULE_READ,
  ON_SCHEDULE_READING,
  ON_SCHEDULE_READ_FAIL,
  ON_SCHEDULE_CREATED,
  ON_SCHEDULE_CREATING,
  ON_SCHEDULE_CREATE_FAIL,
  ON_SCHEDULE_CONFIG_UPDATING,
  ON_SCHEDULE_CONFIG_UPDATED,
  ON_SCHEDULE_READ_EMPTY,
  ON_ACTIVE_SCHEDULES_READ,
  ON_ACTIVE_SCHEDULES_READING,
  ON_ACTIVE_SCHEDULES_READ_FAIL
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onScheduleValueChange = payload => {
  return { type: ON_SCHEDULE_VALUE_CHANGE, payload };
};

export const onScheduleCardValueChange = card => {
  return { type: ON_SCHEDULE_CARD_VALUE_CHANGE, payload: card };
};

export const onScheduleCardDelete = cardId => {
  return { type: ON_SCHEDULE_CARD_DELETE, payload: cardId };
};

export const onScheduleFormOpen = () => {
  return { type: ON_SCHEDULE_FORM_OPEN };
};

const formatSchedule = schedule => {
  const { startDate, endDate, employeeId } = schedule;

  return {
    ...schedule,
    startDate: moment(startDate),
    endDate: endDate ? moment(endDate) : null,
    employeeId: employeeId || null,
  };
};

const schedulesRead = async ({ commerceId, selectedDate, date, employeeId }) => {
  const schedules = [];

  try {
    const response = await axios.get(`${backendUrl}/api/schedules/`, {
      params: {
        commerceId,
        selectedDate: selectedDate ? localDate(selectedDate) : null,
        date: date ? localDate(date) : null,
        employeeId
      }
    });

    for (const schedule of response.data) {
      let selectedDays = [];
      const settingsResponse = await axios.get(`${backendUrl}/api/schedules/settings/`, { params: { commerceId, employeeId } });
      const setting = settingsResponse.data.length ? settingsResponse.data[0] : {}; // esto mandarlo directamente desde el serializer del schedule

      const cards = await axios.get(`${backendUrl}/api/schedules/workshifts/`, { params: { scheduleId: schedule.id } });
      cards.data.forEach(card => { selectedDays = [...selectedDays, ...card.days] });

      schedules.push({ ...formatSchedule(schedule), cards: cards.data, selectedDays, ...setting });
    }

    return schedules;
  } catch (error) {
    return error;
  }
};

export const onScheduleRead = ({ commerceId, selectedDate, employeeId }) => async dispatch => {
  dispatch({ type: ON_SCHEDULE_READING });

  try {
    const schedules = await schedulesRead({ commerceId, selectedDate, employeeId });

    if (schedules.length) {
      dispatch({ type: ON_SCHEDULE_READ, payload: schedules[0] });
    } else {
      dispatch({ type: ON_SCHEDULE_READ_EMPTY });
    }
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_READ_FAIL });
  }
};

export const onCommerceSchedulesRead = ({ commerceId, selectedDate, date, employeeId }) => async dispatch => {
  dispatch({ type: ON_ACTIVE_SCHEDULES_READING });

  try {
    const schedules = await schedulesRead({ commerceId, selectedDate, date, employeeId });

    dispatch({ type: ON_ACTIVE_SCHEDULES_READ, payload: schedules });
  } catch (error) {
    dispatch({ type: ON_ACTIVE_SCHEDULES_READ_FAIL });
  }
};

export const onScheduleUpdate = scheduleData => async dispatch => {
  dispatch({ type: ON_SCHEDULE_CREATING });

  const {
    commerceId,
    cards,
    reservationMinLength,
    startDate,
    endDate,
    schedules,
    reservationsToCancel,
    employeeId,
  } = scheduleData;

  try {
    let requests = [];

    const schedule = await axios.post(`${backendUrl}/api/schedules/create/`, {
      commerceId,
      startDate: localDate(startDate),
      endDate: endDate ? localDate(endDate) : null,
      employeeId,
      reservationMinLength,
      reservationsToCancel: reservationsToCancel.map(res => res.id)
    });

    cards.forEach(card => {
      const { days, firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd } = card;

      requests.push(axios.post(`${backendUrl}/api/schedules/workshifts/create/`, {
        scheduleId: schedule.data.id,
        days,
        firstShiftStart,
        firstShiftEnd,
        secondShiftStart,
        secondShiftEnd
      }));
    });

    await axios.all(requests);

    reservationsToCancel.forEach(res => {
      if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
    });

    dispatch({ type: ON_SCHEDULE_CREATED });
    return true;
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
    return false;
  }
};

export const onScheduleDelete = ({ schedule, endDate, reservationsToCancel }) => async dispatch => {

  try {
    await axios.patch(`${backendUrl}/api/schedules/update/${schedule.id}/`, { endDate: localDate(endDate), reservationsToCancel: reservationsToCancel.map(res => res.id) });

    reservationsToCancel.forEach(res => {
      if (res.client) onNotificationSend({ notification: res.notification, profileId: res.client.profileId, notificationTypeId: NOTIFICATION_TYPES.NOTIFICATION });
    });

    dispatch({ type: ON_SCHEDULE_CREATED });
    return true;
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
    return false;
  }
};

export const onScheduleConfigurationSave = ({ scheduleSettingId, commerceId, employeeId, reservationDayPeriod, reservationMinCancelTime }, navigation) => async dispatch => {
  dispatch({ type: ON_SCHEDULE_CONFIG_UPDATING });

  try {
    let response;

    if (scheduleSettingId) {
      response = await axios.patch(`${backendUrl}/api/schedules/settings/update/${scheduleSettingId}/`, { reservationDayPeriod, reservationMinCancelTime });
    } else {
      response = await axios.post(`${backendUrl}/api/schedules/settings/create/`, { commerceId, employeeId, reservationDayPeriod, reservationMinCancelTime });
    }

    dispatch({ type: ON_SCHEDULE_VALUE_CHANGE, payload: { scheduleSettingId: response.data.id } });
    dispatch({ type: ON_SCHEDULE_CONFIG_UPDATED });
    navigation.goBack();
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
  }
};
