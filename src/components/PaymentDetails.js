import React, { Component } from 'react';
import moment from 'moment';
import { Text, View, StyleSheet } from 'react-native';
import { Card } from 'react-native-elements';

class PaymentDetails extends Component {
  constructor(props) {
    super(props);
    const reservation = props.navigation.getParam('reservation', null);
    this.state = { reservation };
  }

  getClientName = () => {
    const { client, clientName } = this.state.reservation;

    if (client) return client.firstName + ' ' + client.lastName;
    if (clientName) return clientName;
  }

  render() {
    const { payment } = this.state.reservation;

    return (
      <Card title="Información" textAlign="center" containerStyle={styles.cardStyle}>
        <View style={styles.containerStyle}>
          <Text style={styles.textStyle}>
            {`Fecha del Pago: ${moment(payment.paymentDate).format('DD/MM/YYYY')}`}
          </Text>
          <Text style={styles.textStyle}>
            {`Nombre: ${this.getClientName()}`}
          </Text>
          <Text style={styles.textStyle}>
            {`Monto: $${this.state.reservation.price}`}
          </Text>
          <Text style={styles.textStyle}>
            {`Método de Pago: ${payment.paymentMethod.name}`}
          </Text>
          {payment.paymentMethod.id === 'cash' && payment.receiptNumber ?
            <Text style={styles.textStyle}>
              {`Nro. de Comprobante: ${payment.receiptNumber}`}
            </Text> : null}
        </View>
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  cardStyle: { borderRadius: 10 },
  containerStyle: { flexDirection: 'column', marginRight: 15 },
  textStyle: { textAlign: 'left', fontSize: 15, padding: 5 }
})

export default PaymentDetails;
