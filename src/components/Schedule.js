import React, { Component } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Image } from 'react-native';
import { ListItem } from 'react-native-elements';
import { connect } from 'react-redux';
import moment from 'moment';
import { Badge, Calendar, Spinner, EmptyList } from './common';
import { getHourAndMinutes } from '../utils';
import { MAIN_COLOR, WARNING_COLOR, SUCCESS_COLOR, GREY_DISABLED } from '../constants';
import { onScheduleValueChange } from '../actions';

/*
    props: {
        cards: objects array,
        selectedDate: date,
        onDateChanged: function,
        reservationMinLength: int,
        reservationDayPeriod: int,'
        loading: bool,
        onRefresh: function
        onSlotPress: return slot pressed,
    }

    slot: {
      id: identificador unico,
      shiftId: si pertenece al primer o segundo turno
      startDate: fecha y hora de inicio del turno,
      endDate: fecha y hora de fin del turno,
      available: indica si tiene turnos libres o no,
      disabled: indica si esta deshabilitado o no el slot,
      free: cantidad de turnos libres en el slot,
      total: total de turnos disponibles para reservar
    }
*/

class Schedule extends Component {
  componentDidUpdate(prevProps) {
    // se estarian generando los slots cada vez que se trae una nueva diagramacion
    if (prevProps.loadingSchedule && !this.props.loadingSchedule) {
      if (this.props.scheduleId) {
        this.onDateSelected(this.props.selectedDate);
      } else {
        this.props.onScheduleValueChange({ slots: [] });
      }
    }
  }

  onDateSelected = selectedDate => {
    selectedDate = moment([selectedDate.year(), selectedDate.month(), selectedDate.date()]);

    //slots & shifts
    let slots = [];
    const shifts = [];
    const { cards } = this.props;
    const dayShifts = cards.find(card => card.days.includes(selectedDate.day())); // horario de atención ese día de la semana

    //si hay horario de atención ese día, genera los slots
    if (dayShifts) {
      const { firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd } = dayShifts;

      shifts.push({ shiftStart: firstShiftStart, shiftEnd: firstShiftEnd });

      if (secondShiftStart && secondShiftEnd) {
        shifts.push({ shiftStart: secondShiftStart, shiftEnd: secondShiftEnd });
      }

      slots = this.generateSlots(selectedDate, shifts);
    }

    this.props.onScheduleValueChange({ slots });
    this.props.onDateChanged(selectedDate);
  };

  generateSlots = (selectedDate, shifts) => {
    // selected date params
    const year = selectedDate.year();
    const month = selectedDate.month();
    const date = selectedDate.date(); // día del mes

    const { reservationMinLength } = this.props;
    const slots = [];

    shifts.forEach((shift, index) => {
      let { shiftStart, shiftEnd } = shift;
      shiftStart = getHourAndMinutes(shiftStart);
      shiftEnd = getHourAndMinutes(shiftEnd);

      const shiftStartDate = moment([year, month, date, shiftStart.hour, shiftStart.minutes]);

      const shiftEndDate = moment([year, month, date, shiftEnd.hour, shiftEnd.minutes]);

      const slotStartDate = moment(shiftStartDate);

      let divider = index > 0;

      for (
        let j = 0;
        shiftStartDate.add(reservationMinLength, 'minutes') <= shiftEndDate ||
        (shiftStartDate.format('HH:mm') === '00:00' && shiftEndDate.format('HH:mm') === '23:59');
        j++
      ) {
        if (divider) {
          slots.push({ id: `divider${j}`, divider });
          divider = false;
        }

        slots.push({
          id: slots.length,
          shiftId: index,
          startDate: moment(slotStartDate),
          endDate: moment(shiftStartDate),
          available: true,
          disabled: false,
          visible: true,
          free: 0,
          total: 0
        });

        slotStartDate.add(reservationMinLength, 'minutes');
      }
    });

    return slots;
  };

  badgeColor = (free, total) => {
    if (!free) {
      return MAIN_COLOR;
    } else if (free <= total / 2) {
      return WARNING_COLOR;
    } else {
      return SUCCESS_COLOR;
    }
  };

  badgeTitle = (free, total) => {
    switch (this.props.mode) {
      case 'courts':
        return free ? `Disponibles: ${free.toString()} / ${total.toString()}` : 'Ocupadas';
      case 'services':
        return free ? 'Disponible' : 'Ocupado';
      default:
        return null;
    }
  };

  renderList = ({ item }) => {
    if (item.visible)
      return (
        <ListItem
          leftIcon={{
            name: 'md-time',
            type: 'ionicon',
            color: 'black'
          }}
          rightElement={
            <Badge
              value={this.badgeTitle(item.free, item.total)}
              color={this.badgeColor(item.free, item.total)}
              containerStyle={{ paddingTop: 0 }}
            />
          }
          title={`${item.startDate.format('HH:mm')}`}
          containerStyle={styles.slotContainerStyle}
          rightSubtitleStyle={styles.slotRightSubtitleStyle}
          onPress={() => this.props.onSlotPress(item)}
          disabled={item.disabled}
          bottomDivider
        />
      );

    if (item.divider)
      return (
        <View style={styles.slotDividerContainer}>
          <Image
            source={require('../../assets/turnosya-white-notext.png')}
            style={{ height: 25 }}
            resizeMode="contain"
          />
        </View>
      );
  };

  onRefresh = () => {
    return (
      <RefreshControl
        refreshing={this.props.refresh ? this.props.refreshing : false}
        onRefresh={this.props.refresh ? this.props.refresh : null}
        colors={[MAIN_COLOR]}
        tintColor={MAIN_COLOR}
      />
    );
  };

  renderSlots = () => {
    if (this.props.slots.length) {
      return (
        <FlatList
          data={this.props.slots}
          renderItem={this.renderList.bind(this)}
          keyExtractor={slot => slot.id.toString()}
          refreshControl={this.onRefresh()}
        />
      );
    } else {
      return <EmptyList title="No se encontraron turnos para este día" refreshControl={this.onRefresh()} />;
    }
  };

  render() {
    return (
      <View style={{ alignSelf: 'stretch', flex: 1 }}>
        <Calendar
          onDateSelected={date => this.onDateSelected(date)}
          startingDate={this.props.selectedDate}
          maxDate={moment().add(this.props.reservationDayPeriod, 'days')}
          datesWhitelist={this.props.datesWhitelist}
        />

        {this.props.loading ? <Spinner style={{ position: 'relative' }} /> : this.renderSlots()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  slotContainerStyle: {
    backgroundColor: 'white'
  },
  slotRightSubtitleStyle: {
    color: 'grey'
  },
  slotDividerContainer: {
    backgroundColor: GREY_DISABLED,
    height: 45,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

const mapStateToProps = state => {
  const { slots, loadingSchedule, id } = state.commerceSchedule;

  return { slots, loadingSchedule, scheduleId: id };
};

export default connect(mapStateToProps, { onScheduleValueChange })(Schedule);
