import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Schedule from '../Schedule';
import { Toast } from '../common';
import { MONTHS } from '../../constants';
import {
  onScheduleRead,
  onScheduleValueChange,
  onReservationValueChange,
  onClientCommerceReservationsRead,
  onCommerceCourtsReadByType,
  isCourtDisabledOnSlot
} from '../../actions';

class ClientCourtsSchedule extends Component {
  state = { selectedDate: moment() };

  componentDidMount() {
    this.props.onScheduleRead({
      commerceId: this.props.commerce.objectID,
      selectedDate: this.state.selectedDate
    });

    this.unsubscribeCourtsRead = this.props.onCommerceCourtsReadByType({
      commerceId: this.props.commerce.objectID,
      courtTypeId: this.props.courtType
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.reservations !== this.props.reservations || prevProps.courts !== this.props.courts) {
      this.reservationsOnSlots();
    }
  }

  componentWillUnmount() {
    this.unsubscribeCourtsRead && this.unsubscribeCourtsRead();
    this.unsubscribeReservationsRead && this.unsubscribeReservationsRead();
  }

  onDateChanged = date => {
    const { scheduleStartDate, scheduleEndDate, scheduleId } = this.props;

    this.unsubscribeReservationsRead && this.unsubscribeReservationsRead();
    this.unsubscribeReservationsRead = this.props.onClientCommerceReservationsRead({
      commerceId: this.props.commerce.objectID,
      selectedDate: date,
      courtType: this.props.courtType
    });

    if (!scheduleId || (scheduleEndDate && date >= scheduleEndDate) || date < scheduleStartDate) {
      this.props.onScheduleRead({
        commerceId: this.props.commerce.objectID,
        selectedDate: date
      });
    }

    this.setState({ selectedDate: date });
  };

  onSlotPress = slot => {
    if (moment() >= slot.startDate) {
      return Toast.show({
        text: 'Ya no se puede reservar en este horario'
      });
    }

    if (!slot.available) {
      return Toast.show({
        text: 'No hay más canchas disponibles en este horario'
      });
    }

    const { startDate, endDate } = slot;

    this.props.onReservationValueChange({ startDate, endDate });

    this.props.navigation.navigate('commerceCourtsList', {
      title: startDate.format('DD') + ' de ' + MONTHS[startDate.month()] + ', ' + startDate.format('HH:mm') + ' hs.'
    });
  };

  reservationsOnSlots = () => {
    const { reservations, courts, slots } = this.props;

    const newSlots = slots.map(slot => {
      if (slot.divider) return slot;

      let reserved = 0;
      let available = true;
      let courtsAvailable = 0;

      reservations.forEach(reservation => {
        if (slot.startDate.toString() === reservation.startDate.toString()) reserved++;
      });

      courts.forEach(court => {
        !isCourtDisabledOnSlot(court, slot) && courtsAvailable++;
      });

      if (reserved >= courtsAvailable) available = false;

      return {
        ...slot,
        free: courtsAvailable - reserved,
        total: courts.length,
        available
      };
    });

    this.props.onScheduleValueChange({ slots: newSlots });
  };

  render() {
    const {
      cards,
      reservationDayPeriod,
      reservationMinLength,
      loadingSchedule,
      loadingReservations,
      loadingCourts
    } = this.props;

    const { selectedDate } = this.state;

    return (
      <Schedule
        mode="courts"
        cards={cards}
        selectedDate={selectedDate}
        reservationMinLength={reservationMinLength}
        reservationDayPeriod={reservationDayPeriod}
        datesWhitelist={[
          {
            start: moment(),
            end: moment().add(reservationDayPeriod, 'days')
          }
        ]}
        loading={loadingSchedule || loadingReservations || loadingCourts}
        onDateChanged={date => this.onDateChanged(date)}
        onSlotPress={slot => this.onSlotPress(slot)}
      />
    );
  }
}

const mapStateToProps = state => {
  const {
    id,
    cards,
    slots,
    reservationDayPeriod,
    reservationMinLength,
    startDate,
    endDate,
    refreshing,
    loadingSchedule
  } = state.commerceSchedule;
  const { commerce, courtType } = state.reservation;
  const { reservations } = state.reservationsList;
  const loadingReservations = state.reservationsList.loading;
  const { courts } = state.courtsList;
  const loadingCourts = state.courtsList.loading;

  return {
    scheduleId: id,
    commerce,
    cards,
    slots,
    reservationDayPeriod,
    reservationMinLength,
    scheduleStartDate: startDate,
    scheduleEndDate: endDate,
    refreshing,
    reservations,
    courts,
    courtType,
    loadingSchedule,
    loadingReservations,
    loadingCourts
  };
};

export default connect(mapStateToProps, {
  onScheduleValueChange,
  onScheduleRead,
  onReservationValueChange,
  onClientCommerceReservationsRead,
  onCommerceCourtsReadByType
})(ClientCourtsSchedule);
