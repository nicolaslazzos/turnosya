import axios from 'axios';
import { localDate } from '../utils';
import {
  ON_CASH_PAYMENT_REGISTERED,
  ON_CASH_PAYMENT_REGISTERING,
  ON_CASH_PAYMENT_REGISTER_FAIL
} from '../actions/types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onCashPaymentCreate = ({ reservationId, receiptNumber, navigation }) => async dispatch => {
  dispatch({ type: ON_CASH_PAYMENT_REGISTERING });

  try {
    const payment = await axios.post(`${backendUrl}/api/payments/create/`, { paymentMethodId: 'cash', receiptNumber, paymentDate: localDate() });
    await axios.patch(`${backendUrl}/api/reservations/update/${reservationId}/`, { stateId: 'paid', paymentId: payment.data.id });

    dispatch({ type: ON_CASH_PAYMENT_REGISTERED });
    navigation.goBack();
  } catch (error) {
    console.error(error);
    dispatch({ type: ON_CASH_PAYMENT_REGISTER_FAIL });
  }
};
