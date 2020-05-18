import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Input, Button, CardSection } from '../common';
import CourtReservationDetails from '../CourtReservationDetails';
import { validateValueType, trimString } from '../../utils';
import { onReservationValueChange, onCommerceReservationCreate } from '../../actions';

class CommerceCourtReservationRegister extends Component {
  state = {
    selectedIndex: 0,
    priceButtons: [],
    prices: [],
    nameError: '',
    phoneError: ''
  };

  componentDidMount() {
    this.loading = false;
  }

  componentDidUpdate() {
    if (this.props.loading !== this.loading) {
      this.loading = this.props.loading;
    }
  }

  renderInputs = () => {
    if (!this.props.saved) {
      return (
        <View>
          <CardSection style={styles.cardSection}>
            <Input
              label="Nombre:"
              placeholder="Nombre del cliente"
              autoCapitalize="words"
              value={this.props.clientName}
              onChangeText={clientName => this.props.onReservationValueChange({ clientName })}
              errorMessage={this.state.nameError}
              onFocus={() => this.setState({ nameError: '' })}
              onBlur={this.nameError}
            />
          </CardSection>
          <CardSection style={styles.cardSection}>
            <Input
              label="Teléfono:"
              placeholder="Teléfono del cliente (opcional)"
              value={this.props.clientPhone}
              onChangeText={clientPhone => this.props.onReservationValueChange({ clientPhone: clientPhone.trim() })}
              errorMessage={this.state.phoneError}
              onFocus={() => this.setState({ phoneError: '' })}
              onBlur={this.phoneError}
            />
          </CardSection>
        </View>
      );
    }
  };

  nameError = () => {
    const clientName = trimString(this.props.clientName);

    this.props.onReservationValueChange({ clientName });

    if (!clientName) {
      this.setState({ nameError: 'Dato requerido' });
    } else if (!validateValueType('name', clientName)) {
      this.setState({ nameError: 'Formato no válido' });
    } else {
      this.setState({ nameError: '' });
      return false;
    }

    return true;
  };

  phoneError = () => {
    if (this.props.clientPhone && !validateValueType('phone', this.props.clientPhone)) {
      this.setState({ phoneError: 'Formato no válido' });
      return true;
    } else {
      this.setState({ phoneError: '' });
      return false;
    }
  };

  renderButtons = () => {
    if (!this.props.saved && !this.props.exists) {
      return (
        <CardSection>
          <Button title="Confirmar Reserva" loading={this.loading} onPress={this.onConfirmReservation} />
        </CardSection>
      );
    }
  };

  onConfirmReservation = () => {
    if (!this.nameError() && !this.phoneError() && !this.loading) {
      this.loading = true;

      const { commerceId, clientName, clientPhone, court, startDate, endDate, price } = this.props;

      this.props.onCommerceReservationCreate({
        commerceId,
        courtId: court.id,
        clientName,
        clientPhone,
        startDate,
        endDate,
        price
      });
    }
  };

  render() {
    const { clientName, clientPhone, court, startDate, endDate, price, saved } = this.props;

    return (
      <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={60} contentContainerStyle={{ flexGrow: 1 }}>
        <CourtReservationDetails
          name={saved && clientName}
          info={saved && clientPhone}
          infoIcon="ios-call"
          court={court}
          startDate={startDate}
          endDate={endDate}
          price={price}
        />
        {this.renderInputs()}
        <View style={styles.confirmButtonContainer}>{this.renderButtons()}</View>
      </KeyboardAwareScrollView>
    );
  }
}

const styles = StyleSheet.create({
  cardSection: {
    paddingHorizontal: 10
  },
  confirmButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignSelf: 'stretch'
  }
});

const mapStateToProps = state => {
  const { commerceId } = state.commerceData;
  const {
    clientName,
    clientPhone,
    court,
    startDate,
    endDate,
    price,
    saved,
    exists,
    loading
  } = state.reservation;

  return {
    commerceId,
    clientName,
    clientPhone,
    court,
    startDate,
    endDate,
    price,
    saved,
    exists,
    loading
  };
};

export default connect(mapStateToProps, {
  onReservationValueChange,
  onCommerceReservationCreate
})(CommerceCourtReservationRegister);
