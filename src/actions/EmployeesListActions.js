import axios from 'axios';
import { ON_EMPLOYEES_READ, ON_EMPLOYEES_READING, ON_EMPLOYEES_READ_FAIL, ON_EMPLOYEE_SELECT } from './types';

import getEnvVars from '../../environment';
const { backendUrl } = getEnvVars();

export const onEmployeeSelect = selectedEmployeeId => ({ type: ON_EMPLOYEE_SELECT, payload: { selectedEmployeeId } });

export const onEmployeesRead = ({ commerceId, visible, startDate, employeesIds }) => dispatch => {
  dispatch({ type: ON_EMPLOYEES_READING });

  axios.get(`${backendUrl}/api/employees/`, { params: { commerceId, visible, startDate, employeesIds: employeesIds ? employeesIds.toString() : null } })
    .then(response => dispatch({ type: ON_EMPLOYEES_READ, payload: response.data }))
    .catch(error => {
      console.error(error);
      dispatch({ type: ON_EMPLOYEES_READ_FAIL })
    });
};
