import firebase from 'firebase/app';
import 'firebase/firestore';
import moment from 'moment';
import axios from 'axios';
import { onReservationsCancel } from './ReservationsListActions';
import { onClientNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES, AREAS } from '../constants';
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
  const { reservationDayPeriod, reservationMinLength, startDate, endDate, employeeId } = schedule;

  return {
    ...schedule,
    startDate: moment(startDate),
    endDate: endDate ? moment(endDate) : null,
    // reservationDayPeriod,
    // reservationMinLength,
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
      const cards = await axios.get(`${backendUrl}/api/schedules/workshifts/`, { params: { scheduleId: schedule.id } });
      cards.data.forEach(card => { selectedDays = [...selectedDays, ...card.days] });
      schedules.push({ ...formatSchedule(schedule), cards: cards.data, selectedDays });
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

    // schedules.push({
    //   ...schedule,
    //   employeeName: `${firstName} ${lastName}`,
    // });

    dispatch({ type: ON_ACTIVE_SCHEDULES_READ, payload: schedules });
  } catch (error) {
    dispatch({ type: ON_ACTIVE_SCHEDULES_READ_FAIL });
  }
};

export const onScheduleUpdate = scheduleData => async dispatch => {
  dispatch({ type: ON_SCHEDULE_CREATING });

  const {
    commerceId,
    scheduleId,
    cards,
    reservationMinLength,
    reservationDayPeriod,
    reservationMinCancelTime,
    startDate,
    endDate,
    schedules,
    reservationsToCancel,
    employeeId,
  } = scheduleData;

  const requests = [];

  schedules.forEach(schedule => {
    if (schedule.startDate < startDate && (!schedule.endDate || startDate < schedule.endDate)) {
      // si se superpone con un schedule que inicia antes, este último termina donde inicia el nuevo
      requests.push(axios.patch(`${backendUrl}/api/schedules/update/${schedule.id}/`, { endDate: localDate(startDate) }));
    }

    if (schedule.startDate >= startDate && (!endDate || (schedule.endDate && schedule.endDate <= endDate))) {
      // si un schedule anterior queda dentro del periodo de vigencia del nuevo, se elimina
      requests.push(axios.delete(`${backendUrl}/api/schedules/delete/${schedule.id}/`));
    }

    if (endDate && endDate > schedule.startDate && (!schedule.endDate || (endDate && endDate < schedule.endDate)) && schedule.startDate >= startDate) {
      // si se superpone con un schedule que esta después, este último inicia donde termina el nuevo
      requests.push(axios.patch(`${backendUrl}/api/schedules/update/${schedule.id}/`, { startDate: localDate(endDate) }));
    }
  });

  try {
    let newScheduleObject = {
      commerceId,
      startDate: localDate(startDate),
      endDate: endDate ? localDate(endDate) : null,
      employeeId,
      reservationMinLength,
      // reservationDayPeriod,
      // reservationMinCancelTime,
    };

    // if (employeeId) {
    //   newScheduleObject = { ...newScheduleObject, employeeId };
    // }

    // new schedule creation
    const newSchedule = await axios.post(`${backendUrl}/api/schedules/create/`, newScheduleObject);

    cards.forEach(card => {
      const { days, firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd } = card;

      requests.push(axios.post(`${backendUrl}/api/schedules/workshifts/create/`, {
        scheduleId: newSchedule.data.id,
        days,
        firstShiftStart,
        firstShiftEnd,
        secondShiftStart,
        secondShiftEnd
      }));
    });

    await axios.all(requests);

    // reservations cancel
    // await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    reservationsToCancel.forEach(res => {
      if (res.client) onClientNotificationSend(res.notification, res.client.profileId, NOTIFICATION_TYPES.NOTIFICATION);
    });

    dispatch({ type: ON_SCHEDULE_CREATED });
    return true;
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
    return false;
  }
};

export const onScheduleDelete = ({ commerceId, schedule, endDate, reservationsToCancel }) => async dispatch => {

  try {
    if (endDate <= schedule.startDate) {
      // si se está elimiando un schedule que no estaba en vigencia todavía sin reservas o
      // cancelando las reservas si es que tenía, se le hace una baja lógica
      await axios.delete(`${backendUrl}/api/schedules/delete/${schedule.id}/`);
    } else {
      // si se está eliminando un schedule que ya estaba en vigencia o uno que tiene reservas
      // sin cancelarlas, se le establece una fecha de fin de vigencia lo más pronto posible
      await axios.patch(`${backendUrl}/api/schedules/update/${schedule.id}/`, { endDate: localDate(startDate) });
    }

    // reservations cancel
    // await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    reservationsToCancel.forEach(res => {
      if (res.client) onClientNotificationSend(res.notification, res.client.profileId, NOTIFICATION_TYPES.NOTIFICATION);
    });

    dispatch({ type: ON_SCHEDULE_CREATED });
    return true;
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
    return false;
  }
};

export const onScheduleConfigurationSave = (
  { reservationDayPeriod, reservationMinCancelTime, commerceId, date, employeeId },
  navigation
) => async dispatch => {
  dispatch({ type: ON_SCHEDULE_CONFIG_UPDATING });

  const db = firebase.firestore();
  const batch = db.batch();
  const schedulesRef = db.collection(`Commerces/${commerceId}/Schedules`);
  const updateObj = { reservationDayPeriod, reservationMinCancelTime };

  try {
    let snapshot = await schedulesRef
      .where('softDelete', '==', null)
      .where('endDate', '>=', date.toDate())
      .orderBy('endDate')
      .get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        if (!employeeId || (employeeId === doc.data().employeeId))
          batch.update(doc.ref, updateObj)
      });
    }

    snapshot = await schedulesRef
      .where('softDelete', '==', null)
      .where('endDate', '==', null)
      .get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        if (!employeeId || (employeeId === doc.data().employeeId))
          batch.update(doc.ref, updateObj)
      });
    }

    await batch.commit();

    dispatch({ type: ON_SCHEDULE_CONFIG_UPDATED });
    navigation.goBack();
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
  }
};
