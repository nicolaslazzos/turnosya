import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FlatList } from 'react-native';
import { Spinner, EmptyList } from '../common';
import { onReservationValueChange, isCourtDisabledOnSlot, onNewReservation } from '../../actions';
import CommerceCourtsStateListItem from './CommerceCourtsStateListItem';

class CommerceCourtsStateList extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('title')
  });

  courtReservation = court => {
    const { reservations, startDate } = this.props;
    return reservations.find(reservation => reservation.startDate.toString() === startDate.toString() && reservation.court.id === court.id);
  };

  onReservedCourtPress = courtReservation => {
    this.props.navigation.navigate('reservationDetails', { reservation: courtReservation });
  };

  onAvailableCourtPress = court => {
    this.props.onNewReservation();

    const light = !!(court.lightPrice && court.lightHour && court.lightHour <= this.props.startDate.format('HH:mm'));

    this.props.onReservationValueChange({
      court,
      light,
      price: light ? court.lightPrice : court.price
    });

    this.props.navigation.navigate('courtReservationRegister');
  };

  isCourtTypeSelected = courtType => {
    const selectedCourtTypes = this.props.navigation.getParam('selectedCourtTypes');
    return selectedCourtTypes.includes('Todas') || selectedCourtTypes.includes(courtType);
  };

  renderRow({ item }) {
    if (!this.isCourtTypeSelected(item.courtType.name)) return;

    const { startDate, endDate } = this.props;
    const courtReservation = this.courtReservation(item);

    return (
      <CommerceCourtsStateListItem
        court={item}
        commerceId={this.props.commerceId}
        navigation={this.props.navigation}
        courtAvailable={!courtReservation}
        disabled={isCourtDisabledOnSlot(item, { startDate, endDate })}
        onPress={() => !courtReservation ? this.onAvailableCourtPress(item) : this.onReservedCourtPress(courtReservation)}
      />
    );
  }

  renderList = () => {
    if (this.props.courts.length) {
      return (
        <FlatList
          data={this.props.courts}
          renderItem={this.renderRow.bind(this)}
          keyExtractor={court => court.id.toString()}
          extraData={this.props.reservations}
        />
      );
    }

    return <EmptyList title="No hay ninguna cancha" />;
  };

  render() {
    const { loading } = this.props;
    if (loading) return <Spinner />;

    return this.renderList();
  }
}

const mapStateToProps = state => {
  const { courts } = state.courtsList;
  const { commerceId } = state.commerceData;
  const { startDate, endDate } = state.reservation;
  const { loading, reservations, detailedReservations } = state.reservationsList;

  return {
    courts,
    loading,
    commerceId,
    startDate,
    endDate,
    reservations,
    detailedReservations
  };
};

export default connect(mapStateToProps, {
  onReservationValueChange,
  onNewReservation
})(CommerceCourtsStateList);
