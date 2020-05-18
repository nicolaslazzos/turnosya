import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, View, RefreshControl, Text } from 'react-native';
import { Divider, Card, Slider, CheckBox } from 'react-native-elements';
import { Fab } from 'native-base';
import moment from 'moment';
import { MAIN_COLOR, MAIN_COLOR_OPACITY, DAYS, MONTHS, AREAS } from '../../constants';
import ScheduleRegisterItem from './ScheduleRegisterItem';
import { hourToDate, formattedMoment, stringFormatMinutes, cancelReservationNotificationFormat } from '../../utils';
import { IconButton, EmptyList, Menu, MenuItem, DatePicker, CardSection, Toast } from '../common';
import {
  onScheduleValueChange,
  onScheduleUpdate,
  onNextReservationsRead,
  onCommerceSchedulesRead,
  onScheduleRead
} from '../../actions';

class ScheduleRegister extends Component {
  constructor(props) {
    super(props);

    this.state = {
      incompatibleScheduleVisible: false,
      incompatibleEndDateVisible: false,
      confirmationVisible: false,
      reservationsAfterEndDate: [],
      lastReservationDate: null,
      notCoveredReservations: [],
      lastIncompatibleDate: null,
      reservationsToCancel: [],
      prevSchedule: null,
      overlappedSchedule: null,
      startDateError: '',
      endDateError: '',
      sliderValues: {
        reservationMinFrom: 5,
        reservationMinTo: 240,
        reservationMinValue: 60
      }
    };

    this.onConfirmPress = null;
  }

  static navigationOptions = ({ navigation }) => {
    return {
      headerRight: <IconButton icon="md-checkmark" onPress={navigation.getParam('onSavePress')} />,
      title: navigation.getParam('title')
    };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      onSavePress: this.onSavePress
    });

    this.setState({
      sliderValues: {
        ...this.state.sliderValues,
        reservationMinValue: this.props.reservationMinLength
      }
    });

    const prevSchedule = this.props.navigation.getParam('schedule');
    prevSchedule && this.setState({ prevSchedule });

    this.onBlurListener = this.props.navigation.addListener('willBlur', () => {
      this.props.onScheduleRead({
        commerceId: this.props.commerceId,
        selectedDate: this.props.navigation.getParam('selectedDate'),
        employeeId: this.props.employeeId
      });
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.nextReservations !== this.props.nextReservations && this.props.navigation.isFocused()) {
      this.workShiftsValidate();
    }

    if (prevProps.startDate !== this.props.startDate || prevProps.endDate !== this.props.endDate) {
      this.renderStartDateError();
      this.renderEndDateError();
    }
  }

  componentWillUnmount() {
    this.onBlurListener.remove && this.onBlurListener.remove();
  }

  onSavePress = () => {
    if (!this.validateMinimumData()) return;

    let { startDate, endDate, commerceId, schedules, employeeId } = this.props;
    const { prevSchedule } = this.state;

    // el overlapped schedule es un schedule cuyo periodo de vigencia abarca el periodo de
    // vigencia del schedule que estamos modificando o creando
    const overlappedSchedule = schedules.find(schedule => {
      return (
        startDate > schedule.startDate &&
        ((!schedule.endDate && endDate) || (schedule.endDate && endDate && endDate < schedule.endDate))
      );
    });

    if (prevSchedule) {
      endDate = prevSchedule.endDate;
    } else {
      if (overlappedSchedule) {
        endDate = overlappedSchedule.endDate;
      }
    }

    this.setState({ reservationsToCancel: [], overlappedSchedule });

    if (!prevSchedule || this.didChanges()) {
      return this.props.onNextReservationsRead({
        commerceId,
        startDate,
        endDate,
        employeeId
      });
    }

    this.props.navigation.goBack();
  };

  didChanges = () => {
    // esta funcion verifica si se hizo algun cambio en los horarios de atencion
    // el tiempo minimo de turno o las fechas de vigencia para que en caso de que no
    // hubo cambios, no se ejcute lo mismo el update en la base de datos

    const oldStartDate = this.state.prevSchedule.startDate;
    const oldEndDate = this.state.prevSchedule.endDate;
    const prevSchedule = {
      cards: this.state.prevSchedule.cards,
      reservationMinLength: this.state.prevSchedule.reservationMinLength
    };

    const newStartDate = this.props.startDate;
    const newEndDate = this.props.endDate;
    const newSchedule = {
      cards: this.props.cards,
      reservationMinLength: this.props.reservationMinLength
    };

    if (
      JSON.stringify(prevSchedule) !== JSON.stringify(newSchedule) ||
      !!oldEndDate !== !!newEndDate ||
      (oldEndDate && newEndDate && oldEndDate.diff(newEndDate, 'minutes')) ||
      (oldStartDate <= formattedMoment() && newStartDate.diff(formattedMoment(), 'minutes')) ||
      (oldStartDate >= formattedMoment() && newStartDate.diff(oldStartDate, 'minutes'))
    )
      return true;
  };

  validateMinimumData = () => {
    // esta función valida en conjunto que se hayan ingresado todos los datos requeridos
    // y que los mismos sean correctos, antes de pasar a validar la compatibilidad de los horarios

    const { cards, startDate, endDate } = this.props;
    let error = false;

    if ((endDate && startDate >= endDate) || !cards.length) error = true;

    for (i in cards) {
      const { firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd, days } = cards[i];

      if (
        !firstShiftStart ||
        !firstShiftEnd ||
        firstShiftStart >= firstShiftEnd ||
        !!secondShiftStart !== !!secondShiftEnd ||
        (secondShiftStart && secondShiftStart >= secondShiftEnd) ||
        (secondShiftStart && secondShiftStart <= firstShiftEnd) ||
        !days.length
      ) {
        error = true;
        break;
      }
    }

    if (error) {
      Toast.show({
        text: 'Hay datos faltantes o incorrectos. Revise los mismos e intente nuevamente.'
      });
    }

    return !error;
  };

  workShiftsValidate = () => {
    const { nextReservations } = this.props;

    if (nextReservations) {
      // si hay reservas en el periodo de vigencia del horario que estamos modificando o creando

      // si estamos modificando horarios y cambiamos las fechas de inicio y fin de vigencia
      // de modo que estan quedando afuera resevas que antes eran cubiertas por este horario
      if (!this.validEndDate()) return;

      // verifica si no es compatible con reservas existentes dentro del periodo definido
      return this.compatibleSchedule();
    }

    // no hay reservas o si las hay, no entran en conflicto
    this.onScheduleSave();
  };

  compatibleSchedule = () => {
    // esta función toma las reservas existentes (en caso de que haya) que se encuentran
    // en el periodo del schedule que estamos creando o modificando para ver si hay algun conflicto

    const { nextReservations, cards, startDate, endDate } = this.props;

    let notCoveredReservations = nextReservations.filter(res => {
      return res.startDate >= startDate && (!endDate || (endDate && res.endDate <= endDate));
    });

    for (i in cards) {
      // nuevos horarios de atención
      const { firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd, days } = cards[i];

      // se verifica si los nuevos horarios abarcan las (startDate, endDate) de los turnos próximos
      notCoveredReservations = this.compatibleShift(firstShiftStart, firstShiftEnd, days, notCoveredReservations);

      // si existen segundos horarios, se verifica lo mismo que los primeros horarios
      if (notCoveredReservations.length && secondShiftStart && secondShiftEnd) {
        notCoveredReservations = this.compatibleShift(secondShiftStart, secondShiftEnd, days, notCoveredReservations);
      }
    }

    if (notCoveredReservations.length) {
      return this.setState({
        notCoveredReservations,
        lastIncompatibleDate: notCoveredReservations[notCoveredReservations.length - 1].startDate,
        incompatibleScheduleVisible: true
      });
    }

    // si no hay conflictos guarda
    this.onScheduleSave();
  };

  compatibleShift = (shiftStart, shiftEnd, days, notCoveredReservations) => {
    // esta función se ejecuta por cada card, y evalua en función de los horarios de atención
    // y la duración de los turnos, si las reservas existentes aun son compatibles, devolviendo
    // aquellas que no lo son

    const { reservationMinLength } = this.props;

    notCoveredReservations = notCoveredReservations.filter(reservation => {
      const { startDate, endDate } = reservation;
      const shiftStartDate = hourToDate(shiftStart, startDate);
      const shiftEndDate = hourToDate(shiftEnd, startDate);

      if (startDate >= shiftStartDate && endDate <= shiftEndDate) {
        const startDiff = Math.abs(shiftStartDate.diff(startDate, 'minutes'));
        const reservationDuration = Math.abs(startDate.diff(endDate, 'minutes'));

        return (
          // en el caso en que un turno pueda ocupar varios slots se
          // reemplazaría la primer comparación por esta que esta comentada
          // (reservationDuration % reservationMinLength) ||
          (!this.props.employeeId && reservationDuration !== reservationMinLength) ||
          startDiff % reservationMinLength ||
          !days.includes(startDate.day())
        );
      }

      return true;
    });

    return notCoveredReservations;
  };

  validEndDate = () => {
    // en caso de que haya un overlapped schedule, la fecha de fin de vigencia de este, ahora será
    // igual a la fecha de inicio de vigencia del nuevo schedule o el que estamos modificando, por
    // lo que aca se valida si hay reservas que esten quedando afuera del periodo de vigencia de
    // este último para en ese caso, comunicarselo al usuario

    const { nextReservations } = this.props;
    const newEndDate = this.props.endDate;

    if (this.state.overlappedSchedule) {
      const reservationsAfterEndDate = nextReservations.filter(res => {
        return res.startDate >= newEndDate;
      });

      if (reservationsAfterEndDate.length) {
        this.setState({
          reservationsAfterEndDate,
          lastReservationDate: reservationsAfterEndDate[reservationsAfterEndDate.length - 1].startDate,
          incompatibleEndDateVisible: true
        });

        return false;
      }
    }

    return true;
  };

  onAddPress = () => {
    const { cards, selectedDays, onScheduleValueChange } = this.props;

    if (cards.length === 0) {
      onScheduleValueChange({ cards: cards.concat([{ ...emptyCard, id: 0 }]) });
    } else if (selectedDays.length < 7 && !this.props.cards.find(card => card.days.length === 0)) {
      onScheduleValueChange({
        cards: cards.concat([{ ...emptyCard, id: parseInt(cards[cards.length - 1].id) + 1 }])
      });
    }
  };

  onStartDateValueChange = startDate => {
    startDate = moment(startDate);

    if (startDate < formattedMoment()) {
      return Toast.show({ text: 'No puede ingresar una fecha pasada' });
    }

    this.props.onScheduleValueChange({ startDate });
  };

  renderStartDateError = () => {
    const { startDate, endDate } = this.props;

    if (endDate && startDate >= endDate) {
      this.setState({
        startDateError: 'Debe ser anterior a la fecha de fin de vigencia'
      });
    } else if (!startDate) {
      this.setState({ startDateError: 'Debe seleccionar una fecha' });
    } else {
      this.setState({ startDateError: '' });
      return true;
    }

    return false;
  };

  onEndDateValueChange = endDate => {
    endDate = moment(endDate);

    if (endDate < formattedMoment()) {
      return Toast.show({ text: 'No puede ingresar una fecha pasada' });
    }

    this.props.onScheduleValueChange({ endDate });
  };

  renderEndDateError = () => {
    const { startDate, endDate } = this.props;

    if (endDate && startDate >= endDate) {
      this.setState({
        endDateError: 'Debe ser posterior a la fecha de fin de vigencia'
      });
    } else {
      this.setState({ endDateError: '' });
      return true;
    }

    return false;
  };

  onScheduleSave = async () => {
    let {
      commerceId,
      scheduleId,
      cards,
      reservationMinLength,
      reservationDayPeriod,
      reservationMinCancelTime,
      startDate,
      endDate,
      schedules,
      // only hairdressers
      employeeId
    } = this.props;

    const reservationsToCancel = this.state.reservationsToCancel.map(res => {
      return {
        ...res,
        notification: cancelReservationNotificationFormat({
          startDate: res.startDate,
          actorName: this.props.commerceName,
          cancellationReason: 'Cambio en los horarios de atención'
        })
      }
    })

    if (this.validateMinimumData()) {
      const success = await this.props.onScheduleUpdate({
        commerceId,
        cards,
        reservationMinLength,
        startDate,
        endDate,
        schedules,
        reservationsToCancel,
        employeeId
      });

      if (success) {
        // si se guardo con éxito, se recarga el listado de schedules y se vuelve
        this.props.onCommerceSchedulesRead({
          commerceId,
          date: moment(),
          employeeId
        });

        this.props.navigation.goBack();
      }
    }
  };

  renderIncompatibleScheduleModal = () => {
    const { lastIncompatibleDate, incompatibleScheduleVisible } = this.state;

    if (lastIncompatibleDate && incompatibleScheduleVisible) {
      return (
        <Menu
          title={
            'Los nuevos horarios de atención entran en conflicto con una o más ' +
            'reservas existentes hasta el ' +
            DAYS[lastIncompatibleDate.day()] +
            ' ' +
            lastIncompatibleDate.format('D') +
            ' de ' +
            MONTHS[lastIncompatibleDate.month()] +
            '. ' +
            '¿Desea establecer el inicio de vigencia luego de esta fecha?. ' +
            'Seleccione "Aceptar" para confirmar estos cambios o ' +
            '"Cancelar reservas y notificar" para cancelar dichas reservas e ' +
            'iniciar la vigencia en la fecha ingresada'
          }
          onBackdropPress={() => this.setState({ incompatibleScheduleVisible: false })}
          isVisible={incompatibleScheduleVisible}
        >
          <MenuItem
            title="Acepar"
            icon="md-checkmark"
            onPress={() => this.onConfirmModalOpen(this.onSetNewStartDate)}
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem
            title="Cancelar reservas y notificar"
            icon="md-trash"
            onPress={() => this.onConfirmModalOpen(this.onIncompatibleScheduleSave)}
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem
            title="Volver"
            icon="md-close"
            onPress={() => this.setState({ incompatibleScheduleVisible: false })}
          />
        </Menu>
      );
    }
  };

  onSetNewStartDate = () => {
    const { lastIncompatibleDate } = this.state;

    this.props.onScheduleValueChange({
      startDate: formattedMoment(lastIncompatibleDate).add(1, 'days')
    });

    this.setState({ confirmationVisible: false }, this.onScheduleSave);
  };

  onIncompatibleScheduleSave = () => {
    const { reservationsToCancel, notCoveredReservations } = this.state;

    this.setState(
      {
        reservationsToCancel: reservationsToCancel.concat(notCoveredReservations),
        confirmationVisible: false
      },
      this.onScheduleSave
    );
  };

  renderIncompatibleEndDateModal = () => {
    const { lastReservationDate, incompatibleEndDateVisible } = this.state;

    if (lastReservationDate && incompatibleEndDateVisible) {
      return (
        <Menu
          title={
            'Tienes reservas hasta el ' +
            DAYS[lastReservationDate.day()] +
            ' ' +
            lastReservationDate.format('D') +
            ' de ' +
            MONTHS[lastReservationDate.month()] +
            '. ' +
            '¿Desea establecer el fin de vigencia luego de esta fecha?. ' +
            'Seleccione "Aceptar" confirmar estos cambios o ' +
            '"Cancelar reservas y notificar" para cancelar dichas reservas ' +
            'y finalizar la vigencia en la fecha ingresada'
          }
          onBackdropPress={() => this.setState({ incompatibleEndDateVisible: false })}
          isVisible={incompatibleEndDateVisible}
        >
          <MenuItem title="Aceptar" icon="md-checkmark" onPress={() => this.onConfirmModalOpen(this.onSetNewEndDate)} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem
            title="Cancelar reservas y notificar"
            icon="md-trash"
            onPress={() => this.onConfirmModalOpen(this.onIncompatibleEndDateSave)}
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem
            title="Volver"
            icon="md-close"
            onPress={() => this.setState({ incompatibleEndDateVisible: false })}
          />
        </Menu>
      );
    }
  };

  onSetNewEndDate = () => {
    const { lastReservationDate } = this.state;

    this.props.onScheduleValueChange({
      endDate: formattedMoment(lastReservationDate).add(1, 'days')
    });

    this.setState({ confirmationVisible: false }, this.compatibleSchedule);
  };

  onIncompatibleEndDateSave = () => {
    const { reservationsToCancel, reservationsAfterEndDate } = this.state;

    this.setState(
      {
        reservationsToCancel: reservationsToCancel.concat(reservationsAfterEndDate),
        confirmationVisible: false
      },
      this.compatibleSchedule
    );
  };

  onConfirmModalOpen = onConfirmPress => {
    this.setState({
      incompatibleEndDateVisible: false,
      incompatibleScheduleVisible: false,
      confirmationVisible: true
    });

    this.onConfirmPress = onConfirmPress;
  };

  renderFirstItem = () => {
    const { reservationMinFrom, reservationMinTo, reservationMinValue } = this.state.sliderValues;

    return (
      <Card containerStyle={{ borderRadius: 10, padding: 5, paddingTop: 10 }}>
        <CardSection
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-around'
          }}
        >
          <DatePicker
            date={this.props.startDate || formattedMoment()}
            mode="date"
            label="Inicio de vigencia:"
            placeholder="Fecha de inicio"
            errorMessage={this.state.startDateError}
            onDateChange={this.onStartDateValueChange}
          />
          <DatePicker
            date={this.props.endDate}
            mode="date"
            label="Fin de vigencia:"
            placeholder="Opcional"
            errorMessage={this.state.endDateError}
            onDateChange={this.onEndDateValueChange}
          />
        </CardSection>
        {this.props.endDate && (
          <CardSection>
            <CheckBox
              title="Agregar fecha de fin de vigencia"
              iconType="material"
              checkedIcon="clear"
              uncheckedIcon="add"
              checkedColor={MAIN_COLOR}
              uncheckedColor={MAIN_COLOR}
              checkedTitle="Quitar fecha de fin de vigencia"
              checked={!!this.props.endDate}
              onPress={() => this.props.onScheduleValueChange({ endDate: null })}
            />
          </CardSection>
        )}
        <CardSection style={{ paddingHorizontal: 20, paddingTop: 15 }}>
          <Text>{'Duración mínima de turnos: ' + stringFormatMinutes(reservationMinValue)}</Text>
          <Slider
            animationType="spring"
            minimumTrackTintColor={MAIN_COLOR_OPACITY}
            minimumValue={reservationMinFrom}
            maximumValue={reservationMinTo}
            step={reservationMinFrom}
            thumbTouchSize={{ width: 60, height: 60 }}
            thumbTintColor={MAIN_COLOR}
            value={reservationMinValue}
            onSlidingComplete={reservationMinLength => this.props.onScheduleValueChange({ reservationMinLength })}
            onValueChange={value =>
              this.setState({
                sliderValues: {
                  ...this.state.sliderValues,
                  reservationMinValue: value
                }
              })
            }
          />
        </CardSection>
      </Card>
    );
  };

  renderRow = ({ item }) => {
    if (item.id === 'firstItem') {
      // esto es para que el primer item que tiene las fechas de vigencia y la duración del
      // turno este en la FlatList, sino se quedaría anclado arriba y no scrollearía
      return this.renderFirstItem();
    }

    return <ScheduleRegisterItem card={item} />;
  };

  renderList = () => {
    const { cards, refreshing, loadingReservations } = this.props;

    if (cards.length) {
      return (
        <FlatList
          data={[{ id: 'firstItem' }, ...cards]}
          renderItem={this.renderRow}
          keyExtractor={card => card.id.toString()}
          extraData={this.props}
          contentContainerStyle={{ paddingBottom: 95 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loadingReservations}
              colors={[MAIN_COLOR]}
              tintColor={MAIN_COLOR}
            />
          }
        />
      );
    }

    return <EmptyList title="No hay horarios de atención" />;
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.renderList()}
        {this.renderIncompatibleScheduleModal()}
        {this.renderIncompatibleEndDateModal()}

        <Fab style={{ backgroundColor: MAIN_COLOR }} position="bottomRight" onPress={this.onAddPress}>
          <Ionicons name="md-add" />
        </Fab>

        <Menu
          title={'¿Está seguro que desea confirmar esta acción?'}
          onBackdropPress={() => this.setState({ confirmationVisible: false })}
          isVisible={this.state.confirmationVisible}
        >
          <MenuItem title="Aceptar" icon="md-checkmark" onPress={this.onConfirmPress} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ confirmationVisible: false })} />
        </Menu>
      </View>
    );
  }
}

const emptyCard = {
  firstShiftStart: '',
  firstShiftEnd: '',
  secondShiftStart: null,
  secondShiftEnd: null,
  days: []
};

const mapStateToProps = state => {
  const {
    id,
    cards,
    selectedDays,
    reservationMinLength,
    reservationDayPeriod,
    reservationMinCancelTime,
    startDate,
    endDate,
    schedules,
    error,
    refreshing
  } = state.commerceSchedule;
  const { nextReservations } = state.reservationsList;
  const loadingReservations = state.reservationsList.loading;
  const {
    commerceId,
    area: { areaId },
    name: commerceName
  } = state.commerceData;
  const employeeId = areaId === AREAS.hairdressers ? state.roleData.employeeId : null;

  return {
    scheduleId: id,
    cards,
    selectedDays,
    commerceId,
    reservationMinLength,
    reservationMinCancelTime,
    reservationDayPeriod,
    startDate,
    endDate,
    schedules,
    error,
    loadingReservations,
    refreshing,
    nextReservations,
    employeeId,
    commerceName
  };
};

export default connect(mapStateToProps, {
  onScheduleValueChange,
  onScheduleUpdate,
  onNextReservationsRead,
  onCommerceSchedulesRead,
  onScheduleRead
})(ScheduleRegister);
