import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { Card, Divider } from 'react-native-elements';
import { MenuItem, Menu, Spinner, Button } from '../common';
import { onCommerceMPagoTokenEnable, onCommerceMPagoTokenDisable } from '../../actions';

class PaymentSettings extends Component {
  state = { mPagoModalVisible: false };

  mPagoSwitchPressHandler = () => {
    this.props.mPagoToken
      ? this.props.onCommerceMPagoTokenDisable(this.props.commerceId)
      : this.props.onCommerceMPagoTokenEnable(this.props.commerceId);
    this.setState({ mPagoModalVisible: false });
  };

  renderConfirmMPagoSwitch = () => {
    // ventana de confirmacion para habilitar/deshabilitar pago
    return (
      <Menu
        title={`¿Está seguro que desea ${
          this.props.mPagoToken ? 'deshabilitar' : 'habilitar'
        } el cobro de sus turnos mediante Mercado Pago?`}
        onBackdropPress={() => this.setState({ mPagoModalVisible: false })}
        isVisible={this.state.mPagoModalVisible}
      >
        <MenuItem title="Confirmar" icon="md-checkmark" onPress={this.mPagoSwitchPressHandler} />
        <Divider style={{ backgroundColor: 'grey' }} />
        <MenuItem title="Cancelar" icon="md-close" onPress={() => this.setState({ mPagoModalVisible: false })} />
      </Menu>
    );
  };

  render() {
    return this.props.mPagoTokenReadLoading ? (
      <Spinner />
    ) : (
      <Card title="Información" textAlign="center" containerStyle={{ borderRadius: 10 }}>
        {this.renderConfirmMPagoSwitch()}
        {this.props.hasAnyMPagoToken ? (
          <View>
            <Text style={{ textAlign: 'left', fontSize: 15, padding: 5 }}>{`Estado Actual: ${
              this.props.mPagoToken ? 'Habilitado' : 'Deshabilitado'
            }`}</Text>
            <Button
              style={{ paddingTop: 4 }}
              title={`${this.props.mPagoToken ? 'Deshabilitar' : 'Habilitar'} Cobro`}
              onPress={() => this.setState({ mPagoModalVisible: true })}
              loading={this.props.mPagoTokenSwitchLoading}
            />
          </View>
        ) : (
          <View>
            <Text style={{ textAlign: 'left', fontSize: 15, padding: 5 }}>Estado Actual: Deshabilitado</Text>
            <Button
              style={{ paddingTop: 4 }}
              title="Comenzar a Cobrar"
              onPress={() => this.props.navigation.navigate('paymentSettingsWeb')}
            />
          </View>
        )}
      </Card>
    );
  }
}

const mapStateToProps = state => {
  const {
    commerceId,
    mPagoTokenSwitchLoading,
    mPagoTokenReadLoading,
    hasAnyMPagoToken,
    mPagoToken
  } = state.commerceData;
  return { commerceId, mPagoTokenSwitchLoading, mPagoTokenReadLoading, hasAnyMPagoToken, mPagoToken };
};

export default connect(mapStateToProps, { onCommerceMPagoTokenEnable, onCommerceMPagoTokenDisable })(PaymentSettings);