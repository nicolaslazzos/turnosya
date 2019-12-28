import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FlatList, View } from 'react-native';
import { Spinner, EmptyList } from '../common';
import {
  onReservationClientRead,
  onCourtReservationsListValueChange,
  onCourtReservationValueChange
} from '../../actions';
import CommerceCourtsStateListItem from './CommerceCourtsStateListItem';

class CommerceCourtsStateList extends Component {
  state = {
    selectedReservation: {},
    selectedCourt: {}
  };

  courtReservation = court => {
    const { reservations, slot } = this.props;

    return reservations.find(reservation => {
      return (
        reservation.startDate.toString() === slot.startDate.toString() &&
        reservation.courtId === court.id
      );
    });
  };

  onReservedCourtPress = async (court, courtReservation) => {
    // aca si la reserva ya esta tambien en la lista detallada, trae el cliente directamente desde ahi
    let reservation = {
      ...courtReservation,
      court: { ...court }
    };

    if (courtReservation.clientId) {
      let client = {};

      let res = this.props.detailedReservations.find(
        res => res.id === courtReservation.id
      );

      if (res) {
        client = res.client;
      } else {
        client = await this.props.onReservationClientRead(courtReservation.clientId);
      }

      reservation = {
        ...reservation,
        client: { ...client }
      };
    }

    this.props.navigation.navigate('reservationDetails', {
      reservation
    });
  };

  onAvailableCourtPress = court => {
    this.props.onCourtReservationValueChange({
      prop: 'court',
      value: court
    });

    this.props.navigation.navigate('courtReservationRegister');
  }

  renderRow({ item }) {
    const courtReservation = this.courtReservation(item);

    return (
      <CommerceCourtsStateListItem
        court={item}
        commerceId={this.props.commerceId}
        navigation={this.props.navigation}
        courtAvailable={!courtReservation}
        onPress={() =>
          !courtReservation
            ? this.onAvailableCourtPress(item)
            : this.onReservedCourtPress(item, courtReservation)
        }
      />
    );
  }

  renderList = () => {
    if (this.props.courtsAvailable.length > 0) {
      return (
        <FlatList
          data={this.props.courtsAvailable}
          renderItem={this.renderRow.bind(this)}
          keyExtractor={court => court.id}
          extraData={this.props.reservations}
        />
      );
    }

    return <EmptyList title="No hay ninguna cancha" />;
  };

  render() {
    const { loading, loadingClientData } = this.props;
    if (loading || loadingClientData) return <Spinner />;

    return this.renderList();
  }
}

const mapStateToProps = state => {
  const { courtsAvailable } = state.courtsList;
  const { commerceId } = state.commerceData;
  const { slot } = state.courtReservation;
  const {
    loading,
    reservations,
    loadingClientData,
    detailedReservations,
    reservationClient
  } = state.courtReservationsList;

  return {
    courtsAvailable,
    loading,
    commerceId,
    slot,
    reservations,
    detailedReservations,
    loadingClientData,
    reservationClient
  };
};

export default connect(mapStateToProps, {
  onReservationClientRead,
  onCourtReservationsListValueChange,
  onCourtReservationValueChange
})(CommerceCourtsStateList);
