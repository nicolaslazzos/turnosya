import {
  ON_CASH_PAYMENT_REGISTERED,
  ON_CASH_PAYMENT_REGISTERING,
  ON_CASH_PAYMENT_REGISTER_FAIL
} from '../actions/types';
import { Toast } from '../components/common';

const INITIAL_STATE = {
  method: '',
  date: null,
  loading: true,
  cashPayRegisterLoading: false
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ON_CASH_PAYMENT_REGISTERING:
      return { ...state, cashPayRegisterLoading: true };
    case ON_CASH_PAYMENT_REGISTER_FAIL:
      Toast.show({
        text: 'Ha ocurrido un error. Vuelva a intentarlo más tarde.'
      });
    case ON_CASH_PAYMENT_REGISTERED:
      return { ...state, cashPayRegisterLoading: false };
    default:
      return state;
  }
};
