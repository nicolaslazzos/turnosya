import axios from 'axios';
import { localDate } from '../utils';
import {
  ON_COMMERCE_REPORT_READING,
  ON_COMMERCE_REPORT_READ,
  ON_COMMERCE_REPORT_VALUE_CHANGE,
  ON_COMMERCE_REPORT_VALUE_RESET,
  ON_COMMERCE_REPORT_DATA_EMPTY
} from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onCommerceReportValueChange = payload => {
  return { type: ON_COMMERCE_REPORT_VALUE_CHANGE, payload };
};

export const onCommerceReportValueReset = () => {
  return { type: ON_COMMERCE_REPORT_VALUE_RESET };
};

// Daily Reservations report
export const onDailyReservationsReadByRange = (commerceId, startDate, endDate, employeeId = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REPORT_READING });

  axios.get(`${backendUrl}/api/commerces/daily-reservations/`, {
    params: {
      commerceId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null,
      employeeId
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_READ, payload: response.data }))
    .catch(error => console.error(error));
};

// Monthly Earnings Report
export const onMonthlyEarningsReadByYear = (commerceId, year, employeeId = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REPORT_READING });

  axios.get(`${backendUrl}/api/commerces/monthly-earnings/`, { params: { commerceId, year, employeeId } })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_READ, payload: response.data }))
    .catch(error => console.error(error));
};

// Monthly Reviews Report
export const onMonthlyReviewsReadByYear = (commerceId, year, employeeId = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REPORT_READING });

  axios.get(`${backendUrl}/api/commerces/monthly-reviews/`, { params: { commerceId, year, employeeId } })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_READ, payload: response.data }))
    .catch(error => console.error(error));
};

// Reserved and Cancelled reservations Report
export const onReservedAndCancelledReservationsReadByRange = (commerceId, startDate, endDate, employeeId = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REPORT_READING });

  axios.get(`${backendUrl}/api/commerces/reserved-canceled-reservations/`, {
    params: {
      commerceId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null,
      employeeId
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_READ, payload: response.data }))
    .catch(error => console.error(error));
};

// Most Popular Shifts Report
export const onMostPopularShiftsReadByRange = (commerceId, startDate, endDate, employeeId = null) => dispatch => {
  dispatch({ type: ON_COMMERCE_REPORT_READING });

  axios.get(`${backendUrl}/api/commerces/popular-shifts/`, {
    params: {
      commerceId,
      startDate: startDate ? localDate(startDate) : null,
      endDate: endDate ? localDate(endDate) : null,
      employeeId
    }
  })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_READ, payload: response.data }))
    .catch(error => console.error(error));
};

export const yearsOfActivity = commerceId => dispatch => {
  axios.get(`${backendUrl}/api/commerces/years-of-activity/`, { params: { commerceId } })
    .then(response => dispatch({ type: ON_COMMERCE_REPORT_VALUE_CHANGE, payload: response.data }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_COMMERCE_REPORT_DATA_EMPTY })
    });
};
