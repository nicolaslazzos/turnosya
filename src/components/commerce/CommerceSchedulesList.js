import React, { Component } from 'react';
import { FlatList, View, Text } from 'react-native';
import { ListItem, Divider } from 'react-native-elements';
import { connect } from 'react-redux';
import { Fab } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Spinner, EmptyList, Menu, MenuItem } from '../common';
import { DAYS, MONTHS, MAIN_COLOR, AREAS } from '../../constants';
import { formattedMoment, stringFormatMinutes, cancelReservationNotificationFormat } from '../../utils';
import {
  onCommerceSchedulesRead,
  onScheduleValueChange,
  onScheduleDelete,
  onNextReservationsRead,
  onScheduleFormOpen,
  onScheduleRead
} from '../../actions';

class CommerceSchedulesList extends Component {
  state = {
    deleteModalVisible: false,
    deleteConfirmVisible: false,
    optionsVisible: false,
    lastReservationDate: null,
    reservationsToCancel: [],
    selectedSchedule: {}
  };

  componentDidMount() {
    this.props.onCommerceSchedulesRead({
      commerceId: this.props.commerceId,
      date: moment(),
      employeeId: this.props.employeeId
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.nextReservations !== this.props.nextReservations && this.props.navigation.isFocused()) {
      this.onScheduleDelete();
    }
  }

  onScheduleAddPress = () => {
    this.props.onScheduleFormOpen();
    this.props.navigation.navigate('scheduleRegister', {
      title: 'Nuevo horario',
      selectedDate: this.props.navigation.getParam('selectedDate')
    });
  };

  onScheduleEditPress = () => {
    const { selectedSchedule } = this.state;
    this.setState({ optionsVisible: false });

    let startDate = selectedSchedule.startDate;

    if (startDate < formattedMoment()) {
      // esto es porque en caso de que se selecciona editar un schedule cuya fecha de inicio
      // de vigencia es pasada, al modificarlo en realidad se crea uno nuevo cuya fecha de inicio
      // es por defecto, la actual, para que los horarios pasados queden tal cual estaban
      startDate = formattedMoment();
    }

    this.props.onScheduleValueChange({ ...selectedSchedule, startDate });

    this.props.navigation.navigate('scheduleRegister', {
      schedule: selectedSchedule,
      title: 'Modificar horario',
      selectedDate: this.props.navigation.getParam('selectedDate')
    });
  };

  onScheduleDeletePress = () => {
    const { commerceId, employeeId } = this.props;
    const { selectedSchedule } = this.state;

    let startDate = formattedMoment();

    if (selectedSchedule.startDate > startDate) startDate = selectedSchedule.startDate;

    this.props.onNextReservationsRead({
      commerceId,
      startDate,
      endDate: selectedSchedule.endDate,
      employeeId
    });

    this.setState({ optionsVisible: false, reservationsToCancel: [] });
  };

  onScheduleDelete = () => {
    const { nextReservations } = this.props;
    let { lastReservationDate } = this.state;

    if (nextReservations.length) {
      lastReservationDate = formattedMoment(nextReservations[nextReservations.length - 1].startDate).add(1, 'day');
      this.setState({ deleteModalVisible: true, lastReservationDate });
    } else {
      lastReservationDate = formattedMoment();
      this.setState({ deleteConfirmVisible: true, lastReservationDate });
    }
  };

  onCancelReservations = () => {
    const reservationsToCancel = this.props.nextReservations.map(res => {
      return {
        ...res,
        notification: cancelReservationNotificationFormat({
          startDate: res.startDate,
          actorName: this.props.commerceName,
          cancellationReason: 'Cambio en los horarios de atención'
        })
      }
    })

    this.setState({
      lastReservationDate: formattedMoment(),
      reservationsToCancel,
      deleteModalVisible: false,
      deleteConfirmVisible: true
    });
  };

  onScheduleDeleteConfirm = async () => {
    const { lastReservationDate, selectedSchedule, reservationsToCancel } = this.state;

    const success = await this.props.onScheduleDelete({
      schedule: selectedSchedule,
      endDate: lastReservationDate,
      reservationsToCancel
    });

    if (success) {
      this.props.onCommerceSchedulesRead({
        commerceId: this.props.commerceId,
        date: moment(),
        employeeId: this.props.employeeId
      });

      this.props.onScheduleRead({
        commerceId: this.props.commerceId,
        selectedDate: this.props.navigation.getParam('selectedDate'),
        employeeId: this.props.employeeId
      });
    }

    this.setState({ deleteModalVisible: false, deleteConfirmVisible: false });
  };

  renderDeleteScheduleModal = () => {
    const { lastReservationDate, deleteModalVisible } = this.state;

    if (lastReservationDate && deleteModalVisible) {
      const date = moment(lastReservationDate).subtract(1, 'day');

      return (
        <Menu
          title={
            'Tienes reservas hasta el ' +
            DAYS[date.day()] +
            ' ' +
            date.format('D') +
            ' de ' +
            MONTHS[date.month()] +
            ' ' +
            'por lo que la baja de los horarios de atención entrará en ' +
            'vigencia luego de esa fecha. Seleccione "Aceptar" para ' +
            'confirmar estos cambios o "Cancelar reservas y notificar" ' +
            'para que la baja entre en vigencia ahora mismo.'
          }
          onBackdropPress={() => this.setState({ deleteModalVisible: false })}
          isVisible={this.state.deleteModalVisible}
        >
          <MenuItem
            title="Aceptar"
            icon="md-checkmark"
            onPress={() =>
              this.setState({
                deleteConfirmVisible: true,
                deleteModalVisible: false
              })
            }
          />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Cancelar reservas y notificar" icon="md-trash" onPress={this.onCancelReservations} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Volver" icon="md-close" onPress={() => this.setState({ deleteModalVisible: false })} />
        </Menu>
      );
    }
  };

  cardToText = card => {
    const { id, firstShiftStart, firstShiftEnd, secondShiftStart, secondShiftEnd, days } = card;

    let strDays = '';

    days
      .sort((a, b) => a - b)
      .forEach((day, i) => {
        strDays += DAYS[day] + `${i === days.length - 1 ? '' : ', '}`;
      });

    const strShifts =
      `${firstShiftStart} a ${firstShiftEnd}` +
      `${secondShiftStart ? ` / ${secondShiftStart} a ${secondShiftEnd}` : ''}`;

    return (
      <Text key={id.toString()} style={{ fontSize: 13, marginBottom: 3 }}>
        {`${strDays}\n${strShifts}`}
      </Text>
    );
  };

  onOptionsPress = selectedSchedule => {
    this.setState({
      selectedSchedule,
      optionsVisible: true
    });
  };

  renderItem = ({ item }) => {
    const { startDate, endDate, cards, reservationMinLength } = item;

    return (
      <ListItem
        title={
          <View>
            {cards.map(card => this.cardToText(card))}
            <Text style={{ fontSize: 13, marginBottom: 3 }}>
              {'Duración del turno: ' + stringFormatMinutes(reservationMinLength)}
            </Text>
          </View>
        }
        subtitle={
          `Del ${startDate.format('DD/MM/YYYY')} ` + `${endDate ? `al ${endDate.format('DD/MM/YYYY')}` : 'en adelante'}`
        }
        subtitleStyle={{ fontSize: 12 }}
        rightIcon={{
          name: 'md-more',
          type: 'ionicon',
          containerStyle: { height: 20, width: 10 },
          onPress: () => this.onOptionsPress(item)
        }}
        onLongPress={() => this.onOptionsPress(item)}
        bottomDivider
      />
    );
  };

  renderList = () => {
    const { schedules } = this.props;

    if (schedules.length) {
      return (
        <FlatList
          data={schedules}
          renderItem={this.renderItem}
          keyExtractor={schedule => schedule.id.toString()}
          contentContainerStyle={{ paddingBottom: 95 }}
        />
      );
    }

    return <EmptyList title="No hay horarios de atención vigentes" />;
  };

  render() {
    const { loading } = this.props;

    if (loading) return <Spinner />;

    return (
      <View style={{ flex: 1 }}>
        {this.renderList()}

        <Fab style={{ backgroundColor: MAIN_COLOR }} position="bottomRight" onPress={this.onScheduleAddPress}>
          <Ionicons name="md-add" />
        </Fab>

        <Menu
          title={'Horarios de Atención'}
          onBackdropPress={() => this.setState({ optionsVisible: false })}
          isVisible={this.state.optionsVisible}
        >
          <MenuItem title="Editar" icon="md-create" onPress={this.onScheduleEditPress} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Eliminar" icon="md-trash" onPress={this.onScheduleDeletePress} />
        </Menu>

        <Menu
          title={'¿Está seguro que desea confirmar esta acción?'}
          onBackdropPress={() => this.setState({ deleteConfirmVisible: false })}
          isVisible={this.state.deleteConfirmVisible}
        >
          <MenuItem title="Aceptar" icon="md-checkmark" onPress={this.onScheduleDeleteConfirm} />
          <Divider style={{ backgroundColor: 'grey' }} />
          <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ deleteConfirmVisible: false })} />
        </Menu>

        {this.renderDeleteScheduleModal()}
      </View>
    );
  }
}

const mapStateToProps = state => {
  const { schedules, loading } = state.commerceSchedule;
  const { nextReservations } = state.reservationsList;
  const {
    commerceId,
    name: commerceName,
    area: { areaId }
  } = state.commerceData;
  const employeeId = areaId === AREAS.hairdressers ? state.roleData.employeeId : null;

  return { schedules, commerceId, commerceName, loading, nextReservations, employeeId };
};

export default connect(mapStateToProps, {
  onCommerceSchedulesRead,
  onScheduleValueChange,
  onScheduleDelete,
  onNextReservationsRead,
  onScheduleFormOpen,
  onScheduleRead
})(CommerceSchedulesList);
