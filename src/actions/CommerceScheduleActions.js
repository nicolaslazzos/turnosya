import firebase from 'firebase/app';
import 'firebase/firestore';
import moment from 'moment';
import axios from 'axios';
import { onReservationsCancel } from './ReservationsListActions';
import { onClientNotificationSend } from './NotificationActions';
import { NOTIFICATION_TYPES, AREAS } from '../constants';
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
  try {
    let schedules = await axios.get(`${backendUrl}/api/schedules/`, {
      params: {
        commerceId,
        selectedDate: selectedDate || '',
        date: date || '',
        employeeId: employeeId || ''
      }
    });

    schedules = schedules.data.map(async schedule => {
      let selectedDays = [];
      const cards = await axios.get(`${backendUrl}/api/schedules/workshifts/`, { params: { scheduleId: schedule.id } });
      cards.data.forEach(card => { selectedDays = [...selectedDays, ...card.days] });
      return { ...formatSchedule(schedule), cards: cards.data, selectedDays };
    })

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

export const onCommerceSchedulesRead = ({ commerceId, selectedDate, date, areaId }) => async dispatch => {
  dispatch({ type: ON_ACTIVE_SCHEDULES_READING });

  try {
    const schedules = await schedulesRead({ commerceId, selectedDate, date });

    // schedules.push({
    //   ...schedule,
    //   employeeName: `${firstName} ${lastName}`,
    // });

    dispatch({ type: ON_ACTIVE_SCHEDULES_READ, payload: schedules });
  } catch (error) {
    dispatch({ type: ON_ACTIVE_SCHEDULES_READ_FAIL });
  }
};

export const onActiveSchedulesRead = ({ commerceId, date, employeeId }) => {
  onCommerceSchedulesRead({ commerceId, date, employeeId });
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

  const db = firebase.firestore();
  const batch = db.batch();
  const schedulesRef = db.collection(`Commerces/${commerceId}/Schedules`);

  schedules.forEach(schedule => {
    if (schedule.startDate < startDate && (!schedule.endDate || startDate < schedule.endDate)) {
      // si se superpone con un schedule que inicia antes, este último termina donde inicia el nuevo
      batch.update(schedulesRef.doc(schedule.id), {
        endDate: startDate.toDate(),
      });
    }

    if (schedule.startDate >= startDate && (!endDate || (schedule.endDate && schedule.endDate <= endDate))) {
      if (schedule.id === scheduleId) {
        // el schedule que se está modificando se elimina porque después se crea de nuevo
        batch.delete(schedulesRef.doc(schedule.id));
        // al eliminarlo hace falta también eliminar las subcolecciones
        schedule.cards.forEach(card => {
          const cardRef = schedulesRef.doc(`${schedule.id}/WorkShifts/${card.id}`);
          batch.delete(cardRef);
        });
      } else {
        // si un schedule anterior queda dentro del periodo de vigencia del nuevo,
        // se le hace una baja lógica
        batch.update(schedulesRef.doc(schedule.id), { softDelete: new Date() });
      }
    }

    if (
      endDate &&
      endDate > schedule.startDate &&
      (!schedule.endDate || (endDate && endDate < schedule.endDate)) &&
      schedule.startDate >= startDate
    ) {
      // si se superpone con un schedule que esta después, este último inicia donde termina el nuevo
      batch.update(schedulesRef.doc(schedule.id), {
        startDate: endDate.toDate(),
      });
    }
  });

  try {
    let newScheduleObj = {
      startDate: startDate.toDate(),
      endDate: endDate ? endDate.toDate() : null,
      softDelete: null,
      reservationMinLength,
      reservationDayPeriod,
      reservationMinCancelTime,
    };

    if (employeeId) {
      newScheduleObj = { ...newScheduleObj, employeeId };
    }

    // new schedule creation
    const newSchedule = await db.collection(`Commerces/${commerceId}/Schedules/`).add(newScheduleObj);

    cards.forEach(card => {
      const { days, firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd } = card;

      const cardRef = schedulesRef.doc(`${newSchedule.id}/WorkShifts/${card.id}`);
      batch.set(cardRef, {
        days,
        firstShiftStart,
        firstShiftEnd,
        secondShiftStart,
        secondShiftEnd,
      });
    });

    // reservations cancel
    await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    await batch.commit();

    reservationsToCancel.forEach(res => {
      if (res.clientId)
        onClientNotificationSend(res.notification, res.clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
    });

    dispatch({ type: ON_SCHEDULE_CREATED });
    return true;
  } catch (error) {
    dispatch({ type: ON_SCHEDULE_CREATE_FAIL });
    return false;
  }
};

export const onScheduleDelete = ({ commerceId, schedule, endDate, reservationsToCancel }) => async dispatch => {
  const db = firebase.firestore();
  const batch = db.batch();
  const scheduleRef = db.doc(`Commerces/${commerceId}/Schedules/${schedule.id}`);

  try {
    if (endDate <= schedule.startDate) {
      // si se está elimiando un schedule que no estaba en vigencia todavía sin reservas o
      // cancelando las reservas si es que tenía, se le hace una baja lógica
      batch.update(scheduleRef, { softDelete: new Date() });
    } else {
      // si se está eliminando un schedule que ya estaba en vigencia o uno que tiene reservas
      // sin cancelarlas, se le establece una fecha de fin de vigencia lo más pronto posible
      batch.update(scheduleRef, { endDate: endDate.toDate() });
    }

    // reservations cancel
    await onReservationsCancel(db, batch, commerceId, reservationsToCancel);

    await batch.commit();

    reservationsToCancel.forEach(res => {
      if (res.clientId)
        onClientNotificationSend(res.notification, res.clientId, commerceId, NOTIFICATION_TYPES.NOTIFICATION);
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
