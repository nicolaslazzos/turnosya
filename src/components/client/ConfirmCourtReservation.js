import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button as RNEButton } from 'react-native-elements';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { CardSection, Button } from '../common';
import { MAIN_COLOR } from '../../constants';
import CourtReservationDetails from '../CourtReservationDetails';
import { onClientReservationCreate } from '../../actions';
import { isEmailVerified, newReservationNotificationFormat } from '../../utils';
import VerifyEmailModal from './VerifyEmailModal';

class ConfirmCourtReservation extends Component {
  state = { selectedIndex: 0, priceButtons: [], prices: [] };

  componentDidMount() {
    this.loading = false;
  }

  componentDidUpdate() {
    if (this.props.loading !== this.loading) {
      this.loading = this.props.loading;
    }
  }

  onConfirmReservation = async () => {
    if (this.loading) return;

    this.loading = true;

    try {
      if (await isEmailVerified()) {
        const {
          commerce,
          court,
          startDate,
          endDate,
          price,
          firstName,
          lastName
        } = this.props;

        const notification = newReservationNotificationFormat({
          startDate,
          service: `${court.name}`,
          actorName: `${firstName} ${lastName}`,
          receptorName: `${commerce.name}`
        });

        this.props.onClientReservationCreate({
          commerceId: commerce.commerceId,
          courtId: court.id,
          startDate,
          endDate,
          price,
        }, notification);
      } else {
        this.setState({ modal: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  onModalClose = () => {
    this.setState({ modal: false });
  };

  renderEmailModal = () => {
    if (this.state.modal) return <VerifyEmailModal onModalCloseCallback={this.onModalClose} />;
  };

  renderButtons = () => {
    if (this.props.saved || this.props.exists) {
      return (
        <CardSection style={{ flexDirection: 'row' }}>
          <View style={{ alignItems: 'flex-start', flex: 1 }}>
            <RNEButton
              title="Reservar Otro"
              type="clear"
              titleStyle={{ color: MAIN_COLOR }}
              icon={<Ionicons name="ios-arrow-back" size={30} color={MAIN_COLOR} style={{ marginRight: 10 }} />}
              onPress={() => this.props.navigation.navigate('commerceProfileView')}
            />
          </View>
          {this.props.saved ? (
            <View style={{ alignItems: 'flex-end' }}>
              <RNEButton
                title="Finalizar"
                type="clear"
                titleStyle={{ color: MAIN_COLOR }}
                iconRight
                icon={<Ionicons name="ios-arrow-forward" size={30} color={MAIN_COLOR} style={{ marginLeft: 10 }} />}
                onPress={() => this.props.navigation.navigate('commercesAreas')}
              />
            </View>
          ) : null}
        </CardSection>
      );
    }

    return (
      <CardSection>
        <Button title="Confirmar Reserva" loading={this.loading} onPress={this.onConfirmReservation} />
      </CardSection>
    );
  };

  render() {
    const { commerce, court, startDate, endDate, price } = this.props;

    return (
      <View style={{ flex: 1 }}>
        <CourtReservationDetails
          mode="commerce"
          name={commerce.name}
          info={commerce.address + ', ' + commerce.city + ', ' + commerce.province.name}
          infoIcon="md-pin"
          picture={commerce.profilePicture}
          court={court}
          startDate={startDate}
          endDate={endDate}
          price={price}
        />
        <View style={styles.confirmButtonContainer}>{this.renderButtons()}</View>
        {this.renderEmailModal()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  cardSections: {
    alignItems: 'center'
  },
  confirmButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignSelf: 'stretch'
  }
});

const mapStateToProps = state => {
  const {
    commerce,
    court,
    startDate,
    endDate,
    price,
    saved,
    exists,
    loading
  } = state.reservation;
  const { firstName, lastName } = state.clientData;

  return {
    commerce,
    court,
    startDate,
    endDate,
    price,
    saved,
    exists,
    loading,
    firstName,
    lastName
  };
};

export default connect(mapStateToProps, { onClientReservationCreate })(ConfirmCourtReservation);
